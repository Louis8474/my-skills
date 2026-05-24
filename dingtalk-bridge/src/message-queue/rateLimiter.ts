/**
 * 流量控制器
 * 使用令牌桶算法实现速率限制
 */

interface UserBucket {
  tokens: number;
  lastRefill: number;
}

/**
 * 令牌桶限流器
 */
export class RateLimiter {
  private buckets: Map<string, UserBucket> = new Map();
  private maxTokens: number;
  private refillRate: number; // 每秒补充的令牌数
  private maxEntries: number;
  private cleanupTimer: NodeJS.Timeout | null = null;
  private static readonly BUCKET_TTL_MS = 60 * 60 * 1000; // 1 小时未活动的 bucket 自动清理
  private static readonly CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 每 5 分钟清理一次

  constructor(options?: { maxTokens?: number; refillRate?: number; maxEntries?: number }) {
    const { maxTokens = 10, refillRate = 1, maxEntries = 10000 } = options ?? {};
    this.maxTokens = maxTokens;
    this.refillRate = refillRate;
    this.maxEntries = maxEntries;
    this.startCleanup();
  }

  /**
   * 消耗令牌
   */
  consumeToken(userId: string): boolean {
    const bucket = this.getOrCreateBucket(userId);
    this.refillBucket(bucket);

    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      return true;
    }

    return false;
  }

  /**
   * 检查速率限制
   */
  checkRateLimit(userId: string): {
    allowed: boolean;
    remaining: number;
    resetAfter: number;
  } {
    const bucket = this.getOrCreateBucket(userId);
    this.refillBucket(bucket);

    const allowed = bucket.tokens >= 1;
    const resetAfter = bucket.tokens < 1 ? Math.ceil((1 - bucket.tokens) / this.refillRate) : 0;

    return {
      allowed,
      remaining: Math.floor(bucket.tokens),
      resetAfter,
    };
  }

  /**
   * 获取剩余配额
   */
  getRemainingQuota(userId: string): number {
    const bucket = this.getBucket(userId);
    if (!bucket) return this.maxTokens;

    this.refillBucket(bucket);
    return Math.floor(bucket.tokens);
  }

  /**
   * 获取或创建令牌桶
   */
  private getOrCreateBucket(userId: string): UserBucket {
    let bucket = this.buckets.get(userId);

    if (!bucket) {
      // 容量保护：超限时淘汰最旧的 bucket
      if (this.buckets.size >= this.maxEntries) {
        this.evictOldest();
      }
      bucket = {
        tokens: this.maxTokens,
        lastRefill: Date.now(),
      };
      this.buckets.set(userId, bucket);
    }

    return bucket;
  }

  /**
   * 淘汰最旧的 bucket
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;
    for (const [key, bucket] of this.buckets) {
      if (bucket.lastRefill < oldestTime) {
        oldestTime = bucket.lastRefill;
        oldestKey = key;
      }
    }
    if (oldestKey !== null) {
      this.buckets.delete(oldestKey);
    }
  }

  /**
   * 获取令牌桶
   */
  private getBucket(userId: string): UserBucket | null {
    return this.buckets.get(userId) ?? null;
  }

  /**
   * 补充令牌
   */
  private refillBucket(bucket: UserBucket): void {
    const now = Date.now();
    const elapsed = (now - bucket.lastRefill) / 1000; // 转换为秒
    const tokensToAdd = elapsed * this.refillRate;

    bucket.tokens = Math.min(this.maxTokens, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;
  }

  /**
   * 重置用户令牌桶
   */
  reset(userId: string): void {
    this.buckets.delete(userId);
  }

  /**
   * 清空所有限流器
   */
  clear(): void {
    this.buckets.clear();
  }

  /**
   * 获取限流器状态
   */
  getStatus(): {
    totalUsers: number;
    averageTokens: number;
  } {
    const buckets = Array.from(this.buckets.values());
    const averageTokens =
      buckets.length > 0
        ? buckets.reduce((sum, b) => sum + b.tokens, 0) / buckets.length
        : this.maxTokens;

    return {
      totalUsers: this.buckets.size,
      averageTokens,
    };
  }

  /**
   * 获取最大令牌数
   */
  getMaxTokens(): number {
    return this.maxTokens;
  }

  /**
   * 获取当前用户数
   */
  getUserCount(): number {
    return this.buckets.size;
  }

  /**
   * 清理过期的 bucket（超过 TTL 未活动）
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, bucket] of this.buckets) {
      if (now - bucket.lastRefill > RateLimiter.BUCKET_TTL_MS) {
        this.buckets.delete(key);
      }
    }
  }

  /**
   * 启动定时清理
   */
  private startCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, RateLimiter.CLEANUP_INTERVAL_MS);
  }

  /**
   * 停止定时清理
   */
  stopCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }
}
