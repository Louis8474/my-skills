/**
 * CLI 可用性检查测试
 */
import { EventEmitter } from 'events';

jest.mock('../../config', () => ({
  config: {
    aiProvider: 'opencode',
    ai: { command: 'opencode' },
    claude: { command: 'claude' },
  },
}));

// Mock child_process
const mockSpawn = jest.fn();
jest.mock('child_process', () => ({
  spawn: mockSpawn,
  execSync: jest.fn(),
}));

const {
  getAICLICommand,
  getProviderDisplayName,
  getInstallSuggestion,
  clearCLICache,
  checkCLIAvailability,
  getCLIVersion,
} = require('../cliChecker');

describe('CLI Checker', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    clearCLICache();
  });

  describe('getAICLICommand', () => {
    it('should return opencode command for opencode provider', () => {
      expect(getAICLICommand()).toBe('opencode');
    });
  });

  describe('getProviderDisplayName', () => {
    it('should return OpenCode for opencode provider', () => {
      expect(getProviderDisplayName()).toBe('OpenCode');
    });

    it('should accept explicit provider param', () => {
      expect(getProviderDisplayName('claude')).toBe('Claude Code');
      expect(getProviderDisplayName('opencode')).toBe('OpenCode');
    });
  });

  describe('getInstallSuggestion', () => {
    it('should return npm install for opencode', () => {
      const suggestion = getInstallSuggestion();
      expect(suggestion).toContain('npm');
    });

    it('should accept explicit provider param', () => {
      expect(getInstallSuggestion('claude')).toContain('brew');
      expect(getInstallSuggestion('opencode')).toContain('npm');
    });
  });

  describe('clearCLICache', () => {
    it('should clear the cache without error', () => {
      expect(() => clearCLICache()).not.toThrow();
    });
  });

  describe('checkCLIAvailability', () => {
    it('should return available when spawn exits with code 0', async () => {
      const emitter = new EventEmitter();
      const proc = Object.assign(emitter, { kill: jest.fn(), killed: false });
      mockSpawn.mockReturnValueOnce(proc);
      setTimeout(() => emitter.emit('close', 0), 5);

      const result = await checkCLIAvailability();
      expect(result.available).toBe(true);
      expect(mockSpawn).toHaveBeenCalledWith('opencode', ['--version'], { stdio: 'ignore' });
    });

    it('should return not available when spawn errors', async () => {
      const emitter = new EventEmitter();
      const proc = Object.assign(emitter, { kill: jest.fn(), killed: false });
      mockSpawn.mockReturnValueOnce(proc);
      setTimeout(() => emitter.emit('error', new Error('not found')), 5);

      const result = await checkCLIAvailability();
      expect(result.available).toBe(false);
      expect(result.suggestion).toBeDefined();
    });

    it('should cache results and not re-spawn', async () => {
      const emitter = new EventEmitter();
      const proc = Object.assign(emitter, { kill: jest.fn(), killed: false });
      mockSpawn.mockReturnValueOnce(proc);
      setTimeout(() => emitter.emit('close', 0), 5);

      await checkCLIAvailability();
      const result2 = await checkCLIAvailability();
      expect(result2.available).toBe(true);
      // spawn should only be called once due to cache
      expect(mockSpawn).toHaveBeenCalledTimes(1);
    });

    it('should force refresh when flag is set', async () => {
      const e1 = new EventEmitter();
      const p1 = Object.assign(e1, { kill: jest.fn(), killed: false });
      const e2 = new EventEmitter();
      const p2 = Object.assign(e2, { kill: jest.fn(), killed: false });
      mockSpawn.mockReturnValueOnce(p1).mockReturnValueOnce(p2);
      setTimeout(() => e1.emit('close', 0), 5);
      setTimeout(() => e2.emit('close', 0), 5);

      await checkCLIAvailability();
      await checkCLIAvailability(undefined, true);
      expect(mockSpawn).toHaveBeenCalledTimes(2);
    });
  });

  describe('getCLIVersion', () => {
    it('should return version string on success', async () => {
      const { execSync } = require('child_process');
      execSync.mockReturnValueOnce('opencode 1.0.0\n');
      const version = await getCLIVersion();
      expect(version).toBe('opencode 1.0.0');
    });

    it('should return null on error', async () => {
      const { execSync } = require('child_process');
      execSync.mockImplementationOnce(() => {
        throw new Error('not found');
      });
      const version = await getCLIVersion();
      expect(version).toBeNull();
    });
  });
});
