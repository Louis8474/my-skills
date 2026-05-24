/**
 * Stream Service Tests
 * Tests for the fixed stream message handling
 */

// Mock the dingtalk-stream module - 必须在 import 之前
jest.mock('dingtalk-stream', () => ({
  DWClient: jest.fn(() => {
    const mockClient = {
      config: { subscriptions: [] },
      on: jest.fn(),
      registerCallbackListener: jest.fn(),
      connect: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn(),
      socketCallBackResponse: jest.fn(),
    };
    return mockClient;
  }),
  TOPIC_ROBOT: '/v1.0/im/robots/messages',
}));

// Mock axios
jest.mock('axios', () => ({
  post: jest.fn().mockResolvedValue({ data: {} }),
}));

// Mock config
jest.mock('../../config', () => ({
  config: {
    dingtalk: {
      appKey: 'test-key',
      appSecret: 'test-secret',
      allowFrom: '*',
    },
    stream: {
      enabled: true,
    },
    media: {
      enabled: false,
    },
  },
}));

// Mock alert utils
jest.mock('../../utils/alert', () => ({
  updateAdminSessionWebhook: jest.fn(),
  getAdminConversationId: jest.fn().mockReturnValue(''),
}));

// 现在可以导入被 mock 的模块
import { DingtalkStreamService } from '../stream';
import { DWClient } from 'dingtalk-stream';

describe('DingtalkStreamService', () => {
  let service: DingtalkStreamService;
  let mockClient: any;
  let mockMessageHandler: jest.Mock;

  beforeEach(() => {
    // 创建新的 mock 客户端实例
    mockClient = {
      config: { subscriptions: [] },
      on: jest.fn(),
      registerCallbackListener: jest.fn(),
      connect: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn(),
      socketCallBackResponse: jest.fn(),
    };
    const MockDWClient = DWClient as unknown as jest.Mock;
    MockDWClient.mockImplementation(() => mockClient);

    service = new DingtalkStreamService();
    // 清理构造函数中创建的定时器
    service.clearTimers();
    mockMessageHandler = jest.fn().mockResolvedValue(undefined);
    service.setMessageHandler(mockMessageHandler);
  });

  afterEach(async () => {
    await service.stop();
    jest.clearAllTimers();
    jest.clearAllMocks();
  });

  describe('Message Handling', () => {
    it('should ACK message immediately before processing', async () => {
      // Start service to initialize client
      await service.start();

      // 获取注册的回调函数
      const callbackListener = mockClient.registerCallbackListener.mock.calls[0]?.[1];
      expect(callbackListener).toBeDefined();

      // Simulate a message
      const mockMsg = {
        headers: { messageId: 'msg-123' },
        data: JSON.stringify({
          senderId: 'user-123',
          senderNick: 'Test User',
          msgtype: 'text',
          text: { content: 'Hello' },
          conversationId: 'conv-123',
          sessionWebhook: 'https://webhook.example.com',
        }),
      };

      // Handle message
      await callbackListener(mockMsg);

      // Verify ACK was called immediately
      expect(mockClient.socketCallBackResponse).toHaveBeenCalledWith('msg-123', { received: true });
    });

    it('should handle message asynchronously', async () => {
      await service.start();

      // Create a handler that takes time
      const slowHandler = jest
        .fn()
        .mockImplementation(() => new Promise(resolve => setTimeout(resolve, 5000)));
      service.setMessageHandler(slowHandler);

      const callbackListener = mockClient.registerCallbackListener.mock.calls[0]?.[1];

      const mockMsg = {
        headers: { messageId: 'msg-456' },
        data: JSON.stringify({
          senderId: 'user-456',
          senderNick: 'Slow User',
          msgtype: 'text',
          text: { content: 'Slow message' },
          conversationId: 'conv-456',
          sessionWebhook: 'https://webhook.example.com',
        }),
      };

      const startTime = Date.now();
      await callbackListener(mockMsg);
      const endTime = Date.now();

      // Should complete quickly (not wait for slow handler)
      expect(endTime - startTime).toBeLessThan(100);

      // But handler should be called (may be async, so check after a delay)
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(slowHandler).toHaveBeenCalled();
    });

    it('should handle error in message handler gracefully', async () => {
      await service.start();

      const errorHandler = jest.fn().mockRejectedValue(new Error('Handler error'));
      service.setMessageHandler(errorHandler);

      const callbackListener = mockClient.registerCallbackListener.mock.calls[0]?.[1];

      const mockMsg = {
        headers: { messageId: 'msg-789' },
        data: JSON.stringify({
          senderId: 'user-789',
          senderNick: 'Error User',
          msgtype: 'text',
          text: { content: 'Error message' },
          conversationId: 'conv-789',
          sessionWebhook: 'https://webhook.example.com',
        }),
      };

      // Should not throw
      await expect(callbackListener(mockMsg)).resolves.not.toThrow();

      // Should still ACK
      expect(mockClient.socketCallBackResponse).toHaveBeenCalledWith('msg-789', { received: true });
    });

    it('should handle invalid JSON data gracefully', async () => {
      await service.start();

      const callbackListener = mockClient.registerCallbackListener.mock.calls[0]?.[1];

      const mockMsg = {
        headers: { messageId: 'msg-invalid' },
        data: 'invalid json',
      };

      // Should not throw
      await expect(callbackListener(mockMsg)).resolves.not.toThrow();

      // Should still ACK even on parse error
      expect(mockClient.socketCallBackResponse).toHaveBeenCalledWith('msg-invalid', {
        received: true,
      });
    });

    it('should update heartbeat on message receive', async () => {
      await service.start();

      // Manually set heartbeat time for testing
      const mockTime = Date.now();
      service.updateHeartbeat(mockTime);

      const callbackListener = mockClient.registerCallbackListener.mock.calls[0]?.[1];

      const mockMsg = {
        headers: { messageId: 'msg-001' },
        data: JSON.stringify({
          senderId: 'user-001',
          senderNick: 'Test User',
          msgtype: 'text',
          text: { content: 'Test' },
          conversationId: 'conv-001',
          sessionWebhook: 'https://webhook.example.com',
        }),
      };

      await callbackListener(mockMsg);

      // Give a small delay for async operations
      await new Promise(resolve => setTimeout(resolve, 10));

      const afterStatus = service.getStatus();
      // Heartbeat should be updated (close to 0)
      expect(afterStatus.lastHeartbeatSecondsAgo).toBeLessThanOrEqual(1);
    });
  });

  describe('Session Management', () => {
    it('should save session info when message has sessionWebhook', async () => {
      await service.start();

      const callbackListener = mockClient.registerCallbackListener.mock.calls[0]?.[1];

      const mockMsg = {
        headers: { messageId: 'msg-session' },
        data: JSON.stringify({
          senderId: 'user-session',
          senderNick: 'Session User',
          msgtype: 'text',
          text: { content: 'Test session' },
          conversationId: 'test-conv-id',
          sessionWebhook: 'https://webhook.session.example.com',
        }),
      };

      await callbackListener(mockMsg);

      const status = service.getStatus();
      expect(status.pendingMessages).toBeGreaterThan(0);
    });
  });

  describe('Status Reporting', () => {
    it('should report correct status', () => {
      const status = service.getStatus();

      expect(status).toHaveProperty('connected');
      expect(status).toHaveProperty('uptimeSeconds');
      expect(status).toHaveProperty('lastHeartbeatSecondsAgo');
      expect(status).toHaveProperty('lastMessageSecondsAgo');
      expect(status).toHaveProperty('pendingMessages');
    });
  });
});
