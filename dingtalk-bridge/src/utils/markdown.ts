/**
 * Markdown 渲染器 - 增强版
 * 
 * 增强：
 * 1. 行首空格 → 不换行空格（防止 Markdown 吞缩进）
 * 2. 非空行之间的单个 \n → 尾部两空格强制换行
 * 3. 代码块内不做处理
 * 4. 钉钉 Markdown 兼容性适配
 */
export interface RenderedContent {
  text: string;
  type: 'text' | 'markdown';
}

export class MarkdownRenderer {
  render(content: string): RenderedContent {
    if (!content) return { text: '', type: 'text' };
    return { text: this.convert(content), type: 'markdown' };
  }

  private convert(c: string): string {
    let r = c;

    // 先保护代码块，不做处理
    const codeBlocks: string[] = [];
    r = r.replace(/```[\s\S]*?```/g, (match) => {
      codeBlocks.push(match);
      return `__CODE_BLOCK_${codeBlocks.length - 1}__`;
    });

    // 行内代码也保护
    const inlineCodes: string[] = [];
    r = r.replace(/`[^`\n]+`/g, (match) => {
      inlineCodes.push(match);
      return `__INLINE_CODE_${inlineCodes.length - 1}__`;
    });

    // 1. 行首空格 → 不换行空格（防止 Markdown 吞缩进）
    r = r.replace(/^(\s+)/gm, (match) => {
      return '\u00A0'.repeat(match.length);
    });

    // 2. 非空行之间的单个换行 → 尾部两空格强制换行
    r = r.replace(/([^\n])\n([^\n])/g, '$1  \n$2');

    // 3. 标题转换（钉钉不支持 # 语法，用加粗代替）
    r = r.replace(/^#{1,6}\s+(.+)$/gm, '**$1**');

    // 4. 斜体 → 加粗（钉钉对斜体支持不好）
    r = r.replace(/\*([^*]+)\*/g, '**$1**');

    // 5. 列表转换
    r = r.replace(/^[-*+]\s+(.+)$/gm, '• $1');

    // 6. 有序列表
    r = r.replace(/^\d+\.\s+(.+)$/gm, '• $1');

    // 7. 代码块修饰（确保有语言标识）
    r = r.replace(/```(\w*)\n([\s\S]*?)```/g, (_m: string, l: string, code: string) => {
      return '```' + (l || 'text') + '\n' + code.trim() + '\n```';
    });

    // 还原行内代码
    inlineCodes.forEach((code, i) => {
      r = r.replace(`__INLINE_CODE_${i}__`, code);
    });

    // 还原代码块
    codeBlocks.forEach((block, i) => {
      r = r.replace(`__CODE_BLOCK_${i}__`, block);
    });

    // 最后再做一次代码块修正
    r = r.replace(/```(\w*)\n([\s\S]*?)```/g, (_m: string, l: string, code: string) => {
      return '```' + (l || 'text') + '\n' + code.trim() + '\n```';
    });

    return r;
  }

  formatCodeBlock(code: string, lang?: string): string {
    return '```' + (lang || 'text') + '\n' + code.trim() + '\n```';
  }

  /**
   * 钉钉 Markdown 预处理
   * 参考 cc-connect 的 preprocessDingTalkMarkdown
   */
  preprocessDingTalkMarkdown(text: string): string {
    if (!text) return text;

    const codeBlocks: string[] = [];
    let result = text;

    // 保护代码块
    result = result.replace(/```[\s\S]*?```/g, (match) => {
      codeBlocks.push(match);
      return `__CODE_BLOCK_${codeBlocks.length - 1}__`;
    });

    // 行首空格 → 不换行空格
    result = result.replace(/^(\s+)/gm, (match) => {
      return '\u00A0'.repeat(match.length);
    });

    // 非空行间的单个换行 → 两空格+换行
    result = result.replace(/([^\n])\n([^\n])/g, '$1  \n$2');

    // 还原代码块
    codeBlocks.forEach((block, i) => {
      result = result.replace(`__CODE_BLOCK_${i}__`, block);
    });

    return result;
  }
}

export function createMarkdownRenderer(): MarkdownRenderer {
  return new MarkdownRenderer();
}

export function renderMarkdown(content: string): string {
  return createMarkdownRenderer().render(content).text;
}

export function preprocessDingTalkMarkdown(content: string): string {
  return createMarkdownRenderer().preprocessDingTalkMarkdown(content);
}
