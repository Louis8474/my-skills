/**
 * 消息类型定义
 */

/**
 * 消息元数据
 */
export interface MessageMetadata {
  timestamp: number;
  source: 'dingtalk' | 'system' | 'ai' | 'scheduler';
}

/**
 * 基础消息接口
 */
export interface Message {
  id: string;
  conversationId: string;
  userId: string;
  content: string;
  metadata: MessageMetadata;
}

/**
 * 用户消息
 */
export interface UserMessage extends Message {
  type: 'user';
  username?: string;
}

/**
 * AI 消息
 */
export interface AIMessage extends Message {
  type: 'ai';
}

/**
 * 系统消息
 */
export interface SystemMessage extends Message {
  type: 'system';
}

/**
 * 对话消息联合类型
 */
export type ConversationMessage = UserMessage | AIMessage | SystemMessage;

/**
 * AI 执行上下文（OpenCode/Claude 通用）
 */
export interface MessageContext {
  userId: string;
  userName?: string;
  conversationId?: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  memoryContext?: string;
}