/**
 * Open Code CLI 执行器
 * 负责调用 Open Code CLI 执行各种任务（编程、对话、调用 skill/MCP）
 * 所有消息都通过 Open Code 处理，利用其内置的大模型能力
 */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { spawn, ChildProcess } from 'child_process';
import { config } from '../config';
import { withRetry } from '../utils/retry';
import { createSafeLogger } from '../utils/logger';
import type { MessageContext } from '../types/message';

const logger = createSafeLogger('OpenCode');

export interface OpenCodeResult {
  success: boolean;
  output: string;
  error?: string;
  executionTime: number;
  exitCode: number;
}

export interface OpenCodeConfig {
  command: string; // opencode 命令路径
  timeout: number; // 执行超时时间
  maxRetries: number; // 最大重试次数
  retryBaseDelay?: number; // 重试基础延迟（毫秒）
  retryMaxDelay?: number; // 重试最大延迟（毫秒）
  workingDir?: string; // 工作目录
  model: string; // 模型名称
  maxInputLength: number; // 最大输入长度
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
 * Open Code CLI 执行器类
 */
export class OpenCodeExecutor {
  private config: OpenCodeConfig;

  constructor(options?: Partial<OpenCodeConfig>) {
    this.config = {
      command: config.ai.command,
      timeout: config.ai.timeout,
      maxRetries: config.ai.maxRetries,
      workingDir: config.ai.workingDir,
      model: config.ai.model,
      maxInputLength: config.ai.maxInputLength,
      ...options,
    };
  }

  /**
   * 执行 Open Code 命令 - 主要入口
   * 所有消息都通过这个方法处理
   */
  async execute(prompt: string, context?: MessageContext): Promise<OpenCodeResult> {
    const startTime = Date.now();

    logger.log(`📝 执行 Open Code: ${prompt.substring(0, 50)}...`);
    if (context?.userId) {
      logger.log(`   用户: ${context.userName || context.userId}`);
    }

    try {
      // 构建完整的输入（包含上下文）
      const fullPrompt = this.buildPromptWithContext(prompt, context);

      // 验证输入长度
      this.validateInput(fullPrompt);

      // 构建命令参数（不包含用户消息，通过 stdin 传递）
      const args = this.buildCommandArgs();

      // 通过 stdin 传递消息，避免命令注入风险
      // 使用重试机制处理临时性故障
      const result = await withRetry(() => this.runCommand(args, fullPrompt), {
        maxRetries: this.config.maxRetries,
        baseDelay: this.config.retryBaseDelay || 1000,
        maxDelay: this.config.retryMaxDelay || 10000,
        exponential: true,
        onRetry: (attempt, error, delay) => {
          logger.warn(
            `执行失败，正在重试 (第 ${attempt}/${this.config.maxRetries} 次，延迟 ${delay}ms): ${error.message}`
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
   * 解析 OpenCode 的输出
   * MiniMax Free 模型直接输出文本
   */
  private parseOutput(output: string): string {
    // 移除 ANSI 颜色代码
    const cleanedOutput = output.replace(/\x1b\[[0-9;]*m/g, '');
    // 移除可能的状态行（如 "> build · minimax-m2.5-free"）
    const lines = cleanedOutput.split('\n').filter(line => {
      const trimmed = line.trim();
      return trimmed && !trimmed.startsWith('>') && !trimmed.includes('·');
    });
    return lines.join('\n').trim() || cleanedOutput.trim();
  }

  /**
   * 构建包含上下文的完整提示
   */
  private buildPromptWithContext(prompt: string, context?: MessageContext): string {
    const parts: string[] = [];

    // 注入项目记忆上下文
    if (context?.memoryContext) {
      parts.push(context.memoryContext);
    }

    // 如果有历史消息，构建对话上下文
    if (context?.history && context.history.length > 0) {
      const historyText = context.history
        .slice(-10) // 最多保留最近 10 条
        .map(msg => `${msg.role === 'user' ? '用户' : '助手'}: ${msg.content}`)
        .join('\n\n');
      parts.push(`【对话历史】\n${historyText}`);
    }

    parts.push(`【当前问题】\n${prompt}`);

    return parts.join('\n\n');
  }

  /**
   * 构建命令参数（不包含用户输入，通过 stdin 传递以提高安全性）
   * OpenCode CLI 调用方式：opencode run [-m "model"]
   * 如果配置了模型则使用，否则使用 OpenCode CLI 默认配置
   */
  private buildCommandArgs(): string[] {
    const args = ['run'];
    if (this.config.model) {
      args.push('-m', this.config.model);
    }
    return args;
  }

  /**
   * 执行命令（通过 stdin 传递消息）
   */
  private runCommand(args: string[], stdinInput: string): Promise<OpenCodeResult> {
    return new Promise(resolve => {
      let stdout = '';
      let stderr = '';
      let processInstance: ChildProcess | null = null;
      let resolved = false;
      let timeoutId: ReturnType<typeof setTimeout> | null = null;

      logger.log(`执行命令: ${this.config.command} ${args.join(' ')} (通过 stdin 传递输入)`);

      // 启动 Open Code CLI 进程，使用 pipe stdin
      processInstance = spawn(this.config.command, args, {
        cwd: this.config.workingDir,
        stdio: ['pipe', 'pipe', 'pipe'], // stdin 使用 pipe
        env: {
          ...process.env,
          LANG: 'zh_CN.UTF-8',
        },
      });

      // 通过 stdin 写入消息（安全：避免命令行注入）
      if (processInstance.stdin) {
        processInstance.stdin.write(stdinInput);
        processInstance.stdin.end();
      }

      // 捕获标准输出
      processInstance.stdout?.on('data', data => {
        stdout += data.toString();
      });

      // 捕获错误输出
      processInstance.stderr?.on('data', data => {
        stderr += data.toString();
      });

      // 进程结束
      processInstance.on('close', code => {
        if (resolved) return;
        resolved = true;

        // 清理超时定时器
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }

        logger.log(`进程结束，退出码: ${code}`);
        // 调试：打印 stdout 和 stderr 内容
        if (stdout) {
          logger.log(`stdout: ${stdout.substring(0, 500)}`);
        }
        if (stderr) {
          logger.log(`stderr: ${stderr.substring(0, 500)}`);
        }

        resolve({
          success: code === 0,
          output: stdout.trim(),
          error: stderr.trim() || undefined,
          exitCode: code || 0,
          executionTime: 0,
        });
      });

      // 错误处理
      processInstance.on('error', error => {
        if (resolved) return;
        resolved = true;

        // 清理超时定时器
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }

        logger.error('进程错误:', error);

        // 如果是命令未找到
        if ('code' in error && error.code === 'ENOENT') {
          resolve({
            success: false,
            output: '',
            error: `Open Code CLI 未安装或找不到命令: ${this.config.command}`,
            exitCode: -1,
            executionTime: 0,
          });
        } else {
          resolve({
            success: false,
            output: '',
            error: error.message,
            exitCode: -1,
            executionTime: 0,
          });
        }
      });

      // 超时处理
      timeoutId = setTimeout(() => {
        if (processInstance && !processInstance.killed && !resolved) {
          logger.log(`执行超时 (${this.config.timeout / 1000}秒)，终止进程`);
          resolved = true;
          processInstance.kill('SIGTERM');

          // 如果 SIGTERM 不生效，强制杀死
          setTimeout(() => {
            if (processInstance && !processInstance.killed) {
              processInstance.kill('SIGKILL');
            }
          }, 5000);

          resolve({
            success: false,
            output: stdout.trim(),
            error: `命令执行超时 (${this.config.timeout / 1000}秒)`,
            exitCode: -1,
            executionTime: this.config.timeout,
          });
        }
      }, this.config.timeout);
    });
  }

  /**
   * 流式执行（实时输出）
   * 支持长时间任务的实时反馈
   */
  async executeStream(
    prompt: string,
    onChunk: (chunk: string) => void | Promise<void>,
    context?: MessageContext
  ): Promise<OpenCodeResult> {
    const startTime = Date.now();

    logger.log(`📝 流式执行 Open Code: ${prompt.substring(0, 50)}...`);

    try {
      const fullPrompt = this.buildPromptWithContext(prompt, context);

      // 验证输入长度
      this.validateInput(fullPrompt);

      const args = this.buildCommandArgs();

      return await this.runCommandStream(args, fullPrompt, onChunk, startTime);
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
   * 流式执行命令
   */
  private async runCommandStream(
    args: string[],
    stdinInput: string,
    onChunk: (chunk: string) => void | Promise<void>,
    startTime: number
  ): Promise<OpenCodeResult> {
    return new Promise(resolve => {
      let stdout = '';
      let stderr = '';
      let processInstance: ChildProcess | null = null;
      let resolved = false;
      let timeoutId: ReturnType<typeof setTimeout> | null = null;

      processInstance = spawn(this.config.command, args, {
        cwd: this.config.workingDir,
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
          ...process.env,
          LANG: 'zh_CN.UTF-8',
        },
      });

      // 通过 stdin 写入消息
      if (processInstance.stdin) {
        processInstance.stdin.write(stdinInput);
        processInstance.stdin.end();
      }

      // 流式输出
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      processInstance.stdout?.on('data', async data => {
        const chunk = data.toString();
        stdout += chunk;
        await onChunk(chunk);
      });

      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      processInstance.stderr?.on('data', async data => {
        const chunk = data.toString();
        stderr += chunk;
        // 某些输出也可能是有用的
        if (!chunk.includes('warning') && !chunk.includes('Warning')) {
          await onChunk(chunk);
        }
      });

      processInstance.on('close', code => {
        if (resolved) return;
        resolved = true;

        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }

        const parsedOutput = this.parseOutput(stdout.trim());

        resolve({
          success: code === 0,
          output: parsedOutput,
          error: stderr.trim() || undefined,
          exitCode: code || 0,
          executionTime: Date.now() - startTime,
        });
      });

      processInstance.on('error', error => {
        if (resolved) return;
        resolved = true;

        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }

        resolve({
          success: false,
          output: '',
          error: error.message,
          exitCode: -1,
          executionTime: Date.now() - startTime,
        });
      });

      // 超时处理
      timeoutId = setTimeout(() => {
        if (processInstance && !processInstance.killed && !resolved) {
          resolved = true;
          processInstance.kill('SIGTERM');

          resolve({
            success: false,
            output: stdout.trim(),
            error: `命令执行超时 (${this.config.timeout / 1000}秒)`,
            exitCode: -1,
            executionTime: this.config.timeout,
          });
        }
      }, this.config.timeout);
    });
  }

  /**
   * 检查 OpenCode CLI 是否可用
   */
  async isAvailable(): Promise<boolean> {
    return new Promise(resolve => {
      let resolved = false;
      const proc = spawn(this.config.command, ['--version'], {
        stdio: 'ignore',
      });

      const timeoutId = setTimeout(() => {
        proc.kill();
        if (!resolved) {
          resolved = true;
          resolve(false);
        }
      }, 5000);

      proc.on('close', code => {
        clearTimeout(timeoutId);
        if (!resolved) {
          resolved = true;
          resolve(code === 0);
        }
      });

      proc.on('error', () => {
        clearTimeout(timeoutId);
        if (!resolved) {
          resolved = true;
          resolve(false);
        }
      });
    });
  }

  /**
   * 获取当前配置
   */
  getConfig(): OpenCodeConfig {
    return { ...this.config };
  }
}

function createOpenCodeExecutor(options?: Partial<OpenCodeConfig>): OpenCodeExecutor {
  return new OpenCodeExecutor(options);
}
