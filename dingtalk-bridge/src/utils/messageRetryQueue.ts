/**
 * 消息重试队列
 * 确保每条消息都能成功发送
 */
import { calculateDelay } from './retry';
import { createSafeLogger } from './logger';

const logger = createSafeLogger('MessageRetryQueue');

export type MessageType = 'text' | 'markdown';

export interface QueuedMessage {
  id: string;
  conversationId: string;
  type: MessageType;
  content: string; // text: content, markdown: text
  title?: string; // markdown 标题
  mentionList?: string[]; // @ 用户列表
  retryCount: number; // 当前重试次数
  maxRetries: number; // 最大重试次数
  createdAt: number; // 创建时间
  lastAttemptAt?: number; // 上次尝试时间
  error?: string; // 最后错误信息
  status: 'pending' | 'sending' | 'sent' | 'failed';
}

export class MessageRetryQueue {
  private queue: Map<string, QueuedMessage> = new Map();
  private maxRetries: number;
  private baseDelay: number; // 基础延迟（毫秒）
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(options?: { maxRetries?: number; baseDelay?: number }) {
    this.maxRetries = options?.maxRetries ?? 10; // 默认最多重试 10 次
    this.baseDelay = options?.baseDelay ?? 5000; // 基础延迟 5 秒

    // 启动定期清理
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60 * 1000); // 每分钟清理一次
  }

  /**
   * 添加消息到队列
   */
  add(
    id: string,
    conversationId: string,
    type: MessageType,
    content: string,
    options?: { title?: string; mentionList?: string[] }
  ): void {
    const message: QueuedMessage = {
      id,
      conversationId,
      type,
      content,
      title: options?.title,
      mentionList: options?.mentionList,
      retryCount: 0,
      maxRetries: this.maxRetries,
      createdAt: Date.now(),
      status: 'pending',
    };

    this.queue.set(id, message);
    logger.log(
      `添加消息到队列: ${id} (类型: ${type}, 目标: ${conversationId.substring(0, 20)}...)`
    );
  }

  /**
   * 获取待发送的消息
   */
  getPending(): QueuedMessage[] {
    return Array.from(this.queue.values())
      .filter(msg => msg.status === 'pending')
      .sort((a, b) => a.createdAt - b.createdAt); // 按创建时间排序
  }

  /**
   * 开始发送（标记为 sending）
   */
  startSending(id: string): QueuedMessage | undefined {
    const msg = this.queue.get(id);
    if (msg && msg.status === 'pending') {
      msg.status = 'sending';
      msg.lastAttemptAt = Date.now();
      return msg;
    }
    return undefined;
  }

  /**
   * 发送成功
   */
  markSent(id: string): void {
    const msg = this.queue.get(id);
    if (msg) {
      msg.status = 'sent';
      logger.log(`消息发送成功: ${id} (重试 ${msg.retryCount} 次)`);
    }
  }

  /**
   * 发送失败，增加重试次数
   */
  markFailed(id: string, error?: string): void {
    const msg = this.queue.get(id);
    if (msg && msg.status === 'sending') {
      msg.retryCount++;
      msg.error = error;

      if (msg.retryCount >= msg.maxRetries) {
        msg.status = 'failed';
        logger.error(`消息发送失败，已达最大重试次数: ${id}`);
      } else {
        msg.status = 'pending';
        const delay = this.calculateDelay(msg.retryCount);
        logger.warn(`消息发送失败，将在 ${delay / 1000}s 后重试: ${id}, 错误: ${error}`);
      }
    }
  }

  /**
   * 获取统计信息
   */
  getStats(): { pending: number; sending: number; sent: number; failed: number; total: number } {
    const messages = Array.from(this.queue.values());
    return {
      pending: messages.filter(m => m.status === 'pending').length,
      sending: messages.filter(m => m.status === 'sending').length,
      sent: messages.filter(m => m.status === 'sent').length,
      failed: messages.filter(m => m.status === 'failed').length,
      total: messages.length,
    };
  }

  /**
   * 获取失败消息列表
   */
  getFailedMessages(): QueuedMessage[] {
    return Array.from(this.queue.values()).filter(msg => msg.status === 'failed');
  }

  /**
   * 计算延迟（指数退避）
   */
  private calculateDelay(retryCount: number): number {
    // 使用共享的 calculateDelay 函数（无抖动，指数退避）
    return calculateDelay(retryCount, this.baseDelay, 5 * 60 * 1000, true);
  }

  /**
   * 清理已发送和过期的失败消息
   */
  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [id, msg] of this.queue.entries()) {
      // 清理已发送超过 1 小时的消息
      if (msg.status === 'sent' && msg.lastAttemptAt && now - msg.lastAttemptAt > 60 * 60 * 1000) {
        this.queue.delete(id);
        cleaned++;
        continue;
      }

      // 清理失败超过 24 小时的消息
      if (
        msg.status === 'failed' &&
        msg.lastAttemptAt &&
        now - msg.lastAttemptAt > 24 * 60 * 60 * 1000
      ) {
        this.queue.delete(id);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.log(`清理了 ${cleaned} 条过期消息`);
    }
  }

  /**
   * 停止队列
   */
  stop(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}
