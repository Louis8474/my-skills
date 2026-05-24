/**
 * 日志工具 - 支持敏感信息脱敏
 */

/**
 * 敏感信息模式
 */
const SENSITIVE_PATTERNS = [
  // 钉钉凭证
  { pattern: /([Aa]pp[Ss]ecret)[=:]\s*["']?([a-zA-Z0-9_-]+)["']?/g, replace: '$1=****' },
  { pattern: /([Tt]oken)[=:]\s*["']?([a-zA-Z0-9_-]{10,})["']?/g, replace: '$1=****' },
  // clientSecret (DingTalk Stream)
  { pattern: /(clientSecret)[=:]\s*["']?([a-zA-Z0-9_-]+)["']?/gi, replace: '$1=****' },
  // sessionWebhook
  { pattern: /(sessionWebhook)[=:]\s*["']?(https?:\/\/[^&"']+)["']?/g, replace: '$1=****' },
  { pattern: /(session=)([a-zA-Z0-9_-]+)/gi, replace: '$1****' },
  // 管理员 webhook
  { pattern: /(adminSessionWebhook)[=:]\s*["']?(https?:\/\/[^&"']+)["']?/g, replace: '$1=****' },
  // OpenCode 模型参数
  { pattern: /(-m\s+)([a-zA-Z0-9_/-]+)/g, replace: '$1****' },
  // Authorization 头
  {
    pattern: /(Authorization)[=:]\s*["']?([Bb]earer\s+)?([a-zA-Z0-9_-]+)["']?/gi,
    replace: '$1=****',
  },
  // 通用密钥模式 (30位以上的字母数字字符串)
  { pattern: /\b([a-zA-Z0-9_-]{32,})\b/g, replace: '****' },
];

/**
 * 是否已启用全局脱敏
 */
let globalSanitizeEnabled = false;

/**
 * 启用全局日志脱敏 - 覆盖所有 console 方法
 * 用于自动脱敏第三方库的日志输出（如 dingtalk-stream）
 */
export function enableGlobalSanitize(): void {
  if (globalSanitizeEnabled) return;
  globalSanitizeEnabled = true;

  const methods = ['log', 'warn', 'error', 'info', 'debug'] as const;

  for (const method of methods) {
    const original = console[method];
    console[method] = (...args: unknown[]) => {
      const sanitized = args.map(arg => {
        if (typeof arg === 'string') {
          return sanitizeLog(arg);
        }
        if (typeof arg === 'object' && arg !== null) {
          try {
            return sanitizeLog(JSON.stringify(arg));
          } catch {
            return arg;
          }
        }
        return arg;
      });
      original.apply(console, sanitized as Parameters<typeof original>);
    };
  }

  console.log('[Logger] 全局日志脱敏已启用');
}

/**
 * 脱敏日志输出
 */
export function sanitizeLog(message: string): string {
  let sanitized = message;

  for (const { pattern, replace } of SENSITIVE_PATTERNS) {
    sanitized = sanitized.replace(pattern, replace);
  }

  return sanitized;
}

/**
 * 创建安全的日志函数
 */
export function createSafeLogger(tag: string) {
  const sanitize = (args: unknown[]) =>
    args.map(arg => (typeof arg === 'string' ? sanitizeLog(arg) : arg));

  return {
    log: (...args: unknown[]) => console.log(`[${tag}]`, ...sanitize(args)),
    info: (...args: unknown[]) => console.info(`[${tag}]`, ...sanitize(args)),
    debug: (...args: unknown[]) => console.debug(`[${tag}]`, ...sanitize(args)),
    warn: (...args: unknown[]) => console.warn(`[${tag}]`, ...sanitize(args)),
    error: (...args: unknown[]) => console.error(`[${tag}]`, ...sanitize(args)),
  };
}

/**
 * 脱敏配置对象（用于日志输出）
 */
export function sanitizeConfig(obj: Record<string, unknown>): Record<string, unknown> {
  const sensitiveKeys = ['appSecret', 'token', 'sessionWebhook', 'accessToken', 'secret'];

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (sensitiveKeys.some(k => key.toLowerCase().includes(k.toLowerCase()))) {
      result[key] = '****';
    } else if (typeof value === 'object' && value !== null) {
      result[key] = sanitizeConfig(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }

  return result;
}
