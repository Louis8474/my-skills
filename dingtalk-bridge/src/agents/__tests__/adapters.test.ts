/**
 * Agent 适配器测试
 */

// Create mock executor factory functions to avoid hoisting issues
const createMockOpenCodeExecutor = () => ({
  execute: jest
    .fn()
    .mockResolvedValue({ success: true, output: 'ok', executionTime: 10, exitCode: 0 }),
  executeStream: jest.fn().mockImplementation(async (_p: string, onChunk: (c: string) => void) => {
    onChunk('chunk');
    return { success: true, output: 'ok', executionTime: 10, exitCode: 0 };
  }),
  isAvailable: jest.fn().mockResolvedValue(true),
  getConfig: jest.fn().mockReturnValue({
    command: 'opencode',
    timeout: 120000,
    maxRetries: 3,
    retryBaseDelay: 1000,
    retryMaxDelay: 10000,
    workingDir: '/tmp',
    model: 'gpt-4',
    maxInputLength: 10000,
  }),
});

const createMockClaudeCodeExecutor = () => ({
  execute: jest
    .fn()
    .mockResolvedValue({ success: true, output: 'claude-ok', executionTime: 15, exitCode: 0 }),
  executeStream: jest.fn().mockImplementation(async (_p: string, onChunk: (c: string) => void) => {
    onChunk('chunk-claude');
    return { success: true, output: 'claude-ok', executionTime: 15, exitCode: 0 };
  }),
  isAvailable: jest.fn().mockResolvedValue(true),
  getConfig: jest.fn().mockReturnValue({
    command: 'claude',
    timeout: 120000,
    maxRetries: 3,
    retryBaseDelay: 1000,
    retryMaxDelay: 10000,
    workingDir: '/tmp',
    model: 'sonnet',
    maxInputLength: 10000,
  }),
});

// Mock config first (required by executors)
jest.mock('../../config', () => ({
  config: {
    aiProvider: 'opencode',
    ai: {
      command: 'opencode',
      timeout: 120000,
      maxRetries: 3,
      model: 'gpt-4',
      maxInputLength: 10000,
    },
    claude: {
      command: 'claude',
      timeout: 120000,
      maxRetries: 3,
      model: 'sonnet',
      maxInputLength: 10000,
    },
  },
}));

// Mock node-pty (required by ClaudeCodeExecutor)
jest.mock('node-pty', () => ({}));

// Mock fs (required by ClaudeCodeExecutor)
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  existsSync: jest.fn().mockReturnValue(false),
}));

// Mock executors using factory functions
jest.mock('../../opencode/executor', () => ({
  OpenCodeExecutor: jest.requireActual('../../opencode/executor').OpenCodeExecutor,
}));

jest.mock('../../claude/executor', () => ({
  ClaudeCodeExecutor: jest.requireActual('../../claude/executor').ClaudeCodeExecutor,
}));

import { OpenCodeAgent } from '../adapters/opencode';
import { ClaudeCodeAgent } from '../adapters/claude';
import type { OpenCodeExecutor } from '../../opencode/executor';
import type { ClaudeCodeExecutor } from '../../claude/executor';

describe('OpenCodeAgent', () => {
  let agent: OpenCodeAgent;

  beforeEach(() => {
    jest.clearAllMocks();
    // Use dependency injection with mock executor (cast to any for testing)
    agent = new OpenCodeAgent(createMockOpenCodeExecutor() as unknown as OpenCodeExecutor);
  });

  it('should have correct name and type', () => {
    expect(agent.name).toBe('opencode');
    expect(agent.type).toBe('opencode');
  });

  it('should execute a prompt', async () => {
    const result = await agent.execute('hello');
    expect(result.success).toBe(true);
    expect(result.output).toBe('ok');
  });

  it('should execute with streaming', async () => {
    const chunks: string[] = [];
    const result = await agent.executeStream('hello', c => chunks.push(c));
    expect(result.success).toBe(true);
    expect(chunks).toContain('chunk');
  });

  it('should check availability', async () => {
    const available = await agent.isAvailable();
    expect(available).toBe(true);
  });

  it('should return config', () => {
    const cfg = agent.getConfig();
    expect(cfg.command).toBe('opencode');
    expect(cfg.timeout).toBe(120000);
  });

  it('should expose underlying executor', () => {
    const executor = agent.getExecutor();
    expect(executor).toBeDefined();
  });
});

describe('ClaudeCodeAgent', () => {
  let agent: ClaudeCodeAgent;

  beforeEach(() => {
    jest.clearAllMocks();
    // Use dependency injection with mock executor (cast to any for testing)
    agent = new ClaudeCodeAgent(createMockClaudeCodeExecutor() as unknown as ClaudeCodeExecutor);
  });

  it('should have correct name and type', () => {
    expect(agent.name).toBe('claude');
    expect(agent.type).toBe('claude');
  });

  it('should execute a prompt', async () => {
    const result = await agent.execute('hello');
    expect(result.success).toBe(true);
    expect(result.output).toBe('claude-ok');
  });

  it('should execute with streaming', async () => {
    const chunks: string[] = [];
    const result = await agent.executeStream('hello', c => chunks.push(c));
    expect(result.success).toBe(true);
    expect(chunks).toContain('chunk-claude');
  });

  it('should check availability', async () => {
    const available = await agent.isAvailable();
    expect(available).toBe(true);
  });

  it('should return config', () => {
    const cfg = agent.getConfig();
    expect(cfg.command).toBe('claude');
  });

  it('should expose underlying executor', () => {
    const executor = agent.getExecutor();
    expect(executor).toBeDefined();
  });
});
