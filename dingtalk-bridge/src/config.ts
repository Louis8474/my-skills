/**
 * 配置模块 - 集中管理所有配置项，包含完整的值域验证
 */
import dotenv from 'dotenv';
import { createSafeLogger } from './utils/logger';

const logger = createSafeLogger('Config');

// 加载环境变量（强制覆盖已有值）
dotenv.config({ override: true });

// ==================== 配置类型定义 ====================

export interface DingtalkConfig {
  appKey: string;
  appSecret: string;
  allowFrom: string;
}

export interface GatewayConfig {
  port: number;
  host: string;
  apiToken?: string;
}

export type AIProvider = 'opencode' | 'claude';

export interface AIConfig {
  command: string;
  timeout: number;
  maxRetries: number;
  retryBaseDelay: number;
  retryMaxDelay: number;
  workingDir?: string;
  model: string;
  maxInputLength: number;
}

export type PermissionMode = 'default' | 'plan' | 'auto-edit' | 'dangerously-skip-permissions';

export interface ClaudeCodeConfig {
  command: string;
  timeout: number;
  maxRetries: number;
  retryBaseDelay: number;
  retryMaxDelay: number;
  workingDir?: string;
  model: string;
  maxInputLength: number;
  permissionMode: PermissionMode;
}

export interface SessionConfig {
  ttl: number;
  idleResetMs: number;
  maxHistoryMessages: number;
  maxSessions: number;
}

export interface MessageQueueConfig {
  maxConcurrentPerUser: number;
  maxConcurrentGlobal: number;
  rateLimitMaxTokens: number;
  pollInterval: number;
  enablePersistence: boolean;
}

export interface StreamConfig {
  enabled: boolean;
  maxReconnectAttempts: number;
  reconnectBaseDelay: number;
  reconnectMaxDelay: number;
}

export interface StorageConfig {
  dbPath: string;
  enableWAL: boolean;
  cleanupInterval: number;
}

export interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  format: 'json' | 'pretty';
  enableFile: boolean;
  filePath?: string;
}

export interface SchedulerTaskConfig {
  name: string;
  cron: string;
  prompt: string;
  conversationId: string;
  enabled?: boolean;
}

export interface SchedulerConfig {
  enabled: boolean;
  tasks: SchedulerTaskConfig[];
}

export interface MediaConfig {
  enabled: boolean;
  voiceTranscriptionEnabled: boolean;
  imageDescriptionEnabled: boolean;
  maxFileSize: number;
  downloadTimeout: number;
}

export interface RouterProviderConfig {
  name: string;
  type: string;
  command: string;
  args?: string[];
  timeout: number;
  enabled: boolean;
}

export interface RouterRuleConfig {
  name: string;
  enabled: boolean;
  priority: number;
  condition: Record<string, unknown>;
  provider: string;
}

export interface RouterConfig {
  enabled: boolean;
  providers: RouterProviderConfig[];
  rules: RouterRuleConfig[];
}

export interface MemoryConfig {
  enabled: boolean;
  autoSummarizeEnabled: boolean;
  summarizeThreshold: number;
  maxContextMemories: number;
  autoMemoryMaxAge: number;
  boostOnAccess: boolean;
  boostIncrement: number;
}

export type DisplayMode = 'full' | 'compact' | 'quiet';

export interface DisplayConfig {
  mode: DisplayMode;
  thinkingMessages: boolean;
  thinkingMaxLen: number;
  toolMessages: boolean;
  toolMaxLen: number;
}

export interface StreamingConfig {
  enabled: boolean;
  intervalMs: number;
  minDeltaChars: number;
  maxChars: number;
  thinkingText: string;
  cardTemplateId: string;
}

export interface PersistentSessionConfig {
  enabled: boolean; // 是否启用持久化会话（消除冷启动）
  maxSessions: number; // 最大会话数，默认 10
  idleTimeout: number; // 空闲超时（毫秒），默认 30 分钟
  warmUpSessions: number; // 启动时预热会话数，默认 1（0 禁用预热）
}

// ==================== 配置验证错误 ====================

export class ConfigValidationError extends Error {
  constructor(public errors: string[]) {
    super(`配置验证失败:\n${errors.map(e => `  - ${e}`).join('\n')}`);
    this.name = 'ConfigValidationError';
  }
}

// ==================== 环境变量解析 ====================

function parseEnvNumber(key: string, defaultValue: number, min?: number, max?: number): number {
  const value = process.env[key];
  if (!value) return defaultValue;

  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    logger.warn(`${key} 的值 "${value}" 不是有效数字，使用默认值 ${defaultValue}`);
    return defaultValue;
  }

  if (min !== undefined && parsed < min) {
    logger.warn(`${key} 的值 ${parsed} 小于最小值 ${min}，使用最小值`);
    return min;
  }

  if (max !== undefined && parsed > max) {
    logger.warn(`${key} 的值 ${parsed} 大于最大值 ${max}，使用最大值`);
    return max;
  }

  return parsed;
}

function parseEnvString(key: string, defaultValue: string, allowedValues?: string[]): string {
  const value = process.env[key];
  if (!value) return defaultValue;

  if (allowedValues && !allowedValues.includes(value)) {
    logger.warn(`${key} 的值 "${value}" 不在允许列表中，使用默认值 "${defaultValue}"`);
    return defaultValue;
  }

  return value;
}

// ==================== 主要配置对象 ====================

const aiProvider: AIProvider = parseEnvString('AI_PROVIDER', 'opencode', [
  'opencode',
  'claude',
]) as AIProvider;

export const config = {
  // AI Provider 选择
  aiProvider,

  dingtalk: {
    appKey: process.env.DINGTALK_APP_KEY || '',
    appSecret: process.env.DINGTALK_APP_SECRET || '',
    allowFrom: process.env.DINGTALK_ALLOW_FROM || '*',
  },

  gateway: {
    port: parseEnvNumber('GATEWAY_PORT', 3000, 1, 65535),
    host: process.env.GATEWAY_HOST || '0.0.0.0',
    apiToken: process.env.GATEWAY_API_TOKEN || undefined,
  } as GatewayConfig,

  ai: {
    command: process.env.OPENCODE_COMMAND || 'opencode',
    timeout: parseEnvNumber('OPENCODE_TIMEOUT', 120000, 1000, 600000),
    maxRetries: parseEnvNumber('OPENCODE_MAX_RETRIES', 3, 0, 10),
    retryBaseDelay: parseEnvNumber('OPENCODE_RETRY_BASE_DELAY', 1000, 100, 30000),
    retryMaxDelay: parseEnvNumber('OPENCODE_RETRY_MAX_DELAY', 10000, 1000, 60000),
    workingDir: process.env.OPENCODE_WORKING_DIR || process.cwd(),
    model: process.env.OPENCODE_MODEL || '',
    maxInputLength: parseEnvNumber('OPENCODE_MAX_INPUT_LENGTH', 10000, 100, 100000),
  } as AIConfig,

  claude: {
    command: process.env.CLAUDE_COMMAND || 'claude',
    timeout: parseEnvNumber('CLAUDE_TIMEOUT', 120000, 1000, 600000),
    maxRetries: parseEnvNumber('CLAUDE_MAX_RETRIES', 3, 0, 10),
    retryBaseDelay: parseEnvNumber('CLAUDE_RETRY_BASE_DELAY', 1000, 100, 30000),
    retryMaxDelay: parseEnvNumber('CLAUDE_RETRY_MAX_DELAY', 10000, 1000, 60000),
    workingDir: process.env.CLAUDE_WORKING_DIR || process.cwd(),
    model: process.env.CLAUDE_MODEL || '',
    maxInputLength: parseEnvNumber('CLAUDE_MAX_INPUT_LENGTH', 10000, 100, 100000),
    permissionMode: (() => {
      const mode = parseEnvString('CLAUDE_PERMISSION_MODE', 'default', [
        'default',
        'plan',
        'auto-edit',
        'dangerously-skip-permissions',
      ]) as PermissionMode;
      if (mode === 'dangerously-skip-permissions') {
        if (process.env.NODE_ENV === 'production') {
          logger.error('dangerously-skip-permissions 模式在生产环境被禁用，已降级为 default 模式');
          return 'default';
        }
        logger.warn(
          '⚠️ dangerously-skip-permissions 模式已启用！AI CLI 可无限制执行任意命令，请确保仅在开发环境使用'
        );
      }
      return mode;
    })(),
  } as ClaudeCodeConfig,

  session: {
    ttl: parseEnvNumber('SESSION_TTL', 1800000, 60000, 86400000),
    idleResetMs: parseEnvNumber('SESSION_IDLE_RESET_MINS', 30, 5, 1440) * 60 * 1000,
    maxHistoryMessages: parseEnvNumber('SESSION_MAX_HISTORY', 50, 10, 500),
    maxSessions: parseEnvNumber('SESSION_MAX_SESSIONS', 1000, 100, 10000),
  },

  messageQueue: {
    maxConcurrentPerUser: parseEnvNumber('MQ_MAX_CONCURRENT_PER_USER', 3, 1, 20),
    maxConcurrentGlobal: parseEnvNumber('MQ_MAX_CONCURRENT_GLOBAL', 10, 1, 100),
    rateLimitMaxTokens: parseEnvNumber('MQ_RATE_LIMIT_TOKENS', 10, 1, 100),
    pollInterval: parseEnvNumber('MQ_POLL_INTERVAL', 100, 10, 5000),
    enablePersistence: process.env.MQ_ENABLE_PERSISTENCE === 'true',
  },

  stream: {
    enabled: process.env.STREAM_ENABLED !== 'false',
    maxReconnectAttempts: parseEnvNumber('STREAM_MAX_RECONNECT', 10, 1, 100),
    reconnectBaseDelay: parseEnvNumber('STREAM_RECONNECT_BASE_DELAY', 1000, 100, 30000),
    reconnectMaxDelay: parseEnvNumber('STREAM_RECONNECT_MAX_DELAY', 60000, 1000, 300000),
  },

  storage: {
    dbPath: process.env.STORAGE_DB_PATH || '',
    enableWAL: process.env.STORAGE_ENABLE_WAL !== 'false',
    cleanupInterval: parseEnvNumber('STORAGE_CLEANUP_INTERVAL', 3600000, 60000, 86400000),
  },

  logging: {
    level: parseEnvString('LOG_LEVEL', 'info', [
      'debug',
      'info',
      'warn',
      'error',
    ]) as LoggingConfig['level'],
    format: parseEnvString('LOG_FORMAT', 'pretty', ['json', 'pretty']) as LoggingConfig['format'],
    enableFile: process.env.LOG_ENABLE_FILE === 'true',
    filePath: process.env.LOG_FILE_PATH,
  } as LoggingConfig,

  scheduler: {
    enabled: process.env.SCHEDULER_ENABLED === 'true',
    tasks: (() => {
      try {
        const tasksJson = process.env.SCHEDULER_TASKS;
        return tasksJson ? (JSON.parse(tasksJson) as SchedulerTaskConfig[]) : [];
      } catch (err: unknown) {
        logger.debug(
          'SCHEDULER_TASKS JSON 解析失败，使用空数组:',
          err instanceof Error ? err.message : String(err)
        );
        return [] as SchedulerTaskConfig[];
      }
    })(),
  },

  media: {
    enabled: process.env.MEDIA_ENABLED !== 'false',
    voiceTranscriptionEnabled: process.env.MEDIA_VOICE_TRANSCRIPTION === 'true',
    imageDescriptionEnabled: process.env.MEDIA_IMAGE_DESCRIPTION === 'true',
    maxFileSize: parseEnvNumber('MEDIA_MAX_FILE_SIZE', 10485760, 1048576, 52428800),
    downloadTimeout: parseEnvNumber('MEDIA_DOWNLOAD_TIMEOUT', 30000, 5000, 120000),
  },

  router: {
    enabled: process.env.ROUTER_ENABLED === 'true',
    providers: (() => {
      try {
        const providersJson = process.env.ROUTER_PROVIDERS;
        return providersJson ? (JSON.parse(providersJson) as RouterProviderConfig[]) : [];
      } catch (err: unknown) {
        logger.debug(
          'ROUTER_PROVIDERS JSON 解析失败，使用空数组:',
          err instanceof Error ? err.message : String(err)
        );
        return [] as RouterProviderConfig[];
      }
    })(),
    rules: (() => {
      try {
        const rulesJson = process.env.ROUTER_RULES;
        return rulesJson ? (JSON.parse(rulesJson) as RouterRuleConfig[]) : [];
      } catch (err: unknown) {
        logger.debug(
          'ROUTER_RULES JSON 解析失败，使用空数组:',
          err instanceof Error ? err.message : String(err)
        );
        return [] as RouterRuleConfig[];
      }
    })(),
  },

  memory: {
    enabled: process.env.MEMORY_ENABLED !== 'false',
    autoSummarizeEnabled: process.env.MEMORY_AUTO_SUMMARIZE !== 'false',
    summarizeThreshold: parseEnvNumber('MEMORY_SUMMARIZE_THRESHOLD', 20, 5, 100),
    maxContextMemories: parseEnvNumber('MEMORY_MAX_CONTEXT', 10, 1, 50),
    autoMemoryMaxAge: parseEnvNumber('MEMORY_AUTO_MAX_AGE', 7776000000, 86400000, 31536000000),
    boostOnAccess: process.env.MEMORY_BOOST_ON_ACCESS !== 'false',
    boostIncrement: parseEnvNumber('MEMORY_BOOST_INCREMENT', 1, 1, 10) / 10,
  },

  display: {
    mode: parseEnvString('DISPLAY_MODE', 'compact', ['full', 'compact', 'quiet']) as DisplayMode,
    thinkingMessages: process.env.DISPLAY_THINKING_MESSAGES !== 'false',
    thinkingMaxLen: parseEnvNumber('DISPLAY_THINKING_MAX_LEN', 300, 50, 2000),
    toolMessages: process.env.DISPLAY_TOOL_MESSAGES !== 'false',
    toolMaxLen: parseEnvNumber('DISPLAY_TOOL_MAX_LEN', 500, 50, 5000),
  },

  streaming: {
    enabled: process.env.STREAMING_ENABLED === 'true',
    intervalMs: parseEnvNumber('STREAMING_INTERVAL_MS', 1500, 500, 10000),
    minDeltaChars: parseEnvNumber('STREAMING_MIN_DELTA_CHARS', 30, 1, 500),
    maxChars: parseEnvNumber('STREAMING_MAX_CHARS', 2000, 100, 10000),
    thinkingText: '⏳ AI 正在思考...',
    cardTemplateId:
      process.env.STREAMING_CARD_TEMPLATE_ID || '82632605-8031-4963-8a92-d25e2ca8aad7.schema',
  },

  persistentSession: {
    enabled: process.env.PERSISTENT_SESSION_ENABLED !== 'false',
    maxSessions: parseEnvNumber('PERSISTENT_SESSION_MAX_SESSIONS', 10, 1, 100),
    idleTimeout: parseEnvNumber('PERSISTENT_SESSION_IDLE_TIMEOUT', 1800000, 60000, 86400000),
    warmUpSessions: parseEnvNumber('PERSISTENT_SESSION_WARM_UP', 1, 0, 5),
  },
};

// ==================== 配置验证 ====================

export function validateConfig(): void {
  const errors: string[] = [];

  // 必填项检查
  if (!config.dingtalk.appKey) {
    errors.push('DINGTALK_APP_KEY 未配置');
  }
  if (!config.dingtalk.appSecret) {
    errors.push('DINGTALK_APP_SECRET 未配置');
  }

  // 值域验证
  if (config.gateway.port < 1 || config.gateway.port > 65535) {
    errors.push('GATEWAY_PORT: 端口号必须在 1-65535 之间');
  }

  if (config.session.ttl < 60000) {
    errors.push('SESSION_TTL: 会话 TTL 不能小于 60 秒');
  }

  if (config.ai.timeout < 1000 || config.claude.timeout < 1000) {
    errors.push('AI 超时时间不能小于 1 秒');
  }

  if (config.messageQueue.maxConcurrentPerUser < 1) {
    errors.push('MQ_MAX_CONCURRENT_PER_USER: 每用户最大并发数不能小于 1');
  }

  if (config.messageQueue.maxConcurrentGlobal < 1) {
    errors.push('MQ_MAX_CONCURRENT_GLOBAL: 全局最大并发数不能小于 1');
  }

  if (config.messageQueue.maxConcurrentGlobal < config.messageQueue.maxConcurrentPerUser) {
    errors.push('MQ_MAX_CONCURRENT_GLOBAL: 全局最大并发数不能小于每用户最大并发数');
  }

  if (config.messageQueue.pollInterval < 10) {
    errors.push('MQ_POLL_INTERVAL: 轮询间隔不能小于 10ms');
  }

  if (aiProvider !== 'opencode' && aiProvider !== 'claude') {
    errors.push('AI_PROVIDER: 必须是 opencode 或 claude');
  }

  const validLogLevels = ['debug', 'info', 'warn', 'error'];
  if (!validLogLevels.includes(config.logging.level)) {
    errors.push('LOG_LEVEL: 必须是 debug/info/warn/error 之一');
  }

  if (errors.length > 0) {
    throw new ConfigValidationError(errors);
  }

  // 打印配置摘要
  const aiProviderName = config.aiProvider === 'claude' ? 'Claude Code' : 'OpenCode';
  logger.log('✅ 配置验证通过');
  logger.log(`   - AI Provider: ${aiProviderName}`);
  logger.log(`   - Gateway: ${config.gateway.host}:${config.gateway.port}`);
  logger.log(`   - 会话 TTL: ${config.session.ttl / 1000 / 60} 分钟`);
  logger.log(`   - 最大历史消息: ${config.session.maxHistoryMessages}`);
  logger.log(`   - 用户最大并发: ${config.messageQueue.maxConcurrentPerUser}`);
  logger.log(`   - 全局最大并发: ${config.messageQueue.maxConcurrentGlobal}`);
  logger.log(`   - 队列轮询间隔: ${config.messageQueue.pollInterval}ms`);
  logger.log(
    `   - AI 超时: ${config.aiProvider === 'claude' ? config.claude.timeout : config.ai.timeout}ms`
  );
  logger.log(`   - 持久化存储: ${config.messageQueue.enablePersistence ? '启用' : '禁用'}`);
  logger.log(`   - 日志级别: ${config.logging.level}`);
  logger.log(`   - 日志格式: ${config.logging.format}`);
  logger.log(`   - Stream 模式: 启用 (自动重连: ${config.stream.maxReconnectAttempts} 次)`);
  logger.log(`   - 媒体处理: ${config.media.enabled ? '启用' : '禁用'}`);
  logger.log(`   - 路由器: ${config.router.enabled ? '启用' : '禁用'}`);
  logger.log(`   - 流式输出: ${config.streaming.enabled ? '启用' : '禁用'}`);
  logger.log(
    `   - 持久化会话: ${config.persistentSession.enabled ? '启用' : '禁用'}${config.persistentSession.enabled ? ` (最大 ${config.persistentSession.maxSessions}, 预热 ${config.persistentSession.warmUpSessions}, 空闲 ${config.persistentSession.idleTimeout / 1000 / 60}min)` : ''}`
  );
}
