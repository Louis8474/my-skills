/**
 * 历史消息构建工具 - 提供对话历史构建的共享工具函数
 */
import { SessionManager } from '../session-manager/sessionManager';

export interface HistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * 构建传递给 AI 的对话历史
 * @param sessionManager 会话管理器实例
 * @param conversationId 会话 ID
 * @param maxMessages 最大消息数量（默认 20）
 * @returns 格式化的历史消息数组
 */
export async function buildHistory(
  sessionManager: SessionManager,
  conversationId: string,
  maxMessages: number = 20
): Promise<HistoryMessage[]> {
  const messages = await sessionManager.getHistory(conversationId, maxMessages);

  return messages
    .filter(msg => msg.type === 'user' || msg.type === 'ai')
    .map(msg => ({
      role: msg.type === 'user' ? ('user' as const) : ('assistant' as const),
      content: msg.content,
    }));
}
