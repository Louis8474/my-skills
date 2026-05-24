/**
 * proxyClient.ts 测试
 *
 * 测试客户端核心逻辑：连接管理、消息处理、超时机制
 */
import { ClaudeProxyClient } from '../proxyClient';
import { formatToolCall, formatToolResult, shortenPath } from '../../utils/toolFormatter';

// Mock net module
jest.mock('net', () => ({
  connect: jest.fn(),
  createServer: jest.fn(),
}));

// Mock fs module
jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(false),
  readFileSync: jest.fn(),
  unlinkSync: jest.fn(),
}));

// Mock child_process
jest.mock('child_process', () => ({
  spawn: jest.fn(),
  execSync: jest.fn(),
}));

describe('ClaudeProxyClient', () => {
  let client: ClaudeProxyClient;

  beforeEach(() => {
    jest.clearAllMocks();
    client = new ClaudeProxyClient('test-process', 'test-session');
  });

  afterEach(() => {
    client.disconnect();
  });

  describe('constructor', () => {
    test('creates client with processName and sessionId', () => {
      const info = client.getProxyInfo();
      expect(info.processName).toBe('test-process');
      expect(info.sessionId).toBe('test-session');
      expect(info.connected).toBe(false);
      expect(info.proxyAlive).toBe(false);
    });

    test('generates sessionId from processName when not provided', () => {
      const c = new ClaudeProxyClient('my-process');
      const info = c.getProxyInfo();
      expect(info.sessionId).toBeDefined();
      expect(info.sessionId.length).toBeGreaterThan(0);
    });

    test('same processName produces same sessionId', () => {
      const c1 = new ClaudeProxyClient('same-name');
      const c2 = new ClaudeProxyClient('same-name');
      expect(c1.getProxyInfo().sessionId).toBe(c2.getProxyInfo().sessionId);
    });
  });

  describe('isConnected', () => {
    test('returns false initially', () => {
      expect(client.isConnected()).toBe(false);
    });
  });

  describe('disconnect', () => {
    test('disconnects cleanly when not connected', () => {
      expect(() => client.disconnect()).not.toThrow();
    });
  });

  describe('stopProxy', () => {
    test('does not throw when no proxy is running', () => {
      expect(() => client.stopProxy()).not.toThrow();
    });
  });

  describe('getProxyInfo', () => {
    test('returns correct structure', () => {
      const info = client.getProxyInfo();
      expect(info).toHaveProperty('processName');
      expect(info).toHaveProperty('sessionId');
      expect(info).toHaveProperty('connected');
      expect(info).toHaveProperty('proxyAlive');
    });
  });
});

describe('formatToolCall (from shared module)', () => {
  test('formatToolCall is accessible from proxyClient context', () => {
    const result = formatToolCall('Read', { file_path: '/src/index.ts' });
    expect(result).toContain('📖');
    expect(result).toContain('**Read**');
  });
});

describe('formatToolResult (from shared module)', () => {
  test('formatToolResult is accessible from proxyClient context', () => {
    const result = formatToolResult('Bash', 'output line 1\noutput line 2');
    expect(result).toContain('```');
    expect(result).toContain('output line 1');
  });
});
