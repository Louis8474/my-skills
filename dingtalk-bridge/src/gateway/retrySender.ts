/**
 * 消息重试发送器
 * 负责管理发送失败的消息并自动重试
 */
import { calculateDelay } from '../utils/retry';
import { createSafeLogger } from '../utils/logger';

const logger = createSafeLogger('RetrySender');

/**
 * 重试消息类型
 */
export type RetryMessageType = 'text' | 'markdown';

/**
 * 重试消息接口
 */
export interface RetryMessage {
  id: string;
  conversationId: string;
  type: RetryMessageType;
  content: string;
  title?: string; // for markdown
  mentionList?: string[];
  retryCount: number;
  lastAttemptAt: number;
  createdAt: number;
  status: 'pending' | 'sending' | 'sent' | 'failed';
  lastError?: string;
}

/**
 * 重试发送器配置
 */
export interface RetrySenderConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  checkInterval: number;
  maxQueueSize: number;
}

const DEFAULT_CONFIG: RetrySenderConfig = {
  maxRetries: 5,
  baseDelay: 5000, // 5 秒
  maxDelay: 300000, // 5 分钟
  checkInterval: 10000, // 10 秒
  maxQueueSize: 1000,
};

/**
 * 消息发送函数类型
 */
export type MessageSender = (
  conversationId: string,
  content: string,
  title?: string,
  mentionList?: string[]
) => Promise<boolean>;

/**
 * 消息重试发送器类
 */
export class RetrySender {
  private queue: Map<string, RetryMessage> = new Map();
  private config: RetrySenderConfig;
  private sender: MessageSender | null = null;
  private timer: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;

  constructor(config?: Partial<RetrySenderConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * 设置消息发送函数
   */
  setSender(sender: MessageSender): void {
    this.sender = sender;
  }

  /**
   * 启动重试发送器
   */
  start(): void {
    if (this.isRunning) {
      logger.log('已经在运行中');
      return;
    }

    this.isRunning = true;
    logger.log('重试发送器已启动');
    logger.log(`  - 最大重试次数: ${this.config.maxRetries}`);
    logger.log(`  - 重试延迟: ${this.config.baseDelay}ms - ${this.config.maxDelay}ms`);
    logger.log(`  - 检查间隔: ${this.config.checkInterval}ms`);

    this.scheduleNextCheck();
  }

  /**
   * 停止重试发送器
   */
  stop(): void {
    this.isRunning = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    logger.log('重试发送器已停止');
  }

  /**
   * 添加消息到重试队列
   */
  add(
    id: string,
    conversationId: string,
    type: RetryMessageType,
    content: string,
    options?: { title?: string; mentionList?: string[] }
  ): boolean {
    // 检查队列大小
    if (this.queue.size >= this.config.maxQueueSize) {
      logger.warn('队列已满，拒绝新消息');
      return false;
    }

    const message: RetryMessage = {
      id,
      conversationId,
      type,
      content,
      title: options?.title,
      mentionList: options?.mentionList,
      retryCount: 0,
      lastAttemptAt: 0,
      createdAt: Date.now(),
      status: 'pending',
    };

    this.queue.set(id, message);
    logger.log(`消息已加入重试队列: ${id}`);
    return true;
  }

  /**
   * 开始发送消息
   */
  startSending(id: string): boolean {
    const message = this.queue.get(id);
    if (!message || message.status !== 'pending') {
      return false;
    }
    message.status = 'sending';
    return true;
  }

  /**
   * 标记消息已发送
   */
  markSent(id: string): void {
    const message = this.queue.get(id);
    if (message) {
      message.status = 'sent';
      this.queue.delete(id);
      logger.log(`消息发送成功: ${id}`);
    }
  }

  /**
   * 标记消息发送失败
   */
  markFailed(id: string, error?: string): void {
    const message = this.queue.get(id);
    if (!message) return;

    message.retryCount++;
    message.lastError = error;
    message.lastAttemptAt = Date.now();

    if (message.retryCount >= this.config.maxRetries) {
      message.status = 'failed';
      logger.error(`消息发送失败，达到最大重试次数: ${id}`);
    } else {
      message.status = 'pending';
      logger.log(
        `消息将在重试后发送: ${id} (重试 ${message.retryCount}/${this.config.maxRetries})`
      );
    }
  }

  /**
   * 获取待发送的消息列表
   */
  getPending(): RetryMessage[] {
    const pending: RetryMessage[] = [];
    const now = Date.now();

    for (const message of this.queue.values()) {
      if (message.status === 'pending') {
        // 检查是否到达重试时间
        if (message.lastAttemptAt > 0) {
          const delay = this.calculateDelay(message.retryCount);
          if (now - message.lastAttemptAt < delay) {
            continue; // 还未到重试时间
          }
        }
        pending.push(message);
      }
    }

    return pending;
  }

  /**
   * 获取队列统计信息
   */
  getStats(): {
    total: number;
    pending: number;
    sending: number;
    sent: number;
    failed: number;
  } {
    let pending = 0;
    let sending = 0;
    let sent = 0;
    let failed = 0;

    for (const message of this.queue.values()) {
      switch (message.status) {
        case 'pending':
          pending++;
          break;
        case 'sending':
          sending++;
          break;
        case 'sent':
          sent++;
          break;
        case 'failed':
          failed++;
          break;
      }
    }

    return { total: this.queue.size, pending, sending, sent, failed };
  }

  /**
   * 清除所有消息
   */
  clear(): void {
    this.queue.clear();
    logger.log('队列已清空');
  }

  /**
   * 清除失败的消息
   */
  clearFailed(): void {
    for (const [id, message] of this.queue.entries()) {
      if (message.status === 'failed') {
        this.queue.delete(id);
      }
    }
  }

  /**
   * 计算重试延迟
   */
  private calculateDelay(retryCount: number): number {
    // 使用共享的 calculateDelay 函数（指数退避）
    return calculateDelay(retryCount, this.config.baseDelay, this.config.maxDelay, true);
  }

  /**
   * 安排下次检查
   */
  private scheduleNextCheck(): void {
    if (!this.isRunning) return;

    this.timer = setTimeout(() => {
      this.processQueue();
      this.scheduleNextCheck();
    }, this.config.checkInterval);
  }

  /**
   * 处理队列中的消息
   */
  private async processQueue(): Promise<void> {
    if (!this.sender) {
      return;
    }

    const pending = this.getPending();
    if (pending.length === 0) {
      return;
    }

    logger.log(`准备重试发送 ${pending.length} 条消息`);

    for (const message of pending) {
      const started = this.startSending(message.id);
      if (!started) continue;

      try {
        let success: boolean;
        if (message.type === 'markdown') {
          success = await this.sender(
            message.conversationId,
            message.content,
            message.title,
            message.mentionList
          );
        } else {
          success = await this.sender(
            message.conversationId,
            message.content,
            undefined,
            message.mentionList
          );
        }

        if (success) {
          this.markSent(message.id);
        } else {
          this.markFailed(message.id, '发送返回失败');
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        this.markFailed(message.id, errorMsg);
      }
    }
  }
}

/**
 * 创建重试发送器实例
 */
export function createRetrySender(config?: Partial<RetrySenderConfig>): RetrySender {
  return new RetrySender(config);
}
