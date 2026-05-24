/**
 * 自然语言 Cron 解析器
 *
 * 将自然语言描述转换为 cron 表达式。
 * 支持常见的中文和英文自然语言时间描述。
 */

/** 预定义的自然语言映射 */
const NATURAL_LANGUAGE_PATTERNS: Array<{
  pattern: RegExp;
  cron: string;
  description: string;
}> = [
  // 中文模式
  {
    pattern: /每(天|日)早上\s*(\d+)\s*点/,
    cron: '0 {{HOUR}} * * *',
    description: '每天早上 {{HOUR}} 点',
  },
  {
    pattern: /每(天|日)下午\s*(\d+)\s*点/,
    cron: '0 {{HOUR_PM}} * * *',
    description: '每天下午 {{HOUR}} 点',
  },
  { pattern: /每(天|日)\s*(\d+)\s*点/, cron: '0 {{HOUR}} * * *', description: '每天 {{HOUR}} 点' },
  { pattern: /每小时/, cron: '0 * * * *', description: '每小时' },
  { pattern: /每\s*(\d+)\s*分钟/, cron: '*/{{MIN}} * * * *', description: '每 {{MIN}} 分钟' },
  {
    pattern: /每周([一二三四五六日天])\s*(\d+)\s*点/,
    cron: '0 {{HOUR}} * * {{DOW}}',
    description: '每周{{DOW_NAME}} {{HOUR}} 点',
  },
  {
    pattern: /每个?工作日\s*(\d+)\s*点/,
    cron: '0 {{HOUR}} * * 1-5',
    description: '每个工作日 {{HOUR}} 点',
  },
  { pattern: /每天/, cron: '0 9 * * *', description: '每天（默认 9:00）' },

  // 英文模式
  {
    pattern: /every\s+day\s+at\s+(\d+)/i,
    cron: '0 {{HOUR}} * * *',
    description: 'every day at {{HOUR}}:00',
  },
  { pattern: /every\s+hour/i, cron: '0 * * * *', description: 'every hour' },
  {
    pattern: /every\s+(\d+)\s+minutes?/i,
    cron: '*/{{MIN}} * * * *',
    description: 'every {{MIN}} minutes',
  },
  {
    pattern: /every\s+weekday\s+at\s+(\d+)/i,
    cron: '0 {{HOUR}} * * 1-5',
    description: 'every weekday at {{HOUR}}:00',
  },
];

/** 中文星期映射 */
const DOW_MAP: Record<string, string> = {
  一: '1',
  二: '2',
  三: '3',
  四: '4',
  五: '5',
  六: '6',
  日: '0',
  天: '0',
};

/** 解析结果 */
export interface NaturalLanguageCronResult {
  /** 是否成功解析 */
  success: boolean;
  /** 生成的 cron 表达式 */
  cron?: string;
  /** 解析描述 */
  description?: string;
  /** 错误消息 */
  error?: string;
}

/**
 * 将自然语言转换为 cron 表达式
 */
export function parseNaturalLanguageCron(input: string): NaturalLanguageCronResult {
  const trimmed = input.trim();

  // 如果已经是标准 cron 格式，直接返回
  const cronParts = trimmed.split(/\s+/);
  if (cronParts.length === 5 && /^[\d*/,-]+$/.test(cronParts.join(''))) {
    return {
      success: true,
      cron: trimmed,
      description: `Cron: ${trimmed}`,
    };
  }

  // 尝试匹配自然语言模式
  for (const pattern of NATURAL_LANGUAGE_PATTERNS) {
    const match = trimmed.match(pattern.pattern);
    if (match) {
      let cron = pattern.cron;
      let description = pattern.description;

      // 提取数字参数
      const numbers = match.filter((m, i) => i > 0 && /^\d+$/.test(m));

      // 替换小时
      if (cron.includes('{{HOUR}}')) {
        const hour = numbers.length > 0 ? parseInt(numbers[0], 10) : 9;
        cron = cron.replace('{{HOUR}}', String(hour));
        description = description.replace('{{HOUR}}', String(hour));
      }

      // 替换下午小时
      if (cron.includes('{{HOUR_PM}}')) {
        let hour = numbers.length > 0 ? parseInt(numbers[0], 10) : 3;
        if (hour < 12) hour += 12;
        cron = cron.replace('{{HOUR_PM}}', String(hour));
        description = description.replace('{{HOUR}}', String(hour));
      }

      // 替换分钟
      if (cron.includes('{{MIN}}')) {
        const min = numbers.length > 0 ? parseInt(numbers[0], 10) : 30;
        cron = cron.replace('{{MIN}}', String(min));
        description = description.replace('{{MIN}}', String(min));
      }

      // 替换星期
      if (cron.includes('{{DOW}}')) {
        const dowMatch = trimmed.match(/周([一二三四五六日天])/);
        if (dowMatch) {
          const dow = DOW_MAP[dowMatch[1]] || '1';
          cron = cron.replace('{{DOW}}', dow);
          description = description.replace('{{DOW_NAME}}', dowMatch[1]);
        }
      }

      return {
        success: true,
        cron,
        description,
      };
    }
  }

  return {
    success: false,
    error: `无法解析自然语言时间描述: "${trimmed}"。请使用 cron 格式或自然语言（如"每天早上 9 点"）`,
  };
}

/**
 * 验证 cron 表达式是否合法（基本校验）
 */
export function isValidCronExpression(cron: string): boolean {
  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) return false;

  const partPattern = /^(\d+|\*(?:\/\d+)?|\d+-\d+|\d+(?:,\d+)*)$/;
  return parts.every(part => partPattern.test(part));
}
