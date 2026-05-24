/**
 * Claude Code CLI 执行器 - Proxy 模式
 *
 * 使用独立 Proxy 进程管理 Claude CLI，通过 Unix Socket IPC 通信
 * 支持流式输出、工具调用格式化、会话隔离
 *
 * 依赖：
 * - src/claude/proxy.ts: 独立 Proxy 进程
 * - src/claude/proxyClient.ts: Proxy 客户端
 */
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { createHash } from 'crypto';
import { ClaudeProxyClient, type StreamMessageOptions } from './proxyClient';
import { createSafeLogger } from '../utils/logger';

const logger = createSafeLogger('ProxyExecutor');

/** session 文件名前缀匹配长度（16 位 hex = 64 bit 信息量） */
const SESSION_PREFIX_LENGTH = 16;

// ==================== 类型定义 ====================

export interface ProxyExecutorResult {
  success: boolean;
  output: string;
  error?: string;
  executionTime: number;
}

export interface ProxyExecutorConfig {
  /** 基础进程名（支持 per-conversation 会话隔离） */
  baseProcessName: string;
  /** 会话超时时间（毫秒） */
  sessionTimeout?: number;
  /** 是否启用图片自动发送 */
  enableImageAutoSend?: boolean;
  /** 图片发送回调 */
  onImageSend?: (filePath: string, conversationId: string) => Promise<boolean>;
}

/** 活跃会话 */
interface ActiveSession {
  client: ClaudeProxyClient;
  lastActivity: number;
  conversationId: string;
}

// ==================== 主类 ====================

export class ProxyExecutor {
  private baseProcessName: string;
  private client: ClaudeProxyClient | null = null;
  private activeSession: ActiveSession | null = null;
  private executorConfig: ProxyExecutorConfig;

  // 会话隔离相关
  private sessions: Map<string, ActiveSession> = new Map();
  private readonly maxConcurrentSessions = 10;
  private readonly sessionIdleTimeout = 30 * 60 * 1000; // 30 分钟
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(executorConfig: ProxyExecutorConfig) {
    this.baseProcessName = executorConfig.baseProcessName || 'dingtalk-bridge';
    this.executorConfig = {
      sessionTimeout: 3600000, // 1 小时默认
      enableImageAutoSend: false,
      ...executorConfig,
    };

    // 启动会话清理定时器
    this.startCleanupTimer();
  }

  /**
   * 生成会话 ID
   */
  private generateSessionId(conversationId: string): string {
    const hash = createHash('sha256').update(conversationId).digest('hex');
    // UUID 格式
    return `${hash.substring(0, 8)}-${hash.substring(8, 12)}-4${hash.substring(13, 16)}-${hash.substring(16, 20)}-${hash.substring(20, 32)}`;
  }

  /**
   * 根据 conversationId 获取进程名（实现会话隔离）
   */
  private getProcessName(conversationId: string): string {
    const hash = createHash('sha256').update(conversationId).digest('hex').substring(0, 8);
    return `${this.baseProcessName}-${hash}`;
  }

  /**
   * 获取或创建会话
   */
  private async getOrCreateSession(conversationId: string): Promise<ClaudeProxyClient> {
    // 检查现有会话
    const existing = this.sessions.get(conversationId);
    if (existing) {
      existing.lastActivity = Date.now();
      if (existing.client.isConnected()) {
        return existing.client;
      }
      // 尝试重连
      const ok = await existing.client.connect();
      if (ok) return existing.client;
    }

    // 超过上限时淘汰最久未使用的会话
    if (this.sessions.size >= this.maxConcurrentSessions) {
      this.evictLRUSession();
    }

    // 创建新会话
    const processName = this.getProcessName(conversationId);
    const sessionId = this.generateSessionId(conversationId);
    const client = new ClaudeProxyClient(processName, sessionId);

    const ok = await client.connect();
    if (!ok) {
      throw new Error(`Failed to connect Claude proxy for conversation ${conversationId}`);
    }

    const session: ActiveSession = {
      client,
      lastActivity: Date.now(),
      conversationId,
    };
    this.sessions.set(conversationId, session);

    logger.log('Created new Claude proxy session', {
      conversationId,
      processName,
      totalSessions: this.sessions.size,
    });

    return client;
  }

  /**
   * 淘汰最久未使用的会话
   */
  private evictLRUSession(): void {
    let oldestId: string | null = null;
    let oldestTime = Infinity;

    for (const [id, session] of this.sessions) {
      if (session.lastActivity < oldestTime) {
        oldestTime = session.lastActivity;
        oldestId = id;
      }
    }

    if (oldestId) {
      const session = this.sessions.get(oldestId)!;
      session.client.stopProxy();
      this.sessions.delete(oldestId);
      logger.log('Evicted LRU session', { conversationId: oldestId });
    }
  }

  /**
   * 启动会话清理定时器
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(
      () => {
        const now = Date.now();
        let cleaned = 0;

        for (const [id, session] of this.sessions) {
          if (now - session.lastActivity > this.sessionIdleTimeout) {
            session.client.stopProxy();
            this.sessions.delete(id);
            cleaned++;
          }
        }

        if (cleaned > 0) {
          logger.log('Cleaned up idle sessions', { cleaned, remaining: this.sessions.size });
        }
      },
      5 * 60 * 1000
    ); // 每 5 分钟检查一次
  }

  /**
   * 执行消息（流式）
   */
  async executeStream(
    conversationId: string,
    messages: { role: string; content: string }[],
    options: {
      onChunk?: (chunk: string) => Promise<void>;
      onComplete?: (fullOutput: string) => Promise<void>;
      onError?: (error: Error) => Promise<void>;
    } = {}
  ): Promise<ProxyExecutorResult> {
    const startTime = Date.now();
    let fullOutput = '';

    try {
      // 获取会话
      const client = await this.getOrCreateSession(conversationId);

      // 构建回调
      const streamOptions: StreamMessageOptions = {
        messages,
        onChunk: async (chunk: string) => {
          fullOutput += chunk;
          if (options.onChunk) {
            await options.onChunk(chunk);
          }
        },
        onComplete: async () => {
          if (options.onComplete) {
            await options.onComplete(fullOutput);
          }
        },
        onError: options.onError,
      };

      // 如果启用了图片自动发送，添加回调
      if (this.executorConfig.enableImageAutoSend && this.executorConfig.onImageSend) {
        streamOptions.onImage = async (filePath: string) => {
          logger.log('Image detected, sending to DingTalk', { filePath, conversationId });
          try {
            await this.executorConfig.onImageSend!(filePath, conversationId);
          } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            logger.error('Failed to send image', { filePath, error: message });
          }
        };
      }

      // 发送消息
      await client.sendMessage(streamOptions);

      return {
        success: true,
        output: fullOutput,
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      const err = error as Error;
      logger.error('Proxy executor error', { error: err.message, conversationId });

      return {
        success: false,
        output: fullOutput,
        error: err.message,
        executionTime: Date.now() - startTime,
      };
    }
  }

  /**
   * 重置指定会话
   */
  resetSession(conversationId: string): void {
    const session = this.sessions.get(conversationId);
    if (session) {
      session.client.stopProxy();
      this.sessions.delete(conversationId);
      logger.log('Session reset', { conversationId });
    }

    // 同时清理 session 文件
    const processName = this.getProcessName(conversationId);
    const sessionId = this.generateSessionId(conversationId);
    this.deleteSessionFiles(processName, sessionId);
  }

  /**
   * 删除 Claude session 文件
   */
  private deleteSessionFiles(processName: string, sessionId: string): void {
    try {
      const homeDir = os.homedir();
      const cwd = process.cwd().replace(/[:\\/]/g, '-');
      const sessionDir = path.join(homeDir, '.claude', 'projects', cwd);

      if (!fs.existsSync(sessionDir)) return;

      // 使用更长的前缀（16 位）减少误删风险
      const sessionPrefix = sessionId.substring(0, SESSION_PREFIX_LENGTH);
      for (const file of fs.readdirSync(sessionDir)) {
        if (file.startsWith(sessionPrefix)) {
          const fp = path.join(sessionDir, file);
          fs.unlinkSync(fp);
          logger.log('Session file deleted', { file: fp });
        }
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      logger.warn('Failed to delete session files', { error: message });
    }
  }

  /**
   * 销毁执行器
   */
  destroy(): void {
    // 停止清理定时器
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }

    // 停止所有会话
    for (const [, session] of this.sessions) {
      session.client.stopProxy();
    }
    this.sessions.clear();

    logger.log('ProxyExecutor destroyed');
  }

  /**
   * 获取活跃会话数
   */
  getActiveSessionCount(): number {
    return this.sessions.size;
  }
}
