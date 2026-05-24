/**
 * 结构化日志模块
 * 支持多级别、多格式输出，可配置文件输出
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type LogFormat = 'json' | 'pretty';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

interface LoggerConfig {
  level: LogLevel;
  format: LogFormat;
  enableFile: boolean;
  filePath?: string;
  context?: Record<string, unknown>;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// 敏感字段脱敏
const SENSITIVE_FIELDS = ['appKey', 'appSecret', 'password', 'token', 'secret', 'apiKey', 'apiSecret'];

function maskSensitive(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(maskSensitive);
  
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (SENSITIVE_FIELDS.some(f => key.toLowerCase().includes(f.toLowerCase()))) {
      result[key] = '***MASKED***';
    } else if (typeof value === 'object' && value !== null) {
      result[key] = maskSensitive(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

function formatTimestamp(): string {
  return new Date().toISOString();
}

function formatLevel(level: LogLevel): string {
  const colors: Record<LogLevel, string> = {
    debug: '\x1b[36m', // cyan
    info: '\x1b[32m',  // green
    warn: '\x1b[33m',  // yellow
    error: '\x1b[31m', // red
  };
  const reset = '\x1b[0m';
  return `${colors[level]}${level.toUpperCase().padEnd(5)}${reset}`;
}

function formatPretty(entry: LogEntry): string {
  const levelStr = formatLevel(entry.level);
  const contextStr = entry.context ? ` ${JSON.stringify(maskSensitive(entry.context))}` : '';
  const errorStr = entry.error 
    ? `\n  Error: ${entry.error.name}: ${entry.error.message}${entry.error.stack ? `\n  Stack: ${entry.error.stack}` : ''}`
    : '';
  
  return `[${entry.timestamp}] ${levelStr} ${entry.message}${contextStr}${errorStr}`;
}

function formatJson(entry: LogEntry): string {
  return JSON.stringify({
    ...entry,
    context: maskSensitive(entry.context),
  });
}

class Logger {
  private config: LoggerConfig;
  private globalContext: Record<string, unknown> = {};

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: config.level || 'info',
      format: config.format || 'pretty',
      enableFile: config.enableFile || false,
      filePath: config.filePath,
      context: config.context,
    };
  }

  /**
   * 设置日志级别
   */
  setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  /**
   * 设置输出格式
   */
  setFormat(format: LogFormat): void {
    this.config.format = format;
  }

  /**
   * 设置全局上下文
   */
  setContext(context: Record<string, unknown>): void {
    this.globalContext = { ...context };
  }

  /**
   * 添加上下文字段
   */
  addContext(key: string, value: unknown): void {
    this.globalContext[key] = value;
  }

  /**
   * 创建子日志器，继承父级上下文
   */
  child(context: Record<string, unknown>): Logger {
    const childLogger = new Logger(this.config);
    childLogger.setContext({ ...this.globalContext, ...context });
    return childLogger;
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.config.level];
  }

  private log(level: LogLevel, message: string, context?: Record<string, unknown>, error?: Error): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: formatTimestamp(),
      level,
      message,
      context: { ...this.globalContext, ...context },
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : undefined,
    };

    const output = this.config.format === 'json' ? formatJson(entry) : formatPretty(entry);
    
    // 输出到控制台
    if (level === 'error') {
      console.error(output);
    } else if (level === 'warn') {
      console.warn(output);
    } else {
      console.log(output);
    }
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.log('warn', message, context);
  }

  error(message: string, error?: Error | unknown, context?: Record<string, unknown>): void {
    const err = error instanceof Error ? error : undefined;
    const mergedContext = error && !(error instanceof Error) 
      ? { ...context, error } 
      : context;
    this.log('error', message, mergedContext, err);
  }

  /**
   * 记录性能指标
   */
  metric(name: string, value: number, unit: string = 'ms', context?: Record<string, unknown>): void {
    this.log('info', `[Metric] ${name}`, { value, unit, ...context });
  }

  /**
   * 记录请求
   */
  request(method: string, path: string, statusCode: number, duration: number, context?: Record<string, unknown>): void {
    this.log('info', `[Request] ${method} ${path}`, { statusCode, duration, ...context });
  }
}

// 全局日志实例
let globalLogger: Logger | null = null;

/**
 * 获取全局日志实例
 */
export function getLogger(config?: Partial<LoggerConfig>): Logger {
  if (!globalLogger) {
    globalLogger = new Logger(config);
  }
  return globalLogger;
}

/**
 * 创建新的日志实例
 */
export function createLogger(config?: Partial<LoggerConfig>): Logger {
  return new Logger(config);
}

/**
 * 重置全局日志实例
 */
export function resetLogger(): void {
  globalLogger = null;
}

// 便捷函数
export const log = {
  debug: (message: string, context?: Record<string, unknown>) => getLogger().debug(message, context),
  info: (message: string, context?: Record<string, unknown>) => getLogger().info(message, context),
  warn: (message: string, context?: Record<string, unknown>) => getLogger().warn(message, context),
  error: (message: string, error?: Error | unknown, context?: Record<string, unknown>) => getLogger().error(message, error, context),
  metric: (name: string, value: number, unit?: string, context?: Record<string, unknown>) => getLogger().metric(name, value, unit, context),
  request: (method: string, path: string, statusCode: number, duration: number, context?: Record<string, unknown>) => getLogger().request(method, path, statusCode, duration, context),
};

export { Logger };
