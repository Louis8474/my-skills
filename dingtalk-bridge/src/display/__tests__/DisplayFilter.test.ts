/**
 * DisplayFilter 测试
 */
import { DisplayFilter } from '../DisplayFilter';
import type { DisplayMessage } from '../DisplayFilter';

jest.mock('../../config', () => ({
  config: {
    display: {
      mode: 'compact',
      thinkingMaxLen: 500,
      toolMaxLen: 500,
      thinkingMessages: true,
      toolMessages: true,
    },
  },
}));

describe('DisplayFilter', () => {
  describe('constructor', () => {
    it('should use config mode by default', () => {
      const filter = new DisplayFilter();
      expect(filter.getMode()).toBe('compact');
    });

    it('should accept explicit mode', () => {
      const filter = new DisplayFilter('quiet');
      expect(filter.getMode()).toBe('quiet');
    });
  });

  describe('setMode / getMode', () => {
    it('should switch mode', () => {
      const filter = new DisplayFilter();
      filter.setMode('full');
      expect(filter.getMode()).toBe('full');
      filter.setMode('quiet');
      expect(filter.getMode()).toBe('quiet');
    });
  });

  describe('full mode', () => {
    let filter: DisplayFilter;

    beforeEach(() => {
      filter = new DisplayFilter('full');
    });

    it('should pass through text messages', () => {
      const msg: DisplayMessage = { type: 'text', content: 'hello world' };
      const result = filter.filter(msg);
      expect(result.shouldSend).toBe(true);
      expect(result.content).toContain('hello world');
    });

    it('should strip ANSI escape codes', () => {
      const msg: DisplayMessage = { type: 'text', content: '\x1b[31mred text\x1b[0m' };
      const result = filter.filter(msg);
      expect(result.content).toBe('red text');
    });

    it('should filter out session control messages', () => {
      const msg: DisplayMessage = {
        type: 'text',
        content: '(no input in 30 min, auto-resumed: session)',
      };
      const result = filter.filter(msg);
      expect(result.shouldSend).toBe(false);
    });

    it('should filter out ANSI-only lines', () => {
      const msg: DisplayMessage = { type: 'text', content: '\x1b[2J\x1b[H' };
      const result = filter.filter(msg);
      expect(result.shouldSend).toBe(false);
    });

    it('should pass thinking messages', () => {
      const msg: DisplayMessage = { type: 'thinking', content: 'pondering' };
      const result = filter.filter(msg);
      expect(result.shouldSend).toBe(true);
      expect(result.content).toContain('pondering');
    });

    it('should pass tool_use messages with tool name', () => {
      const msg: DisplayMessage = { type: 'tool_use', content: 'data', toolName: 'Read' };
      const result = filter.filter(msg);
      expect(result.shouldSend).toBe(true);
      expect(result.content).toContain('Read');
    });

    it('should pass tool_result messages', () => {
      const msg: DisplayMessage = { type: 'tool_result', content: 'output' };
      const result = filter.filter(msg);
      expect(result.shouldSend).toBe(true);
    });

    it('should prefix tool_result with clipboard icon', () => {
      const msg: DisplayMessage = { type: 'tool_result', content: 'output' };
      const result = filter.filter(msg);
      expect(result.content).toContain('📋');
    });

    it('should strip ANSI and keep real content alongside control lines', () => {
      const content = 'real output\n(no input in 5 min, auto-resumed: test)\nmore output';
      const msg: DisplayMessage = { type: 'text', content };
      const result = filter.filter(msg);
      expect(result.content).toContain('real output');
      expect(result.content).toContain('more output');
      expect(result.content).not.toContain('auto-resumed');
    });
  });

  describe('compact mode', () => {
    let filter: DisplayFilter;

    beforeEach(() => {
      filter = new DisplayFilter('compact');
    });

    it('should send text with cleaned content', () => {
      const msg: DisplayMessage = { type: 'text', content: 'clean text' };
      const result = filter.filter(msg);
      expect(result.shouldSend).toBe(true);
      expect(result.content).toContain('clean text');
    });

    it('should truncate long thinking messages', () => {
      const longContent = 'x'.repeat(600);
      const msg: DisplayMessage = { type: 'thinking', content: longContent };
      const result = filter.filter(msg);
      expect(result.shouldSend).toBe(true);
      expect(result.content.length).toBeLessThan(longContent.length + 10);
    });

    it('should prefix tool_use with wrench icon', () => {
      const msg: DisplayMessage = { type: 'tool_use', content: 'details', toolName: 'Write' };
      const result = filter.filter(msg);
      expect(result.content).toContain('🔧');
      expect(result.content).toContain('Write');
    });

    it('should suppress tool_result messages in compact mode', () => {
      const msg: DisplayMessage = { type: 'tool_result', content: 'output' };
      const result = filter.filter(msg);
      expect(result.shouldSend).toBe(false);
      expect(result.content).toBe('');
    });

    it('should strip ANSI codes in compact mode', () => {
      const msg: DisplayMessage = { type: 'text', content: '\x1b[1mbold\x1b[0m text' };
      const result = filter.filter(msg);
      expect(result.content).not.toContain('\x1b');
      expect(result.content).toContain('bold text');
    });
  });

  describe('quiet mode', () => {
    let filter: DisplayFilter;

    beforeEach(() => {
      filter = new DisplayFilter('quiet');
    });

    it('should buffer text messages without sending', () => {
      const msg: DisplayMessage = { type: 'text', content: 'hello' };
      const result = filter.filter(msg);
      expect(result.shouldSend).toBe(false);
    });

    it('should not send non-text messages in quiet mode', () => {
      const msg: DisplayMessage = { type: 'thinking', content: 'pondering' };
      const result = filter.filter(msg);
      expect(result.shouldSend).toBe(false);
    });

    it('should not send tool_use messages in quiet mode', () => {
      const msg: DisplayMessage = { type: 'tool_use', content: 'data', toolName: 'Read' };
      const result = filter.filter(msg);
      expect(result.shouldSend).toBe(false);
    });
  });

  describe('truncate', () => {
    it('should truncate long content and add indicator', () => {
      const filter = new DisplayFilter('compact');
      const longContent = 'x'.repeat(600);
      const msg: DisplayMessage = { type: 'thinking', content: longContent };
      const result = filter.filter(msg);
      expect(result.content).toContain('...(truncated)');
    });
  });

  describe('ANSI stripping', () => {
    it('should strip CSI sequences', () => {
      const filter = new DisplayFilter('full');
      const msg: DisplayMessage = { type: 'text', content: '\x1b[1;32mbold green\x1b[0m' };
      const result = filter.filter(msg);
      expect(result.content).toBe('bold green');
    });

    it('should normalize CRLF to LF', () => {
      const filter = new DisplayFilter('full');
      const msg: DisplayMessage = { type: 'text', content: 'line1\r\nline2' };
      const result = filter.filter(msg);
      expect(result.content).toBe('line1\nline2');
    });
  });
});
