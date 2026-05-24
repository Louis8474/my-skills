/**
 * 队列消费者测试
 */
import { QueueConsumer, createQueueConsumer } from '../queueConsumer';

describe('QueueConsumer', () => {
  let mockQueue: any;
  let mockRateLimiter: any;
  let mockConcurrencyController: any;
  let mockDeduplicator: any;
  let mockSessionManager: any;
  let mockOpenCodeExecutor: any;
  let mockClaudeCodeExecutor: any;
  let consumer: QueueConsumer;

  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});

    mockQueue = {
      batchDequeue: jest.fn().mockReturnValue([]),
      complete: jest.fn(),
      fail: jest.fn(),
    };
    mockRateLimiter = {
      checkRateLimit: jest.fn().mockReturnValue({ allowed: true, remaining: 9 }),
      consumeToken: jest.fn(),
    };
    mockConcurrencyController = {
      acquireSlot: jest.fn().mockResolvedValue(undefined),
      releaseSlot: jest.fn(),
    };
    mockDeduplicator = {
      isDuplicate: jest.fn().mockReturnValue(false),
      record: jest.fn(),
    };
    mockSessionManager = {
      getOrCreateSession: jest.fn(),
      addMessage: jest.fn(),
    };
    mockOpenCodeExecutor = { execute: jest.fn() };
    mockClaudeCodeExecutor = { execute: jest.fn() };

    consumer = new QueueConsumer(
      mockQueue,
      mockRateLimiter,
      mockConcurrencyController,
      mockDeduplicator,
      mockSessionManager,
      mockOpenCodeExecutor,
      mockClaudeCodeExecutor
    );
  });

  afterEach(() => {
    consumer.stop();
    jest.restoreAllMocks();
  });

  describe('start / stop', () => {
    it('should set isRunning to true on start', () => {
      consumer.start();
      const status = consumer.getStatus();
      expect(status.isRunning).toBe(true);
    });

    it('should log when already running', () => {
      consumer.start();
      consumer.start();
      // No error thrown
    });

    it('should set isRunning to false on stop', () => {
      consumer.start();
      consumer.stop();
      expect(consumer.getStatus().isRunning).toBe(false);
    });
  });

  describe('getStatus', () => {
    it('should return default poll config', () => {
      const status = consumer.getStatus();
      expect(status.batchSize).toBe(5);
      expect(status.pollInterval).toBeGreaterThan(0);
    });
  });

  describe('setMessageHandler', () => {
    it('should allow setting a custom message handler', () => {
      const handler = jest.fn();
      expect(() => consumer.setMessageHandler(handler)).not.toThrow();
    });
  });

  describe('createQueueConsumer', () => {
    it('should create a QueueConsumer instance', () => {
      const qc = createQueueConsumer(
        mockQueue,
        mockRateLimiter,
        mockConcurrencyController,
        mockDeduplicator,
        mockSessionManager,
        mockOpenCodeExecutor,
        mockClaudeCodeExecutor
      );
      expect(qc).toBeInstanceOf(QueueConsumer);
      qc.stop();
    });

    it('should accept custom config', () => {
      const qc = createQueueConsumer(
        mockQueue,
        mockRateLimiter,
        mockConcurrencyController,
        mockDeduplicator,
        mockSessionManager,
        mockOpenCodeExecutor,
        mockClaudeCodeExecutor,
        { pollInterval: 200, batchSize: 3 }
      );
      const status = qc.getStatus();
      expect(status.pollInterval).toBe(200);
      expect(status.batchSize).toBe(3);
      qc.stop();
    });
  });
});
