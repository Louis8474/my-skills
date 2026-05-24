import {
  formatToolCall,
  formatToolResult,
  shortenPath,
  QUIET_TOOLS,
  READ_ONLY_TOOLS,
  TOOL_ICONS,
  MAX_RESULT_CHARS,
  MAX_RESULT_LINES,
} from '../toolFormatter';

describe('toolFormatter', () => {
  describe('shortenPath', () => {
    test('returns empty string for empty input', () => {
      expect(shortenPath('')).toBe('');
    });

    test('returns short paths unchanged (≤3 segments)', () => {
      expect(shortenPath('src/main.ts')).toBe('src/main.ts');
      expect(shortenPath('foo/bar/baz.ts')).toBe('foo/bar/baz.ts');
    });

    test('shortens long paths to last 3 segments', () => {
      expect(shortenPath('/Users/scott/project/src/utils/helper.ts')).toBe(
        '.../src/utils/helper.ts'
      );
    });

    test('handles Windows-style backslashes', () => {
      // C:\Users\scott\project\src\file.ts has 5 segments after conversion
      // last 3 segments → project/src/file.ts
      const result = shortenPath('C:\\Users\\scott\\project\\src\\file.ts');
      expect(result).toContain('src/file.ts');
      expect(result).toContain('...');
    });
  });

  describe('formatToolCall', () => {
    test('formats Read tool with file path', () => {
      const result = formatToolCall('Read', { file_path: '/long/path/to/src/index.ts' });
      expect(result).toContain('📖');
      expect(result).toContain('**Read**');
      expect(result).toContain('index.ts');
    });

    test('formats Bash tool with command (truncated to 300)', () => {
      const longCmd = 'x'.repeat(500);
      const result = formatToolCall('Bash', { command: longCmd });
      expect(result).toContain('⚡');
      expect(result).toContain('**Bash**');
      expect(result).toContain('```');
      expect(result.length).toBeLessThan(500);
    });

    test('formats Edit tool with file path', () => {
      const result = formatToolCall('Edit', { file_path: '/src/app.ts' });
      expect(result).toContain('✏️');
      expect(result).toContain('**Edit**');
      expect(result).toContain('app.ts');
    });

    test('formats Write tool with file path', () => {
      const result = formatToolCall('Write', { file_path: '/src/new-file.ts' });
      expect(result).toContain('📝');
      expect(result).toContain('**Write**');
    });

    test('formats Glob tool with pattern', () => {
      const result = formatToolCall('Glob', { pattern: '**/*.ts' });
      expect(result).toContain('🔍');
      expect(result).toContain('**/*.ts');
    });

    test('formats Grep tool with pattern', () => {
      const result = formatToolCall('Grep', { pattern: 'TODO' });
      expect(result).toContain('🔎');
      expect(result).toContain('TODO');
    });

    test('formats unknown tool with first param', () => {
      const result = formatToolCall('CustomTool', { query: 'short val' });
      expect(result).toContain('🔧');
      expect(result).toContain('**CustomTool**');
      expect(result).toContain('short val');
    });

    test('formats unknown tool without short param', () => {
      const result = formatToolCall('CustomTool', { data: 'x'.repeat(200) });
      expect(result).toContain('**CustomTool**');
      expect(result).not.toContain('x'.repeat(200));
    });

    test('formats unknown tool with no params', () => {
      const result = formatToolCall('CustomTool', {});
      expect(result).toContain('**CustomTool**');
    });
  });

  describe('formatToolResult', () => {
    test('returns empty for quiet tools', () => {
      expect(formatToolResult('EnterPlanMode', 'some content')).toBe('');
      expect(formatToolResult('ExitPlanMode', 'content')).toBe('');
      expect(formatToolResult('Skill', 'content')).toBe('');
    });

    test('formats read-only tools with line count', () => {
      const content = 'line1\nline2\nline3';
      expect(formatToolResult('Read', content)).toBe(' _(3 lines)_');
    });

    test('formats read-only empty result', () => {
      expect(formatToolResult('Read', '')).toBe(' _(empty)_');
      expect(formatToolResult('Read', null)).toBe(' _(empty)_');
    });

    test('formats Edit/Write success result', () => {
      expect(formatToolResult('Edit', 'File updated successfully')).toContain('✅');
      expect(formatToolResult('Write', 'File created at /src/foo.ts')).toContain('✅');
    });

    test('formats empty result', () => {
      expect(formatToolResult('Bash', '')).toContain('no output');
      expect(formatToolResult('Bash', null)).toContain('no output');
    });

    test('formats Bash output in code block', () => {
      const result = formatToolResult('Bash', 'hello world');
      expect(result).toContain('```');
      expect(result).toContain('hello world');
    });

    test('truncates long Bash output', () => {
      const longOutput = Array(20).fill('line of output').join('\n');
      const result = formatToolResult('Bash', longOutput);
      expect(result).toContain('...');
      expect(result).toContain('+');
    });

    test('truncates very long content by characters', () => {
      const veryLong = 'x'.repeat(MAX_RESULT_CHARS + 1000);
      const result = formatToolResult('Bash', veryLong);
      expect(result.length).toBeLessThan(veryLong.length);
    });

    test('formats TodoWrite with blockquote', () => {
      const result = formatToolResult('TodoWrite', 'task1\ntask2');
      expect(result).toContain('> task1');
      expect(result).toContain('> task2');
    });

    test('handles array content with tool_reference', () => {
      const content = [{ type: 'tool_reference', text: 'ref' }];
      expect(formatToolResult('Bash', content)).toBe('');
    });

    test('handles non-string content by JSON stringify', () => {
      const result = formatToolResult('Bash', { key: 'value' });
      expect(result).toContain('key');
    });
  });

  describe('constants', () => {
    test('QUIET_TOOLS contains expected tools', () => {
      expect(QUIET_TOOLS.has('EnterPlanMode')).toBe(true);
      expect(QUIET_TOOLS.has('ExitPlanMode')).toBe(true);
      expect(QUIET_TOOLS.has('Skill')).toBe(true);
      expect(QUIET_TOOLS.has('CronCreate')).toBe(true);
    });

    test('READ_ONLY_TOOLS contains expected tools', () => {
      expect(READ_ONLY_TOOLS.has('Read')).toBe(true);
      expect(READ_ONLY_TOOLS.has('Glob')).toBe(true);
      expect(READ_ONLY_TOOLS.has('Grep')).toBe(true);
    });

    test('TOOL_ICONS has entries for common tools', () => {
      expect(TOOL_ICONS['Read']).toBe('📖');
      expect(TOOL_ICONS['Bash']).toBe('⚡');
      expect(TOOL_ICONS['Edit']).toBe('✏️');
      expect(TOOL_ICONS['Write']).toBe('📝');
    });

    test('MAX_RESULT_CHARS is reasonable', () => {
      expect(MAX_RESULT_CHARS).toBeGreaterThan(0);
      expect(MAX_RESULT_CHARS).toBeLessThanOrEqual(10000);
    });

    test('MAX_RESULT_LINES is reasonable', () => {
      expect(MAX_RESULT_LINES).toBeGreaterThan(0);
      expect(MAX_RESULT_LINES).toBeLessThanOrEqual(20);
    });
  });
});
