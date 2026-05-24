/**
 * CLI 检查工具 - 提供 AI CLI 可用性检查的共享工具函数
 */
import { config } from '../config';
import { spawn } from 'child_process';

// 缓存配置
const CACHE_TTL = 60000; // 60秒缓存
const availabilityCache = new Map<string, { available: boolean; lastChecked: number }>();

export interface CLICheckResult {
  available: boolean;
  version?: string;
  error?: string;
}

export interface DegradationResult {
  available: boolean;
  message: string;
  suggestion?: string;
}

/**
 * 获取当前 AI Provider 的 CLI 命令
 */
export function getAICLICommand(): string {
  return config.aiProvider === 'claude' ? config.claude.command : config.ai.command;
}

/**
 * 获取 Provider 显示名称
 */
export function getProviderDisplayName(provider?: string): string {
  const p = provider || config.aiProvider;
  return p === 'claude' ? 'Claude Code' : 'OpenCode';
}

/**
 * 获取 CLI 安装建议
 */
export function getInstallSuggestion(provider?: string): string {
  const p = provider || config.aiProvider;
  return p === 'claude' ? 'brew install anthropic/claude/claude' : 'npm install -g opencode';
}

/**
 * 检查 CLI 可用性（带缓存）
 * @param provider 可选的 provider 覆盖，默认使用配置中的 provider
 * @param forceRefresh 是否强制刷新缓存
 */
export async function checkCLIAvailability(
  provider?: string,
  forceRefresh: boolean = false
): Promise<DegradationResult> {
  const p = provider || config.aiProvider;
  const command = p === 'claude' ? config.claude.command : config.ai.command;

  // 检查缓存（除非强制刷新）
  if (!forceRefresh) {
    const cached = availabilityCache.get(p);
    if (cached && Date.now() - cached.lastChecked < CACHE_TTL) {
      if (!cached.available) {
        return {
          available: false,
          message: `${getProviderDisplayName(p)} CLI 当前不可用`,
          suggestion: getInstallSuggestion(p),
        };
      }
      return { available: true, message: 'CLI 可用' };
    }
  }

  // 执行检查
  try {
    const result = await checkCLIWithSpawn(command);

    availabilityCache.set(p, { available: result.available, lastChecked: Date.now() });

    if (result.available) {
      return { available: true, message: 'CLI 可用' };
    } else {
      return {
        available: false,
        message: `${getProviderDisplayName(p)} CLI 未安装或不可用`,
        suggestion: getInstallSuggestion(p),
      };
    }
  } catch (_error) {
    availabilityCache.set(p, { available: false, lastChecked: Date.now() });
    return {
      available: false,
      message: `${getProviderDisplayName(p)} CLI 未找到`,
      suggestion: getInstallSuggestion(p),
    };
  }
}

/**
 * 使用 spawn 检查 CLI 可用性
 */
function checkCLIWithSpawn(command: string): Promise<{ available: boolean; version?: string }> {
  return new Promise(resolve => {
    const proc = spawn(command, ['--version'], { stdio: 'ignore' });
    let resolved = false;

    const doResolve = (available: boolean, version?: string) => {
      if (resolved) return;
      resolved = true;
      resolve({ available, version });
    };

    const timeoutId = setTimeout(() => {
      if (!proc.killed) {
        proc.kill();
      }
      doResolve(false);
    }, 5000);

    proc.on('close', code => {
      clearTimeout(timeoutId);
      doResolve(code === 0);
    });

    proc.on('error', () => {
      clearTimeout(timeoutId);
      doResolve(false);
    });
  });
}

/**
 * 获取 CLI 版本
 */
export async function getCLIVersion(): Promise<string | null> {
  const command = getAICLICommand();

  try {
    const { execSync } = await import('child_process');
    const stdout = execSync(`${command} --version`, { timeout: 5000, encoding: 'utf-8' });
    return stdout.trim().split('\n')[0] || null;
  } catch {
    return null;
  }
}

/**
 * 清除 CLI 可用性缓存
 */
export function clearCLICache(): void {
  availabilityCache.clear();
}
