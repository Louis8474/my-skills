/**
 * 错误格式化工具测试
 */
import { formatError, analyzeError, ErrorType, getCLIInstallSuggestion, formatRateLimitMessage, formatBusyMessage } from '../errorFormatter';

describe('errorFormatter', () => {
  describe('analyzeError', () => {
    it('should identify timeout errors', () => {
      expect(analyzeError('timeout exceeded')).toBe(ErrorType.TIMEOUT);
      expect(analyzeError('请求超时')).toBe(ErrorType.TIMEOUT);
    });

    it('should identify CLI not found errors', () => {
      expect(analyzeError('ENOENT: command not found')).toBe(ErrorType.CLI_NOT_FOUND);
      expect(analyzeError('OpenCode CLI 未安装')).toBe(ErrorType.CLI_NOT_FOUND);
      expect(analyzeError('找不到命令')).toBe(ErrorType.CLI_NOT_FOUND);
    });

    it('should identify permission errors', () => {
      expect(analyzeError('Permission denied')).toBe(ErrorType.PERMISSION_DENIED);
      expect(analyzeError('权限不足')).toBe(ErrorType.PERMISSION_DENIED);
    });

    it('should identify network errors', () => {
      expect(analyzeError('ECONNREFUSED')).toBe(ErrorType.NETWORK_ERROR);
      expect(analyzeError('Network error')).toBe(ErrorType.NETWORK_ERROR);
      expect(analyzeError('网络连接失败')).toBe(ErrorType.NETWORK_ERROR);
    });

    it('should identify rate limit errors', () => {
      expect(analyzeError('Rate limit exceeded')).toBe(ErrorType.RATE_LIMIT);
      expect(analyzeError('请求过于频繁')).toBe(ErrorType.RATE_LIMIT);
    });

    it('should identify system busy errors', () => {
      expect(analyzeError('系统繁忙')).toBe(ErrorType.SYSTEM_BUSY);
      expect(analyzeError('concurrent requests too many')).toBe(ErrorType.SYSTEM_BUSY);
    });

    it('should return UNKNOWN for unrecognizable errors', () => {
      expect(analyzeError('something went wrong')).toBe(ErrorType.UNKNOWN);
    });
  });

  describe('formatError', () => {
    it('should format timeout error with friendly message', () => {
      const result = formatError('timeout exceeded');
      expect(result).toContain('超时');
    });

    it('should format CLI not found error with install suggestion', () => {
      const result = formatError('ENOENT: command not found');
      expect(result).toContain('未正确安装');
      expect(result).toMatch(/npm install|brew install/);
    });

    it('should format network error', () => {
      const result = formatError('ECONNREFUSED');
      expect(result).toContain('网络');
    });

    it('should include message ID when provided', () => {
      const result = formatError('some error', 'msg-123');
      expect(result).toContain('msg-123');
      expect(result).toContain('追踪ID');
    });

    it('should show generic error message for system errors', () => {
      const result = formatError('unknown error', undefined, true);
      expect(result).toContain('抱歉');
      expect(result).toContain('稍后重试');
    });

    it('should show original error for non-system errors', () => {
      const result = formatError('something unexpected happened', undefined, false);
      expect(result).toContain('something unexpected happened');
    });

    it('should format permission error', () => {
      const result = formatError('Permission denied');
      expect(result).toContain('权限');
    });

    it('should format rate limit error', () => {
      const result = formatError('Rate limit exceeded');
      expect(result).toContain('频繁');
    });

    it('should format session error', () => {
      const result = formatError('会话创建失败');
      expect(result).toContain('会话');
    });

    it('should format duplicate message error', () => {
      const result = formatError('消息已处理');
      expect(result).toContain('重复');
    });
  });

  describe('getCLIInstallSuggestion', () => {
    it('should return OpenCode install suggestion', () => {
      const result = getCLIInstallSuggestion('opencode');
      expect(result).toContain('OpenCode');
      expect(result).toContain('npm install -g opencode');
    });

    it('should return Claude install suggestion', () => {
      const result = getCLIInstallSuggestion('claude');
      expect(result).toContain('Claude Code');
      expect(result).toContain('brew install anthropic/claude/claude');
    });
  });

  describe('formatRateLimitMessage', () => {
    it('should format rate limit message with remaining count', () => {
      const result = formatRateLimitMessage(5);
      expect(result).toContain('请求过于频繁');
      expect(result).toContain('5');
    });

    it('should format rate limit message with zero remaining', () => {
      const result = formatRateLimitMessage(0);
      expect(result).toContain('0');
    });
  });

  describe('formatBusyMessage', () => {
    it('should format busy message', () => {
      const result = formatBusyMessage();
      expect(result).toContain('系统繁忙');
      expect(result).toContain('稍后重试');
    });
  });
});
