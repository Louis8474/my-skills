/**
 * 流量控制器（令牌桶算法）测试
 */
import { RateLimiter } from '../rateLimiter';

describe('RateLimiter', () => {
  let limiter: RateLimiter;

  beforeEach(() => {
    limiter = new RateLimiter();
  });

  afterEach(() => {
    limiter.stopCleanup();
  });

  describe('constructor', () => {
    it('should use default values when no options provided', () => {
      expect(limiter.getMaxTokens()).toBe(10);
      expect(limiter.getUserCount()).toBe(0);
    });

    it('should accept custom maxTokens and refillRate', () => {
      const custom = new RateLimiter({ maxTokens: 5, refillRate: 2 });
      expect(custom.getMaxTokens()).toBe(5);
      custom.stopCleanup();
    });
  });

  describe('consumeToken', () => {
    it('should allow consuming a token when bucket is full', () => {
      expect(limiter.consumeToken('user1')).toBe(true);
    });

    it('should consume tokens until bucket is empty', () => {
      for (let i = 0; i < 10; i++) {
        expect(limiter.consumeToken('user1')).toBe(true);
      }
      expect(limiter.consumeToken('user1')).toBe(false);
    });

    it('should maintain separate buckets for different users', () => {
      for (let i = 0; i < 10; i++) {
        limiter.consumeToken('user1');
      }
      expect(limiter.consumeToken('user1')).toBe(false);
      expect(limiter.consumeToken('user2')).toBe(true);
    });
  });

  describe('checkRateLimit', () => {
    it('should report allowed and remaining tokens', () => {
      const result = limiter.checkRateLimit('user1');
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(10);
      expect(result.resetAfter).toBe(0);
    });

    it('should report not allowed when tokens are exhausted', () => {
      for (let i = 0; i < 10; i++) {
        limiter.consumeToken('user1');
      }
      const result = limiter.checkRateLimit('user1');
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.resetAfter).toBeGreaterThan(0);
    });
  });

  describe('getRemainingQuota', () => {
    it('should return maxTokens for unknown user', () => {
      expect(limiter.getRemainingQuota('unknown')).toBe(10);
    });

    it('should return remaining tokens for known user', () => {
      limiter.consumeToken('user1');
      limiter.consumeToken('user1');
      expect(limiter.getRemainingQuota('user1')).toBe(8);
    });
  });

  describe('refill', () => {
    it('should refill tokens over time', () => {
      jest.useFakeTimers();
      const customLimiter = new RateLimiter({ maxTokens: 10, refillRate: 1 });

      for (let i = 0; i < 10; i++) {
        customLimiter.consumeToken('user1');
      }
      expect(customLimiter.consumeToken('user1')).toBe(false);

      // Advance time by 2 seconds (refill 2 tokens)
      jest.advanceTimersByTime(2000);
      expect(customLimiter.consumeToken('user1')).toBe(true);
      expect(customLimiter.consumeToken('user1')).toBe(true);
      expect(customLimiter.consumeToken('user1')).toBe(false);

      customLimiter.stopCleanup();
      jest.useRealTimers();
    });

    it('should not exceed maxTokens on refill', () => {
      jest.useFakeTimers();
      const customLimiter = new RateLimiter({ maxTokens: 3, refillRate: 1 });
      customLimiter.consumeToken('user1');
      jest.advanceTimersByTime(10000);
      expect(customLimiter.getRemainingQuota('user1')).toBe(3);
      customLimiter.stopCleanup();
      jest.useRealTimers();
    });
  });

  describe('reset', () => {
    it('should reset a user bucket', () => {
      for (let i = 0; i < 10; i++) {
        limiter.consumeToken('user1');
      }
      limiter.reset('user1');
      expect(limiter.consumeToken('user1')).toBe(true);
    });
  });

  describe('clear', () => {
    it('should clear all buckets', () => {
      limiter.consumeToken('user1');
      limiter.consumeToken('user2');
      limiter.clear();
      expect(limiter.getUserCount()).toBe(0);
    });
  });

  describe('getStatus', () => {
    it('should report total users and average tokens', () => {
      limiter.consumeToken('user1');
      limiter.consumeToken('user2');
      const status = limiter.getStatus();
      expect(status.totalUsers).toBe(2);
      expect(status.averageTokens).toBeGreaterThan(0);
    });

    it('should return maxTokens when no users exist', () => {
      const status = limiter.getStatus();
      expect(status.totalUsers).toBe(0);
      expect(status.averageTokens).toBe(limiter.getMaxTokens());
    });
  });

  describe('getUserCount', () => {
    it('should return the number of tracked users', () => {
      limiter.consumeToken('user1');
      limiter.consumeToken('user2');
      limiter.consumeToken('user3');
      expect(limiter.getUserCount()).toBe(3);
    });
  });
});
