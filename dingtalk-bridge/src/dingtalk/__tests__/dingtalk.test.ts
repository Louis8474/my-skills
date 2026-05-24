/**
 * 钉钉 Channel 实现测试
 */
import type { DingtalkService } from '../dingtalk';

jest.mock('../../config', () => ({
  config: {
    dingtalk: { appKey: 'key123', appSecret: 'secret123' },
  },
}));

const mockGet = jest.fn();
const mockPost = jest.fn();
const mockHttpClient = { get: mockGet, post: mockPost };

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    create: () => mockHttpClient,
  },
}));

const { DingtalkService: DsConstructor } = require('../dingtalk');

describe('DingtalkService', () => {
  let service: DingtalkService;

  beforeEach(() => {
    mockGet.mockReset();
    mockPost.mockReset();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    service = new DsConstructor();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('validateConfig', () => {
    it('should not throw when config is complete', () => {
      expect(() => service.validateConfig()).not.toThrow();
    });
  });

  describe('parseUserIdentity', () => {
    it('should parse senderId and senderNick', () => {
      const { userId, userName } = service.parseUserIdentity({
        senderId: 'user123',
        senderNick: 'Test User',
        msgType: 'text',
        createTime: Date.now(),
      });
      expect(userId).toBe('user123');
      expect(userName).toBe('Test User');
    });

    it('should return defaults for missing fields', () => {
      const { userId, userName } = service.parseUserIdentity({
        msgType: 'text',
        createTime: Date.now(),
      });
      expect(userId).toBe('unknown');
      expect(userName).toBe('未知用户');
    });
  });

  describe('getAccessToken', () => {
    it('should fetch token from API and cache it', async () => {
      mockGet.mockResolvedValueOnce({
        data: { errcode: 0, errmsg: 'ok', access_token: 'token-abc', expire: 7200 },
      });

      const token = await service.getAccessToken();
      expect(token).toBe('token-abc');
      expect(mockGet).toHaveBeenCalledWith('/gettoken', expect.any(Object));
    });

    it('should return cached token on second call', async () => {
      mockGet.mockResolvedValueOnce({
        data: { errcode: 0, errmsg: 'ok', access_token: 'token-abc', expire: 7200 },
      });

      await service.getAccessToken();
      const token2 = await service.getAccessToken();
      expect(token2).toBe('token-abc');
      expect(mockGet).toHaveBeenCalledTimes(1);
    });

    it('should throw when errcode is not 0', async () => {
      mockGet.mockResolvedValueOnce({
        data: { errcode: 40001, errmsg: 'invalid appkey' },
      });

      await expect(service.getAccessToken()).rejects.toThrow('获取 access_token 失败');
    });

    it('should throw on network error', async () => {
      mockGet.mockRejectedValueOnce(new Error('Network Error'));

      await expect(service.getAccessToken()).rejects.toThrow('获取 access_token 异常');
    });
  });

  describe('sendMarkdownMessage', () => {
    it('should post markdown message to robot API', async () => {
      mockPost.mockResolvedValueOnce({ data: {} });

      await service.sendMarkdownMessage('token1', 'Title', '**bold**');
      expect(mockPost).toHaveBeenCalledWith('/robot/send', {
        msgtype: 'markdown',
        markdown: { title: 'Title', text: '**bold**' },
        access_token: 'token1',
      });
    });
  });

  describe('sendTextMessage', () => {
    it('should post text message with at options', async () => {
      mockPost.mockResolvedValueOnce({ data: {} });

      await service.sendTextMessage('token1', 'hello world', ['user1']);
      expect(mockPost).toHaveBeenCalledWith(
        '/robot/send',
        expect.objectContaining({
          msgtype: 'text',
          text: { content: 'hello world' },
          at: { atUserIds: ['user1'], isAtAll: false },
        })
      );
    });

    it('should default mentionList to empty array', async () => {
      mockPost.mockResolvedValueOnce({ data: {} });

      await service.sendTextMessage('token1', 'hello');
      expect(mockPost).toHaveBeenCalledWith(
        '/robot/send',
        expect.objectContaining({
          at: { atUserIds: [], isAtAll: false },
        })
      );
    });
  });

  describe('fetchGroupMessages', () => {
    it('should return empty array when no timestamp is provided', async () => {
      // getAccessToken needs a mock response
      mockGet.mockResolvedValueOnce({
        data: { errcode: 0, errmsg: 'ok', access_token: 'token123', expire: 7200 },
      });
      const messages = await service.fetchGroupMessages(undefined, 20);
      expect(messages).toEqual([]);
    });

    it('should fetch messages with timestamp filter', async () => {
      mockGet
        .mockResolvedValueOnce({
          data: { errcode: 0, errmsg: 'ok', access_token: 'token123', expire: 7200 },
        })
        .mockResolvedValueOnce({
          data: {
            errcode: 0,
            result: {
              messages: [
                {
                  msgUid: 'm1',
                  conversationId: 'c1',
                  senderId: 's1',
                  senderNick: 'User1',
                  content: 'text',
                  msgType: 'text',
                  createTime: 1000,
                },
              ],
            },
          },
        });

      const messages = await service.fetchGroupMessages(500, 10);
      expect(messages).toHaveLength(1);
      expect(messages[0].senderNick).toBe('User1');
    });

    it('should return empty when errcode is not 0', async () => {
      mockGet
        .mockResolvedValueOnce({
          data: { errcode: 0, errmsg: 'ok', access_token: 'token123', expire: 7200 },
        })
        .mockResolvedValueOnce({
          data: { errcode: 40001, errmsg: 'invalid', result: {} },
        });

      const messages = await service.fetchGroupMessages(500, 10);
      expect(messages).toEqual([]);
    });

    it('should re-throw error on fetch failure', async () => {
      mockGet
        .mockResolvedValueOnce({
          data: { errcode: 0, errmsg: 'ok', access_token: 'token123', expire: 7200 },
        })
        .mockRejectedValueOnce(new Error('timeout'));

      await expect(service.fetchGroupMessages(500, 10)).rejects.toThrow('timeout');
    });
  });
});
