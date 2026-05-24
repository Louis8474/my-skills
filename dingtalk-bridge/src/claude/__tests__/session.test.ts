/**
 * ClaudeSession 和 SessionPool 单元测试
 */

// Mock child_process before importing
jest.mock('child_process', () => ({
  spawn: jest.fn(),
}));

jest.mock('readline', () => ({
  createInterface: jest.fn(() => ({
    on: jest.fn(),
    close: jest.fn(),
  })),
}));

jest.mock('fs', () => ({
  readFileSync: jest.fn(),
  existsSync: jest.fn(),
}));

jest.mock('os', () => ({
  homedir: jest.fn(() => '/mock/home'),
}));

jest.mock('../../config', () => ({
  config: {
    claude: {
      command: 'claude',
      timeout: 120000,
      maxRetries: 3,
      retryBaseDelay: 1000,
      retryMaxDelay: 10000,
      workingDir: '/mock/work',
      model: 'sonnet',
      maxInputLength: 10000,
    },
    persistentSession: {
      enabled: true,
      maxSessions: 10,
      idleTimeout: 1800000,
    },
  },
}));

import { spawn } from 'child_process';
import { ClaudeSession, type SessionState } from '../session';
import { SessionPool } from '../sessionPool';

// Shared mock process for all tests
let mockProcess: {
  stdin: { write: ReturnType<typeof jest.fn>; end: ReturnType<typeof jest.fn> };
  stdout: { on: ReturnType<typeof jest.fn> };
  stderr: { on: ReturnType<typeof jest.fn> };
  on: ReturnType<typeof jest.fn>;
  kill: ReturnType<typeof jest.fn>;
};

// ==================== ClaudeSession 测试 ====================

describe('ClaudeSession', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    ClaudeSession.clearEnvCache();

    mockProcess = {
      stdin: { write: jest.fn(), end: jest.fn() },
      stdout: { on: jest.fn() },
      stderr: { on: jest.fn() },
      on: jest.fn(),
      kill: jest.fn(),
    };

    (spawn as ReturnType<typeof jest.fn>).mockReturnValue(mockProcess);
  });

  it('should construct with default config', () => {
    const session = new ClaudeSession({ command: 'claude' });
    expect(session.currentState).toBe('closed');
    expect(session.isAlive).toBe(false);
    expect(session.currentSessionId).toBe('');
  });

  it('should spawn process with correct args on start', () => {
    const session = new ClaudeSession({ command: 'claude' });

    // Verify buildArgs produces correct stream-json args
    const args = (session as unknown as { buildArgs: () => string[] }).buildArgs();
    expect(args).toContain('-p'); // 非交互模式，启用 --input-format/--output-format
    expect(args).toContain('stream-json');
    expect(args).toContain('--input-format');
    expect(args).toContain('--output-format');
    expect(args).toContain('--include-partial-messages'); // 流式输出中间文本块
    expect(args).toContain('--verbose');
    expect(args).toContain('--bare');
    expect(args).toContain('--dangerously-skip-permissions');
  });

  it('should include model and system-prompt in args', () => {
    const session = new ClaudeSession({
      command: 'claude',
      model: 'opus',
      systemPrompt: 'You are helpful',
    });

    const args = (session as unknown as { buildArgs: () => string[] }).buildArgs();
    expect(args).toContain('--model');
    expect(args).toContain('opus');
    expect(args).toContain('--system-prompt');
    expect(args).toContain('You are helpful');
    expect(args).toContain('--dangerously-skip-permissions');
  });

  it('should reject send when busy', async () => {
    const session = new ClaudeSession({ command: 'claude' });
    (session as unknown as { state: SessionState }).state = 'busy';
    await expect(session.send('hello')).rejects.toThrow('busy');
  });

  it('should attempt restart when session is closed', async () => {
    const session = new ClaudeSession({ command: 'claude' });
    // Default state is 'closed' — send() should try to start(), which fails without a real CLI
    await expect(session.send('hello')).rejects.toThrow();
  });

  it('should reject send when busy', async () => {
    const session = new ClaudeSession({ command: 'claude' });
    (session as unknown as { state: SessionState }).state = 'busy';
    await expect(session.send('hello')).rejects.toThrow('busy');
  });

  it('should handle close gracefully when already closed', async () => {
    const session = new ClaudeSession({ command: 'claude' });
    await expect(session.close()).resolves.toBeUndefined();
  });

  it('should auto-approve control requests in bypassPermissions mode', () => {
    const session = new ClaudeSession({ command: 'claude' });
    // Simulate a started process by setting internal state
    (session as unknown as { process: typeof mockProcess }).process = mockProcess;
    (session as unknown as { sessionId: string }).sessionId = 'test-ctrl';
    (session as unknown as { state: SessionState }).state = 'busy';

    // Directly call handleLine with a control_request event
    (session as unknown as { handleLine: (line: string) => void }).handleLine(
      JSON.stringify({
        type: 'control_request',
        id: 'req-1',
        tool: 'Bash',
        input: { command: 'ls' },
      })
    );

    // Should have written an approve response to stdin
    expect(mockProcess.stdin.write).toHaveBeenCalledWith(
      expect.stringContaining('"result":"approve"')
    );
  });
});

// ==================== SessionPool 测试 ====================

describe('SessionPool', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    ClaudeSession.clearEnvCache();

    mockProcess = {
      stdin: { write: jest.fn(), end: jest.fn() },
      stdout: { on: jest.fn() },
      stderr: { on: jest.fn() },
      on: jest.fn(),
      kill: jest.fn(),
    };

    (spawn as ReturnType<typeof jest.fn>).mockReturnValue(mockProcess);
  });

  it('should construct with config', () => {
    const pool = new SessionPool({ command: 'claude' }, { maxSessions: 5, idleTimeout: 60000 });
    expect(pool.size).toBe(0);
    pool.stopCleanup();
  });

  it('should close all sessions when empty', async () => {
    const pool = new SessionPool({ command: 'claude' });
    await pool.closeAll();
    pool.stopCleanup();
    expect(pool.size).toBe(0);
  });

  it('should return empty status when no sessions', () => {
    const pool = new SessionPool({ command: 'claude' });
    const status = pool.getStatus();
    pool.stopCleanup();
    expect(status).toEqual([]);
  });

  it('should start and stop cleanup timer', () => {
    const pool = new SessionPool({ command: 'claude' });
    pool.startCleanup(1000);
    pool.stopCleanup();
  });
});
