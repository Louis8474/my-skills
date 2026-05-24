/**
 * 自然语言 Cron 解析器测试
 */
import { parseNaturalLanguageCron, isValidCronExpression } from '../naturalLanguage';

describe('parseNaturalLanguageCron', () => {
  test('should pass through valid cron expressions', () => {
    const result = parseNaturalLanguageCron('0 9 * * *');
    expect(result.success).toBe(true);
    expect(result.cron).toBe('0 9 * * *');
  });

  test('should parse "每天早上 9 点"', () => {
    const result = parseNaturalLanguageCron('每天早上 9 点');
    expect(result.success).toBe(true);
    expect(result.cron).toBe('0 9 * * *');
  });

  test('should parse "每小时"', () => {
    const result = parseNaturalLanguageCron('每小时');
    expect(result.success).toBe(true);
    expect(result.cron).toBe('0 * * * *');
  });

  test('should parse "每 30 分钟"', () => {
    const result = parseNaturalLanguageCron('每 30 分钟');
    expect(result.success).toBe(true);
    expect(result.cron).toBe('*/30 * * * *');
  });

  test('should parse "every day at 9"', () => {
    const result = parseNaturalLanguageCron('every day at 9');
    expect(result.success).toBe(true);
    expect(result.cron).toBe('0 9 * * *');
  });

  test('should parse "every 15 minutes"', () => {
    const result = parseNaturalLanguageCron('every 15 minutes');
    expect(result.success).toBe(true);
    expect(result.cron).toBe('*/15 * * * *');
  });

  test('should parse "每天下午 3 点"', () => {
    const result = parseNaturalLanguageCron('每天下午 3 点');
    expect(result.success).toBe(true);
    expect(result.cron).toBe('0 15 * * *');
  });

  test('should parse "每个工作日 9 点"', () => {
    const result = parseNaturalLanguageCron('每个工作日 9 点');
    expect(result.success).toBe(true);
    expect(result.cron).toBe('0 9 * * 1-5');
  });

  test('should return error for unrecognized input', () => {
    const result = parseNaturalLanguageCron('sometime next week maybe');
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});

describe('isValidCronExpression', () => {
  test('should validate correct cron expressions', () => {
    expect(isValidCronExpression('0 9 * * *')).toBe(true);
    expect(isValidCronExpression('*/5 * * * *')).toBe(true);
    expect(isValidCronExpression('0 0 1 1 *')).toBe(true);
  });

  test('should reject invalid cron expressions', () => {
    expect(isValidCronExpression('0 9 * *')).toBe(false);
    expect(isValidCronExpression('not a cron')).toBe(false);
    expect(isValidCronExpression('')).toBe(false);
  });
});
