/**
 * AI 降级处理测试
 */
import { generateDegradationResponse, clearAvailabilityCache } from '../aiDegradation';

describe('generateDegradationResponse', () => {
  it('should include warning header', () => {
    const result = generateDegradationResponse({
      available: false,
      message: 'AI CLI is not installed',
    });
    expect(result).toContain('AI 服务暂时不可用');
    expect(result).toContain('AI CLI is not installed');
  });

  it('should include install suggestion when provided', () => {
    const result = generateDegradationResponse({
      available: false,
      message: 'CLI not found',
      suggestion: 'npm install -g opencode',
    });
    expect(result).toContain('安装指南');
    expect(result).toContain('npm install -g opencode');
  });

  it('should not include install section when no suggestion', () => {
    const result = generateDegradationResponse({
      available: true,
      message: 'All good',
    });
    expect(result).not.toContain('安装指南');
  });

  it('should include message recording note', () => {
    const result = generateDegradationResponse({
      available: false,
      message: 'Something wrong',
    });
    expect(result).toContain('您的消息已记录');
  });
});

describe('clearAvailabilityCache', () => {
  it('should call clearCLICache indirectly (no error thrown)', () => {
    expect(() => clearAvailabilityCache()).not.toThrow();
  });
});
