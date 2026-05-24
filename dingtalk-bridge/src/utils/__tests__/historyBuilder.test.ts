/**
 * 历史消息构建工具测试
 */
import { buildHistory, HistoryMessage } from '../historyBuilder';
import { SessionManager } from '../../session-manager/sessionManager';

describe('buildHistory', () => {
  let mockSessionManager: jest.Mocked<SessionManager>;

  beforeEach(() => {
    mockSessionManager = {
      getHistory: jest.fn(),
    } as unknown as jest.Mocked<SessionManager>;
  });

  it('should return formatted user and assistant messages', async () => {
    mockSessionManager.getHistory.mockResolvedValue([
      {
        id: '1',
        userId: 'user1',
        username: 'Test User',
        content: 'Hello',
        conversationId: 'conv1',
        type: 'user',
        metadata: { timestamp: Date.now(), source: 'dingtalk' },
      },
      {
        id: '2',
        userId: 'bot',
        username: 'AI',
        content: 'Hi there',
        conversationId: 'conv1',
        type: 'ai',
        metadata: { timestamp: Date.now(), source: 'ai' },
      },
    ] as any);

    const history = await buildHistory(mockSessionManager, 'conv1', 10);
    expect(history).toHaveLength(2);
    expect(history[0]).toEqual({ role: 'user', content: 'Hello' });
    expect(history[1]).toEqual({ role: 'assistant', content: 'Hi there' });
  });

  it('should filter out non-user/non-ai messages', async () => {
    mockSessionManager.getHistory.mockResolvedValue([
      {
        id: '1',
        userId: 'user1',
        username: 'Test',
        content: 'Hello',
        conversationId: 'conv1',
        type: 'user',
        metadata: { timestamp: Date.now(), source: 'dingtalk' },
      },
      {
        id: '2',
        userId: 'system',
        username: 'System',
        content: 'System message',
        conversationId: 'conv1',
        type: 'system' as any,
        metadata: { timestamp: Date.now(), source: 'system' },
      },
    ]);

    const history = await buildHistory(mockSessionManager, 'conv1', 10);
    expect(history).toHaveLength(1);
    expect(history[0].role).toBe('user');
  });

  it('should return empty array when no messages', async () => {
    mockSessionManager.getHistory.mockResolvedValue([]);

    const history = await buildHistory(mockSessionManager, 'conv1', 10);
    expect(history).toEqual([]);
  });

  it('should pass maxMessages to sessionManager', async () => {
    mockSessionManager.getHistory.mockResolvedValue([]);

    await buildHistory(mockSessionManager, 'conv1', 5);
    expect(mockSessionManager.getHistory).toHaveBeenCalledWith('conv1', 5);
  });

  it('should use default maxMessages of 20', async () => {
    mockSessionManager.getHistory.mockResolvedValue([]);

    await buildHistory(mockSessionManager, 'conv1');
    expect(mockSessionManager.getHistory).toHaveBeenCalledWith('conv1', 20);
  });
});
