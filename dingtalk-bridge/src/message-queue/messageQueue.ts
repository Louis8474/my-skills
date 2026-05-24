/**
 * 消息队列
 * 负责消息的入队、出队和批量处理
 * 支持 SQLite 持久化存储
 */
import { UserMessage } from '../types/message';
import { SQLiteStorage, getStorage } from '../storage/sqlite';
import { config } from '../config';
import { createSafeLogger } from '../utils/logger';

const logger = createSafeLogger('MessageQueue');

export type MessagePriority = 'low' | 'normal' | 'high';

export interface QueuedMessage {
  message: UserMessage;
  priority: MessagePriority;
  enqueueTime: number;
  retryCount: number;
  processing: boolean; // 标记是否正在处理
}

/**
 * 消息队列类
 * 支持内存模式和 SQLite 持久化模式
 */
export class MessageQueue {
  private queue: QueuedMessage[] = [];
  private maxRetries: number;
  private maxQueueSize: number;
  private enablePersistence: boolean;
  private storage: SQLiteStorage | null = null;

  constructor(options?: {
    maxRetries?: number;
    maxQueueSize?: number;
    enablePersistence?: boolean;
  }) {
    this.maxRetries = options?.maxRetries ?? 3;
    this.maxQueueSize = options?.maxQueueSize ?? 1000;
    this.enablePersistence = options?.enablePersistence ?? config.messageQueue.enablePersistence;

    // 如果启用持久化，初始化 SQLite 存储
    if (this.enablePersistence) {
      try {
        this.storage = getStorage({
          dbPath: config.storage.dbPath || undefined,
          enableWAL: config.storage.enableWAL,
        });
        logger.log('SQLite 持久化已启用');
        // 从数据库恢复待处理消息
        this.restoreFromStorage();
      } catch (error) {
        logger.error('初始化 SQLite 存储失败:', error);
        logger.log('回退到内存模式');
        this.enablePersistence = false;
      }
    } else {
      logger.log('使用内存模式（持久化未启用）');
    }
  }

  /**
   * 从 SQLite 恢复待处理消息
   */
  private restoreFromStorage(): void {
    if (!this.storage) return;

    try {
      const pendingMessages = this.storage.getPendingQueueMessages(1000);
      for (const msg of pendingMessages) {
        const queued: QueuedMessage = {
          message: {
            id: msg.id,
            type: 'user',
            conversationId: msg.conversationId,
            userId: msg.userId,
            username: msg.username,
            content: msg.content,
            metadata: {
              timestamp: msg.createdAt,
              source: 'dingtalk',
            },
          },
          priority: msg.priority as MessagePriority,
          enqueueTime: msg.createdAt,
          retryCount: msg.retryCount,
          processing: msg.status === 'processing',
        };
        this.queue.push(queued);
      }
      logger.log(`从 SQLite 恢复 ${pendingMessages.length} 条消息`);
    } catch (error) {
      logger.error('从 SQLite 恢复消息失败:', error);
    }
  }

  /**
   * 入队消息
   */
  enqueue(message: UserMessage, priority: MessagePriority = 'normal'): boolean {
    // 队列容量检查
    if (this.queue.length >= this.maxQueueSize) {
      logger.warn(`队列已满 (${this.queue.length}/${this.maxQueueSize})，拒绝消息：${message.id}`);
      return false;
    }

    const queued: QueuedMessage = {
      message,
      priority,
      enqueueTime: Date.now(),
      retryCount: 0,
      processing: false,
    };

    // 使用二分插入代替全量排序
    this.insertByPriority(queued);

    // 如果启用持久化，保存到 SQLite
    if (this.enablePersistence && this.storage) {
      try {
        this.storage.saveQueueMessage({
          id: message.id,
          conversationId: message.conversationId,
          userId: message.userId,
          username: message.username,
          content: message.content,
          priority,
          status: 'pending',
          retryCount: 0,
          createdAt: queued.enqueueTime,
          updatedAt: queued.enqueueTime,
        });
      } catch (error) {
        logger.error('保存消息到 SQLite 失败:', error);
      }
    }

    logger.log(`📬 消息入队：${message.id} (优先级：${priority}, 队列长度：${this.queue.length})`);
    return true;
  }

  /**
   * 出队消息
   */
  dequeue(): QueuedMessage | null {
    // 找到第一个未在处理中的消息
    const index = this.queue.findIndex(item => !item.processing);

    if (index === -1) {
      return null;
    }

    const item = this.queue[index];
    item.processing = true;

    // 如果启用持久化，更新状态为 processing
    if (this.enablePersistence && this.storage) {
      try {
        this.storage.updateQueueMessageStatus(item.message.id, 'processing');
      } catch (error) {
        logger.error('更新消息状态失败:', error);
      }
    }

    return item;
  }

  /**
   * 批量出队
   */
  batchDequeue(count: number): QueuedMessage[] {
    const results: QueuedMessage[] = [];

    for (let i = 0; i < count; i++) {
      const item = this.dequeue();
      if (!item) break;
      results.push(item);
    }

    return results;
  }

  /**
   * 标记消息处理完成
   */
  complete(messageId: string): void {
    const item = this.queue.find(item => item.message.id === messageId);
    if (item) {
      item.processing = false;
      // 从队列中移除已完成的消息
      const index = this.queue.indexOf(item);
      this.queue.splice(index, 1);
    }

    // 如果启用持久化，更新状态为 completed
    if (this.enablePersistence && this.storage) {
      try {
        this.storage.updateQueueMessageStatus(messageId, 'completed');
      } catch (error) {
        logger.error('更新消息完成状态失败:', error);
      }
    }

    logger.log(`✅ 消息处理完成：${messageId}`);
  }

  /**
   * 消息处理失败，重新入队
   */
  fail(messageId: string, error?: string): void {
    const index = this.queue.findIndex(item => item.message.id === messageId && item.processing);

    if (index !== -1) {
      const item = this.queue[index];

      if (item.retryCount < this.maxRetries) {
        item.retryCount++;
        item.priority = 'high'; // 失败重试的消息优先级提高
        item.processing = false; // 重置处理状态，重新入队
        this.sortByPriority();

        // 如果启用持久化，更新重试状态
        if (this.enablePersistence && this.storage) {
          try {
            this.storage.updateQueueMessageStatus(messageId, 'pending', error);
          } catch (err) {
            logger.error('更新消息重试状态失败:', err);
          }
        }

        logger.log(`🔄 消息重试：${messageId} (第 ${item.retryCount} 次)`);
      } else {
        // 超过最大重试次数，从队列中移除
        this.queue.splice(index, 1);

        // 如果启用持久化，更新状态为 failed
        if (this.enablePersistence && this.storage) {
          try {
            this.storage.updateQueueMessageStatus(messageId, 'failed', error);
          } catch (err) {
            logger.error('更新消息失败状态失败:', err);
          }
        }

        logger.log(`❌ 消息处理失败：${messageId} (超过最大重试次数)`);
      }
    }
  }

  /**
   * 按优先级排序（完整排序，用于初始化或批量操作）
   */
  private sortByPriority(): void {
    const priorityOrder: Record<MessagePriority, number> = {
      high: 0,
      normal: 1,
      low: 2,
    };

    this.queue.sort((a, b) => {
      // 先按优先级排序
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // 同优先级按入队时间排序
      return a.enqueueTime - b.enqueueTime;
    });
  }

  /**
   * 二分插入（O(n) 插入，比全量排序 O(n log n) 更高效）
   */
  private insertByPriority(message: QueuedMessage): void {
    const priorityOrder: Record<MessagePriority, number> = {
      high: 0,
      normal: 1,
      low: 2,
    };
    const priority = priorityOrder[message.priority];
    const enqueueTime = message.enqueueTime;

    // 二分查找插入位置
    let left = 0,
      right = this.queue.length;
    while (left < right) {
      const mid = Math.floor((left + right) / 2);
      const midPriority = priorityOrder[this.queue[mid].priority];
      const midTime = this.queue[mid].enqueueTime;

      // 优先级低的排在后面，同优先级按时间排
      if (midPriority > priority || (midPriority === priority && midTime > enqueueTime)) {
        right = mid;
      } else {
        left = mid + 1;
      }
    }
    this.queue.splice(left, 0, message);
  }

  /**
   * 获取队列长度
   */
  size(): number {
    return this.queue.length;
  }

  /**
   * 获取处理中的消息数量
   */
  processingCount(): number {
    return this.queue.filter(item => item.processing).length;
  }

  /**
   * 清空队列
   */
  clear(): void {
    this.queue = [];

    // 如果启用持久化，清理数据库中的消息
    if (this.enablePersistence && this.storage) {
      try {
        const stats = this.storage.getQueueStats();
        const total = stats.pending + stats.processing + stats.completed + stats.failed;
        if (total > 0) {
          // 清理所有消息
          const pending = this.storage.getPendingQueueMessages(10000);
          for (const msg of pending) {
            this.storage.deleteQueueMessage(msg.id);
          }
          logger.log(`已清理 SQLite 中的 ${total} 条消息`);
        }
      } catch (error) {
        logger.error('清理 SQLite 消息失败:', error);
      }
    }
  }

  /**
   * 获取持久化状态
   */
  isPersistenceEnabled(): boolean {
    return this.enablePersistence;
  }

  /**
   * 获取存储统计信息
   */
  getStorageStats() {
    if (!this.enablePersistence || !this.storage) {
      return null;
    }
    try {
      return this.storage.getStats();
    } catch (error) {
      logger.error('获取存储统计失败:', error);
      return null;
    }
  }

  /**
   * 获取队列状态
   */
  getStatus(): {
    queued: number;
    processing: number;
    byPriority: Record<MessagePriority, number>;
  } {
    const byPriority: Record<MessagePriority, number> = {
      high: 0,
      normal: 0,
      low: 0,
    };
    let processingCount = 0;

    this.queue.forEach(item => {
      byPriority[item.priority]++;
      if (item.processing) {
        processingCount++;
      }
    });

    return {
      queued: this.queue.length - processingCount,
      processing: processingCount,
      byPriority,
    };
  }

  /**
   * 销毁队列，释放资源
   */
  destroy(): void {
    this.clear();
    this.storage = null;
  }
}
