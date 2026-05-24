/**
 * 消息去重缓存
 * 使用 LRU 算法实现滑动窗口去重
 */

interface CacheEntry {
  value: string;
  timestamp: number;
}

/**
 * LRU 缓存实现
 */
export class LRUCache<K, V> {
  private capacity: number;
  private cache: Map<K, V>;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.cache = new Map();
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // 移动到最新
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  set(key: K, value: V): void {
    // 如果已存在，先删除
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    // 如果超出容量，删除最旧的
    else if (this.cache.size >= this.capacity) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, value);
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

/**
 * 消息去重器
 */
export class MessageDeduplicator {
  private cache: LRUCache<string, CacheEntry>;
  private timeWindow: number; // 去重时间窗口（毫秒）

  constructor(options?: {
    maxSize?: number;
    timeWindow?: number;
  }) {
    const { maxSize = 1000, timeWindow = 60000 } = options ?? {};
    this.cache = new LRUCache(maxSize);
    this.timeWindow = timeWindow;
  }

  /**
   * 生成消息指纹
   */
  private generateFingerprint(message: string, userId: string): string {
    // 简单哈希：用户 ID + 消息内容
    return `${userId}:${message.substring(0, 100)}`;
  }

  /**
   * 检查消息是否重复
   */
  isDuplicate(message: string, userId: string): boolean {
    const fingerprint = this.generateFingerprint(message, userId);
    const entry = this.cache.get(fingerprint);

    if (!entry) {
      return false;
    }

    // 检查是否在时间窗口内
    const now = Date.now();
    if (now - entry.timestamp > this.timeWindow) {
      // 超出时间窗口，删除旧记录
      this.cache.delete(fingerprint);
      return false;
    }

    return true;
  }

  /**
   * 记录消息
   */
  record(message: string, userId: string): void {
    const fingerprint = this.generateFingerprint(message, userId);
    const entry: CacheEntry = {
      value: message,
      timestamp: Date.now(),
    };
    this.cache.set(fingerprint, entry);
  }

  /**
   * 清除过期记录
   */
  cleanup(): void {
    // 简化处理：定期清空，实际应该更精细
    if (this.cache.size() > 500) {
      this.cache.clear();
    }
  }

  /**
   * 获取缓存大小
   */
  getSize(): number {
    return this.cache.size();
  }

  /**
   * 清空缓存
   */
  clear(): void {
    this.cache.clear();
  }
}

/**
 * 创建默认去重器
 */
export function createDeduplicator(): MessageDeduplicator {
  return new MessageDeduplicator({
    maxSize: 1000,
    timeWindow: 60000, // 1 分钟
  });
}