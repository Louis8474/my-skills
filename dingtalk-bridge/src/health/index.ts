/**
 * 健康检查模块
 * 提供详细的系统健康状态检查
 */

import { config } from '../config';
import {
  getAICLICommand,
  getProviderDisplayName,
  getInstallSuggestion,
  checkCLIAvailability,
  getCLIVersion,
} from '../utils/cliChecker';

export interface HealthCheckResult {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  mode: string;
  uptime: number;
  checks: Record<string, HealthCheckItem>;
  summary: {
    passed: number;
    warnings: number;
    failed: number;
  };
}

export interface HealthCheckItem {
  status: 'pass' | 'warn' | 'fail';
  message: string;
  details?: Record<string, unknown>;
  duration?: number;
}

/**
 * 检查内存使用情况
 */
function checkMemory(): HealthCheckItem {
  const start = Date.now();
  const memUsage = process.memoryUsage();
  const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
  const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
  const rssMB = Math.round(memUsage.rss / 1024 / 1024);
  const heapUsagePercent = Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100);

  let status: 'pass' | 'warn' | 'fail' = 'pass';
  let message = `内存使用正常 (堆: ${heapUsedMB}/${heapTotalMB}MB, ${heapUsagePercent}%)`;

  if (heapUsagePercent > 90) {
    status = 'fail';
    message = `内存使用过高 (堆: ${heapUsedMB}/${heapTotalMB}MB, ${heapUsagePercent}%)`;
  } else if (heapUsagePercent > 75) {
    status = 'warn';
    message = `内存使用较高 (堆: ${heapUsedMB}/${heapTotalMB}MB, ${heapUsagePercent}%)`;
  }

  return {
    status,
    message,
    duration: Date.now() - start,
    details: {
      heapUsed: heapUsedMB,
      heapTotal: heapTotalMB,
      rss: rssMB,
      heapUsagePercent,
      external: Math.round(memUsage.external / 1024 / 1024),
    },
  };
}

/**
 * 检查 AI CLI 可用性
 */
async function checkAICLI(): Promise<HealthCheckItem> {
  const start = Date.now();
  const command = getAICLICommand();
  const providerName = getProviderDisplayName();

  // 使用共享工具检查 CLI
  const cliResult = await checkCLIAvailability();

  if (cliResult.available) {
    const version = await getCLIVersion();
    return {
      status: 'pass',
      message: `${providerName} CLI 可用 (${version || 'version unknown'})`,
      duration: Date.now() - start,
      details: {
        provider: config.aiProvider,
        command,
        version: version || 'unknown',
      },
    };
  } else {
    return {
      status: 'warn',
      message: `${providerName} CLI 不可用，消息处理功能将受限`,
      duration: Date.now() - start,
      details: {
        provider: config.aiProvider,
        command,
        error: 'CLI not available',
        suggestion: getInstallSuggestion(),
      },
    };
  }
}

/**
 * 检查 SQLite 存储（如果启用）
 */
async function checkStorage(): Promise<HealthCheckItem> {
  const start = Date.now();

  if (!config.messageQueue.enablePersistence) {
    return {
      status: 'pass',
      message: '持久化存储未启用',
      duration: Date.now() - start,
    };
  }

  try {
    const { getStorage } = await import('../storage/sqlite');
    const storage = getStorage();
    const stats = storage.getStats();

    let status: 'pass' | 'warn' | 'fail' = 'pass';
    if (stats.dbSize > 100 * 1024 * 1024) {
      status = 'warn';
    }

    return {
      status,
      message: `SQLite 存储正常 (DB 大小: ${Math.round(stats.dbSize / 1024)}KB)`,
      duration: Date.now() - start,
      details: {
        dbPath: storage.getDbPath(),
        dbSize: stats.dbSize,
        queueMessages: stats.queueMessages,
        sessions: stats.sessions,
        messageHistory: stats.messageHistory,
        retryQueue: stats.retryQueue,
      },
    };
  } catch (error) {
    return {
      status: 'warn',
      message: 'SQLite 存储检查失败',
      duration: Date.now() - start,
      details: {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

/**
 * 检查钉钉配置
 */
function checkDingtalkConfig(): HealthCheckItem {
  const start = Date.now();
  const { appKey, appSecret } = config.dingtalk;

  if (appKey && appSecret) {
    return {
      status: 'pass',
      message: '钉钉配置完整',
      duration: Date.now() - start,
      details: {
        appKeyConfigured: true,
        appSecretConfigured: true,
      },
    };
  }

  return {
    status: 'fail',
    message: '钉钉配置不完整',
    duration: Date.now() - start,
    details: {
      appKeyConfigured: !!appKey,
      appSecretConfigured: !!appSecret,
      missing: [
        !appKey ? 'DINGTALK_APP_KEY' : null,
        !appSecret ? 'DINGTALK_APP_SECRET' : null,
      ].filter(Boolean),
    },
  };
}

/**
 * 检查配置有效性
 */
function checkConfiguration(): HealthCheckItem {
  const start = Date.now();
  const issues: string[] = [];
  const warnings: string[] = [];

  // 检查超时配置
  const timeout = config.aiProvider === 'claude' ? config.claude.timeout : config.ai.timeout;
  if (timeout < 30000) {
    warnings.push(`AI 超时 ${timeout}ms 可能过短`);
  }

  // 检查并发配置
  if (config.messageQueue.maxConcurrentGlobal < config.messageQueue.maxConcurrentPerUser) {
    issues.push('全局并发数小于用户并发数');
  }

  // 检查会话配置
  if (config.session.ttl < 60000) {
    warnings.push(`会话 TTL ${config.session.ttl}ms 可能过短`);
  }

  let status: 'pass' | 'warn' | 'fail' = 'pass';
  if (issues.length > 0) {
    status = 'fail';
  } else if (warnings.length > 0) {
    status = 'warn';
  }

  return {
    status,
    message:
      status === 'pass' ? '配置检查通过' : `配置问题: ${[...issues, ...warnings].join('; ')}`,
    duration: Date.now() - start,
    details: {
      aiProvider: config.aiProvider,
      aiTimeout: timeout,
      maxConcurrentPerUser: config.messageQueue.maxConcurrentPerUser,
      maxConcurrentGlobal: config.messageQueue.maxConcurrentGlobal,
      sessionTTL: config.session.ttl,
      pollInterval: config.messageQueue.pollInterval,
      persistence: config.messageQueue.enablePersistence ? 'enabled' : 'disabled',
      issues,
      warnings,
    },
  };
}

/**
 * 执行完整健康检查
 */
export async function performHealthCheck(
  additionalChecks?: Record<string, () => Promise<HealthCheckItem>>
): Promise<HealthCheckResult> {
  // 并行执行独立的健康检查
  const [memory, aiCli, storage, dingtalkConfig, configuration] = await Promise.all([
    checkMemory(),
    checkAICLI(),
    checkStorage(),
    checkDingtalkConfig(),
    checkConfiguration(),
  ]);

  const checks: Record<string, HealthCheckItem> = {
    memory,
    aiCli,
    storage,
    dingtalkConfig,
    configuration,
  };

  // 附加检查并行执行
  if (additionalChecks) {
    const entries = Object.entries(additionalChecks);
    const additionalResults = await Promise.allSettled(entries.map(([_, checkFn]) => checkFn()));

    entries.forEach(([name], index) => {
      const result = additionalResults[index];
      if (result.status === 'fulfilled') {
        checks[name] = result.value;
      } else {
        checks[name] = {
          status: 'fail',
          message: result.reason instanceof Error ? result.reason.message : 'Unknown error',
        };
      }
    });
  }

  // 计算汇总
  const summary = {
    passed: Object.values(checks).filter(c => c.status === 'pass').length,
    warnings: Object.values(checks).filter(c => c.status === 'warn').length,
    failed: Object.values(checks).filter(c => c.status === 'fail').length,
  };

  // 确定整体状态
  let status: 'ok' | 'degraded' | 'error' = 'ok';
  if (summary.failed > 0) {
    // 关键服务失败时，状态为 error；非关键服务失败时为 degraded
    const criticalFailed =
      ['dingtalkConfig', 'configuration'].filter(n => checks[n]?.status === 'fail').length > 0;
    status = criticalFailed ? 'error' : 'degraded';
  } else if (summary.warnings > 0) {
    status = 'degraded';
  }

  return {
    status,
    timestamp: new Date().toISOString(),
    mode: 'stream',
    uptime: Math.round(process.uptime()),
    checks,
    summary,
  };
}

/**
 * 获取简单状态（用于 /health 端点）
 */
export function getSimpleStatus(): {
  status: string;
  timestamp: string;
  mode: string;
  uptime: number;
} {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    mode: 'stream',
    uptime: Math.round(process.uptime()),
  };
}

/**
 * 获取系统指标
 */
export function getSystemMetrics(): Record<string, unknown> {
  const memUsage = process.memoryUsage();

  return {
    uptime: Math.round(process.uptime()),
    memory: {
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      rss: Math.round(memUsage.rss / 1024 / 1024),
      external: Math.round(memUsage.external / 1024 / 1024),
    },
    node: {
      version: process.version,
      platform: process.platform,
      arch: process.arch,
      pid: process.pid,
    },
    config: {
      aiProvider: config.aiProvider,
      gatewayPort: config.gateway.port,
      persistence: config.messageQueue.enablePersistence,
    },
  };
}
