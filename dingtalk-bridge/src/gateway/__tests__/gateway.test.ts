/**
 * Gateway Server 单元测试
 */
import { GatewayServer, GatewayDeps } from '../index';
import { DingtalkService } from '../../dingtalk/dingtalk';

// Mock dependencies
jest.mock('../../dingtalk/dingtalk');
jest.mock('../../session-manager');
jest.mock('../../message-queue/messageQueue');
jest.mock('../../message-queue/rateLimiter');
jest.mock('../../message-queue/concurrencyController');
jest.mock('../../utils/dedupCache');
jest.mock('../../opencode');
jest.mock('../../dingtalk/streamingCard');
jest.mock('../../hooks/hookRunner', () => ({
  hookRunner: { trigger: jest.fn(), register: jest.fn(), list: jest.fn().mockReturnValue([]) },
}));
jest.mock('../../agents', () => ({
  agentRegistry: {
    list: jest.fn().mockReturnValue([]),
    getDefaultName: jest.fn().mockReturnValue('opencode'),
  },
}));
jest.mock('../../claude');

// Mock config
jest.mock('../../config', () => ({
  config: {
    aiProvider: 'opencode',
    dingtalk: {
      appKey: 'test-key',
      appSecret: 'test-secret',
    },
    gateway: {
      port: 3000,
      host: '0.0.0.0',
      apiToken: undefined,
    },
    ai: {
      command: 'opencode',
      timeout: 120000,
      maxRetries: 3,
      retryBaseDelay: 1000,
      retryMaxDelay: 10000,
      workingDir: process.cwd(),
      model: '',
      maxInputLength: 10000,
    },
    claude: {
      command: 'claude',
      timeout: 120000,
      maxRetries: 3,
      retryBaseDelay: 1000,
      retryMaxDelay: 10000,
      workingDir: process.cwd(),
      model: '',
      maxInputLength: 10000,
    },
    session: {
      ttl: 1800000,
      maxHistoryMessages: 50,
    },
    messageQueue: {
      maxConcurrentPerUser: 3,
      maxConcurrentGlobal: 10,
      rateLimitMaxTokens: 10,
    },
    stream: {
      enabled: true,
      maxReconnectAttempts: 10,
      reconnectBaseDelay: 1000,
      reconnectMaxDelay: 60000,
    },
    streaming: {
      enabled: false,
      intervalMs: 1500,
      minDeltaChars: 30,
      maxChars: 2000,
      thinkingText: '⏳ AI 正在思考...',
    },
    persistentSession: {
      enabled: false,
      poolSize: 5,
      idleTimeout: 300000,
    },
  },
  validateConfig: jest.fn(),
}));

describe('GatewayServer', () => {
  let gateway: GatewayServer;
  let mockDeps: GatewayDeps;
  let mockDingtalkService: jest.Mocked<DingtalkService>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock services
    mockDingtalkService = {
      getAccessToken: jest.fn().mockResolvedValue('mock-token'),
      sendTextMessage: jest.fn().mockResolvedValue(true),
      sendMarkdownMessage: jest.fn().mockResolvedValue(true),
    } as any;

    const mockSessionManager = {
      getOrCreateSession: jest.fn().mockResolvedValue({
        conversationId: 'test-conv-id',
        userId: 'test-user',
        state: 'active',
      }),
      addMessage: jest.fn().mockResolvedValue(undefined),
      getHistory: jest.fn().mockResolvedValue([]),
      getStats: jest.fn().mockResolvedValue({ total: 0, active: 0 }),
      stopCleanupService: jest.fn(),
    } as any;

    const mockMessageQueue = {
      enqueue: jest.fn(),
      dequeue: jest.fn().mockReturnValue(null),
      batchDequeue: jest.fn().mockReturnValue([]),
      complete: jest.fn(),
      fail: jest.fn(),
      getStatus: jest
        .fn()
        .mockReturnValue({ queued: 0, processing: 0, byPriority: { high: 0, normal: 0, low: 0 } }),
    } as any;

    const mockRateLimiter = {
      checkRateLimit: jest.fn().mockReturnValue({ allowed: true, remaining: 10 }),
      consumeToken: jest.fn(),
      getMaxTokens: jest.fn().mockReturnValue(10),
      getUserCount: jest.fn().mockReturnValue(0),
    } as any;

    const mockConcurrencyController = {
      acquireSlot: jest.fn().mockResolvedValue(undefined),
      releaseSlot: jest.fn(),
      getMaxSlotsPerUser: jest.fn().mockReturnValue(3),
      getMaxGlobalSlots: jest.fn().mockReturnValue(10),
      getAvailableSlots: jest.fn().mockReturnValue(3),
      getAvailableGlobalSlots: jest.fn().mockReturnValue(10),
    } as any;

    const mockDeduplicator = {
      isDuplicate: jest.fn().mockReturnValue(false),
      record: jest.fn(),
    } as any;

    const mockOpenCodeExecutor = {
      execute: jest.fn().mockResolvedValue({
        success: true,
        output: 'Test AI response',
        executionTime: 100,
        exitCode: 0,
      }),
      isAvailable: jest.fn().mockResolvedValue(true),
    } as any;

    mockDeps = {
      sessionManager: mockSessionManager,
      messageQueue: mockMessageQueue,
      rateLimiter: mockRateLimiter,
      concurrencyController: mockConcurrencyController,
      deduplicator: mockDeduplicator,
      openCodeExecutor: mockOpenCodeExecutor,
    };
  });

  afterEach(async () => {
    if (gateway) {
      await gateway.stop();
    }
    jest.useRealTimers();
  });

  describe('processMessage', () => {
    it('should reject empty message', async () => {
      gateway = new GatewayServer(mockDingtalkService, mockDeps);

      const result = await gateway.processMessage({
        msg: '',
        userId: 'test-user',
        userName: 'Test User',
      });

      expect(result.success).toBe(false);
      expect(result.message).toMatch(/empty|空/i);
    });

    it('should reject duplicate message', async () => {
      (mockDeps.deduplicator.isDuplicate as jest.Mock).mockReturnValue(true);
      gateway = new GatewayServer(mockDingtalkService, mockDeps);

      const result = await gateway.processMessage({
        msg: 'Hello',
        userId: 'test-user',
        userName: 'Test User',
      });

      expect(result.success).toBe(false);
      expect(result.message).toMatch(/duplicate|重复/i);
    });

    it('should reject when rate limit exceeded', async () => {
      (mockDeps.rateLimiter.checkRateLimit as jest.Mock).mockReturnValue({
        allowed: false,
        remaining: 0,
      });
      gateway = new GatewayServer(mockDingtalkService, mockDeps);

      const result = await gateway.processMessage({
        msg: 'Hello',
        userId: 'test-user',
        userName: 'Test User',
      });

      expect(result.success).toBe(false);
      expect(result.message).toMatch(/频繁|rate/i);
    });

    it('should process message successfully', async () => {
      gateway = new GatewayServer(mockDingtalkService, mockDeps);

      const result = await gateway.processMessage({
        msg: 'Hello AI',
        userId: 'test-user',
        userName: 'Test User',
      });

      expect(result.success).toBe(true);
      expect(result.data?.result).toContain('Test AI response');
      expect(result.data?.conversationId).toBe('test-conv-id');
    });

    it('should handle AI executor error', async () => {
      (mockDeps.openCodeExecutor!.execute as jest.Mock).mockResolvedValue({
        success: false,
        output: '',
        error: 'AI processing failed',
        executionTime: 100,
        exitCode: 1,
      });
      gateway = new GatewayServer(mockDingtalkService, mockDeps);

      const result = await gateway.processMessage({
        msg: 'Hello AI',
        userId: 'test-user',
        userName: 'Test User',
      });

      expect(result.success).toBe(false);
    });
  });
});
