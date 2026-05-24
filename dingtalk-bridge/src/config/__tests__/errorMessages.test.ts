/**
 * 错误消息常量测试
 */
import {
  ErrorType,
  ERROR_MESSAGES,
  SYSTEM_ERROR_MESSAGES,
  CLI_INSTALL_SUGGESTIONS,
  getRateLimitMessage,
  BUSY_ERROR_MESSAGE,
} from '../errorMessages';

describe('ErrorType', () => {
  it('should have all expected error types', () => {
    expect(ErrorType.TIMEOUT).toBe('TIMEOUT');
    expect(ErrorType.CLI_NOT_FOUND).toBe('CLI_NOT_FOUND');
    expect(ErrorType.PERMISSION_DENIED).toBe('PERMISSION_DENIED');
    expect(ErrorType.NETWORK_ERROR).toBe('NETWORK_ERROR');
    expect(ErrorType.RATE_LIMIT).toBe('RATE_LIMIT');
    expect(ErrorType.SYSTEM_BUSY).toBe('SYSTEM_BUSY');
    expect(ErrorType.SESSION_ERROR).toBe('SESSION_ERROR');
    expect(ErrorType.DUPLICATE_MESSAGE).toBe('DUPLICATE_MESSAGE');
    expect(ErrorType.UNKNOWN).toBe('UNKNOWN');
  });
});

describe('ERROR_MESSAGES', () => {
  it('should have entries for all error types', () => {
    const types = Object.values(ErrorType);
    for (const type of types) {
      const config = ERROR_MESSAGES.find(e => e.type === type);
      if (type !== ErrorType.UNKNOWN) {
        expect(config).toBeDefined();
      }
    }
  });

  it('each error config should have a title and template', () => {
    for (const config of ERROR_MESSAGES) {
      expect(config.title).toBeTruthy();
      expect(config.template).toBeTruthy();
    }
  });
});

describe('SYSTEM_ERROR_MESSAGES', () => {
  it('should have generic and retry messages', () => {
    expect(SYSTEM_ERROR_MESSAGES.generic).toBeTruthy();
    expect(SYSTEM_ERROR_MESSAGES.retry).toBeTruthy();
  });
});

describe('CLI_INSTALL_SUGGESTIONS', () => {
  it('should have install commands for opencode and claude', () => {
    expect(CLI_INSTALL_SUGGESTIONS.opencode).toContain('npm');
    expect(CLI_INSTALL_SUGGESTIONS.claude).toContain('brew');
  });
});

describe('getRateLimitMessage', () => {
  it('should include remaining count', () => {
    const msg = getRateLimitMessage(5);
    expect(msg).toContain('5');
  });

  it('should handle zero remaining', () => {
    const msg = getRateLimitMessage(0);
    expect(msg).toContain('0');
  });
});

describe('BUSY_ERROR_MESSAGE', () => {
  it('should be a non-empty string', () => {
    expect(BUSY_ERROR_MESSAGE).toBeTruthy();
    expect(typeof BUSY_ERROR_MESSAGE).toBe('string');
  });
});
