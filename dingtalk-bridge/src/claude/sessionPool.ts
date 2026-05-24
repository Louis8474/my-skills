/**
 * Claude 会话池管理
 *
 * 按 conversationId 管理多个 ClaudeSession 实例：
 * - 同一会话复用已有进程（消除冷启动）
 * - 空闲超时自动回收
 * - 全局优雅关闭
 */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  ClaudeSession,
  type ClaudeSessionConfig,
  type SessionResult,
  type SessionCallbacks,
} from './session';
import { createSafeLogger } from '../utils/logger';

const logger = createSafeLogger('SessionPool');

/** 会话池配置 */
export interface SessionPoolConfig {
  /** 单个会话的最大空闲时间（毫秒），默认 30 分钟 */
  idleTimeout?: number;
  /** 池中最大会话数，默认 10 */
  maxSessions?: number;
  /** 会话启动超时（毫秒），默认 120 秒 */
  startTimeout?: number;
  /** 预热会话数（启动时预创建），默认 1 */
  warmUpCount?: number;
}

/** 池中会话条目 */
interface PooledSession {
  session: ClaudeSession;
  conversationId: string;
  lastActivity: number;
  createdAt: number;
}

const WARM_SPARE_PREFIX = '__warm_spare_';

export class SessionPool {
  private sessions: Map<string, PooledSession> = new Map();
  private config: Required<SessionPoolConfig>;
  private sessionConfig: Omit<ClaudeSessionConfig, 'resumeSessionId'>;
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;
  private spareKeys: string[] = [];

  constructor(
    sessionConfig: Omit<ClaudeSessionConfig, 'resumeSessionId'>,
    poolConfig?: SessionPoolConfig
  ) {
    this.sessionConfig = sessionConfig;
    this.config = {
      idleTimeout: poolConfig?.idleTimeout ?? 30 * 60 * 1000,
      maxSessions: poolConfig?.maxSessions ?? 10,
      startTimeout: poolConfig?.startTimeout ?? 120_000,
      warmUpCount: poolConfig?.warmUpCount ?? 1,
    };
  }

  /** 池中活跃会话数 */
  get size(): number {
    return this.sessions.size;
  }

  /**
   * 获取或创建会话
   *
   * 如果 conversationId 对应的会话存在且存活，直接返回；
   * 否则尝试认领一个预热的 spare 会话；都没有则创建新会话。
   */
  async getOrCreate(conversationId: string, callbacks?: SessionCallbacks): Promise<ClaudeSession> {
    const existing = this.sessions.get(conversationId);

    if (existing && existing.session.isAlive) {
      existing.lastActivity = Date.now();
      if (callbacks) {
        existing.session.setCallbacks(callbacks);
      }
      return existing.session;
    }

    // 清理已失效的条目
    if (existing) {
      this.sessions.delete(conversationId);
    }

    // 尝试认领一个空闲的 warm spare（FIFO，取最老的）
    const claimed = this.claimSpare(conversationId, callbacks);
    if (claimed) {
      return claimed;
    }

    // 池满时淘汰最久未使用的
    if (this.sessions.size >= this.config.maxSessions) {
      await this.evictOldest();
    }

    // 创建新会话
    return this.createSession(conversationId, callbacks);
  }

  /**
   * 向指定会话发送消息
   *
   * 自动处理会话不存在或已失效的情况（重新创建）。
   */
  async send(
    conversationId: string,
    message: string,
    callbacks?: SessionCallbacks
  ): Promise<SessionResult> {
    let session = await this.getOrCreate(conversationId, callbacks);

    try {
      const result = await session.send(message, callbacks);
      // 更新最后活动时间
      const entry = this.sessions.get(conversationId);
      if (entry) {
        entry.lastActivity = Date.now();
      }
      return result;
    } catch (error) {
      // 会话失效时尝试重新创建
      if (!session.isAlive) {
        logger.log(`会话失效，重新创建: ${conversationId}`);
        this.sessions.delete(conversationId);
        session = await this.getOrCreate(conversationId, callbacks);
        const result = await session.send(message, callbacks);
        const entry = this.sessions.get(conversationId);
        if (entry) {
          entry.lastActivity = Date.now();
        }
        return result;
      }
      throw error;
    }
  }

  /**
   * 关闭指定会话
   */
  async closeSession(conversationId: string): Promise<void> {
    const entry = this.sessions.get(conversationId);
    if (entry) {
      this.sessions.delete(conversationId);
      await entry.session.close();
    }
  }

  /**
   * 关闭所有会话
   */
  async closeAll(): Promise<void> {
    this.stopCleanup();

    const closings = Array.from(this.sessions.values()).map(entry =>
      entry.session.close().catch(err => {
        logger.error(`关闭会话失败 (${entry.conversationId}):`, err);
      })
    );

    await Promise.all(closings);
    this.sessions.clear();
  }

  /**
   * 启动定期清理
   */
  startCleanup(intervalMs: number = 60_000): void {
    if (this.cleanupTimer) return;

    this.cleanupTimer = setInterval(() => {
      this.cleanupIdle();
    }, intervalMs);
  }

  /**
   * 停止定期清理
   */
  stopCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * 获取所有会话状态（用于诊断）
   */
  getStatus(): Array<{
    conversationId: string;
    state: string;
    sessionId: string;
    lastActivity: number;
    createdAt: number;
  }> {
    return Array.from(this.sessions.values()).map(entry => ({
      conversationId: entry.conversationId,
      state: entry.session.currentState,
      sessionId: entry.session.currentSessionId,
      lastActivity: entry.lastActivity,
      createdAt: entry.createdAt,
    }));
  }

  /**
   * 预热会话：在后台预创建指定数量的 spare 会话
   *
   * 不阻塞调用方，失败时静默跳过（不影响正常服务）。
   */
  async warmUp(count?: number): Promise<void> {
    const target = count ?? this.config.warmUpCount;
    if (target <= 0) return;

    const actual = Math.min(target, this.config.maxSessions - this.sessions.size);
    if (actual <= 0) return;

    logger.log(`开始预热 ${actual} 个 spare 会话...`);

    const tasks = Array.from({ length: actual }, (_, i) => {
      const spareKey = `${WARM_SPARE_PREFIX}${Date.now()}_${i}`;
      return this.createSession(spareKey)
        .then(() => {
          this.spareKeys.push(spareKey);
          logger.log(`spare 会话就绪: ${spareKey}`);
        })
        .catch(err => {
          logger.warn(`spare 预热失败: ${err.message}`);
        });
    });

    await Promise.all(tasks);
    logger.log(`预热完成，当前 spare 数: ${this.spareKeys.length}`);
  }

  // ==================== 私有方法 ====================

  /** 创建新会话并注册到池中 */
  private async createSession(
    conversationId: string,
    callbacks?: SessionCallbacks
  ): Promise<ClaudeSession> {
    const session = new ClaudeSession({
      ...this.sessionConfig,
      idleTimeout: this.config.idleTimeout,
    });

    session.setCallbacks({
      ...callbacks,
      onStateChange: state => {
        if (state === 'closed' || state === 'error') {
          this.sessions.delete(conversationId);
          this.spareKeys = this.spareKeys.filter(k => k !== conversationId);
        }
        callbacks?.onStateChange?.(state);
      },
    });

    await session.start();

    this.sessions.set(conversationId, {
      session,
      conversationId,
      lastActivity: Date.now(),
      createdAt: Date.now(),
    });

    return session;
  }

  /** 认领一个 warm spare 会话（FIFO），重映射到真实 conversationId */
  private claimSpare(conversationId: string, callbacks?: SessionCallbacks): ClaudeSession | null {
    while (this.spareKeys.length > 0) {
      const spareKey = this.spareKeys.shift()!;
      const entry = this.sessions.get(spareKey);

      if (!entry || !entry.session.isAlive) {
        this.sessions.delete(spareKey);
        continue;
      }

      // 重映射：从 spare key 移到真实 conversationId
      this.sessions.delete(spareKey);
      entry.conversationId = conversationId;
      entry.lastActivity = Date.now();
      this.sessions.set(conversationId, entry);

      if (callbacks) {
        entry.session.setCallbacks({
          ...callbacks,
          onStateChange: state => {
            if (state === 'closed' || state === 'error') {
              this.sessions.delete(conversationId);
            }
            callbacks?.onStateChange?.(state);
          },
        });
      }

      logger.log(`认领 spare 会话: ${spareKey} → ${conversationId}`);
      return entry.session;
    }

    return null;
  }

  /** 淘汰最久未使用的会话 */
  private async evictOldest(): Promise<void> {
    let oldest: PooledSession | null = null;

    for (const entry of this.sessions.values()) {
      if (!oldest || entry.lastActivity < oldest.lastActivity) {
        oldest = entry;
      }
    }

    if (oldest) {
      logger.log(`淘汰最久未使用的会话: ${oldest.conversationId}`);
      this.sessions.delete(oldest.conversationId);
      this.spareKeys = this.spareKeys.filter(k => k !== oldest.conversationId);
      await oldest.session.close().catch(err => {
        logger.error(`淘汰会话关闭失败:`, err);
      });
    }
  }

  /** 清理空闲超时的会话，但保留 warmUpCount 个 spare 作为热备 */
  private cleanupIdle(): void {
    const now = Date.now();
    let readySpareCount = 0;

    for (const [id, entry] of this.sessions) {
      // 清理已关闭/出错的会话
      if (entry.session.currentState === 'closed' || entry.session.currentState === 'error') {
        this.sessions.delete(id);
        this.spareKeys = this.spareKeys.filter(k => k !== id);
        continue;
      }

      const idleMs = now - entry.lastActivity;
      const isSpare = id.startsWith(WARM_SPARE_PREFIX);

      if (entry.session.currentState === 'ready' && idleMs > this.config.idleTimeout) {
        // spare 会话在配额内保留，不销毁
        if (isSpare && readySpareCount < this.config.warmUpCount) {
          readySpareCount++;
          continue;
        }

        logger.log(`清理空闲会话: ${id} (空闲 ${Math.round(idleMs / 1000)}s)`);
        this.sessions.delete(id);
        this.spareKeys = this.spareKeys.filter(k => k !== id);
        entry.session.close().catch(err => {
          logger.error(`清理会话关闭失败:`, err);
        });
      }
    }
  }
}
