/**
 * 状态与诊断路由
 */
import { Router, Request, Response } from 'express';
import { config } from '../../config';
import type { SessionManager } from '../../session-manager';
import type { MessageQueue } from '../../message-queue/messageQueue';
import type { RateLimiter } from '../../message-queue/rateLimiter';
import type { ConcurrencyController } from '../../message-queue/concurrencyController';
import type { RetrySender } from '../retrySender';
import type { OpenCodeExecutor } from '../../opencode';
import type { ClaudeCodeExecutor } from '../../claude';

export interface StatusRouterDeps {
  getSessionManager: () => SessionManager;
  getMessageQueue: () => MessageQueue;
  getRateLimiter: () => RateLimiter;
  getConcurrencyController: () => ConcurrencyController;
  getRetrySender: () => RetrySender;
  getOpenCodeExecutor: () => OpenCodeExecutor;
  getClaudeCodeExecutor: () => ClaudeCodeExecutor;
}

export function createStatusRoutes(deps: StatusRouterDeps): Router {
  const router = Router();

  // 健康检查
  router.get('/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      mode: 'stream',
    });
  });

  // 测试接口
  // eslint-disable-next-line @typescript-eslint/no-misused-promises, @typescript-eslint/require-await
  router.post('/api/test', async (req: Request, res: Response) => {
    // processMessage 需要由 GatewayServer 注入
    // 这里只做占位，实际处理在 index.ts 中
    res.status(501).json({ success: false, message: '请通过 GatewayServer 注入处理逻辑' });
  });

  // 获取会话状态
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  router.get('/api/sessions', async (_req: Request, res: Response) => {
    const stats = await deps.getSessionManager().getStats();
    res.json({
      success: true,
      data: stats,
    });
  });

  // 获取队列状态
  router.get('/api/queue', (_req: Request, res: Response) => {
    res.json({
      success: true,
      data: deps.getMessageQueue().getStatus(),
    });
  });

  // 检查 AI Provider 状态
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  router.get('/api/status', async (_req: Request, res: Response) => {
    const [opencodeAvailable, claudeAvailable] = await Promise.all([
      deps.getOpenCodeExecutor().isAvailable(),
      deps.getClaudeCodeExecutor().isAvailable(),
    ]);
    const queueStatus = deps.getMessageQueue().getStatus();
    const retryQueueStats = deps.getRetrySender().getStats();
    const rateLimitStatus = {
      maxTokensPerUser: deps.getRateLimiter().getMaxTokens(),
      currentUsers: deps.getRateLimiter().getUserCount(),
    };
    const concurrencyStatus = {
      maxPerUser: deps.getConcurrencyController().getMaxSlotsPerUser(),
      maxGlobal: deps.getConcurrencyController().getMaxGlobalSlots(),
      availablePerUser: deps.getConcurrencyController().getAvailableSlots('testUser'),
      availableGlobal: deps.getConcurrencyController().getAvailableGlobalSlots(),
    };

    res.json({
      success: true,
      data: {
        aiProvider: config.aiProvider,
        opencode: {
          available: opencodeAvailable,
          command: config.ai.command,
          timeout: config.ai.timeout,
          maxRetries: config.ai.maxRetries,
        },
        claude: {
          available: claudeAvailable,
          command: config.claude.command,
          timeout: config.claude.timeout,
          maxRetries: config.claude.maxRetries,
        },
        messageQueue: {
          pending: queueStatus.queued,
          processing: queueStatus.processing,
          byPriority: queueStatus.byPriority,
        },
        retryQueue: retryQueueStats,
        rateLimit: rateLimitStatus,
        concurrency: concurrencyStatus,
        persistentSession: {
          enabled: config.persistentSession.enabled,
          pool: deps.getClaudeCodeExecutor().getSessionPoolStatus(),
        },
      },
    });
  });

  // 系统诊断
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  router.get('/api/doctor', async (_req: Request, res: Response) => {
    const { runDoctor } = await import('../../utils/doctor');
    const results = await runDoctor();

    const passCount = results.filter(r => r.status === 'pass').length;
    const warnCount = results.filter(r => r.status === 'warn').length;
    const failCount = results.filter(r => r.status === 'fail').length;

    res.json({
      success: failCount === 0,
      data: {
        results,
        summary: { pass: passCount, warn: warnCount, fail: failCount },
      },
    });
  });

  return router;
}
