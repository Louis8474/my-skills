/**
 * 工具调用格式化 - 共享模块
 *
 * 供 streamingCard.ts 和 proxyClient.ts 复用，
 * 避免格式化逻辑重复导致行为不一致。
 */

/** 单个工具结果显示的最大字符数 */
export const MAX_RESULT_CHARS = 2000;

/** 单个工具结果显示的最大行数 */
export const MAX_RESULT_LINES = 6;

/** 不需要展示结果的工具 */
export const QUIET_TOOLS = new Set([
  'ToolSearch',
  'EnterPlanMode',
  'ExitPlanMode',
  'EnterWorktree',
  'ExitWorktree',
  'Skill',
  'CronCreate',
  'CronDelete',
  'CronList',
]);

/** 只读工具：紧凑显示 */
export const READ_ONLY_TOOLS = new Set(['Read', 'Glob', 'Grep', 'ToolSearch']);

/** 工具图标映射 */
export const TOOL_ICONS: Record<string, string> = {
  Read: '📖',
  Bash: '⚡',
  Edit: '✏️',
  Write: '📝',
  Glob: '🔍',
  Grep: '🔎',
  WebFetch: '🌐',
  WebSearch: '🔎',
  Agent: '🤖',
  NotebookEdit: '📓',
  TaskCreate: '📋',
  TaskUpdate: '📋',
  TaskGet: '📋',
  TaskList: '📋',
  TodoWrite: '📋',
  mcp__computer_use__: '🖥️',
  mcp__node_repl__: '📦',
  BrowserTool: '🌐',
};

/** 缩短文件路径，只保留最后 3 级目录 */
export function shortenPath(filePath: string): string {
  if (!filePath) return '';
  const parts = filePath.replace(/\\/g, '/').split('/');
  if (parts.length <= 3) return parts.join('/');
  return '.../' + parts.slice(-3).join('/');
}

/** 格式化工具调用（展示工具名称和关键参数） */
export function formatToolCall(name: string, input: Record<string, unknown>): string {
  const icon = TOOL_ICONS[name] || '🔧';

  switch (name) {
    case 'Read': {
      const fp = shortenPath(input.file_path as string);
      return `\n\n${icon} **Read** \`${fp}\``;
    }
    case 'Bash': {
      const cmd = ((input.command as string) || '').substring(0, 300);
      return `\n\n${icon} **Bash**\n\`\`\`\n${cmd}\n\`\`\``;
    }
    case 'Edit': {
      const fp = shortenPath(input.file_path as string);
      return `\n\n${icon} **Edit** \`${fp}\``;
    }
    case 'Write':
      return `\n\n${icon} **Write** \`${shortenPath(input.file_path as string)}\``;
    case 'Glob':
      return `\n\n${icon} **Glob** \`${input.pattern}\``;
    case 'Grep':
      return `\n\n${icon} **Grep** \`${input.pattern}\``;
    default: {
      let paramStr = '';
      const entries = Object.entries(input);
      if (entries.length > 0) {
        const val = entries[0][1];
        if (typeof val === 'string' && val.length < 100) paramStr = ` \`${val}\``;
      }
      return `\n\n${icon} **${name}**${paramStr}`;
    }
  }
}

/** 格式化工具结果（截断、归类展示） */
export function formatToolResult(toolName: string, content: unknown): string {
  if (QUIET_TOOLS.has(toolName)) return '';

  // 归一化 content
  if (content == null) {
    content = '';
  } else if (Array.isArray(content)) {
    const refs = content.filter(
      (c: unknown) =>
        typeof c === 'object' &&
        c !== null &&
        'type' in c &&
        (c as { type: string }).type === 'tool_reference'
    );
    if (refs.length > 0) return '';
    content = '';
  } else if (typeof content !== 'string') {
    content = JSON.stringify(content, null, 2);
  }

  const text = (content as string).trim();
  const isReadOnly = READ_ONLY_TOOLS.has(toolName);

  // 只读工具：追加行数
  if (isReadOnly) {
    if (!text) return ' _(empty)_';
    const lineCount = text.split('\n').length;
    return ` _(${lineCount} lines)_`;
  }

  // Edit/Write 成功
  if (
    (toolName === 'Edit' || toolName === 'Write') &&
    text &&
    (text.includes('successfully') || text.includes('updated') || text.includes('created'))
  ) {
    return `\n> ✅ ${text.split('\n')[0]}`;
  }

  // 无输出
  if (!text) return '\n> _(no output)_';

  // 截断
  let resultStr = text;
  if (resultStr.length > MAX_RESULT_CHARS) {
    resultStr = resultStr.substring(0, MAX_RESULT_CHARS);
  }
  const lines = resultStr.split('\n');
  const showLines = lines.slice(0, MAX_RESULT_LINES);
  const truncated = lines.length > MAX_RESULT_LINES;

  // Bash 输出用代码块
  if (toolName === 'Bash') {
    let block = '\n```\n' + showLines.join('\n');
    if (truncated) block += `\n... (+${lines.length - MAX_RESULT_LINES} lines)`;
    block += '\n```';
    return block;
  }

  // TodoWrite 特殊格式
  if (toolName === 'TodoWrite') {
    return '\n' + lines.map(line => `> ${line}`).join('\n');
  }

  // 其他工具：代码块
  let block = '\n```\n' + showLines.join('\n');
  if (truncated) block += `\n... (+${lines.length - MAX_RESULT_LINES} lines)`;
  block += '\n```';
  return block;
}
