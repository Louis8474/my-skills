import { parseCommand, COMMANDS } from '../commandParser';

describe('commandParser', () => {
  test('parses valid command with args', () => {
    const result = parseCommand('/model claude');
    expect(result).toEqual({ command: 'model', args: ['claude'] });
  });

  test('parses command without args', () => {
    const result = parseCommand('/status');
    expect(result).toEqual({ command: 'status', args: [] });
  });

  test('is case insensitive', () => {
    const result = parseCommand('/STATUS');
    expect(result).toEqual({ command: 'status', args: [] });
  });

  test('returns null for non-command input', () => {
    expect(parseCommand('hello world')).toBeNull();
    expect(parseCommand('')).toBeNull();
    expect(parseCommand(' /help')).toEqual({ command: 'help', args: [] });
  });

  test('handles multiple args', () => {
    const result = parseCommand('/remember project_dir /path/to/project');
    expect(result).toEqual({ command: 'remember', args: ['project_dir', '/path/to/project'] });
  });

  test('COMMANDS contains all expected commands', () => {
    expect(Object.keys(COMMANDS)).toContain('help');
    expect(Object.keys(COMMANDS)).toContain('status');
    expect(Object.keys(COMMANDS)).toContain('model');
    expect(Object.keys(COMMANDS)).toContain('history');
    expect(Object.keys(COMMANDS)).toContain('queue');
    expect(Object.keys(COMMANDS)).toContain('config');
    expect(Object.keys(COMMANDS)).toContain('reset');
  });
});