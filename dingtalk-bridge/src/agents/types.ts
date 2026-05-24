/**
 * Agent 抽象层类型定义
 * 参考 cc-connect 的 core/interfaces.go 设计
 * 统一 OpenCode 和 Claude Code CLI 执行器的接口
 */

import type { MessageContext } from '../types/message';

/** Agent 执行结果 */
export interface AgentResult {
  success: boolean;
  output: string;
  error?: string;
  executionTime: number;
  exitCode: number;
}

/** Agent 配置 */
export interface AgentConfig {
  command: string;
  timeout: number;
  maxRetries: number;
  retryBaseDelay: number;
  retryMaxDelay: number;
  workingDir?: string;
  model: string;
  maxInputLength: number;
}

/** 核心 Agent 接口 - 每个 Agent 必须实现 */
export interface Agent {
  readonly name: string;
  readonly type: string;

  /** 同步执行，等待完成返回结果 */
  execute(prompt: string, context?: MessageContext): Promise<AgentResult>;

  /** 流式执行，通过 onChunk 实时返回输出 */
  executeStream(
    prompt: string,
    onChunk: (chunk: string) => void,
    context?: MessageContext
  ): Promise<AgentResult>;

  /** 检查 CLI 是否可用 */
  isAvailable(): Promise<boolean>;

  /** 获取当前配置 */
  getConfig(): AgentConfig;
}

/** 可选：模式切换（权限模式） */
export interface ModeSwitcher {
  setMode(mode: PermissionMode): void;
  getMode(): PermissionMode;
}

/** 权限模式 */
export type PermissionMode = 'default' | 'plan' | 'auto-edit' | 'full-auto';
