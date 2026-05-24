import { CommandHandler, type CommandDeps } from '../commandHandler';
import { SessionManager } from '../../session-manager';
import { MessageQueue } from '../../message-queue/messageQueue';
import { parseCommand } from '../commandParser';

const queueStatusValue = {
  queued: 0,
  processing: 0,
  byPriority: { high: 0, normal: 0, low: 0 },
};

// Mock dependencies
const mockSessionManager = {
  getHistory: jest.fn().mockResolvedValue([]),
  endSession: jest.fn().mockResolvedValue(undefined),
} as unknown as SessionManager;

const mockMessageQueue = {
  getStatus: jest.fn().mockReturnValue(queueStatusValue),
} as unknown as MessageQueue;

const deps: CommandDeps = {
  sessionManager: mockSessionManager,
  messageQueue: mockMessageQueue,
};

describe('CommandHandler', () => {
  let handler: CommandHandler;

  beforeEach(() => {
    handler = new CommandHandler(deps);
    jest.clearAllMocks();
    // Re-setup mock return values after clearAllMocks
    (mockMessageQueue.getStatus as jest.Mock).mockReturnValue(queueStatusValue);
    (mockSessionManager.getHistory as jest.Mock).mockResolvedValue([]);
  });

  test('handles /help command', async () => {
    const parsed = parseCommand('/help')!;
    const result = await handler.handle(parsed, 'user1', 'conv1');
    expect(result).toContain('可用命令');
    expect(result).toContain('/help');
    expect(result).toContain('/status');
  });

  test('handles /status command', async () => {
    const parsed = parseCommand('/status')!;
    const result = await handler.handle(parsed, 'user1', 'conv1');
    expect(result).toContain('系统状态');
    expect(result).toContain('AI Provider');
  });

  test('handles /queue command', async () => {
    const parsed = parseCommand('/queue')!;
    const result = await handler.handle(parsed, 'user1', 'conv1');
    expect(result).toContain('消息队列');
  });

  test('handles /history with no messages', async () => {
    const parsed = parseCommand('/history')!;
    const result = await handler.handle(parsed, 'user1', 'conv1');
    expect(result).toContain('暂无对话历史');
  });

  test('returns error for unknown command', async () => {
    const parsed = parseCommand('/unknown')!;
    const result = await handler.handle(parsed, 'non-admin-user', 'conv1');
    expect(result).toContain('未知命令');
  });

  test('handles /config command', async () => {
    const parsed = parseCommand('/config')!;
    const result = await handler.handle(parsed, 'user1', 'conv1');
    expect(result).toContain('AI Provider');
  });

  test('handles /model command', async () => {
    const parsed = parseCommand('/model')!;
    const result = await handler.handle(parsed, 'user1', 'conv1');
    expect(result).toContain('模型');
  });

  test('handles /model with valid provider arg', async () => {
    const parsed = parseCommand('/model claude')!;
    const result = await handler.handle(parsed, 'user1', 'conv1');
    expect(result).toContain('模型切换');
  });

  test('handles /model with invalid provider arg', async () => {
    const parsed = parseCommand('/model invalid')!;
    const result = await handler.handle(parsed, 'user1', 'conv1');
    expect(result).toContain('不支持的模型');
  });

  test('handles /reset command', async () => {
    const parsed = parseCommand('/reset')!;
    const result = await handler.handle(parsed, 'user1', 'conv1');
    expect(result).toContain('会话已重置');
    expect(result).toContain('session 文件保留');
    expect(mockSessionManager.endSession).toHaveBeenCalledWith('conv1');
  });

  test('handles /new command without resetSession', async () => {
    const parsed = parseCommand('/new')!;
    const result = await handler.handle(parsed, 'user1', 'conv1');
    expect(result).toContain('会话已完全重置');
    expect(result).toContain('session 文件均已清除');
    expect(mockSessionManager.endSession).toHaveBeenCalledWith('conv1');
  });

  test('handles /new command with resetSession', async () => {
    const mockResetSession = jest.fn().mockResolvedValue(true);
    const depsWithReset: CommandDeps = {
      ...deps,
      resetSession: mockResetSession,
    };
    const h = new CommandHandler(depsWithReset);
    const parsed = parseCommand('/new')!;
    const result = await h.handle(parsed, 'user1', 'conv1');
    expect(result).toContain('会话已完全重置');
    expect(mockSessionManager.endSession).toHaveBeenCalledWith('conv1');
    expect(mockResetSession).toHaveBeenCalledWith('conv1');
  });

  test('handles /remember with insufficient args', async () => {
    const parsed = parseCommand('/remember key')!;
    const result = await handler.handle(parsed, 'user1', 'conv1');
    expect(result).toContain('用法');
  });

  test('handles /remember with enough args', async () => {
    const parsed = parseCommand('/remember key value')!;
    const result = await handler.handle(parsed, 'user1', 'conv1');
    expect(result).toContain('记忆功能');
  });

  test('handles /history with messages', async () => {
    (mockSessionManager.getHistory as jest.Mock).mockResolvedValue([
      { type: 'user', content: 'hello world' },
      { type: 'ai', content: 'Hi there!' },
    ]);
    const parsed = parseCommand('/history')!;
    const result = await handler.handle(parsed, 'user1', 'conv1');
    expect(result).toContain('最近');
    expect(result).not.toContain('暂无');
  });

  test('handles /status with aiProviderStatus', async () => {
    const depsWithStatus: CommandDeps = {
      ...deps,
      aiProviderStatus: { opencode: true, claude: false },
    };
    const h = new CommandHandler(depsWithStatus);
    const parsed = parseCommand('/status')!;
    const result = await h.handle(parsed, 'user1', 'conv1');
    expect(result).toContain('OpenCode');
    expect(result).toContain('Claude Code');
  });
});
