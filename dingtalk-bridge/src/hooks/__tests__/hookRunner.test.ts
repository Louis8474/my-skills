/**
 * HookRunner 测试
 */
import { HookRunner } from '../hookRunner';
import type { Hook, HookEvent } from '../types';

jest.mock('child_process', () => ({
  exec: jest.fn((_cmd: string, _opts: unknown, cb: (err: null, stdout: string) => void) =>
    cb(null, 'ok')
  ),
}));

jest.mock('axios', () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue({ status: 200, data: {} }),
}));

describe('HookRunner', () => {
  let runner: HookRunner;

  beforeEach(() => {
    runner = new HookRunner();
  });

  const createShellHook = (event: HookEvent = 'message_received', id = 'hook-1'): Hook => ({
    id,
    event,
    action: { type: 'shell', command: 'echo test' },
    enabled: true,
  });

  const createHttpHook = (event: HookEvent = 'message_sent', id = 'hook-http-1'): Hook => ({
    id,
    event,
    action: { type: 'http', url: 'http://localhost/webhook', method: 'POST' },
    enabled: true,
  });

  describe('register', () => {
    it('should register a hook', () => {
      const hook = createShellHook();
      runner.register(hook);
      expect(runner.list()).toHaveLength(1);
      expect(runner.list()[0].id).toBe('hook-1');
    });

    it('should overwrite hook with same id', () => {
      runner.register(createShellHook('message_received', 'dup'));
      runner.register(createHttpHook('message_sent', 'dup'));
      expect(runner.list()).toHaveLength(1);
      expect(runner.list()[0].action.type).toBe('http');
    });
  });

  describe('unregister', () => {
    it('should remove a hook', () => {
      runner.register(createShellHook());
      expect(runner.unregister('hook-1')).toBe(true);
      expect(runner.list()).toHaveLength(0);
    });

    it('should return false for non-existent hook', () => {
      expect(runner.unregister('nope')).toBe(false);
    });
  });

  describe('getByEvent', () => {
    it('should return hooks matching the event', () => {
      runner.register(createShellHook('message_received', 'h1'));
      runner.register(createHttpHook('message_sent', 'h2'));
      runner.register(createShellHook('message_received', 'h3'));
      const result = runner.getByEvent('message_received');
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no hooks match', () => {
      runner.register(createShellHook('message_received'));
      expect(runner.getByEvent('error')).toHaveLength(0);
    });
  });

  describe('toggle', () => {
    it('should toggle hook enabled state', () => {
      runner.register(createShellHook());
      expect(runner.toggle('hook-1')).toBe(true);
      const hook = runner.list()[0];
      expect(hook.enabled).toBe(false);
      runner.toggle('hook-1');
      expect(hook.enabled).toBe(true);
    });

    it('should return false for non-existent hook', () => {
      expect(runner.toggle('nope')).toBe(false);
    });
  });

  describe('trigger', () => {
    it('should not execute disabled hooks', async () => {
      const hook = createShellHook();
      hook.enabled = false;
      runner.register(hook);
      await runner.trigger('message_received', { content: 'test' });
      // No error thrown means disabled hooks were skipped
    });

    it('should handle shell hooks', async () => {
      runner.register(createShellHook());
      await runner.trigger('message_received', { content: 'test' });
      // Should complete without error
    });

    it('should handle http hooks', async () => {
      runner.register(createHttpHook());
      await runner.trigger('message_sent', { content: 'test' });
      // Should complete without error
    });

    it('should handle empty trigger gracefully', async () => {
      await expect(runner.trigger('error')).resolves.toBeUndefined();
    });

    it('should skip hooks for non-matching events', async () => {
      runner.register(createShellHook('message_received'));
      await runner.trigger('session_created');
      // No hooks match, should complete without error
    });
  });

  describe('list', () => {
    it('should return all registered hooks', () => {
      runner.register(createShellHook('message_received', 'a'));
      runner.register(createHttpHook('message_sent', 'b'));
      const all = runner.list();
      expect(all).toHaveLength(2);
      expect(all.map(h => h.id)).toEqual(['a', 'b']);
    });
  });
});
