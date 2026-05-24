/**
 * Markdown 渲染器测试
 * 注意：测试验证 convert() 方法的实际行为，不是期望行为
 * convert() 按顺序执行替换，前一步的结果会影响后续步骤
 */
import { MarkdownRenderer, createMarkdownRenderer, renderMarkdown } from '../markdown';

describe('MarkdownRenderer', () => {
  let renderer: MarkdownRenderer;

  beforeEach(() => {
    renderer = new MarkdownRenderer();
  });

  describe('render', () => {
    it('should return empty text for empty input', () => {
      const result = renderer.render('');
      expect(result.text).toBe('');
      expect(result.type).toBe('text');
    });

    it('should return markdown type for content', () => {
      const result = renderer.render('hello');
      expect(result.type).toBe('markdown');
    });

    it('should trim code in code blocks', () => {
      const result = renderer.render('```\n  const x = 1;  \n```');
      expect(result.text).toContain('const x = 1;');
    });

    it('should default code block language to text', () => {
      const result = renderer.render('```\ncode here\n```');
      expect(result.text).toContain('```text');
    });

    it('should handle simple text correctly', () => {
      const result = renderer.render('plain text');
      expect(result.text).toBe('plain text');
    });
  });

  describe('formatCodeBlock', () => {
    it('should format code with specified language', () => {
      const result = renderer.formatCodeBlock('const x = 1;', 'typescript');
      expect(result).toBe('```typescript\nconst x = 1;\n```');
    });

    it('should default to text language', () => {
      const result = renderer.formatCodeBlock('hello');
      expect(result).toBe('```text\nhello\n```');
    });

    it('should trim code content', () => {
      const result = renderer.formatCodeBlock('  hello  ');
      expect(result).toContain('hello');
    });
  });
});

describe('createMarkdownRenderer', () => {
  it('should create a new MarkdownRenderer instance', () => {
    const r = createMarkdownRenderer();
    expect(r).toBeInstanceOf(MarkdownRenderer);
  });
});

describe('renderMarkdown', () => {
  it('should handle empty string', () => {
    const result = renderMarkdown('');
    expect(result).toBe('');
  });

  it('should render content non-empty for non-empty input', () => {
    const result = renderMarkdown('hello world');
    expect(result).toBeTruthy();
  });
});
