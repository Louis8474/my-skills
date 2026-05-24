/**
 * 并发控制器
 * 控制用户和全局的并发请求数
 */
import { createSafeLogger } from '../utils/logger';

const logger = createSafeLogger('Concurrency');

interface SlotInfo {
  userId: string;
  requestId: string;
  acquiredAt: number;
}

interface WaitingEntry {
  userId: string;
  requestId: string;
  resolve: (value: boolean) => void;
  reject: (error: Error) => void;
  timerId: NodeJS.Timeout | null;
}

/**
 * 并发控制器类
 */
export class ConcurrencyController {
  private userSlots: Map<string, number> = new Map();
  private activeSlots: Map<string, SlotInfo> = new Map();
  private maxConcurrentPerUser: number;
  private maxConcurrentGlobal: number;
  private waitingQueue: WaitingEntry[] = [];
  private destroyed = false;

  constructor(options?: { maxConcurrentPerUser?: number; maxConcurrentGlobal?: number }) {
    const { maxConcurrentPerUser = 3, maxConcurrentGlobal = 10 } = options ?? {};

    this.maxConcurrentPerUser = maxConcurrentPerUser;
    this.maxConcurrentGlobal = maxConcurrentGlobal;
  }

  /**
   * 获取并发槽位
   * @param userId 用户ID
   * @param requestId 请求ID
   * @param timeout 超时时间（毫秒），默认30秒
   */
  async acquireSlot(userId: string, requestId: string, timeout: number = 30000): Promise<boolean> {
    // 检查是否可以直接获取
    if (this.canAcquire(userId)) {
      this.doAcquire(userId, requestId);
      return true;
    }

    // 需要等待
    return new Promise((resolve, reject) => {
      const entry: WaitingEntry = {
        userId,
        requestId,
        resolve,
        reject,
        timerId: null,
      };

      // 设置超时
      if (timeout > 0) {
        entry.timerId = setTimeout(() => {
          // 从等待队列中移除
          const index = this.waitingQueue.indexOf(entry);
          if (index !== -1) {
            this.waitingQueue.splice(index, 1);
          }
          reject(new Error(`获取并发槽位超时 (${timeout}ms)`));
        }, timeout);
      }

      this.waitingQueue.push(entry);
    });
  }

  /**
   * 检查是否可以获取槽位
   */
  private canAcquire(userId: string): boolean {
    const userCurrent = this.userSlots.get(userId) ?? 0;
    const globalCurrent = this.activeSlots.size;

    return userCurrent < this.maxConcurrentPerUser && globalCurrent < this.maxConcurrentGlobal;
  }

  /**
   * 执行获取槽位
   */
  private doAcquire(userId: string, requestId: string): void {
    // 更新用户槽位计数
    const userCurrent = this.userSlots.get(userId) ?? 0;
    this.userSlots.set(userId, userCurrent + 1);

    // 记录活跃槽位
    this.activeSlots.set(requestId, {
      userId,
      requestId,
      acquiredAt: Date.now(),
    });

    logger.log(
      `🔒 获取槽位：${requestId} (用户：${userId}, 用户并发：${userCurrent + 1}/${this.maxConcurrentPerUser})`
    );
  }

  /**
   * 释放槽位
   */
  releaseSlot(userId: string, requestId: string): void {
    // 释放用户槽位
    const userCurrent = this.userSlots.get(userId) ?? 1;
    this.userSlots.set(userId, Math.max(0, userCurrent - 1));

    // 移除活跃槽位
    this.activeSlots.delete(requestId);

    logger.log(`🔓 释放槽位：${requestId} (用户：${userId})`);

    // 尝试满足等待队列中的请求
    this.processWaitingQueue();
  }

  /**
   * 处理等待队列
   */
  private processWaitingQueue(): void {
    if (this.waitingQueue.length === 0) {
      return;
    }

    // 找到第一个可以处理的请求
    const index = this.waitingQueue.findIndex(item => this.canAcquire(item.userId));

    if (index !== -1) {
      const item = this.waitingQueue.splice(index, 1)[0];
      // 清理超时 timer
      if (item.timerId !== null) {
        clearTimeout(item.timerId);
        item.timerId = null;
      }
      this.doAcquire(item.userId, item.requestId);
      item.resolve(true);

      // 继续处理下一个
      this.processWaitingQueue();
    }
  }

  /**
   * 获取用户当前并发数
   */
  getUserConcurrency(userId: string): number {
    return this.userSlots.get(userId) ?? 0;
  }

  /**
   * 获取全局并发数
   */
  getGlobalConcurrency(): number {
    return this.activeSlots.size;
  }

  /**
   * 获取等待队列长度
   */
  getWaitingQueueLength(): number {
    return this.waitingQueue.length;
  }

  /**
   * 获取控制器状态
   */
  getStatus(): {
    active: number;
    waiting: number;
    byUser: Map<string, number>;
  } {
    return {
      active: this.activeSlots.size,
      waiting: this.waitingQueue.length,
      byUser: new Map(this.userSlots),
    };
  }

  /**
   * 强制释放用户所有槽位
   */
  forceReleaseUser(userId: string): void {
    const userSlots = Array.from(this.activeSlots.entries()).filter(
      ([, info]) => info.userId === userId
    );

    userSlots.forEach(([, info]) => {
      this.releaseSlot(userId, info.requestId);
    });
  }

  /**
   * 清空所有状态
   */
  clear(): void {
    this.userSlots.clear();
    this.activeSlots.clear();
    // 清理所有等待中的 timer
    for (const entry of this.waitingQueue) {
      if (entry.timerId !== null) {
        clearTimeout(entry.timerId);
      }
      entry.reject(new Error('Concurrency controller cleared'));
    }
    this.waitingQueue = [];
  }

  /**
   * 销毁控制器，释放所有资源
   */
  destroy(): void {
    this.destroyed = true;
    this.clear();
  }

  /**
   * 获取每用户最大槽位数
   */
  getMaxSlotsPerUser(): number {
    return this.maxConcurrentPerUser;
  }

  /**
   * 获取全局最大槽位数
   */
  getMaxGlobalSlots(): number {
    return this.maxConcurrentGlobal;
  }

  /**
   * 获取用户可用槽位数
   */
  getAvailableSlots(userId: string): number {
    const used = this.userSlots.get(userId) || 0;
    return Math.max(0, this.maxConcurrentPerUser - used);
  }

  /**
   * 获取全局可用槽位数
   */
  getAvailableGlobalSlots(): number {
    return Math.max(0, this.maxConcurrentGlobal - this.activeSlots.size);
  }
}
