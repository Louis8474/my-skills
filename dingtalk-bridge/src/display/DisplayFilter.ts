import { config } from '../config';
import type { DisplayMode } from '../config';

export interface DisplayMessage {
  type: 'text' | 'thinking' | 'tool_use' | 'tool_result';
  content: string;
  toolName?: string;
}

export interface FilteredOutput {
  shouldSend: boolean;
  content: string;
}

/** 匹配 session 控制消息行的正则（不区分大小写、空格） */
const SESSION_CONTROL_RE = /^\s*\(no\s+input\s+in\s+\d+\s+min[,\s].*?auto-?resume[ds]?:.*?\)\s*$/i;

/** 匹配纯 ANSI 光标操作行（行内容全是 ANSI 码，无实际文本） */
const ANSI_ONLY_RE = /^\s*(\x1b\[[0-9;?]*[a-zA-Z]|\x1b\][^\x07]*\x07|\x1b[()][B0UK])+\s*$/;

export class DisplayFilter {
  private mode: DisplayMode;
  private quietBuffer: string = '';

  constructor(mode?: DisplayMode) {
    this.mode = mode ?? config.display.mode;
  }

  filter(message: DisplayMessage): FilteredOutput {
    switch (this.mode) {
      case 'quiet':
        return this.filterQuiet(message);
      case 'compact':
        return this.filterCompact(message);
      case 'full':
        return this.filterFull(message);
    }
  }

  /**
   * 移除 ANSI 转义码（与 executor.ts 保持一致）
   */
  private stripAnsiCodes(str: string): string {
    let result = str.replace(/\x1b\[[?<>]?[0-9;]*[a-zA-Z]/g, '');
    result = result.replace(/\x1b\][^\x07]*\x07/g, '');
    result = result.replace(/\x1b\][^\x1b]*\x1b\\/g, '');
    result = result.replace(/\x1b[0-9:;<=>?]/g, '');
    result = result.replace(/\x1b[()][B0UK]/g, '');
    result = result.replace(/\r\n/g, '\n').replace(/\r/g, '');
    return result;
  }

  /**
   * 移除 Claude session 控制消息和无效行
   */
  private stripSessionControl(str: string): string {
    return str
      .split('\n')
      .filter(line => {
        const t = line.trim();
        return t.length > 0 && !SESSION_CONTROL_RE.test(t) && !ANSI_ONLY_RE.test(t);
      })
      .join('\n');
  }

  /**
   * 统一清洗入口：剥离 ANSI + 过滤 session 控制消息
   */
  private sanitize(raw: string): string {
    return this.stripSessionControl(this.stripAnsiCodes(raw));
  }

  private filterQuiet(message: DisplayMessage): FilteredOutput {
    if (message.type === 'text') {
      const cleaned = this.sanitize(message.content);
      this.quietBuffer += cleaned;
      return { shouldSend: false, content: '' };
    }
    return { shouldSend: false, content: '' };
  }

  /**
   * 刷新缓冲区，返回累积的文本（用于流式结束时一次性发送）
   */
  flush(): FilteredOutput {
    if (this.mode !== 'quiet') {
      return { shouldSend: false, content: '' };
    }
    const content = this.quietBuffer.trim();
    this.quietBuffer = '';
    if (content) {
      return { shouldSend: true, content: content + '\n\n✅ 完成' };
    }
    return { shouldSend: false, content: '' };
  }

  private filterCompact(message: DisplayMessage): FilteredOutput {
    const cleaned = this.sanitize(message.content);
    if (!cleaned) return { shouldSend: false, content: '' };

    switch (message.type) {
      case 'text':
        return { shouldSend: true, content: cleaned };
      case 'thinking':
        if (!config.display.thinkingMessages) {
          return { shouldSend: false, content: '' };
        }
        return {
          shouldSend: true,
          content: this.truncate(cleaned, config.display.thinkingMaxLen, '💭 '),
        };
      case 'tool_use':
        if (!config.display.toolMessages) {
          return { shouldSend: false, content: '' };
        }
        return {
          shouldSend: true,
          content: this.truncate(
            `🔧 ${message.toolName || 'tool'}: ${cleaned}`,
            config.display.toolMaxLen
          ),
        };
      case 'tool_result':
        return { shouldSend: false, content: '' };
    }
  }

  private filterFull(message: DisplayMessage): FilteredOutput {
    const cleaned = this.sanitize(message.content);
    if (!cleaned) return { shouldSend: false, content: '' };

    switch (message.type) {
      case 'text':
        return { shouldSend: true, content: cleaned };
      case 'thinking':
        return {
          shouldSend: true,
          content: this.truncate(cleaned, config.display.thinkingMaxLen, '💭 '),
        };
      case 'tool_use':
        return {
          shouldSend: true,
          content: this.truncate(
            `🔧 ${message.toolName || 'tool'}: ${cleaned}`,
            config.display.toolMaxLen
          ),
        };
      case 'tool_result':
        return {
          shouldSend: true,
          content: this.truncate(cleaned, config.display.toolMaxLen, '📋 '),
        };
    }
  }

  private truncate(text: string, maxLen: number, prefix = ''): string {
    const prefixed = prefix + text;
    if (prefixed.length <= maxLen) return prefixed;
    return prefixed.slice(0, Math.max(1, maxLen - 15)) + '...(truncated)';
  }

  setMode(mode: DisplayMode): void {
    this.mode = mode;
  }

  getMode(): DisplayMode {
    return this.mode;
  }
}
