/**
 * 重试工具模块
 * 提供带指数退避的重试机制，用于处理临时性故障
 */
import { createSafeLogger } from './logger';

const logger = createSafeLogger('Retry');

/**
 * 重试选项
 */
export interface RetryOptions {
  maxRetries: number; // 最大重试次数
  baseDelay: number; // 基础延迟 (ms)
  maxDelay: number; // 最大延迟 (ms)
  exponential: boolean; // 是否指数退避
  onRetry?: (attempt: number, error: Error, delay: number) => void; // 重试回调
}

/**
 * 默认重试选项
 */
export const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  baseDelay: 1000, // 1 秒
  maxDelay: 30000, // 30 秒
  exponential: true,
};

/**
 * 计算延迟时间（指数退避 + 抖动）
 */
export function calculateDelay(
  attempt: number,
  baseDelay: number,
  maxDelay: number,
  exponential: boolean
): number {
  if (!exponential) {
    return baseDelay;
  }

  // 指数退避：baseDelay * 2^(attempt-1)
  const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);

  // 添加随机抖动（0-1000ms），避免多个请求同时重试
  const jitter = Math.floor(Math.random() * 1000);

  return Math.min(exponentialDelay + jitter, maxDelay);
}

/**
 * 判断错误是否可重试
 * 超时、网络错误等临时故障可重试
 * 配置错误、权限错误等不可重试
 */
export function isRetryableError(error: Error): boolean {
  const message = error.message.toLowerCase();

  // 不可重试的错误模式
  const nonRetryablePatterns = [
    'permission',
    'unauthorized',
    'forbidden',
    'not found',
    'invalid config',
    'command not found',
    'enoent', // 命令不存在
  ];

  for (const pattern of nonRetryablePatterns) {
    if (message.includes(pattern)) {
      return false;
    }
  }

  // 默认认为可重试
  return true;
}

/**
 * 带重试执行函数
 * @param fn 要执行的异步函数
 * @param options 重试选项
 * @returns 执行结果
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const {
    maxRetries = DEFAULT_RETRY_OPTIONS.maxRetries,
    baseDelay = DEFAULT_RETRY_OPTIONS.baseDelay,
    maxDelay = DEFAULT_RETRY_OPTIONS.maxDelay,
    exponential = DEFAULT_RETRY_OPTIONS.exponential,
    onRetry,
  } = options;

  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // 检查是否可重试
      if (!isRetryableError(lastError)) {
        logger.log('不可重试的错误:', lastError.message);
        throw lastError;
      }

      // 已达到最大重试次数
      if (attempt > maxRetries) {
        logger.log('达到最大重试次数，放弃');
        throw lastError;
      }

      // 计算延迟
      const delay = calculateDelay(attempt, baseDelay, maxDelay, exponential);

      // 调用重试回调
      onRetry?.(attempt, lastError, delay);

      // 等待延迟
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // 理论上不会到这里
  throw lastError;
}
