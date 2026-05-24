/**
 * 错误消息常量配置
 */

/**
 * 错误类型
 */
export const ErrorType = {
  TIMEOUT: 'TIMEOUT',
  CLI_NOT_FOUND: 'CLI_NOT_FOUND',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  RATE_LIMIT: 'RATE_LIMIT',
  SYSTEM_BUSY: 'SYSTEM_BUSY',
  SESSION_ERROR: 'SESSION_ERROR',
  DUPLICATE_MESSAGE: 'DUPLICATE_MESSAGE',
  UNKNOWN: 'UNKNOWN',
} as const;

export type ErrorType = (typeof ErrorType)[keyof typeof ErrorType];

/**
 * 错误消息配置
 */
export interface ErrorMessageConfig {
  type: ErrorType;
  title: string;
  template: string;
  suggestion?: string;
}

/**
 * 错误消息配置列表
 */
export const ERROR_MESSAGES: ErrorMessageConfig[] = [
  {
    type: ErrorType.TIMEOUT,
    title: '⏱️ 处理超时',
    template: '我需要更多时间思考，请稍等片刻再试一次。',
  },
  {
    type: ErrorType.CLI_NOT_FOUND,
    title: '⚠️ AI CLI 未正确安装',
    template: '请先安装 AI CLI 工具',
    suggestion: 'npm install -g opencode 或 brew install anthropic/claude/claude',
  },
  {
    type: ErrorType.PERMISSION_DENIED,
    title: '🔒 权限不足',
    template: '抱歉，我没有足够的权限执行此操作。',
  },
  {
    type: ErrorType.NETWORK_ERROR,
    title: '🌐 网络连接失败',
    template: '网络连接出现问题，请检查网络后重试。',
  },
  {
    type: ErrorType.RATE_LIMIT,
    title: '🚦 请求过于频繁',
    template: '请求过于频繁，请稍后再试。',
  },
  {
    type: ErrorType.SYSTEM_BUSY,
    title: '⚙️ 系统繁忙',
    template: '系统当前繁忙，请稍后重试。',
  },
  {
    type: ErrorType.SESSION_ERROR,
    title: '🔑 会话错误',
    template: '会话创建失败，请重新发起对话。',
  },
  {
    type: ErrorType.DUPLICATE_MESSAGE,
    title: '🔄 重复消息',
    template: '这条消息已经处理过了，请勿重复发送。',
  },
];

/**
 * 系统错误消息（面向用户）
 */
export const SYSTEM_ERROR_MESSAGES = {
  generic: '抱歉，我遇到了问题。请稍后重试。',
  retry: '请稍后重试，如果问题持续存在，请联系管理员。',
};

/**
 * CLI 安装建议
 */
export const CLI_INSTALL_SUGGESTIONS = {
  opencode: 'npm install -g opencode',
  claude: 'brew install anthropic/claude/claude',
};

/**
 * 速率限制消息
 */
export function getRateLimitMessage(remaining: number): string {
  return `请求过于频繁，请稍后再试。（剩余 ${remaining} 次）`;
}

/**
 * 系统繁忙消息
 */
export const BUSY_ERROR_MESSAGE = '系统繁忙，请稍后重试。';
