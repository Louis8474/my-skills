/**
 * 日志脱敏工具测试
 */
import { sanitizeLog, createSafeLogger, sanitizeConfig } from '../logger';

describe('sanitizeLog', () => {
  it('should sanitize AppSecret in log message', () => {
    const input = 'AppSecret=abc123xyz';
    expect(sanitizeLog(input)).toBe('AppSecret=****');
  });

  it('should sanitize case-insensitive AppSecret', () => {
    const input = 'appSecret: "my-secret-key"';
    expect(sanitizeLog(input)).toBe('appSecret=****');
  });

  it('should sanitize Token in log message', () => {
    const input = 'Token: "a-very-long-token-value"';
    expect(sanitizeLog(input)).toBe('Token=****');
  });

  it('should sanitize clientSecret', () => {
    const input = 'clientSecret=production-secret-key';
    expect(sanitizeLog(input)).toBe('clientSecret=****');
  });

  it('should sanitize sessionWebhook URLs', () => {
    const input = 'sessionWebhook=https://oapi.dingtalk.com/robot/send?access_token=abc';
    expect(sanitizeLog(input)).toBe('sessionWebhook=****');
  });

  it('should sanitize session tokens', () => {
    const input = 'session=abcdef1234567890';
    expect(sanitizeLog(input)).toBe('session=****');
  });

  it('should sanitize model parameters', () => {
    const input = 'opencode -m claude-sonnet-4-6';
    expect(sanitizeLog(input)).toBe('opencode -m ****');
  });

  it('should sanitize Authorization header', () => {
    const input = 'Authorization: Bearer abc-token-12345';
    expect(sanitizeLog(input)).toBe('Authorization=****');
  });

  it('should sanitize long hex/code strings (32+ chars)', () => {
    const input = 'abcdef1234567890abcdef1234567890';
    const result = sanitizeLog(input);
    expect(result).toBe('****');
  });

  it('should not sanitize short strings', () => {
    const input = 'hello world';
    expect(sanitizeLog(input)).toBe('hello world');
  });

  it('should handle empty string', () => {
    expect(sanitizeLog('')).toBe('');
  });
});

describe('createSafeLogger', () => {
  it('should create a logger with tag prefix', () => {
    const originalLog = console.log;
    const mockLog = jest.fn();
    console.log = mockLog;

    const logger = createSafeLogger('TestTag');
    logger.log('hello');

    const callArg = mockLog.mock.calls[0][0];
    expect(callArg).toBe('[TestTag]');

    console.log = originalLog;
  });

  it('should sanitize sensitive data in log messages', () => {
    const originalLog = console.log;
    const mockLog = jest.fn();
    console.log = mockLog;

    const logger = createSafeLogger('Test');
    logger.log('AppSecret=mysecret');

    console.log = originalLog;

    // Should have sanitized the AppSecret
    const encoded = mockLog.mock.calls[0].join(' ');
    expect(encoded).not.toContain('mysecret');
    expect(encoded).toContain('****');
  });
});

describe('sanitizeConfig', () => {
  it('should mask sensitive keys', () => {
    const input = { appSecret: 'value123', host: 'localhost' };
    const result = sanitizeConfig(input);
    expect(result.appSecret).toBe('****');
    expect(result.host).toBe('localhost');
  });

  it('should mask nested sensitive objects', () => {
    const input = { server: { token: 'abc', port: 3000 } };
    const result = sanitizeConfig(input);
    expect((result.server as Record<string, unknown>).token).toBe('****');
    expect((result.server as Record<string, unknown>).port).toBe(3000);
  });

  it('should handle empty object', () => {
    expect(sanitizeConfig({})).toEqual({});
  });

  it('should mask accessToken and sessionWebhook', () => {
    const input = { accessToken: 'at123', sessionWebhook: 'https://example.com/hook' };
    const result = sanitizeConfig(input);
    expect(result.accessToken).toBe('****');
    expect(result.sessionWebhook).toBe('****');
  });
});
