/**
 * OpenCode 执行器测试
 */
import { OpenCodeExecutor } from '../executor';

// Mock child_process
jest.mock('child_process', () => {
  const mockSpawn = jest.fn();
  return {
    spawn: mockSpawn,
    ChildProcess: class MockChildProcess {
      stdout = { on: jest.fn() };
      stderr = { on: jest.fn() };
      stdin = { write: jest.fn(), end: jest.fn() };
      on = jest.fn();
      kill = jest.fn();
    },
  };
});

jest.mock('../../config', () => ({
  config: {
    ai: {
      command: 'opencode',
      timeout: 30000,
      maxRetries: 2,
      retryBaseDelay: 100,
      retryMaxDelay: 1000,
      workingDir: '/tmp',
      model: '',
      maxInputLength: 10000,
    },
  },
}));

jest.mock('../../utils/retry', () => ({
  withRetry: jest.fn((fn: () => Promise<unknown>) => fn()),
}));

import { spawn } from 'child_process';

const mockSpawn = spawn as jest.MockedFunction<typeof spawn>;

describe('OpenCodeExecutor', () => {
  let executor: OpenCodeExecutor;

  beforeEach(() => {
    jest.clearAllMocks();
    executor = new OpenCodeExecutor({
      command: '/usr/local/bin/opencode',
      timeout: 30000,
      maxRetries: 2,
    });
  });

  describe('isAvailable', () => {
    it('should return true when opencode command exists', async () => {
      const mockProc = {
        on: jest.fn((event: string, cb: (code: number) => void) => {
          if (event === 'close') cb(0);
        }),
        kill: jest.fn(),
      };
      mockSpawn.mockReturnValue(mockProc as any);

      const result = await executor.isAvailable();
      expect(result).toBe(true);
    });

    it('should return false when opencode command not found', async () => {
      const mockProc = {
        on: jest.fn((event: string, cb: (error: Error) => void) => {
          if (event === 'error') cb(new Error('ENOENT'));
        }),
        kill: jest.fn(),
      };
      mockSpawn.mockReturnValue(mockProc as any);

      const result = await executor.isAvailable();
      expect(result).toBe(false);
    });
  });

  describe('getConfig', () => {
    it('should return current configuration', () => {
      const config = executor.getConfig();

      expect(config.command).toBe('/usr/local/bin/opencode');
      expect(config.timeout).toBe(30000);
      expect(config.maxRetries).toBe(2);
    });
  });

  describe('execute', () => {
    it('should return error when opencode not available', async () => {
      // Mock spawn to simulate command not found
      const mockProc = {
        stdout: { on: jest.fn() },
        stderr: {
          on: jest.fn((event: string, cb: (error: Error) => void) => {
            if (event === 'data') cb(new Error('Command not found'));
          }),
        },
        stdin: { write: jest.fn(), end: jest.fn() },
        on: jest.fn((event: string, cb: (error: Error) => void) => {
          if (event === 'error') cb(new Error('ENOENT: command not found'));
        }),
        kill: jest.fn(),
      };
      mockSpawn.mockReturnValue(mockProc as any);

      const result = await executor.execute('test prompt');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
