/**
 * StreamingCardManager 单元测试
 */

import { StreamingCardManager } from '../streamingCard';

// Mock axios
jest.mock('axios', () => ({
  post: jest.fn().mockResolvedValue({ data: {} }),
}));

// Mock AICardService
jest.mock('../aiCardService', () => ({
  AICardService: jest.fn().mockImplementation(() => ({
    createCard: jest.fn(),
    streamUpdate: jest.fn(),
    finish: jest.fn(),
  })),
}));

// Mock config
jest.mock('../../config', () => ({
  config: {
    streaming: {
      enabled: true,
      intervalMs: 1500,
      minDeltaChars: 30,
      maxChars: 2000,
      thinkingText: '思考中...',
      cardTemplateId: '82632605-8031-4963-8a92-d25e2ca8aad7.schema',
    },
  },
}));

const mockAICardInstance = {
  cardInstanceId: 'test-card-id',
  accessToken: 'test-token',
  tokenExpireTime: Date.now() + 7200000,
  inputingStarted: false,
  conversationId: 'test-conversation-id',
  senderType: 'group' as const,
  userId: 'test-user-id',
};

describe('StreamingCardManager', () => {
  let manager: StreamingCardManager;
  let mockCardService: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // 创建 mock card service
    mockCardService = {
      createCard: jest.fn(),
      streamUpdate: jest.fn(),
      finish: jest.fn(),
    };

    manager = new StreamingCardManager();
    (manager as any).cardService = mockCardService;
  });

  afterEach(() => {
    manager.destroy();
  });

  describe('startStream', () => {
    it('成功创建流式句柄（AI Card 模式）', async () => {
      mockCardService.createCard.mockResolvedValue(mockAICardInstance);

      const handle = await manager.startStream(
        'test-conversation-id',
        'https://test.webhook.com',
        'group',
        undefined,
        undefined,
        'test-user-id'
      );

      expect(handle).toBeDefined();
      expect(handle.outTrackId).toMatch(/^stream-/);
      expect(handle.isDegraded()).toBe(false);
      expect(mockCardService.createCard).toHaveBeenCalledWith(
        'test-conversation-id',
        'group',
        'test-user-id'
      );
    });

    it('AI Card 创建失败时降级', async () => {
      mockCardService.createCard.mockResolvedValue(null);

      const handle = await manager.startStream(
        'test-conversation-id',
        'https://test.webhook.com',
        'group'
      );

      expect(handle).toBeDefined();
      expect(handle.isDegraded()).toBe(true);
    });

    it('流式未启用时降级', async () => {
      const disabledManager = new StreamingCardManager({ enabled: false });
      (disabledManager as any).cardService = mockCardService;

      const handle = await disabledManager.startStream(
        'test-conversation-id',
        'https://test.webhook.com'
      );

      expect(handle.isDegraded()).toBe(true);
      disabledManager.destroy();
    });
  });

  describe('StreamCardHandle', () => {
    it('追加文本块', async () => {
      mockCardService.createCard.mockResolvedValue(mockAICardInstance);

      const handle = await manager.startStream('test-conversation-id', 'https://test.webhook.com');

      handle.appendChunk('Hello ');
      handle.appendChunk('World');

      expect(handle.getFullText()).toBe('Hello World');
    });

    it('完成流式（AI Card 成功）', async () => {
      mockCardService.createCard.mockResolvedValue(mockAICardInstance);
      mockCardService.finish.mockResolvedValue();

      const handle = await manager.startStream('test-conversation-id', 'https://test.webhook.com');

      handle.appendChunk('测试内容');
      await handle.finish('最终内容');

      expect(mockCardService.finish).toHaveBeenCalledWith(
        expect.objectContaining({ cardInstanceId: 'test-card-id' }),
        '最终内容'
      );
    });

    it('完成流式（AI Card 失败，降级）', async () => {
      mockCardService.createCard.mockResolvedValue(mockAICardInstance);
      mockCardService.finish.mockRejectedValue(new Error('Finish failed'));

      const sendMarkdownFn = jest.fn().mockResolvedValue(true);

      const handle = await manager.startStream(
        'test-conversation-id',
        'https://test.webhook.com',
        'group',
        sendMarkdownFn
      );

      handle.appendChunk('测试内容');
      await handle.finish('最终内容');

      expect(sendMarkdownFn).toHaveBeenCalled();
    });

    it('重复完成应该被忽略', async () => {
      mockCardService.createCard.mockResolvedValue(mockAICardInstance);
      mockCardService.finish.mockResolvedValue();

      const handle = await manager.startStream('test-conversation-id', 'https://test.webhook.com');

      await handle.finish('第一次');
      await handle.finish('第二次');

      expect(mockCardService.finish).toHaveBeenCalledTimes(1);
    });
  });

  describe('sendFallback', () => {
    it('使用 sendMarkdownFn 发送降级消息', async () => {
      mockCardService.createCard.mockResolvedValue(null);

      const sendMarkdownFn = jest.fn().mockResolvedValue(true);
      const sendTextFn = jest.fn();

      const handle = await manager.startStream(
        'test-conversation-id',
        'https://test.webhook.com',
        'group',
        sendMarkdownFn,
        sendTextFn
      );

      handle.appendChunk('降级内容');
      await handle.finish();

      expect(sendMarkdownFn).toHaveBeenCalledWith('test-conversation-id', 'AI 回复', '降级内容');
    });

    it('sendMarkdownFn 失败时使用兜底', async () => {
      const axios = require('axios');
      axios.post.mockRejectedValueOnce(new Error('Webhook failed'));

      mockCardService.createCard.mockResolvedValue(null);

      const sendMarkdownFn = jest.fn().mockRejectedValue(new Error('Failed'));
      const sendTextFn = jest.fn().mockResolvedValue(true);

      const handle = await manager.startStream(
        'test-conversation-id',
        'https://test.webhook.com',
        'group',
        sendMarkdownFn,
        sendTextFn
      );

      handle.appendChunk('降级内容');
      await handle.finish();

      expect(sendTextFn).toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    it('清理所有活跃流', async () => {
      mockCardService.createCard.mockResolvedValue(mockAICardInstance);

      await manager.startStream('conv-1', 'webhook-1');
      await manager.startStream('conv-2', 'webhook-2');

      expect(manager.getActiveStreamCount()).toBe(2);

      manager.cleanup();

      expect(manager.getActiveStreamCount()).toBe(0);
    });
  });
});
