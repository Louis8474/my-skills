/**
 * AI CLI 不可用时的优雅降级处理
 */

import { checkCLIAvailability, clearCLICache } from '../utils/cliChecker';

export interface DegradationResult {
  available: boolean;
  message: string;
  suggestion?: string;
}

/**
 * 检查 AI CLI 是否可用（带缓存）
 */
async function checkAICLIAvailability(): Promise<DegradationResult> {
  // 使用共享工具检查 CLI（带缓存）
  return checkCLIAvailability();
}

/**
 * 生成降级响应消息
 */
export function generateDegradationResponse(result: DegradationResult): string {
  const blocks: string[] = [];

  blocks.push('## ⚠️ AI 服务暂时不可用');
  blocks.push('');
  blocks.push(result.message);

  if (result.suggestion) {
    blocks.push('');
    blocks.push('### 安装指南');
    blocks.push('```bash');
    blocks.push(result.suggestion);
    blocks.push('```');
  }

  blocks.push('');
  blocks.push('---');
  blocks.push('💡 *您的消息已记录，服务恢复后将自动处理*');

  return blocks.join('\n');
}

/**
 * 清除可用性缓存
 */
export function clearAvailabilityCache(): void {
  clearCLICache();
}
