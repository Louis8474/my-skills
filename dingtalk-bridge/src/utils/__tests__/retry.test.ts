/**
 * 重试工具测试
 */
import { withRetry, calculateDelay, isRetryableError, DEFAULT_RETRY_OPTIONS } from '../retry';

describe('Retry Utils', () => {
  describe('calculateDelay', () => {
    it('should return baseDelay for linear mode', () => {
      const delay = calculateDelay(1, 1000, 10000, false);
      expect(delay).toBe(1000);

      const delay2 = calculateDelay(2, 1000, 10000, false);
      expect(delay2).toBe(1000);
    });

    it('should calculate exponential delay', () => {
      // 第 1 次重试：1000 + jitter
      const delay1 = calculateDelay(1, 1000, 10000, true);
      expect(delay1).toBeGreaterThanOrEqual(1000);
      expect(delay1).toBeLessThan(2500);

      // 第 2 次重试：2000 + jitter
      const delay2 = calculateDelay(2, 1000, 10000, true);
      expect(delay2).toBeGreaterThanOrEqual(2000);
      expect(delay2).toBeLessThan(3500);

      // 第 3 次重试：4000 + jitter
      const delay3 = calculateDelay(3, 1000, 10000, true);
      expect(delay3).toBeGreaterThanOrEqual(4000);
      expect(delay3).toBeLessThan(5500);
    });

    it('should cap at maxDelay', () => {
      // 第 10 次重试应该被 maxDelay 限制
      const delay = calculateDelay(10, 1000, 5000, true);
      expect(delay).toBeLessThanOrEqual(5000);
    });

    it('should include jitter', () => {
      // 多次计算结果应该不同（因为有 jitter）
      const delays = new Set([
        calculateDelay(1, 1000, 10000, true),
        calculateDelay(1, 1000, 10000, true),
        calculateDelay(1, 1000, 10000, true),
      ]);
      // 至少有 2 个不同的值
      expect(delays.size).toBeGreaterThanOrEqual(2);
    });
  });

  describe('isRetryableError', () => {
    it('should return false for non-retryable errors', () => {
      expect(isRetryableError(new Error('Permission denied'))).toBe(false);
      expect(isRetryableError(new Error('Unauthorized'))).toBe(false);
      expect(isRetryableError(new Error('Forbidden'))).toBe(false);
      expect(isRetryableError(new Error('Not found'))).toBe(false);
      expect(isRetryableError(new Error('Invalid config'))).toBe(false);
      expect(isRetryableError(new Error('Command not found'))).toBe(false);
      expect(isRetryableError(new Error('ENOENT: no such file'))).toBe(false);
    });

    it('should return true for retryable errors', () => {
      expect(isRetryableError(new Error('Timeout'))).toBe(true);
      expect(isRetryableError(new Error('Network error'))).toBe(true);
      expect(isRetryableError(new Error('Connection reset'))).toBe(true);
      expect(isRetryableError(new Error('ECONNRESET'))).toBe(true);
      expect(isRetryableError(new Error('ETIMEDOUT'))).toBe(true);
      expect(isRetryableError(new Error('Connection refused'))).toBe(true);
    });

    it('should handle case insensitively', () => {
      expect(isRetryableError(new Error('PERMISSION DENIED'))).toBe(false);
      expect(isRetryableError(new Error('timeout'))).toBe(true);
    });
  });

  describe('withRetry', () => {
    // 使用真实定时器，但在测试中控制时间
    it('should return result on first success', async () => {
      let callCount = 0;
      const fn = async () => {
        callCount++;
        return 'success';
      };

      const result = await withRetry(fn, { maxRetries: 3, baseDelay: 10, maxDelay: 50 });

      expect(result).toBe('success');
      expect(callCount).toBe(1);
    });

    it('should retry on failure and succeed', async () => {
      let callCount = 0;
      const fn = async () => {
        callCount++;
        if (callCount <= 2) {
          throw new Error('Timeout');
        }
        return 'success';
      };

      const result = await withRetry(fn, {
        maxRetries: 3,
        baseDelay: 50,
        maxDelay: 100,
      });

      expect(result).toBe('success');
      expect(callCount).toBe(3);
    });

    it('should throw after max retries', async () => {
      let callCount = 0;
      const fn = async () => {
        callCount++;
        throw new Error('Timeout');
      };

      await expect(withRetry(fn, {
        maxRetries: 2,
        baseDelay: 50,
        maxDelay: 100,
      })).rejects.toThrow('Timeout');

      expect(callCount).toBe(3); // initial + 2 retries
    });

    it('should not retry for non-retryable errors', async () => {
      let callCount = 0;
      const fn = async () => {
        callCount++;
        throw new Error('Permission denied');
      };

      await expect(withRetry(fn, { maxRetries: 3, baseDelay: 10 })).rejects.toThrow('Permission denied');
      expect(callCount).toBe(1);
    });

    it('should call onRetry callback', async () => {
      const onRetry = jest.fn();
      let callCount = 0;
      const fn = async () => {
        callCount++;
        if (callCount === 1) {
          throw new Error('Timeout');
        }
        return 'success';
      };

      await withRetry(fn, {
        maxRetries: 3,
        baseDelay: 50,
        onRetry,
      });

      expect(onRetry).toHaveBeenCalledTimes(1);
      expect(onRetry).toHaveBeenCalledWith(
        expect.any(Number),  // attempt
        expect.any(Error),   // error
        expect.any(Number)   // delay
      );
    });

    it('should use default options when not provided', async () => {
      let callCount = 0;
      const fn = async () => {
        callCount++;
        return 'success';
      };

      await withRetry(fn);
      expect(callCount).toBe(1);
    });

    it('should handle non-Error rejections', async () => {
      let callCount = 0;
      const fn = async () => {
        callCount++;
        throw 'string error'; // eslint-disable-line no-throw-literal
      };

      await expect(withRetry(fn, {
        maxRetries: 1,
        baseDelay: 50,
      })).rejects.toThrow();

      expect(callCount).toBe(2);
    });
  });
});