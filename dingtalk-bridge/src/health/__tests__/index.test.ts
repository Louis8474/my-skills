/**
 * 健康检查模块测试 - 扩展覆盖
 */

// Mock config before any imports
jest.mock('../../config', () => ({
  config: {
    aiProvider: 'opencode',
    dingtalk: { appKey: 'key123', appSecret: 'secret123' },
    gateway: { port: 3000 },
    messageQueue: {
      enablePersistence: false,
      maxConcurrentGlobal: 10,
      maxConcurrentPerUser: 3,
      pollInterval: 100,
    },
    ai: { timeout: 120000, command: 'opencode' },
    claude: { timeout: 120000, command: 'claude' },
    session: { ttl: 1800000 },
    configSource: 'env',
  },
}));

// Mock child_process so cliChecker can't actually spawn processes
jest.mock('child_process', () => ({
  spawn: jest.fn().mockReturnValue({
    on: jest.fn(),
    kill: jest.fn(),
  }),
  execSync: jest.fn().mockReturnValue('1.0.0'),
}));

jest.mock('../../storage/sqlite', () => ({
  getStorage: jest.fn().mockReturnValue({
    getStats: jest.fn().mockReturnValue({
      dbSize: 1024,
      queueMessages: 0,
      sessions: 0,
      messageHistory: 0,
      retryQueue: 0,
    }),
    getDbPath: jest.fn().mockReturnValue(':memory:'),
  }),
}));

import { getSimpleStatus, getSystemMetrics, performHealthCheck } from '../index';

describe('health/index', () => {
  describe('getSimpleStatus', () => {
    it('should return ok status with timestamp and mode', () => {
      const result = getSimpleStatus();
      expect(result.status).toBe('ok');
      expect(result.mode).toBe('stream');
      expect(result.uptime).toBeGreaterThanOrEqual(0);
      expect(() => new Date(result.timestamp).toISOString()).not.toThrow();
    });
  });

  describe('getSystemMetrics', () => {
    it('should return memory and node metrics', () => {
      const metrics = getSystemMetrics();
      expect(metrics.uptime).toBeGreaterThanOrEqual(0);
      expect(metrics.memory).toHaveProperty('heapUsed');
      expect(metrics.memory).toHaveProperty('heapTotal');
      expect(metrics.memory).toHaveProperty('rss');
      expect(metrics.node).toHaveProperty('version');
      expect(metrics.node).toHaveProperty('platform');
      const node = metrics.node as Record<string, unknown>;
      expect(node.platform).toBe(process.platform);
      const cfg = metrics.config as Record<string, unknown>;
      expect(cfg.aiProvider).toBe('opencode');
    });

    it('should report correct config fields', () => {
      const metrics = getSystemMetrics();
      const cfg = metrics.config as Record<string, unknown>;
      expect(cfg.gatewayPort).toBe(3000);
      expect(cfg.persistence).toBe(false);
    });
  });

  describe('performHealthCheck', () => {
    it('should return health check result with all standard checks', async () => {
      const result = await performHealthCheck();
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('mode', 'stream');
      expect(result).toHaveProperty('checks');
      expect(result).toHaveProperty('summary');
      expect(result.checks).toHaveProperty('memory');
      expect(result.checks).toHaveProperty('aiCli');
      expect(result.checks).toHaveProperty('storage');
      expect(result.checks).toHaveProperty('dingtalkConfig');
      expect(result.checks).toHaveProperty('configuration');
    });

    it('should include memory check with a valid status', async () => {
      const result = await performHealthCheck();
      const mem = result.checks.memory;
      expect(['pass', 'warn', 'fail']).toContain(mem.status);
      expect(mem.message).toBeTruthy();
    });

    it('should report pass for dingtalkConfig when configured', async () => {
      const result = await performHealthCheck();
      expect(result.checks.dingtalkConfig.status).toBe('pass');
      expect(result.checks.dingtalkConfig.details).toHaveProperty('appKeyConfigured', true);
      expect(result.checks.dingtalkConfig.details).toHaveProperty('appSecretConfigured', true);
    });

    it('should report pass for storage when persistence is disabled', async () => {
      const result = await performHealthCheck();
      expect(result.checks.storage.status).toBe('pass');
      expect(result.checks.storage.message).toContain('未启用');
    });

    it('should include duration in each check', async () => {
      const result = await performHealthCheck();
      for (const check of Object.values(result.checks)) {
        expect(check).toHaveProperty('duration');
      }
    });

    it('should handle additional checks that succeed', async () => {
      const result = await performHealthCheck({
        custom: async () => ({ status: 'pass', message: 'Custom OK' }),
      });
      expect(result.checks.custom).toBeDefined();
      expect(result.checks.custom.status).toBe('pass');
    });

    it('should handle additional checks that fail', async () => {
      const result = await performHealthCheck({
        broken: async () => Promise.reject(new Error('check failed')),
      });
      expect(result.checks.broken).toBeDefined();
      expect(result.checks.broken.status).toBe('fail');
      expect(result.checks.broken.message).toBe('check failed');
    });

    it('should handle additional checks that reject with non-Error', async () => {
      const result = await performHealthCheck({
        stringErr: async () => Promise.reject('string error'),
      });
      expect(result.checks.stringErr).toBeDefined();
      expect(result.checks.stringErr.status).toBe('fail');
      expect(result.checks.stringErr.message).toBe('Unknown error');
    });

    it('should calculate summary correctly', async () => {
      const result = await performHealthCheck();
      const total = result.summary.passed + result.summary.warnings + result.summary.failed;
      expect(total).toBe(Object.keys(result.checks).length);
    });

    it('should set status to degraded or ok with a warning check', async () => {
      const result = await performHealthCheck({
        warnCheck: async () => ({ status: 'warn', message: 'Something is off' }),
      });
      expect(['degraded', 'ok']).toContain(result.status);
    });
  });
});
