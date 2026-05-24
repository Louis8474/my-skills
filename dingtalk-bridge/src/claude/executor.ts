/**
 * Claude Code CLI 执行器
 * 负责调用 Claude Code CLI 处理各种任务
 * 通过 claude CLI 的 -p (prompt) 选项传递消息
 *
 * 注意：Claude CLI 需要 TTY 才能正常工作，因此使用 node-pty 创建伪终端
 */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import * as pty from 'node-pty';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { config } from '../config';
import { withRetry } from '../utils/retry';
import type { MessageContext } from '../types/message';
import { SessionPool, type SessionPoolConfig } from './sessionPool';
import type { SessionCallbacks, SessionResult } from './session';
import { createSafeLogger } from '../utils/logger';

const logger = createSafeLogger('ClaudeExecutor');

export interface ClaudeCodeResult {
  success: boolean;
  output: string;
  error?: string;
  executionTime: number;
  exitCode: number;
}

export interface ClaudeCodeConfig {
  command: string;
  timeout: number;
  maxRetries: number;
  retryBaseDelay?: number;
  retryMaxDelay?: number;
  workingDir?: string;
  model: string;
  maxInputLength: number;
}

// 消息上下文从 ../types/message 导入

// 输入验证错误
class InputValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InputValidationError';
  }
}

/**
 * Claude Code CLI 执行器类
 */
export class ClaudeCodeExecutor {
  private config: ClaudeCodeConfig;
  private sessionPool: SessionPool | null = null;

  constructor(options?: Partial<ClaudeCodeConfig>) {
    this.config = {
      command: config.claude.command,
      timeout: config.claude.timeout,
      maxRetries: config.claude.maxRetries,
      workingDir: config.claude.workingDir,
      model: config.claude.model,
      maxInputLength: config.claude.maxInputLength,
      ...options,
    };
  }

  private static cachedClaudeEnv: Record<string, string> | null = null;

  /**
   * 读取 ~/.claude/settings.json 中的环境变量
   * Claude CLI 通过 settings.json 配置 API 密钥和端点，
   * 但 node-pty 不会自动加载这些变量，需要显式注入
   */
  private getClaudeEnv(): Record<string, string> {
    if (ClaudeCodeExecutor.cachedClaudeEnv) {
      return ClaudeCodeExecutor.cachedClaudeEnv;
    }
    try {
      const settingsPath = path.join(os.homedir(), '.claude', 'settings.json');
      const content = fs.readFileSync(settingsPath, 'utf-8');
      const settings = JSON.parse(content);
      const rawEnv =
        settings.env && typeof settings.env === 'object'
          ? (settings.env as Record<string, string>)
          : {};
      // 映射 ANTHROPIC_AUTH_TOKEN → ANTHROPIC_API_KEY（Claude CLI 使用后者）
      const env: Record<string, string> = { ...rawEnv };
      if (rawEnv.ANTHROPIC_AUTH_TOKEN && !rawEnv.ANTHROPIC_API_KEY) {
        env.ANTHROPIC_API_KEY = rawEnv.ANTHROPIC_AUTH_TOKEN;
      }
      ClaudeCodeExecutor.cachedClaudeEnv = env;
      logger.log(`已加载 ${Object.keys(env).length} 个环境变量 from settings.json`);
      return env;
    } catch (err: unknown) {
      logger.debug(
        '加载 Claude Code 环境变量失败:',
        err instanceof Error ? err.message : String(err)
      );
      ClaudeCodeExecutor.cachedClaudeEnv = {};
      return {};
    }
  }

  /**
   * 执行 Claude Code 命令 - 主要入口
   * 使用 claude -p "prompt" 方式调用
   */
  async execute(prompt: string, context?: MessageContext): Promise<ClaudeCodeResult> {
    const startTime = Date.now();

    logger.log(`📝 执行 Claude Code: ${prompt.substring(0, 50)}...`);
    if (context?.userId) {
      logger.log(`   用户: ${context.userName || context.userId}`);
    }

    try {
      // 构建完整的输入（包含上下文）
      const fullPrompt = this.buildPromptWithContext(prompt, context);

      // 验证输入长度
      this.validateInput(fullPrompt);

      // 构建命令参数（prompt 作为参数传递）
      const args = this.buildCommandArgs(fullPrompt);

      // 使用重试机制处理临时性故障
      const result = await withRetry(() => this.runCommand(args), {
        maxRetries: this.config.maxRetries,
        baseDelay: this.config.retryBaseDelay || 1000,
        maxDelay: this.config.retryMaxDelay || 10000,
        exponential: true,
        onRetry: (attempt, error, delay) => {
          logger.warn(
            `[Claude Code] 执行失败，正在重试 (第 ${attempt}/${this.config.maxRetries} 次，延迟 ${delay}ms): ${error.message}`
          );
        },
      });

      // 解析输出
      const parsedOutput = this.parseOutput(result.output);

      return {
        ...result,
        output: parsedOutput,
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      logger.error('执行失败:', error);

      if (error instanceof InputValidationError) {
        return {
          success: false,
          output: '',
          error: error.message,
          executionTime: Date.now() - startTime,
          exitCode: -1,
        };
      }

      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : '未知错误',
        executionTime: Date.now() - startTime,
        exitCode: -1,
      };
    }
  }

  /**
   * 验证输入长度
   */
  private validateInput(input: string): void {
    if (input.length > this.config.maxInputLength) {
      throw new InputValidationError(
        `输入内容过长 (${input.length} 字符)，最大允许 ${this.config.maxInputLength} 字符`
      );
    }
  }

  /**
   * 解析 Claude Code 的输出
   */
  private parseOutput(output: string): string {
    // 移除 ANSI 颜色代码
    const cleaned = output.replace(/\x1b\[[0-9;]*m/g, '');

    // 尝试解析 JSON 格式
    try {
      const json = JSON.parse(cleaned);
      if (json.result) {
        return json.result;
      }
      if (json.text) {
        return json.text;
      }
    } catch {
      // 不是 JSON，保持原有逻辑
      logger.debug('输出非 JSON 格式，使用文本解析');
    }

    // 兼容非 JSON 输出
    const lines = cleaned.split('\n').filter(line => {
      const trimmed = line.trim();
      return (
        trimmed &&
        !trimmed.startsWith('>') &&
        !trimmed.startsWith('⚠') &&
        !trimmed.startsWith('请') &&
        trimmed.length > 0
      );
    });

    return lines.join('\n').trim() || cleaned.trim();
  }

  /**
   * 过滤警告消息
   */
  private filterWarnings(text: string): string {
    if (!text) return text;

    let result = text;

    // 移除所有 Claude Code 的启动警告和提示
    const warningPatterns = [
      /我已注意到您使用了.*?标志.*?请问您需要我完成什么任务？\n?/gi,
      /I have noticed you are using.*?This is a destructive operation.*?sandboxing\.\n?/gi,
      /我已收到您使用.*?标志启动.*?无需逐一确认\n?/gi,
      /I have received.*?--dangerously-skip-permissions.*?without you needing to confirm\n?/gi,
      /You have granted.*?full permission.*?execute operations without confirmation\n?/gi,
      /This is a special session.*?skip permission checks\n?/gi,
      /dangerously-skip-permissions.*?完全权限\n?/gi,
      /这是一个破坏性操作.*?沙盒安全保护\n?/gi,
      /Please confirm.*?do you want to continue in this mode\n?/gi,
      /通常只有在以下情况才需要:\n?/gi,
      /●.*?运行需要更高权限的系统命令\n?/gi,
      /●.*?执行受信任的内部工具\n?/gi,
      /●.*?处理已知安全的脚本\n?/gi,
      /如果您只是想进行常规的代码编辑.*?不需要使用此标志\n?/gi,
      /请告诉我您想要做什么.*?\n?/gi,
      /钉钉.*?自动化项目.*?可以帮助您进行各种开发任务\n?/gi,
      /●.*?修改和调试代码\n?/gi,
      /●.*?添加新功能\n?/gi,
      /●.*?运行测试\n?/gi,
      /●.*?执行 git 操作\n?/gi,
      /请问您今天需要我帮您处理什么任务\n?/gi,
    ];

    for (const pattern of warningPatterns) {
      result = result.replace(pattern, '');
    }

    // 移除空行
    result = result.replace(/\n{3,}/g, '\n\n');

    return result.trim();
  }

  /**
   * 构建包含上下文的完整提示
   */
  private buildPromptWithContext(prompt: string, context?: MessageContext): string {
    let fullPrompt = `你是一个友好的AI助手，正在与用户在钉钉群聊中直接对话。请直接回答用户的问题，不要询问项目、代码或任务相关的话题。\n\n`;

    // 注入项目记忆上下文
    if (context?.memoryContext) {
      fullPrompt += `${context.memoryContext}\n\n`;
    }

    if (context?.history && context.history.length > 0) {
      // 如果有历史消息，构建对话上下文
      const historyText = context.history
        .slice(-10) // 最多保留最近 10 条
        .map(msg => `${msg.role === 'user' ? '用户' : '助手'}: ${msg.content}`)
        .join('\n\n');

      fullPrompt += `对话历史:\n${historyText}\n\n`;
    }

    fullPrompt += `用户说: ${prompt}\n\n请直接回复:`;

    return fullPrompt;
  }

  /**
   * 构建命令参数
   * Claude Code CLI 调用方式: claude -p "prompt"
   * prompt 作为参数传递（不是 stdin），因为 node-pty 更适合这种方式
   *
   * --bare: 跳过 hooks、插件同步、LSP、auto-memory 等启动开销，
   *         将冷启动时间从 30-60s 降至 5-10s
   * --model: 指定模型，覆盖 settings.json 中的默认值
   */
  private buildCommandArgs(prompt: string): string[] {
    const args = ['-p', '--output-format=text', '--bare'];
    if (config.claude.permissionMode === 'dangerously-skip-permissions') {
      args.push('--dangerously-skip-permissions');
    }

    if (this.config.model) {
      args.push('--model', this.config.model);
    }

    args.push(prompt);
    return args;
  }

  /**
   * 执行命令（使用 node-pty 创建伪终端）
   * Claude CLI 需要 TTY 才能正常工作
   */
  private runCommand(args: string[]): Promise<ClaudeCodeResult> {
    return new Promise(resolve => {
      let output = '';
      let resolved = false;
      let timeoutId: ReturnType<typeof setTimeout> | null = null;

      logger.log(`执行命令: ${this.config.command} ${args.join(' ')}`);

      // 使用 node-pty 创建伪终端，Claude CLI 需要 TTY
      const ptyProcess = pty.spawn(this.config.command, args, {
        name: 'xterm-color',
        cols: 80,
        rows: 30,
        cwd: this.config.workingDir || process.cwd(),
        env: {
          ...process.env,
          ...this.getClaudeEnv(),
          LANG: 'zh_CN.UTF-8',
        },
      });

      // 捕获输出
      ptyProcess.onData((data: string) => {
        output += data;
      });

      // 进程结束
      ptyProcess.onExit(({ exitCode, signal }) => {
        if (resolved) return;
        resolved = true;

        // 清理超时定时器
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }

        logger.log(`进程结束，退出码: ${exitCode}, 信号: ${signal}`);
        logger.log(`原始输出: ${output.substring(0, 500)}`);

        // 过滤输出中的警告和控制字符
        const filteredOutput = this.filterWarnings(this.stripAnsiCodes(output.trim()));

        resolve({
          success: exitCode === 0,
          output: filteredOutput,
          error: undefined,
          exitCode: exitCode || 0,
          executionTime: 0,
        });
      });

      // 超时处理
      timeoutId = setTimeout(() => {
        if (!resolved) {
          logger.log(`执行超时 (${this.config.timeout / 1000}秒)，终止进程`);
          resolved = true;
          ptyProcess.kill();

          resolve({
            success: false,
            output: this.stripAnsiCodes(output.trim()),
            error: `命令执行超时 (${this.config.timeout / 1000}秒)`,
            exitCode: -1,
            executionTime: this.config.timeout,
          });
        }
      }, this.config.timeout);
    });
  }

  /**
   * 移除 ANSI 转义码
   */
  private stripAnsiCodes(str: string): string {
    // 移除 CSI 序列：\x1b[ (可选 ?/>/< 参数) 数字/分号 字母
    let result = str.replace(/\x1b\[[?<>]?[0-9;]*[a-zA-Z]/g, '');
    // 移除 OSC 序列：\x1b] ... \x07 (BEL) 或 \x1b\\ (ST)
    result = result.replace(/\x1b\][^\x07]*\x07/g, '');
    result = result.replace(/\x1b\][^\x1b]*\x1b\\/g, '');
    // 移除其他控制序列：\x1b 后跟单个字符（如 \x1b7 保存光标, \x1b8 恢复光标）
    result = result.replace(/\x1b[0-9:;<=>?]/g, '');
    result = result.replace(/\x1b[()][B0UK]/g, '');
    // 清理回车符（保留换行）
    result = result.replace(/\r\n/g, '\n').replace(/\r/g, '');
    return result;
  }

  /**
   * 流式执行（实时输出）
   */
  async executeStream(
    prompt: string,
    onChunk: (chunk: string) => void | Promise<void>,
    context?: MessageContext
  ): Promise<ClaudeCodeResult> {
    const startTime = Date.now();

    logger.log(`📝 流式执行 Claude Code: ${prompt.substring(0, 50)}...`);

    try {
      const fullPrompt = this.buildPromptWithContext(prompt, context);
      this.validateInput(fullPrompt);

      const args = this.buildCommandArgs(fullPrompt);
      return await this.runCommandStream(args, onChunk, startTime);
    } catch (error) {
      if (error instanceof InputValidationError) {
        return {
          success: false,
          output: '',
          error: error.message,
          executionTime: Date.now() - startTime,
          exitCode: -1,
        };
      }

      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : '未知错误',
        executionTime: Date.now() - startTime,
        exitCode: -1,
      };
    }
  }

  /**
   * 流式执行命令（使用 node-pty）
   */
  private async runCommandStream(
    args: string[],
    onChunk: (chunk: string) => void | Promise<void>,
    startTime: number
  ): Promise<ClaudeCodeResult> {
    return new Promise(resolve => {
      let output = '';
      let resolved = false;
      let timeoutId: ReturnType<typeof setTimeout> | null = null;

      // 使用 node-pty 创建伪终端
      const ptyProcess = pty.spawn(this.config.command, args, {
        name: 'xterm-color',
        cols: 80,
        rows: 30,
        cwd: this.config.workingDir || process.cwd(),
        env: {
          ...process.env,
          ...this.getClaudeEnv(),
          LANG: 'zh_CN.UTF-8',
        },
      });

      // 流式输出
      ptyProcess.onData(async (data: string) => {
        output += data;
        // 清理 ANSI 控制码后回调，避免下游收到乱码
        await onChunk(this.stripAnsiCodes(data));
      });

      ptyProcess.onExit(({ exitCode }) => {
        if (resolved) return;
        resolved = true;

        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }

        const parsedOutput = this.parseOutput(this.stripAnsiCodes(output.trim()));

        resolve({
          success: exitCode === 0,
          output: parsedOutput,
          error: undefined,
          exitCode: exitCode || 0,
          executionTime: Date.now() - startTime,
        });
      });

      // 超时处理
      timeoutId = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          ptyProcess.kill();

          resolve({
            success: false,
            output: this.stripAnsiCodes(output.trim()),
            error: `命令执行超时 (${this.config.timeout / 1000}秒)`,
            exitCode: -1,
            executionTime: this.config.timeout,
          });
        }
      }, this.config.timeout);
    });
  }

  /**
   * 检查 Claude Code CLI 是否可用
   */
  async isAvailable(): Promise<boolean> {
    return new Promise(resolve => {
      // 使用 pty 创建伪终端检查版本
      const ptyProcess = pty.spawn(this.config.command, ['--version'], {
        name: 'xterm-color',
        cols: 80,
        rows: 30,
        cwd: this.config.workingDir || process.cwd(),
        env: { ...process.env, ...this.getClaudeEnv() },
      });

      let output = '';
      let resolved = false;

      ptyProcess.onData((data: string) => {
        output += data;
      });

      ptyProcess.onExit(({ exitCode }) => {
        if (resolved) return;
        resolved = true;
        resolve(exitCode === 0 && output.includes('Claude Code'));
      });

      // 快速超时
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          ptyProcess.kill();
          resolve(false);
        }
      }, 5000);
    });
  }

  /**
   * 获取当前配置
   */
  getConfig(): ClaudeCodeConfig {
    return { ...this.config };
  }

  // ==================== 持久化会话模式 ====================

  /**
   * 初始化会话池（启用持久化会话模式）
   *
   * 启用后，executeSession() 将复用已有的 Claude CLI 进程，
   * 避免每次消息都冷启动（消除约 85 秒延迟）。
   */
  async initSessionPool(poolConfig?: SessionPoolConfig): Promise<void> {
    if (this.sessionPool) {
      logger.log('会话池已初始化，跳过');
      return;
    }

    this.sessionPool = new SessionPool(
      {
        command: this.config.command,
        workingDir: this.config.workingDir,
        model: this.config.model,
        permissionMode: config.claude.permissionMode,
      },
      {
        ...poolConfig,
        warmUpCount: config.persistentSession.warmUpSessions,
      }
    );

    this.sessionPool.startCleanup();
    logger.log('会话池已初始化');

    const warmCount = config.persistentSession.warmUpSessions;
    if (warmCount > 0) {
      await this.sessionPool.warmUp(warmCount);
    }
  }

  /**
   * 使用持久化会话执行消息
   *
   * 通过 SessionPool 复用已有 Claude CLI 进程，
   * 首次消息仍需等待进程启动，后续消息直接发送，无需冷启动。
   * 如果会话池未初始化，自动降级到 executeStream()。
   */
  async executeSession(
    conversationId: string,
    prompt: string,
    onChunk?: (chunk: string) => void,
    context?: MessageContext,
    streamCallbacks?: SessionCallbacks
  ): Promise<ClaudeCodeResult> {
    const startTime = Date.now();

    // 降级：会话池未初始化时使用 executeStream
    if (!this.sessionPool) {
      logger.log('会话池未初始化，降级到 executeStream');
      if (onChunk) {
        return this.executeStream(prompt, onChunk, context);
      }
      return this.execute(prompt, context);
    }

    logger.log(`🚀 持久化会话执行: ${conversationId} - ${prompt.substring(0, 50)}...`);

    try {
      const fullPrompt = this.buildPromptWithContext(prompt, context);
      this.validateInput(fullPrompt);

      const callbacks: SessionCallbacks = { ...streamCallbacks };
      if (onChunk && !callbacks.onText) {
        callbacks.onText = onChunk;
      }

      const result: SessionResult = await this.sessionPool.send(
        conversationId,
        fullPrompt,
        callbacks
      );

      // 过滤输出中的警告
      const filteredOutput = this.filterWarnings(result.output);

      return {
        success: result.success,
        output: filteredOutput,
        error: result.error,
        executionTime: result.executionTime || Date.now() - startTime,
        exitCode: result.success ? 0 : -1,
      };
    } catch (error) {
      logger.error('持久化会话执行失败:', error);

      // 降级到 executeStream
      logger.log('降级到 executeStream');
      if (onChunk) {
        return this.executeStream(prompt, onChunk, context);
      }
      return this.execute(prompt, context);
    }
  }

  /**
   * 获取会话池状态（诊断用）
   */
  getSessionPoolStatus(): Array<{
    conversationId: string;
    state: string;
    sessionId: string;
    lastActivity: number;
    createdAt: number;
  }> {
    return this.sessionPool?.getStatus() ?? [];
  }

  /**
   * 关闭会话池中所有会话
   */
  async closeSessionPool(): Promise<void> {
    if (this.sessionPool) {
      await this.sessionPool.closeAll();
      logger.log('会话池已关闭');
    }
  }

  /**
   * 关闭会话池中指定会话（用于 /stop 命令）
   */
  async closeSessionPoolSession(conversationId: string): Promise<void> {
    if (this.sessionPool) {
      await this.sessionPool.closeSession(conversationId);
      logger.log(`会话已关闭: ${conversationId}`);
    }
  }
}

function createClaudeCodeExecutor(options?: Partial<ClaudeCodeConfig>): ClaudeCodeExecutor {
  return new ClaudeCodeExecutor(options);
}
