/**
 * OpenCode Agent 适配器 - 将 OpenCodeExecutor 适配为 Agent 接口
 */

import type { Agent, AgentResult, AgentConfig } from '../types';
import type { MessageContext } from '../../types/message';
import type { OpenCodeConfig } from '../../opencode/executor';
import { OpenCodeExecutor } from '../../opencode/executor';

export class OpenCodeAgent implements Agent {
  readonly name = 'opencode';
  readonly type = 'opencode';
  private executor: OpenCodeExecutor;

  constructor(optionsOrExecutor?: Partial<OpenCodeConfig> | OpenCodeExecutor) {
    if (
      optionsOrExecutor &&
      typeof optionsOrExecutor === 'object' &&
      'execute' in optionsOrExecutor
    ) {
      // Dependency injection: accept an existing executor instance
      this.executor = optionsOrExecutor;
    } else {
      this.executor = new OpenCodeExecutor(optionsOrExecutor);
    }
  }

  async execute(prompt: string, context?: MessageContext): Promise<AgentResult> {
    const result = await this.executor.execute(prompt, context);
    return {
      success: result.success,
      output: result.output,
      error: result.error,
      executionTime: result.executionTime,
      exitCode: result.exitCode,
    };
  }

  async executeStream(
    prompt: string,
    onChunk: (chunk: string) => void,
    context?: MessageContext
  ): Promise<AgentResult> {
    const result = await this.executor.executeStream(prompt, onChunk, context);
    return {
      success: result.success,
      output: result.output,
      error: result.error,
      executionTime: result.executionTime,
      exitCode: result.exitCode,
    };
  }

  async isAvailable(): Promise<boolean> {
    return this.executor.isAvailable();
  }

  getConfig(): AgentConfig {
    const cfg = this.executor.getConfig();
    return {
      command: cfg.command,
      timeout: cfg.timeout,
      maxRetries: cfg.maxRetries,
      retryBaseDelay: cfg.retryBaseDelay || 1000,
      retryMaxDelay: cfg.retryMaxDelay || 10000,
      workingDir: cfg.workingDir,
      model: cfg.model,
      maxInputLength: cfg.maxInputLength,
    };
  }

  /** 获取底层执行器（兼容用途） */
  getExecutor(): OpenCodeExecutor {
    return this.executor;
  }
}
