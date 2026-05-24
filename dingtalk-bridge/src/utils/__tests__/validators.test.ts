/**
 * API 输入验证工具测试
 */
import {
  isValidCron,
  isPositiveInteger,
  isNonNegativeInteger,
  isValidId,
  parsePositiveInt,
  parseNonNegativeInt,
} from '../validators';

describe('isValidCron', () => {
  it('accepts standard 5-field expressions', () => {
    expect(isValidCron('* * * * *')).toBe(true);
    expect(isValidCron('0 9 * * 1')).toBe(true);
    expect(isValidCron('0-30 8-18 * * 1-5')).toBe(true);
    expect(isValidCron('*/5 * * * *')).toBe(true);
    expect(isValidCron('0,15,30,45 * * * *')).toBe(true);
  });

  it('rejects wrong field count', () => {
    expect(isValidCron('* * * *')).toBe(false);
    expect(isValidCron('* * * * * *')).toBe(false);
  });

  it('rejects malformed fields', () => {
    expect(isValidCron('?? * * * *')).toBe(false);
    expect(isValidCron('abc * * * *')).toBe(false);
  });

  it('rejects empty / non-string input', () => {
    expect(isValidCron('')).toBe(false);
    expect(isValidCron(undefined as unknown as string)).toBe(false);
    expect(isValidCron(null as unknown as string)).toBe(false);
    expect(isValidCron(123 as unknown as string)).toBe(false);
  });
});

describe('isPositiveInteger', () => {
  it('accepts positive integers', () => {
    expect(isPositiveInteger(1)).toBe(true);
    expect(isPositiveInteger(120000)).toBe(true);
  });

  it('rejects zero, negative, decimals, non-numbers', () => {
    expect(isPositiveInteger(0)).toBe(false);
    expect(isPositiveInteger(-1)).toBe(false);
    expect(isPositiveInteger(1.5)).toBe(false);
    expect(isPositiveInteger('1')).toBe(false);
    expect(isPositiveInteger(NaN)).toBe(false);
    expect(isPositiveInteger(undefined)).toBe(false);
  });
});

describe('isNonNegativeInteger', () => {
  it('accepts zero and positives', () => {
    expect(isNonNegativeInteger(0)).toBe(true);
    expect(isNonNegativeInteger(100)).toBe(true);
  });

  it('rejects negative, decimal, non-number', () => {
    expect(isNonNegativeInteger(-1)).toBe(false);
    expect(isNonNegativeInteger(2.5)).toBe(false);
    expect(isNonNegativeInteger('0')).toBe(false);
    expect(isNonNegativeInteger(null)).toBe(false);
  });
});

describe('isValidId', () => {
  it('accepts non-empty strings', () => {
    expect(isValidId('abc')).toBe(true);
    expect(isValidId('rule-1')).toBe(true);
  });

  it('rejects empty / whitespace / non-string', () => {
    expect(isValidId('')).toBe(false);
    expect(isValidId('   ')).toBe(false);
    expect(isValidId(123)).toBe(false);
    expect(isValidId(undefined)).toBe(false);
  });
});

describe('parsePositiveInt', () => {
  it('returns parsed value when valid', () => {
    expect(parsePositiveInt('10', 1)).toBe(10);
    expect(parsePositiveInt(5, 1)).toBe(5);
  });

  it('returns default for invalid input', () => {
    expect(parsePositiveInt('abc', 7)).toBe(7);
    expect(parsePositiveInt(0, 7)).toBe(7);
    expect(parsePositiveInt(-1, 7)).toBe(7);
    expect(parsePositiveInt(1.5, 7)).toBe(7);
    expect(parsePositiveInt(undefined, 7)).toBe(7);
  });

  it('clamps to max when provided', () => {
    expect(parsePositiveInt('500', 1, 100)).toBe(100);
    expect(parsePositiveInt('50', 1, 100)).toBe(50);
  });
});

describe('parseNonNegativeInt', () => {
  it('returns parsed value when valid', () => {
    expect(parseNonNegativeInt('0', 5)).toBe(0);
    expect(parseNonNegativeInt('20', 5)).toBe(20);
  });

  it('returns default for invalid input', () => {
    expect(parseNonNegativeInt('-1', 5)).toBe(5);
    expect(parseNonNegativeInt('abc', 5)).toBe(5);
    expect(parseNonNegativeInt(1.5, 5)).toBe(5);
  });

  it('clamps to max when provided', () => {
    expect(parseNonNegativeInt('999', 0, 100)).toBe(100);
  });
});
