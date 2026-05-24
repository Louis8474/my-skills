/**
 * Gateway 服务模块 - 基于 Stream 模式的消息处理
 * 所有消息通过 Stream 连接接收，无需 Webhook 回调
 *
 * 重构说明：
 * - 错误格式化逻辑移至 errorFormatter.ts
 * - 消息重试逻辑移至 retrySender.ts
 * - 队列消费逻辑移至 queueConsumer.ts
 * - 路由逻辑移至 routes/ 目录
 * - 类型定义移至 types.ts
 * - 中间件配置移至 middleware.ts
 * - 流式回调逻辑移至 streamingCallbacks.ts
 * - 消息处理逻辑移至 messageHandler.ts
 */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import express, { Express, Request, Response } from 'express';
import { DingtalkService } from '../dingtalk/dingtalk';
import { DingtalkStreamService } from '../dingtalk/stream';
import { SessionManager } from '../session-manager';
import { MessageQueue } from '../message-queue/messageQueue';
import { RateLimiter } from '../message-queue/rateLimiter';
import { ConcurrencyController } from '../message-queue/concurrencyController';
import { MessageDeduplicator } from '../utils/dedupCache';
import { OpenCodeExecutor } from '../opencode';
import { ClaudeCodeExecutor } from '../claude';
import { config } from '../config';
import { createAdminRouter } from '../web';
import { StreamingCardManager } from '../dingtalk/streamingCard';
import { Scheduler } from '../scheduler';
import { CommandHandler } from '../commands/commandHandler';
import { ProviderRegistry, MessageRouter } from '../router';
import { MemoryManager } from '../memory';
import { CardBuilder } from '../dingtalk/cards';
import { RetrySender, type MessageSender } from './retrySender';
import {
  createStatusRoutes,
  createSchedulerRouter,
  createRouterRoutes,
  createMemoryRoutes,
} from './routes';
import { setupMiddleware } from './middleware';
import { MessageHandler } from './messageHandler';
import { createSafeLogger } from '../utils/logger';
import type { GatewayDeps, GatewayRequest, GatewayResponse } from './types';

// 重导出类型，保持公共 API 不变
export type { GatewayDeps, GatewayRequest, GatewayResponse } from './types';

const logger = createSafeLogger('Gateway');

export class GatewayServer {
  private app: Express;
  private dingtalkService: DingtalkService;
  private streamService: DingtalkStreamService | null = null;
  private openCodeExecutor: OpenCodeExecutor;
  private claudeCodeExecutor: ClaudeCodeExecutor;
  private sessionManager: SessionManager;
  private messageQueue: MessageQueue;
  private rateLimiter: RateLimiter;
  private concurrencyController: ConcurrencyController;
  private deduplicator: MessageDeduplicator;
  private retrySender: RetrySender;
  private scheduler: Scheduler | null = null;
  private commandHandler: CommandHandler;
  private router: MessageRouter | null = null;
  private providerRegistry: ProviderRegistry | null = null;
  private memoryManager: MemoryManager | null;
  private server: ReturnType<Express['listen']> | null = null;
  private streamingCardManager: StreamingCardManager | null = null;
  private messageHandler: MessageHandler;

  constructor(dingtalkService: DingtalkService, deps: GatewayDeps) {
    this.app = express();
    this.dingtalkService = dingtalkService;
    this.openCodeExecutor = deps.openCodeExecutor || new OpenCodeExecutor();
    this.claudeCodeExecutor = deps.claudeCodeExecutor || new ClaudeCodeExecutor();
    this.sessionManager = deps.sessionManager;
    this.messageQueue = deps.messageQueue;
    this.rateLimiter = deps.rateLimiter;
    this.concurrencyController = deps.concurrencyController;
    this.deduplicator = deps.deduplicator;
    this.retrySender = new RetrySender({
      maxRetries: 5,
      baseDelay: 5000,
      maxDelay: 300000,
      checkInterval: 10000,
    });
    this.memoryManager = deps.memoryManager ?? null;

    // 初始化命令处理器
    this.commandHandler = new CommandHandler({
      sessionManager: deps.sessionManager,
      messageQueue: deps.messageQueue,
      stopSession: async (conversationId: string) => {
        try {
          await this.claudeCodeExecutor.closeSessionPoolSession(conversationId);
          return true;
        } catch {
          return false;
        }
      },
    });

    // 初始化消息处理器
    this.messageHandler = new MessageHandler({
      dingtalkService: this.dingtalkService,
      sessionManager: this.sessionManager,
      messageQueue: this.messageQueue,
      rateLimiter: this.rateLimiter,
      concurrencyController: this.concurrencyController,
      deduplicator: this.deduplicator,
      openCodeExecutor: this.openCodeExecutor,
      claudeCodeExecutor: this.claudeCodeExecutor,
      retrySender: this.retrySender,
      commandHandler: this.commandHandler,
      memoryManager: this.memoryManager,
      streamingCardManager: this.streamingCardManager,
    });

    const providerName = config.aiProvider === 'claude' ? 'Claude Code' : 'OpenCode';
    logger.log(`✅ Gateway 已启用，所有消息将路由到 ${providerName}`);

    this.setupMiddleware();
    this.setupRoutes();
    this.app.use(createAdminRouter());
    this.messageHandler.startConsumer();
    this.setupRetrySender();
  }

  /**
   * 设置重试发送器
   */
  private setupRetrySender(): void {
    const sender: MessageSender = async (conversationId, content, title, mentionList) => {
      try {
        const accessToken = await this.dingtalkService.getAccessToken();

        if (title) {
          await this.dingtalkService.sendMarkdownMessage(accessToken, title, content);
        } else {
          await this.dingtalkService.sendTextMessage(accessToken, content, mentionList);
        }
        return true;
      } catch (error: unknown) {
        logger.error('发送消息失败:', error);
        return false;
      }
    };

    this.retrySender.setSender(sender);
    this.retrySender.start();
  }

  /**
   * 设置 Express 中间件
   */
  private setupMiddleware(): void {
    setupMiddleware(this.app);
  }

  private setupRoutes(): void {
    // 状态与诊断路由
    const statusRoutes = createStatusRoutes({
      getSessionManager: () => this.sessionManager,
      getMessageQueue: () => this.messageQueue,
      getRateLimiter: () => this.rateLimiter,
      getConcurrencyController: () => this.concurrencyController,
      getRetrySender: () => this.retrySender,
      getOpenCodeExecutor: () => this.openCodeExecutor,
      getClaudeCodeExecutor: () => this.claudeCodeExecutor,
    });
    this.app.use(statusRoutes);

    // 测试接口（需要注入 processMessage，在此单独注册）
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    this.app.post('/api/test', async (req: Request, res: Response) => {
      try {
        const result = await this.processMessage({
          msg: req.body.msg || '',
          userId: 'test-user',
          userName: '测试用户',
        });
        res.json(result);
      } catch (error: unknown) {
        res.status(500).json({
          success: false,
          message: error instanceof Error ? error.message : '未知错误',
        });
      }
    });

    // 互动卡片 API
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    this.app.post('/api/card/send', async (req: Request, res: Response) => {
      try {
        const { conversationId, title, content, buttons, imageUrl } = req.body;

        if (!conversationId || !title || !content) {
          res.status(400).json({
            success: false,
            message: '缺少必要参数：conversationId, title, content',
          });
          return;
        }

        if (!this.streamService) {
          res.status(503).json({
            success: false,
            message: 'Stream 服务未连接',
          });
          return;
        }

        const cardData = CardBuilder.createMarkdownCard({
          title,
          content,
          buttons,
          imageUrl,
        });

        const sent = await this.streamService.sendCardMessage(conversationId, cardData);

        res.json({
          success: sent,
          message: sent ? '卡片发送成功' : '卡片发送失败',
        });
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        logger.error('发送卡片失败:', msg);
        res.status(500).json({
          success: false,
          message: `发送卡片失败: ${msg}`,
        });
      }
    });

    // 定时任务路由
    this.app.use(createSchedulerRouter(() => this.scheduler));

    // 多 Agent 路由管理
    this.app.use(
      createRouterRoutes(
        () => this.providerRegistry,
        () => this.router
      )
    );

    // 项目记忆路由
    this.app.use(createMemoryRoutes(() => this.memoryManager));
  }

  /**
   * 核心消息处理方法（委托给 MessageHandler）
   */
  async processMessage(
    request: GatewayRequest,
    useQueue: boolean = false
  ): Promise<GatewayResponse> {
    return this.messageHandler.processMessage(request, useQueue);
  }

  /**
   * 处理来自 Stream 的消息并发送回复（委托给 MessageHandler）
   */
  async handleStreamMessage(msg: string, userId: string, userName: string): Promise<void> {
    return this.messageHandler.handleStreamMessage(msg, userId, userName);
  }

  /**
   * 设置 Stream 服务（由 index.ts 调用）
   */
  setStreamService(service: DingtalkStreamService): void {
    this.streamService = service;
    // 将命令处理器注入到 Stream 服务
    service.setCommandHandler(this.commandHandler);
  }

  setScheduler(scheduler: Scheduler): void {
    this.scheduler = scheduler;
  }

  setStreamingCardManager(manager: StreamingCardManager): void {
    this.streamingCardManager = manager;
    this.messageHandler.setStreamingCardManager(manager);
    logger.log('StreamingCardManager 已设置');
  }

  setRouter(router: MessageRouter, registry: ProviderRegistry): void {
    this.router = router;
    this.providerRegistry = registry;
    logger.log('Router 已设置');
  }

  async start(port: number, host: string = '0.0.0.0'): Promise<void> {
    // 初始化持久化会话池（同步等待 warmUp 完成，规避首条消息冷启动）
    if (config.persistentSession.enabled && config.aiProvider === 'claude') {
      try {
        await this.claudeCodeExecutor.initSessionPool({
          maxSessions: config.persistentSession.maxSessions,
          idleTimeout: config.persistentSession.idleTimeout,
        });
        logger.log(
          `🚀 持久化会话池已启用 (最大 ${config.persistentSession.maxSessions} 会话，预热 ${config.persistentSession.warmUpSessions} 个 CLI 进程已就绪)`
        );
      } catch (warmupErr) {
        logger.warn(
          `[Gateway] Claude CLI 预热失败: ${warmupErr instanceof Error ? warmupErr.message : String(warmupErr)}`
        );
        logger.warn('服务继续启动，但首条消息可能遇冷启动延迟');
      }
    }

    return new Promise((resolve, reject) => {
      this.server = this.app.listen(port, host, () => {
        logger.log(`🚀 Gateway 服务器已启动`);
        logger.log(`   - 地址：http://${host}:${port}`);
        logger.log(`   - 健康检查：http://${host}:${port}/health`);
        logger.log(`   - 测试接口：http://${host}:${port}/api/test`);
        logger.log(`   - 状态检查：http://${host}:${port}/api/status`);
        resolve();
      });

      this.server.on('error', error => {
        reject(error);
      });
    });
  }

  async stop(): Promise<void> {
    this.messageHandler.stopConsumer();
    this.retrySender.stop();

    // 关闭持久化会话池
    await this.claudeCodeExecutor.closeSessionPool();

    if (this.server) {
      return new Promise(resolve => {
        this.server!.close(() => {
          logger.log('🛑 Gateway 服务器已停止');
          resolve();
        });
      });
    }
  }

  /**
   * 销毁 Gateway，释放所有资源
   */
  destroy(): void {
    logger.log('正在销毁，释放资源...');

    // 停止消息处理器中的消费者
    this.messageHandler.stopConsumer();

    // 停止重试发送器
    this.retrySender.stop();

    // 销毁并发控制器
    this.concurrencyController.destroy();

    // 停止限流器清理
    this.rateLimiter.stopCleanup();

    // 销毁消息队列
    this.messageQueue.destroy();

    // 销毁流式卡片管理器
    if (this.streamingCardManager) {
      this.streamingCardManager.destroy();
    }

    // 关闭 HTTP 服务器
    if (this.server) {
      this.server.close();
      this.server = null;
    }

    logger.log('资源已释放');
  }
}
