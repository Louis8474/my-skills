/**
 * 错误格式化工具
 * 将技术错误转换为用户友好的消息
 */

import { ErrorType } from '../config/errorMessages';

/**
 * 错误类型枚举（保持向后兼容）
 */
export enum ErrorTypeEnum {
  TIMEOUT = 'timeout',
  CLI_NOT_FOUND = 'cli_not_found',
  PERMISSION_DENIED = 'permission_denied',
  NETWORK_ERROR = 'network_error',
  RATE_LIMIT = 'rate_limit',
  SYSTEM_BUSY = 'system_busy',
  SESSION_ERROR = 'session_error',
  DUPLICATE_MESSAGE = 'duplicate_message',
  UNKNOWN = 'unknown',
}

// 保持向后兼容
export { ErrorType };

/**
 * 错误信息接口
 */
export interface FormattedError {
  type: ErrorType;
  title: string;
  message: string;
  suggestion?: string;
  messageId?: string;
}

/**
 * 错误模式匹配规则
 */
interface ErrorPattern {
  patterns: RegExp[];
  type: ErrorType;
  title: string;
  template: string;
  suggestion?: string;
}

const ERROR_PATTERNS: ErrorPattern[] = [
  {
    patterns: [/timeout/i, /超时/],
    type: ErrorType.TIMEOUT,
    title: '⏱️ 处理超时',
    template: '我需要更多时间思考，请稍等片刻再试一次。',
  },
  {
    patterns: [/未安装/i, /找不到命令/i, /ENOENT/i, /command not found/i],
    type: ErrorType.CLI_NOT_FOUND,
    title: '⚠️ AI CLI 未正确安装',
    template: '请先安装 AI CLI 工具',
    suggestion: 'npm install -g opencode 或 brew install anthropic/claude/claude',
  },
  {
    patterns: [/permission/i, /Permission denied/i, /权限/i],
    type: ErrorType.PERMISSION_DENIED,
    title: '🔒 权限不足',
    template: '无法执行操作，请检查权限设置。',
  },
  {
    patterns: [/network/i, /Network/i, /ECONNREFUSED/i, /ENOTFOUND/i, /网络/i],
    type: ErrorType.NETWORK_ERROR,
    title: '🌐 网络问题',
    template: '无法连接到服务，请检查网络后重试。',
  },
  {
    patterns: [/Rate limit/i, /请求过于频繁/i, /429/],
    type: ErrorType.RATE_LIMIT,
    title: '🚥 请求过于频繁',
    template: '请稍等片刻再发送消息。',
  },
  {
    patterns: [/系统繁忙/i, /concurrent/i, /too many requests/i],
    type: ErrorType.SYSTEM_BUSY,
    title: '🔥 系统繁忙',
    template: '当前用户并发请求过多，请稍后重试。',
  },
  {
    patterns: [/会话创建失败/i, /session/i],
    type: ErrorType.SESSION_ERROR,
    title: '🗣️ 会话创建失败',
    template: '请稍后重试，或重新发起对话。',
  },
  {
    patterns: [/消息已处理/i, /重复/i, /duplicate/i],
    type: ErrorType.DUPLICATE_MESSAGE,
    title: '🔄 消息重复',
    template: '该消息已处理，请勿重复发送。',
  },
];

/**
 * 分析错误类型
 */
export function analyzeError(error: string): ErrorType {
  for (const pattern of ERROR_PATTERNS) {
    for (const regex of pattern.patterns) {
      if (regex.test(error)) {
        return pattern.type;
      }
    }
  }
  return ErrorType.UNKNOWN;
}

/**
 * 格式化错误信息为用户友好的消息
 */
export function formatError(
  error: string,
  messageId?: string,
  isSystemError: boolean = false
): string {
  const errorType = analyzeError(error);
  const pattern = ERROR_PATTERNS.find(p => p.type === errorType);

  let result: string;

  if (pattern) {
    result = `${pattern.title}\n\n${pattern.template}`;
    if (pattern.suggestion) {
      result += `\n\n\`\`\`bash\n${pattern.suggestion}\n\`\`\``;
    }
  } else if (isSystemError) {
    result = '❌ 处理失败\n\n抱歉，我遇到了问题。请稍后重试。';
  } else {
    result = `❌ ${error}`;
  }

  // 添加追踪 ID
  if (messageId) {
    result += `\n\n📋 追踪ID: ${messageId}`;
  }

  return result;
}

/**
 * 获取 CLI 安装建议
 */
export function getCLIInstallSuggestion(provider: 'opencode' | 'claude'): string {
  if (provider === 'claude') {
    return `⚠️ Claude Code CLI 未安装

请先安装 Claude Code CLI:
\`\`\`bash
brew install anthropic/claude/claude
\`\`\`

或配置环境变量 CLAUDE_COMMAND 指定 claude 命令路径。`;
  }

  return `⚠️ OpenCode CLI 未安装

请先安装 OpenCode CLI:
\`\`\`bash
npm install -g opencode
\`\`\`

或配置环境变量 OPENCODE_COMMAND 指定 opencode 命令路径。`;
}

/**
 * 格式化剩余配额消息
 */
export function formatRateLimitMessage(remaining: number): string {
  return `🚥 请求过于频繁，请稍后再试\n\n当前剩余配额：${remaining}`;
}

/**
 * 格式化系统繁忙消息
 */
export function formatBusyMessage(): string {
  return '🔥 系统繁忙\n\n当前用户并发请求过多，请稍后重试。';
}
