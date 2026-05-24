/**
 * 配置模块测试
 *
 * 由于 config.ts 在 import 时调用 dotenv.config() 和读取 process.env，
 * 所有测试需要在隔离的模块作用域中运行。
 */

// Mock dotenv globally for all tests in this file
jest.mock('dotenv', () => ({
  config: jest.fn(),
}));

describe('ConfigValidationError', () => {
  it('should include all errors in message', () => {
    const { ConfigValidationError } = require('../config');
    const error = new ConfigValidationError(['error 1', 'error 2']);
    expect(error.message).toContain('error 1');
    expect(error.message).toContain('error 2');
    expect(error.name).toBe('ConfigValidationError');
    expect(error.errors).toEqual(['error 1', 'error 2']);
  });
});

describe('validateConfig', () => {
  beforeEach(() => {
    jest.resetModules();
    // Clear env vars for clean testing
    delete process.env.DINGTALK_APP_KEY;
    delete process.env.DINGTALK_APP_SECRET;
    delete process.env.MQ_MAX_CONCURRENT_PER_USER;
    delete process.env.MQ_MAX_CONCURRENT_GLOBAL;
  });

  it('should throw ConfigValidationError if DINGTALK_APP_KEY is missing', () => {
    process.env.DINGTALK_APP_SECRET = 'secret123';
    const { validateConfig } = require('../config');
    expect(() => validateConfig()).toThrow();
    try {
      validateConfig();
    } catch (e: any) {
      expect(e.name).toBe('ConfigValidationError');
      expect(e.message).toContain('DINGTALK_APP_KEY');
    }
  });

  it('should throw ConfigValidationError if DINGTALK_APP_SECRET is missing', () => {
    process.env.DINGTALK_APP_KEY = 'key123';
    const { validateConfig } = require('../config');
    try {
      validateConfig();
    } catch (e: any) {
      expect(e.name).toBe('ConfigValidationError');
      expect(e.message).toContain('DINGTALK_APP_SECRET');
    }
  });

  it('should pass validation when required fields are set', () => {
    process.env.DINGTALK_APP_KEY = 'key123';
    process.env.DINGTALK_APP_SECRET = 'secret123';
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const { validateConfig } = require('../config');
    expect(() => validateConfig()).not.toThrow();
    expect(consoleLogSpy).toHaveBeenCalledWith('[Config]', expect.stringContaining('配置验证通过'));
    consoleLogSpy.mockRestore();
  });

  it('should fail when MQ_MAX_CONCURRENT_GLOBAL < MQ_MAX_CONCURRENT_PER_USER', () => {
    process.env.DINGTALK_APP_KEY = 'key123';
    process.env.DINGTALK_APP_SECRET = 'secret123';
    process.env.MQ_MAX_CONCURRENT_PER_USER = '10';
    process.env.MQ_MAX_CONCURRENT_GLOBAL = '3';
    const { validateConfig } = require('../config');
    expect(() => validateConfig()).toThrow();
  });
});

describe('config object', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('should have all major config sections', () => {
    const { config } = require('../config');
    expect(config).toHaveProperty('dingtalk');
    expect(config).toHaveProperty('gateway');
    expect(config).toHaveProperty('ai');
    expect(config).toHaveProperty('claude');
    expect(config).toHaveProperty('session');
    expect(config).toHaveProperty('messageQueue');
    expect(config).toHaveProperty('stream');
    expect(config).toHaveProperty('storage');
    expect(config).toHaveProperty('logging');
    expect(config).toHaveProperty('scheduler');
    expect(config).toHaveProperty('media');
    expect(config).toHaveProperty('router');
    expect(config).toHaveProperty('memory');
    expect(config).toHaveProperty('aiProvider');
  });

  it('should parse router providers JSON from env', () => {
    process.env.ROUTER_PROVIDERS = JSON.stringify([
      { name: 'test', type: 'opencode', command: 'test', timeout: 1000, enabled: true },
    ]);
    const { config } = require('../config');
    expect(config.router.providers).toHaveLength(1);
    expect(config.router.providers[0].name).toBe('test');
  });

  it('should fallback to empty array on invalid JSON', () => {
    process.env.SCHEDULER_TASKS = 'not-json!!';
    const { config } = require('../config');
    expect(Array.isArray(config.scheduler.tasks)).toBe(true);
  });

  it('should handle invalid router JSON gracefully', () => {
    process.env.ROUTER_RULES = '{broken';
    const { config } = require('../config');
    expect(Array.isArray(config.router.rules)).toBe(true);
  });

  it('should have default ai timeout', () => {
    const { config } = require('../config');
    expect(config.ai.timeout).toBeGreaterThan(1000);
  });

  it('should have stream enabled by default', () => {
    const { config } = require('../config');
    expect(config.stream.enabled).toBe(true);
  });
});
