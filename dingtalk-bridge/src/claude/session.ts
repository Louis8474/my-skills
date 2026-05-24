/**
 * Claude CLI 持久化会话管理
 *
 * 使用 claude --input-format stream-json --output-format stream-json 模式
 * 保持 CLI 进程长驻，通过 stdin/stdout 交换 NDJSON 消息，
 * 避免每次消息都冷启动 CLI（当前约 85 秒延迟）。
 *
 * 协议参考: https://github.com/chenhg5/cc-connect (agent/claudecode/session.go)
 */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { spawn, ChildProcess } from 'child_process';
import { createInterface, Interface } from 'readline';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { config } from '../config';
import { createSafeLogger } from '../utils/logger';

const logger = createSafeLogger('ClaudeSession');

// ==================== 类型定义 ====================

/** 会话状态 */
export type SessionState = 'starting' | 'ready' | 'busy' | 'closing' | 'closed' | 'error';

/** 发送给 Claude 的用户消息 */
export interface SessionUserMessage {
  type: 'user';
  message: {
    role: 'user';
    content: Array<{ type: 'text'; text: string }>;
  };
}

// Base64-encoded image source for Claude vision input
export interface SessionImageSource {
  type: 'base64';
  media_type: string;
  /** Base64-encoded image content */
  content: string;
}

export interface SessionImage {
  type: 'image';
  source: SessionImageSource;
}

export interface SessionFile {
  type: 'file';
  name: string;
  content: string;
}

/** Claude 返回的事件类型 */
export interface SystemInitEvent {
  type: 'system';
  subtype: 'init';
  session_id: string;
  tools: string[];
  model: string;
  [key: string]: unknown;
}

export interface AssistantEvent {
  type: 'assistant';
  message: {
    id: string;
    content: AssistantContent[];
    model?: string;
    stop_reason?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export type AssistantContent =
  | { type: 'text'; text: string }
  | { type: 'tool_use'; id: string; name: string; input: Record<string, unknown> }
  | { type: 'thinking'; text: string }
  | { type: 'tool_result'; tool_use_id: string; content: string };

export interface ResultEvent {
  type: 'result';
  result: string;
  session_id: string;
  [key: string]: unknown;
}

export interface ControlRequestEvent {
  type: 'control_request';
  id: string;
  tool: string;
  input: Record<string, unknown>;
  [key: string]: unknown;
}

export interface StreamEvent {
  type: 'stream_event';
  [key: string]: unknown;
}

export type ClaudeEvent =
  | SystemInitEvent
  | AssistantEvent
  | ResultEvent
  | ControlRequestEvent
  | StreamEvent;

/** 会话配置 */
export interface ClaudeSessionConfig {
  /** CLI 命令路径 */
  command: string;
  /** 工作目录 */
  workingDir?: string;
  /** 模型名称 */
  model?: string;
  /** 权限模式 */
  permissionMode?: 'default' | 'plan' | 'auto-edit' | 'dangerously-skip-permissions';
  /** 空闲超时（毫秒），默认 30 分钟 */
  idleTimeout?: number;
  /** 系统提示词 */
  systemPrompt?: string;
  /** 恢复的会话 ID */
  resumeSessionId?: string;
}

/** 会话请求的回调 */
export interface SessionCallbacks {
  /** 收到文本输出 */
  onText?: (text: string) => void;
  /** 收到思考过程 */
  onThinking?: (text: string) => void;
  /** 收到工具调用 */
  onToolUse?: (name: string, input: Record<string, unknown>) => void;
  /** 收到工具结果 */
  onToolResult?: (toolUseId: string, content: string) => void;
  /** 状态变更 */
  onStateChange?: (state: SessionState) => void;
  /** 错误 */
  onError?: (error: Error) => void;
}

/** 一次请求的结果 */
export interface SessionResult {
  success: boolean;
  output: string;
  sessionId: string;
  error?: string;
  executionTime: number;
}

// ==================== ClaudeSession 类 ====================

export class ClaudeSession {
  private process: ChildProcess | null = null;
  private readline: Interface | null = null;
  private sessionId: string = '';
  private state: SessionState = 'closed';
  private idleTimer: ReturnType<typeof setTimeout> | null = null;
  private pendingResolve: ((result: SessionResult) => void) | null = null;
  private pendingReject: ((error: Error) => void) | null = null;
  private accumulatedText: string = '';
  private startTime: number = 0;
  private readonly config: Required<ClaudeSessionConfig>;
  private callbacks: SessionCallbacks = {};
  private static cachedEnv: Record<string, string> | null = null;
  /**
   * 跟踪上一次 assistant 事件的完整文本长度。
   * --include-partial-messages 模式下，每个 assistant 事件包含全量文本（非增量），
   * 需要计算 delta 才能正确触发 onText 回调实现打字机效果。
   */
  private previousAssistantText = '';
  /** -p 模式下 result 事件已处理，进程即将正常退出 */
  private resultReceived = false;

  constructor(sessionConfig: ClaudeSessionConfig) {
    this.config = {
      command: sessionConfig.command,
      workingDir: sessionConfig.workingDir ?? config.claude.workingDir ?? process.cwd(),
      model: sessionConfig.model ?? config.claude.model ?? '',
      permissionMode: sessionConfig.permissionMode ?? 'dangerously-skip-permissions',
      idleTimeout: sessionConfig.idleTimeout ?? 30 * 60 * 1000,
      systemPrompt: sessionConfig.systemPrompt ?? '',
      resumeSessionId: sessionConfig.resumeSessionId ?? '',
    };
  }

  // ==================== 公共 API ====================

  /** 当前会话 ID */
  get currentSessionId(): string {
    return this.sessionId;
  }

  /** 当前状态 */
  get currentState(): SessionState {
    return this.state;
  }

  /** 会话是否可用 */
  get isAlive(): boolean {
    return this.state === 'ready' || this.state === 'busy';
  }

  /** 注册回调 */
  setCallbacks(callbacks: SessionCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /** 追踪 hooks 完成状态 */
  private hookStarted = 0;
  private hookCompleted = 0;

  /**
   * 启动会话 — 生成 claude 进程并等待 hooks 初始化完成
   *
   * 新版 CLI (v2.1.x) 不再发送 system.init 事件，
   * 而是通过 hook_started/hook_response 完成初始化。
   * 等待最多 120 秒，所有 hooks 响应完成或超时则进入 ready。
   */
  async start(): Promise<void> {
    if (this.process && this.state !== 'closed' && this.state !== 'error') {
      throw new Error('Session already started');
    }

    // 清理旧进程状态（--resume 重启场景）
    this.cleanup();

    this.setState('starting');
    this.hookStarted = 0;
    this.hookCompleted = 0;

    try {
      const args = this.buildArgs();
      const env = this.getEnv();

      this.process = spawn(this.config.command, args, {
        cwd: this.config.workingDir,
        env: { ...process.env, ...env },
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      this.setupReadline();
      this.setupErrorHandling();

      // --bare 模式跳过 hooks/plugins/LSP，通常 3-5s 完成初始化
      await this.waitForInit(15_000);

      this.setState('ready');
      this.resetIdleTimer();
    } catch (error) {
      this.setState('error');
      this.cleanup();
      throw error;
    }
  }

  /**
   * 发送用户消息并等待完整响应
   *
   * -p 模式下 CLI 处理完请求后会退出，下次 send 时自动 --resume 恢复会话。
   */
  async send(message: string, callbacks?: SessionCallbacks): Promise<SessionResult> {
    if (this.state === 'busy') {
      throw new Error('Session is busy processing another request');
    }

    // -p 模式下进程在处理完请求后退出，需要通过 --resume 重启
    if (this.state === 'closed' || this.state === 'error') {
      if (this.sessionId) {
        logger.log(`进程已退出，使用 --resume ${this.sessionId} 恢复会话`);
        this.config.resumeSessionId = this.sessionId;
      }
      await this.start();
    }

    if (!this.isAlive) {
      throw new Error(`Session not alive (state: ${this.state})`);
    }

    this.setState('busy');
    this.clearIdleTimer();
    this.startTime = Date.now();
    this.accumulatedText = '';
    this.previousAssistantText = '';
    this.resultReceived = false;

    // 合并临时回调
    if (callbacks) {
      this.callbacks = { ...this.callbacks, ...callbacks };
    }

    return new Promise<SessionResult>((resolve, reject) => {
      this.pendingResolve = resolve;
      this.pendingReject = reject;

      const userMsg: SessionUserMessage = {
        type: 'user',
        message: {
          role: 'user',
          content: [{ type: 'text', text: message }],
        },
      };

      const serialized = JSON.stringify(userMsg) + '\n';
      this.process!.stdin!.write(serialized, err => {
        if (err) {
          this.pendingResolve = null;
          this.pendingReject = null;
          this.setState('ready');
          this.resetIdleTimer();
          reject(new Error(`Failed to write to stdin: ${err.message}`));
        }
      });
    });
  }

  /**
   * 优雅关闭会话
   */
  async close(): Promise<void> {
    if (this.state === 'closed' || this.state === 'closing') {
      return;
    }

    this.setState('closing');
    this.clearIdleTimer();

    if (this.pendingReject) {
      this.pendingReject(new Error('Session closing'));
      this.pendingResolve = null;
      this.pendingReject = null;
    }

    if (!this.process) {
      this.setState('closed');
      return;
    }

    // 优雅关闭：关闭 stdin → 等待进程退出
    try {
      this.process.stdin!.end();

      const exitPromise = new Promise<void>(resolve => {
        const forceKillTimer = setTimeout(() => {
          // SIGTERM
          try {
            this.process!.kill('SIGTERM');
          } catch (err: unknown) {
            logger.debug(
              'SIGTERM 失败，进程可能已退出:',
              err instanceof Error ? err.message : String(err)
            );
          }

          const sigkillTimer = setTimeout(() => {
            // SIGKILL
            try {
              this.process!.kill('SIGKILL');
            } catch (err: unknown) {
              logger.debug(
                'SIGKILL 失败，进程可能已退出:',
                err instanceof Error ? err.message : String(err)
              );
            }
            resolve();
          }, 5000);

          this.process!.once('exit', () => {
            clearTimeout(sigkillTimer);
            resolve();
          });
        }, 3000);

        this.process!.once('exit', () => {
          clearTimeout(forceKillTimer);
          resolve();
        });
      });

      await exitPromise;
    } catch (err: unknown) {
      logger.warn('会话关闭异常:', err instanceof Error ? err.message : String(err));
      // 强制清理
      try {
        this.process.kill('SIGKILL');
      } catch (killErr: unknown) {
        logger.debug('SIGKILL 失败:', killErr instanceof Error ? killErr.message : String(killErr));
      }
    }

    this.cleanup();
    this.setState('closed');
  }

  // ==================== 私有方法 ====================

  /** 构建命令行参数 */
  private buildArgs(): string[] {
    const args: string[] = [
      '-p', // 非交互模式：启用 --input-format/--output-format（CLI 要求 -p 才生效）
      '--input-format',
      'stream-json',
      '--output-format',
      'stream-json',
      '--include-partial-messages', // 流式输出中间文本块（打字机效果必需）
      '--bare',
      '--verbose',
    ];

    if (this.config.permissionMode === 'dangerously-skip-permissions') {
      args.push('--dangerously-skip-permissions');
    }

    if (this.config.model) {
      args.push('--model', this.config.model);
    }

    if (this.config.resumeSessionId) {
      args.push('--resume', this.config.resumeSessionId);
    }

    if (this.config.systemPrompt) {
      args.push('--system-prompt', this.config.systemPrompt);
    }

    return args;
  }

  /** 获取环境变量（注入 settings.json 中的 API key） */
  private getEnv(): Record<string, string> {
    const env = ClaudeSession.loadClaudeEnv();
    // 防止嵌套检测
    delete env.CLAUDECODE;
    return env;
  }

  /** 从 ~/.claude/settings.json 加载环境变量 */
  private static loadClaudeEnv(): Record<string, string> {
    if (ClaudeSession.cachedEnv) {
      return { ...ClaudeSession.cachedEnv };
    }

    try {
      const settingsPath = path.join(os.homedir(), '.claude', 'settings.json');
      const content = fs.readFileSync(settingsPath, 'utf-8');
      const settings = JSON.parse(content);
      const rawEnv =
        settings.env && typeof settings.env === 'object'
          ? (settings.env as Record<string, string>)
          : {};

      const env: Record<string, string> = { ...rawEnv };
      if (rawEnv.ANTHROPIC_AUTH_TOKEN && !rawEnv.ANTHROPIC_API_KEY) {
        env.ANTHROPIC_API_KEY = rawEnv.ANTHROPIC_AUTH_TOKEN;
      }

      ClaudeSession.cachedEnv = env;
      return { ...env };
    } catch (err: unknown) {
      logger.debug(
        '加载 Claude 环境变量失败，使用空环境:',
        err instanceof Error ? err.message : String(err)
      );
      ClaudeSession.cachedEnv = {};
      return {};
    }
  }

  /** 设置 readline 逐行读取 stdout */
  private setupReadline(): void {
    if (!this.process?.stdout) return;

    this.readline = createInterface({
      input: this.process.stdout,
      crlfDelay: Infinity,
    });

    this.readline.on('line', (line: string) => {
      this.handleLine(line);
    });
  }

  /** 处理 stderr 和进程错误 */
  private setupErrorHandling(): void {
    if (!this.process) return;

    this.process.on('error', err => {
      logger.error('进程错误:', err);
      this.callbacks.onError?.(err);
      this.setState('error');
    });

    if (this.process.stderr) {
      this.process.stderr.on('data', (data: Buffer) => {
        const text = data.toString().trim();
        if (text) {
          logger.error('stderr:', text);
        }
      });
    }

    this.process.on('exit', (code, signal) => {
      logger.log(`进程退出: code=${code}, signal=${signal}`);

      if (this.state === 'closing' || this.state === 'closed') {
        this.cleanup();
        return;
      }

      // -p 模式下，进程处理完请求后正常退出（code=0），result 事件已被处理
      // 静默设置 closed 状态，不触发 onStateChange（避免 SessionPool 删除会话条目）
      // send() 中的 getOrCreate 重试逻辑会在下次调用时通过 --resume 恢复
      if (code === 0 && this.resultReceived) {
        logger.log('-p 模式正常退出，标记为 closed（下次 send 将 --resume 恢复）');
        this.state = 'closed'; // 直接赋值，不触发 onStateChange
        this.cleanup();
        return;
      }

      // 异常退出
      const error = new Error(`Process exited unexpectedly: code=${code}, signal=${signal}`);
      this.callbacks.onError?.(error);

      if (this.pendingReject) {
        this.pendingReject(error);
        this.pendingResolve = null;
        this.pendingReject = null;
      }

      this.setState('error');
      this.cleanup();
    });
  }

  /** 处理 stdout 的一行 NDJSON */
  private handleLine(line: string): void {
    if (!line.trim()) return;

    let event: ClaudeEvent;
    try {
      event = JSON.parse(line) as ClaudeEvent;
    } catch {
      logger.warn('无法解析 JSON:', line.substring(0, 200));
      return;
    }
    logger.log(`handleLine: type=${event.type}`);

    // 收到任何有效事件时，若仍在等待初始化，立即 resolve（新版 CLI 可能不发 system.init）
    if (this.initResolve && event.type !== 'system') {
      logger.log(`收到首条 ${event.type} 事件，初始化完成`);
      this.initResolve();
      this.initResolve = null;
    }

    switch (event.type) {
      case 'system':
        this.handleSystemEvent(event);
        break;
      case 'assistant':
        this.handleAssistantEvent(event);
        break;
      case 'result':
        this.handleResultEvent(event);
        break;
      case 'control_request':
        this.handleControlRequest(event);
        break;
      case 'stream_event':
        // --include-partial-messages 产生的心跳/进度事件，无需处理
        break;
      default:
        logger.log('未知事件类型:', (event as Record<string, unknown>).type);
    }
  }

  /** 处理系统事件：init（旧版）和 hooks（新版） */
  private handleSystemEvent(event: SystemInitEvent): void {
    if (event.subtype === 'init') {
      // 旧版 CLI 协议
      this.sessionId = event.session_id;
      logger.log(
        `会话初始化: session_id=${event.session_id}, model=${event.model}`
      );

      if (this.initResolve) {
        this.initResolve();
        this.initResolve = null;
      }
      return;
    }

    if (event.subtype === 'hook_started') {
      this.hookStarted++;
      return;
    }

    if (event.subtype === 'hook_response') {
      this.hookCompleted++;
      // 所有 hooks 响应完成，进程已就绪
      if (this.hookCompleted >= this.hookStarted && this.hookStarted > 0) {
        logger.log(
          `Hooks 完成 (${this.hookStarted}/${this.hookCompleted})，会话就绪`
        );
        // session_id 可从任意事件获取
        if (!this.sessionId && event.session_id) {
          this.sessionId = event.session_id;
        }
        if (this.initResolve) {
          this.initResolve();
          this.initResolve = null;
        }
      }
      return;
    }
  }

  /** 处理 assistant 事件（文本、工具调用、思考）
   *
   * --include-partial-messages 模式下，每个 assistant 事件包含全量文本（非增量）：
   *   事件1: text="Hello"
   *   事件2: text="Hello world"
   *   事件3: text="Hello world, how are you?"
   * 需要计算 delta 才能正确触发 onText 回调实现打字机效果。
   *
   * 兼容旧模式（增量文本）：每个事件只包含新增的文本块。
   */
  private handleAssistantEvent(event: AssistantEvent): void {
    if (!event.message?.content) return;

    for (const block of event.message.content) {
      if (block.type === 'text') {
        const text = block.text;

        if (
          text.startsWith(this.previousAssistantText) &&
          text.length > this.previousAssistantText.length
        ) {
          // Partial message 模式：text 包含全量文本，提取增量部分
          const delta = text.substring(this.previousAssistantText.length);
          this.accumulatedText += delta;
          this.previousAssistantText = text;
          logger.log(
            `handleAssistantEvent: partial text delta=${delta.length}, total=${text.length}, preview="${delta.substring(0, 60).replace(/"/g, '\\"')}"`
          );
          this.callbacks.onText?.(delta);
        } else if (text !== this.previousAssistantText) {
          // 增量模式或首块：text 是新的文本块
          this.accumulatedText += text;
          this.previousAssistantText += text;
          logger.log(
            `handleAssistantEvent: text chunk length=${text.length}, preview="${text.substring(0, 60).replace(/"/g, '\\"')}"`
          );
          this.callbacks.onText?.(text);
        }
        // text === previousAssistantText: 重复事件，跳过
      } else if (block.type === 'thinking') {
        const thinkingText = block.text ?? '';
        logger.log(`handleAssistantEvent: thinking block, length=${thinkingText.length}`);
        this.callbacks.onThinking?.(thinkingText);
      } else if (block.type === 'tool_use') {
        logger.log(`handleAssistantEvent: tool_use block, name=${block.name}`);
        this.callbacks.onToolUse?.(block.name, block.input);
      } else if (block.type === 'tool_result') {
        logger.log(
          `handleAssistantEvent: tool_result block, tool_use_id=${block.tool_use_id}`
        );
        this.callbacks.onToolResult?.(block.tool_use_id, block.content);
      }
    }
  }

  /** 处理 result 事件（请求完成） */
  private handleResultEvent(event: ResultEvent): void {
    logger.log(
      `handleResultEvent: result.length=${(event.result || this.accumulatedText || '').length}, executionMs=${Date.now() - this.startTime}`
    );
    const executionTime = Date.now() - this.startTime;

    // 保存 sessionId 供 --resume 使用
    if (event.session_id) {
      this.sessionId = event.session_id;
    }

    // 标记 result 已接收（-p 模式下进程即将退出）
    this.resultReceived = true;

    if (this.pendingResolve) {
      this.pendingResolve({
        success: true,
        output: this.accumulatedText || event.result || '',
        sessionId: event.session_id || this.sessionId,
        executionTime,
      });
      this.pendingResolve = null;
      this.pendingReject = null;
    }

    // -p 模式：进程即将退出，不设 ready（避免 exit handler 竞争）
    // exit handler 会将状态设为 closed，下次 send() 时通过 --resume 恢复
  }

  /** 处理权限请求（dangerously-skip-permissions 模式下不应出现，但做兜底处理） */
  private handleControlRequest(event: ControlRequestEvent): void {
    logger.log(`权限请求: tool=${event.tool}, id=${event.id}`);

    // dangerously-skip-permissions 模式下自动批准
    const response = {
      type: 'control_response' as const,
      id: event.id,
      result: 'approve' as const,
    };

    const serialized = JSON.stringify(response) + '\n';
    this.process?.stdin?.write(serialized);
  }

  /** 等待初始化完成（system.init / hooks / 首条输出 / 超时） */
  private initResolve: (() => void) | null = null;

  private waitForInit(timeoutMs: number): Promise<void> {
    return new Promise(resolve => {
      if (this.sessionId) {
        resolve();
        return;
      }

      this.initResolve = resolve;

      setTimeout(() => {
        if (this.initResolve) {
          logger.log(`初始化超时 ${timeoutMs}ms，直接进入 ready 状态`);
          this.initResolve();
          this.initResolve = null;
        }
      }, timeoutMs);
    });
  }

  /** 设置状态并通知 */
  private setState(newState: SessionState): void {
    const oldState = this.state;
    this.state = newState;
    if (oldState !== newState) {
      logger.log(`状态: ${oldState} → ${newState}`);
      this.callbacks.onStateChange?.(newState);
    }
  }

  /** 重置空闲计时器 */
  private resetIdleTimer(): void {
    this.clearIdleTimer();

    if (this.state === 'ready') {
      this.idleTimer = setTimeout(() => {
        logger.log(`空闲超时 (${this.config.idleTimeout / 1000}s)，关闭会话`);
        this.close().catch(err => {
          logger.error('空闲关闭失败:', err);
        });
      }, this.config.idleTimeout);
    }
  }

  /** 清除空闲计时器 */
  private clearIdleTimer(): void {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
  }

  /** 清理资源 */
  private cleanup(): void {
    if (this.readline) {
      this.readline.close();
      this.readline = null;
    }

    this.process = null;
    this.clearIdleTimer();
  }

  /** 清除环境变量缓存（用于测试） */
  static clearEnvCache(): void {
    ClaudeSession.cachedEnv = null;
  }
}
