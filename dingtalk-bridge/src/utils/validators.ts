/**
 * API 输入验证工具函数
 */

/** 验证是否为合法的 5 字段 cron 表达式（分 时 日 月 周） */
export function isValidCron(expr: string): boolean {
  if (!expr || typeof expr !== 'string') return false;

  const fields = expr.trim().split(/\s+/);
  if (fields.length !== 5) return false;

  // 每个字段允许: 数字、*、逗号分隔、连字符范围、/步长
  const fieldPattern = /^(\*|\d+(-\d+)?(,\d+(-\d+)?)*)(\/\d+)?$/;

  return fields.every(field => {
    // 预处理：将 */N 拆分为 * 和 /N
    const normalized = field.startsWith('*/') ? `*${field.slice(1)}` : field;
    return fieldPattern.test(normalized);
  });
}

/** 验证是否为正整数 */
export function isPositiveInteger(val: unknown): val is number {
  return typeof val === 'number' && Number.isInteger(val) && val > 0;
}

/** 验证是否为非负整数 */
export function isNonNegativeInteger(val: unknown): val is number {
  return typeof val === 'number' && Number.isInteger(val) && val >= 0;
}

/** 验证是否为非空字符串 ID */
export function isValidId(val: unknown): val is string {
  return typeof val === 'string' && val.trim().length > 0;
}

/** 将查询参数转为正整数，无效则返回默认值 */
export function parsePositiveInt(val: unknown, defaultValue: number, max?: number): number {
  const num = Number(val);
  if (!Number.isInteger(num) || num <= 0) return defaultValue;
  if (max && num > max) return max;
  return num;
}

/** 将查询参数转为非负整数，无效则返回默认值 */
export function parseNonNegativeInt(val: unknown, defaultValue: number, max?: number): number {
  const num = Number(val);
  if (!Number.isInteger(num) || num < 0) return defaultValue;
  if (max && num > max) return max;
  return num;
}
