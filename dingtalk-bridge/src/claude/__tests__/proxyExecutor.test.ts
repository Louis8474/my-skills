/**
 * proxyExecutor.ts 测试
 *
 * 测试会话管理、LRU 淘汰、会话清理等核心功能
 */

// Mock ClaudeProxyClient
const mockConnect = jest.fn().mockResolvedValue(true);
const mockDisconnect = jest.fn();
const mockStopProxy = jest.fn();
const mockIsConnected = jest.fn().mockReturnValue(true);
const mockSendMessage = jest.fn().mockImplementation(async (options: any) => {
  if (options.onChunk) {
    await options.onChunk('test response');
  }
  if (options.onComplete) {
    await options.onComplete();
  }
});
const mockGetProxyInfo = jest.fn().mockReturnValue({
  processName: 'test',
  sessionId: 'test-session',
  connected: true,
  proxyAlive: true,
});

jest.mock('../proxyClient', () => ({
  ClaudeProxyClient: jest.fn().mockImplementation(() => ({
    connect: mockConnect,
    disconnect: mockDisconnect,
    stopProxy: mockStopProxy,
    isConnected: mockIsConnected,
    sendMessage: mockSendMessage,
    getProxyInfo: mockGetProxyInfo,
  })),
}));

// Mock fs
jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(false),
  readdirSync: jest.fn().mockReturnValue([]),
  unlinkSync: jest.fn(),
}));

// Mock config
jest.mock('../../config', () => ({
  config: {
    aiProvider: 'claude',
    session: { ttl: 1800000, maxHistoryMessages: 50 },
  },
}));

// Mock logger
jest.mock('../../utils/logger', () => ({
  createSafeLogger: jest.fn().mockReturnValue({
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }),
}));

import { ProxyExecutor } from '../proxyExecutor';

// Get the mocked constructor
const MockedClaudeProxyClient = jest.requireMock('../proxyClient').ClaudeProxyClient as jest.Mock;

describe('ProxyExecutor', () => {
  let executor: ProxyExecutor;

  beforeEach(() => {
    // Reset mock implementations (not clearAllMocks which resets the class mock)
    mockConnect.mockReset();
    mockDisconnect.mockReset();
    mockStopProxy.mockReset();
    mockIsConnected.mockReset();
    mockSendMessage.mockReset();
    mockGetProxyInfo.mockReset();

    // Re-setup mock return values
    mockConnect.mockResolvedValue(true);
    mockIsConnected.mockReturnValue(true);
    mockSendMessage.mockImplementation(async (options: any) => {
      if (options.onChunk) {
        await options.onChunk('test response');
      }
      if (options.onComplete) {
        await options.onComplete();
      }
    });
    mockGetProxyInfo.mockReturnValue({
      processName: 'test',
      sessionId: 'test-session',
      connected: true,
      proxyAlive: true,
    });

    // Re-setup the class mock implementation
    MockedClaudeProxyClient.mockImplementation(
      () =>
        ({
          connect: mockConnect,
          disconnect: mockDisconnect,
          stopProxy: mockStopProxy,
          isConnected: mockIsConnected,
          sendMessage: mockSendMessage,
          getProxyInfo: mockGetProxyInfo,
        }) as any
    );

    executor = new ProxyExecutor({
      baseProcessName: 'test-bridge',
    });
  });

  afterEach(() => {
    executor.destroy();
  });

  describe('constructor', () => {
    test('creates executor with default config', () => {
      expect(executor.getActiveSessionCount()).toBe(0);
    });
  });

  describe('executeStream', () => {
    test('creates session and executes message', async () => {
      const result = await executor.executeStream('conv-1', [{ role: 'user', content: 'Hello' }]);

      expect(result.success).toBe(true);
      expect(result.executionTime).toBeGreaterThanOrEqual(0);
      expect(executor.getActiveSessionCount()).toBe(1);
    });

    test('reuses existing session for same conversation', async () => {
      await executor.executeStream('conv-1', [{ role: 'user', content: 'Hello' }]);
      await executor.executeStream('conv-1', [{ role: 'user', content: 'World' }]);

      expect(executor.getActiveSessionCount()).toBe(1);
    });

    test('creates separate sessions for different conversations', async () => {
      await executor.executeStream('conv-1', [{ role: 'user', content: 'Hello' }]);
      await executor.executeStream('conv-2', [{ role: 'user', content: 'World' }]);

      expect(executor.getActiveSessionCount()).toBe(2);
    });

    test('supports onChunk callback', async () => {
      const chunks: string[] = [];
      const result = await executor.executeStream(
        'conv-chunk',
        [{ role: 'user', content: 'test' }],
        {
          onChunk: async chunk => {
            chunks.push(chunk);
          },
        }
      );

      expect(result.success).toBe(true);
      expect(chunks.length).toBeGreaterThan(0);
    });

    test('supports onComplete callback', async () => {
      let completeOutput = '';
      await executor.executeStream('conv-complete', [{ role: 'user', content: 'test' }], {
        onComplete: async output => {
          completeOutput = output;
        },
      });

      expect(completeOutput).toBeTruthy();
    });

    test('returns error when connect fails', async () => {
      mockConnect.mockResolvedValueOnce(false);

      const failExecutor = new ProxyExecutor({ baseProcessName: 'fail-bridge' });
      const result = await failExecutor.executeStream('conv-fail', [
        { role: 'user', content: 'test' },
      ]);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      failExecutor.destroy();
    });
  });

  describe('resetSession', () => {
    test('resets an existing session', async () => {
      await executor.executeStream('conv-reset', [{ role: 'user', content: 'Hello' }]);
      expect(executor.getActiveSessionCount()).toBe(1);

      await executor.resetSession('conv-reset');
      expect(executor.getActiveSessionCount()).toBe(0);
    });

    test('does nothing for non-existent session', () => {
      expect(() => executor.resetSession('non-existent')).not.toThrow();
    });
  });

  describe('destroy', () => {
    test('destroys executor and clears sessions', async () => {
      await executor.executeStream('conv-1', [{ role: 'user', content: 'a' }]);
      await executor.executeStream('conv-2', [{ role: 'user', content: 'b' }]);
      expect(executor.getActiveSessionCount()).toBe(2);

      executor.destroy();
      expect(executor.getActiveSessionCount()).toBe(0);
    });
  });

  describe('session limits', () => {
    test('evicts LRU session when limit is reached', async () => {
      // Create 10 sessions (max concurrent)
      for (let i = 0; i < 10; i++) {
        await executor.executeStream(`conv-${i}`, [{ role: 'user', content: `msg-${i}` }]);
      }
      expect(executor.getActiveSessionCount()).toBe(10);

      // One more should trigger eviction
      await executor.executeStream('conv-extra', [{ role: 'user', content: 'extra' }]);
      expect(executor.getActiveSessionCount()).toBe(10);
    });
  });
});
