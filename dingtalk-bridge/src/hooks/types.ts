/**
 * 生命周期钩子类型定义
 */

/** 钩子事件类型 */
export type HookEvent =
  | 'message_received'
  | 'message_sent'
  | 'session_created'
  | 'session_reset'
  | 'cron_trigger'
  | 'permission_change'
  | 'error';

/** Shell 类型钩子动作 */
export interface ShellHookAction {
  type: 'shell';
  command: string;
}

/** HTTP 类型钩子动作 */
export interface HttpHookAction {
  type: 'http';
  url: string;
  method: string;
  body?: string;
  headers?: Record<string, string>;
}

export type HookAction = ShellHookAction | HttpHookAction;

/** 钩子定义 */
export interface Hook {
  id: string;
  event: HookEvent;
  action: HookAction;
  async?: boolean; // 默认 true，fail-open
  enabled: boolean;
}

/** 钩子上下文 - 传递给动作的变量 */
export interface HookContext {
  userId?: string;
  userName?: string;
  conversationId?: string;
  content?: string;
  error?: string;
  [key: string]: unknown;
}
