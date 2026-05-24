/**
 * 会话类型定义
 * 用于管理用户对话会话
 */

import { ConversationMessage } from './message';

/**
 * 会话状态枚举
 */
export enum SessionState {
  /** 活跃状态 - 正在交互 */
  Active = 'active',
  /** 空闲状态 - 等待用户响应 */
  Idle = 'idle',
  /** 过期状态 - 超过 TTL 未活动 */
  Expired = 'expired',
  /** 终止状态 - 用户主动结束 */
  Terminated = 'terminated',
}

/**
 * 会话配置
 */
export interface SessionConfig {
  /** 会话 TTL (毫秒) */
  ttl: number;
  /** 最大历史消息数 */
  maxHistoryMessages: number;
  /** 最大会话数（用于内存限制） */
  maxSessions: number;
}

/**
 * 会话上下文
 */
export interface ConversationContext {
  conversationId: string;
  messages: ConversationMessage[];
  metadata: {
    createdAt: number;
    lastActivityAt: number;
    messageCount: number;
  };
}

/**
 * 会话对象
 */
export interface Session {
  conversationId: string;
  userId: string;
  state: SessionState;
  config: SessionConfig;
  context: ConversationContext;
  createdAt: number;
  lastActivityAt: number;
  expiresAt?: number;
}

/**
 * 默认会话配置
 */
export const DEFAULT_SESSION_CONFIG: SessionConfig = {
  ttl: 30 * 60 * 1000, // 30 分钟
  maxHistoryMessages: 50,
  maxSessions: 1000,
};
