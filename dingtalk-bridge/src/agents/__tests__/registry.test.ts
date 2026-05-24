/**
 * Agent 注册表测试
 */
import { AgentRegistry } from '../registry';
import type { Agent, AgentResult } from '../types';

function createMockAgent(name: string, agentType = 'mock'): Agent {
  return {
    name,
    type: agentType,
    execute: jest.fn<Promise<AgentResult>, [string]>().mockResolvedValue({
      success: true,
      output: `${name} result`,
      executionTime: 100,
      exitCode: 0,
    }),
    executeStream: jest
      .fn<Promise<AgentResult>, [string, (chunk: string) => void]>()
      .mockResolvedValue({
        success: true,
        output: `${name} stream result`,
        executionTime: 100,
        exitCode: 0,
      }),
    isAvailable: jest.fn<Promise<boolean>, []>().mockResolvedValue(true),
    getConfig: jest.fn().mockReturnValue({ command: name, timeout: 30000, maxRetries: 3 }),
  };
}

describe('AgentRegistry', () => {
  let registry: AgentRegistry;

  beforeEach(() => {
    registry = new AgentRegistry();
  });

  describe('register', () => {
    it('should register an agent', () => {
      const agent = createMockAgent('test-agent');
      registry.register(agent);
      expect(registry.get('test-agent')).toBe(agent);
      expect(registry.size).toBe(1);
    });

    it('should set first agent as default', () => {
      const agent = createMockAgent('first');
      registry.register(agent);
      expect(registry.getDefaultName()).toBe('first');
      expect(registry.getDefault()).toBe(agent);
    });

    it('should set explicit default agent', () => {
      const agent1 = createMockAgent('a1');
      const agent2 = createMockAgent('a2');
      registry.register(agent1);
      registry.register(agent2, true);
      expect(registry.getDefaultName()).toBe('a2');
    });

    it('should overwrite existing agent with same name', () => {
      const agent1 = createMockAgent('dup');
      const agent2 = createMockAgent('dup', 'v2');
      registry.register(agent1);
      registry.register(agent2);
      expect(registry.size).toBe(1);
      expect(registry.get('dup')?.type).toBe('v2');
    });
  });

  describe('get', () => {
    it('should return undefined for non-existent agent', () => {
      expect(registry.get('nope')).toBeUndefined();
    });
  });

  describe('setDefault', () => {
    it('should switch default to existing agent', () => {
      const a1 = createMockAgent('a1');
      const a2 = createMockAgent('a2');
      registry.register(a1);
      registry.register(a2);
      expect(registry.setDefault('a2')).toBe(true);
      expect(registry.getDefaultName()).toBe('a2');
    });

    it('should return false for non-existent agent', () => {
      expect(registry.setDefault('nope')).toBe(false);
    });
  });

  describe('list', () => {
    it('should return all agents as name/type pairs', () => {
      registry.register(createMockAgent('alpha', 'type-a'));
      registry.register(createMockAgent('beta', 'type-b'));
      const list = registry.list();
      expect(list).toEqual([
        { name: 'alpha', type: 'type-a' },
        { name: 'beta', type: 'type-b' },
      ]);
    });
  });

  describe('unregister', () => {
    it('should remove an agent', () => {
      registry.register(createMockAgent('remove-me'));
      expect(registry.unregister('remove-me')).toBe(true);
      expect(registry.get('remove-me')).toBeUndefined();
      expect(registry.size).toBe(0);
    });

    it('should return false for non-existent agent', () => {
      expect(registry.unregister('nope')).toBe(false);
    });

    it('should switch default when unregistering the default', () => {
      const a1 = createMockAgent('first');
      const a2 = createMockAgent('second');
      registry.register(a1);
      registry.register(a2);
      registry.setDefault('first');
      registry.unregister('first');
      expect(registry.getDefaultName()).toBe('second');
    });

    it('should clear default when last agent is removed', () => {
      registry.register(createMockAgent('sole'));
      registry.unregister('sole');
      expect(registry.getDefaultName()).toBe('');
      expect(registry.getDefault()).toBeUndefined();
    });
  });
});
