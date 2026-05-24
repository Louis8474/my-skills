/**
 * 应用入口
 *
 * 核心功能：
 * 1. 初始化各模块（会话管理、消息队列、流量控制等）
 * 2. 启动 Gateway HTTP 服务
 * 3. 启动 Stream 模式接收钉钉消息
 * 4. 处理消息并调用 AI CLI
 */

import { config, validateConfig } from './config';
import { DingtalkService } from './dingtalk/dingtalk';
import { DingtalkStreamService } from './dingtalk/stream';
import { GatewayServer } from './gateway';
import { SessionManager } from './session-manager';
import { MessageQueue, RateLimiter, ConcurrencyController } from './message-queue';
import { MessageDeduplicator } from './utils/dedupCache';
import { OpenCodeExecutor } from './opencode';
import {
  notifyServiceStart,
  notifyServiceStop,
  notifyError,
  isAlertEnabled,
  setStreamService,
} from './utils/alert';
import { createSafeLogger, enableGlobalSanitize } from './utils/logger';
import { Scheduler } from './scheduler';
import { ProviderRegistry, MessageRouter } from './router';
import type { RoutingCondition } from './router';
import { MemoryManager, MemoryStore } from './memory';
import { closeStorage } from './storage/sqlite';

const logger = createSafeLogger('App');

// 全局服务引用，用于优雅关闭
let globalStreamService: DingtalkStreamService | null = null;
let globalGateway: GatewayServer | null = null;
let globalSessionManager: SessionManager | null = null;
let globalScheduler: Scheduler | null = null;
let _globalMemoryManager: MemoryManager | null = null;

async function main(): Promise<void> {
  // 启用全局日志脱敏
  enableGlobalSanitize();

  logger.log('🚀 启动钉钉 + AI 集成系统...');
  logger.log('📦 所有消息将通过 AI CLI 处理');

  // 验证配置
  validateConfig();

  // 显示权限模式警告
  if (config.claude.permissionMode !== 'default') {
    logger.warn(`⚠️  权限模式: ${config.claude.permissionMode}`);
  }

  // 初始化基础模块
  const dingtalkService = new DingtalkService();
  const openCodeExecutor = new OpenCodeExecutor();

  // 检查 AI CLI 是否可用
  const opencodeAvailable = await openCodeExecutor.isAvailable();
  if (opencodeAvailable) {
    logger.log('✅ AI CLI 可用');
  } else {
    logger.log('⚠️ AI CLI 未安装，请先安装 opencode 或 claude');
  }

  // 初始化会话管理
  const sessionManager = new SessionManager({
    config: {
      ttl: config.session.ttl,
      maxHistoryMessages: config.session.maxHistoryMessages,
    },
    autoCleanup: true,
    cleanupInterval: 60000, // 1 分钟清理一次
  });
  globalSessionManager = sessionManager;

  // 初始化消息队列
  const messageQueue = new MessageQueue();

  // 初始化流量控制器
  const rateLimiter = new RateLimiter({
    maxTokens: config.messageQueue.rateLimitMaxTokens,
    refillRate: 1, // 每秒补充 1 个令牌
  });

  // 初始化并发控制器
  const concurrencyController = new ConcurrencyController({
    maxConcurrentPerUser: config.messageQueue.maxConcurrentPerUser,
    maxConcurrentGlobal: config.messageQueue.maxConcurrentGlobal,
  });

  // 初始化消息去重器
  const deduplicator = new MessageDeduplicator({
    maxSize: 1000,
    timeWindow: 60000,
  });

  logger.log('✅ 基础模块初始化完成');
  logger.log(`   - 会话管理器：已启动 (TTL: ${config.session.ttl / 1000 / 60}分钟)`);
  logger.log(`   - 流量控制：已启动 (令牌：${config.messageQueue.rateLimitMaxTokens})`);
  logger.log(`   - 并发控制：已启动 (用户：${config.messageQueue.maxConcurrentPerUser})`);
  logger.log(`   - AI 超时：${config.ai.timeout / 1000}秒`);

  // 初始化定时任务调度器
  const scheduler = new Scheduler(config.scheduler);
  globalScheduler = scheduler;
  scheduler.setMessageQueue(messageQueue);
  await scheduler.init();
  if (config.scheduler.enabled) {
    logger.log(`✅ 定时任务调度器已启动 (${scheduler.listTasks().length} 个任务)`);
  }

  // 初始化项目记忆模块
  let memoryManager: MemoryManager | null = null;
  if (config.memory.enabled) {
    const memoryStore = new MemoryStore();
    memoryManager = new MemoryManager(memoryStore, sessionManager, {
      autoSummarizeEnabled: config.memory.autoSummarizeEnabled,
      summarizeThreshold: config.memory.summarizeThreshold,
      maxContextMemories: config.memory.maxContextMemories,
      autoMemoryMaxAge: config.memory.autoMemoryMaxAge,
      boostOnAccess: config.memory.boostOnAccess,
      boostIncrement: config.memory.boostIncrement,
    });
    _globalMemoryManager = memoryManager;
    logger.log(
      `✅ 项目记忆模块已启动 (自动摘要: ${config.memory.autoSummarizeEnabled ? '启用' : '禁用'})`
    );
  }

  // 创建 Gateway 服务
  const gateway = new GatewayServer(dingtalkService, {
    sessionManager,
    messageQueue,
    rateLimiter,
    concurrencyController,
    deduplicator,
    openCodeExecutor,
    memoryManager: memoryManager ?? undefined,
  });
  globalGateway = gateway;

  // 将调度器绑定到 Gateway
  gateway.setScheduler(scheduler);

  // 初始化并设置 StreamingCardManager
  if (config.streaming.enabled) {
    const { StreamingCardManager } = await import('./dingtalk/streamingCard');
    const streamingCardManager = new StreamingCardManager();
    gateway.setStreamingCardManager(streamingCardManager);
    logger.log('✅ 流式卡片管理器已初始化');
  }

  // 初始化路由器
  if (config.router.enabled) {
    const providerRegistry = new ProviderRegistry();
    providerRegistry.register({
      name: 'default',
      type: config.aiProvider,
      command: config.aiProvider === 'claude' ? config.claude.command : config.ai.command,
      timeout: config.aiProvider === 'claude' ? config.claude.timeout : config.ai.timeout,
      enabled: true,
    });

    const messageRouter = new MessageRouter(providerRegistry);
    for (const ruleConfig of config.router.rules) {
      messageRouter.addRule({
        name: ruleConfig.name,
        enabled: ruleConfig.enabled,
        priority: ruleConfig.priority,
        condition: ruleConfig.condition as RoutingCondition,
        provider: ruleConfig.provider,
      });
    }

    gateway.setRouter(messageRouter, providerRegistry);
    logger.log(
      `✅ 路由器已启动 (${providerRegistry.size()} 个 Provider, ${messageRouter.listRules().length} 条规则)`
    );
  }

  // 启动 Gateway
  try {
    await gateway.start(config.gateway.port);
    logger.log(`✅ Gateway 服务已启动，监听端口：${config.gateway.port}`);
    logger.log(`   - 健康检查：http://${config.gateway.host}:${config.gateway.port}/health`);
    logger.log(`   - 测试接口：http://${config.gateway.host}:${config.gateway.port}/api/test`);
    logger.log(`   - 状态检查：http://${config.gateway.host}:${config.gateway.port}/api/status`);

    // 通知 PM2 服务已就绪
    if (process.send) {
      process.send('ready');
    }
  } catch (error) {
    logger.error('❌ 启动 Gateway 失败:', error);
    process.exit(1);
  }

  // 启动 Stream 模式（唯一模式）
  logger.log('\n🌊 启动 Stream 模式（钉钉官方推荐，无需内网穿透）...');

  const streamService = new DingtalkStreamService();
  globalStreamService = streamService;

  // 设置媒体处理器
  if (config.media.enabled) {
    const { MediaDownloader, MediaProcessor } = await import('./media');
    const downloader = new MediaDownloader(dingtalkService);
    const mediaProcessor = new MediaProcessor(downloader, config.media.enabled);
    streamService.setMediaProcessor(mediaProcessor);
    logger.log('✅ 媒体处理器已设置到 Stream 服务');
  }

  // 设置消息处理器
  streamService.setMessageHandler(
    async (userId, userName, content, conversationId, sessionWebhook, conversationType) => {
      const startTime = Date.now();
      logger.log(`收到消息：${userName}(${userId}): ${content}`);
      logger.log(`conversationId: ${conversationId}`);
      logger.log(`sessionWebhook: ${sessionWebhook ? '✅ 有效' : '❌ 无效'}`);
      logger.log(`conversationType: ${conversationType || 'group'}`);

      try {
        // 使用超时包装消息处理，防止长时间阻塞
        const processingTimeout = config.ai.timeout + 10000; // AI 超时 + 10秒缓冲
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(
            () => reject(new Error(`消息处理超时 (${processingTimeout / 1000}秒)`)),
            processingTimeout
          );
        });

        // 所有消息直接交给 AI 处理
        const result = await Promise.race([
          gateway.processMessage({
            msg: content,
            userId,
            userName,
            conversationId,
            sessionWebhook,
            conversationType,
          }),
          timeoutPromise,
        ]);

        const processingTime = Date.now() - startTime;
        logger.log(`消息处理完成，耗时: ${processingTime}ms`);

        // 使用 sessionWebhook 发送回复
        const replyTitle = config.aiProvider === 'claude' ? 'Claude Code 回复' : 'AI 回复';
        if (result.success && result.data?.result) {
          await streamService.sendMarkdownMessage(conversationId, replyTitle, result.data.result);
          logger.log(`✅ 回复发送成功 (总耗时: ${Date.now() - startTime}ms)`);
        } else if (!result.success) {
          const errorMessage = `❌ ${result.message}`;
          await streamService.sendTextMessage(conversationId, errorMessage);
          logger.log(`⚠️ 处理失败: ${result.message}`);
        }
      } catch (error) {
        const processingTime = Date.now() - startTime;
        logger.error(`消息处理失败 (${processingTime}ms):`, error);
        const errorMessage = `❌ 消息处理失败\n\n错误：${error instanceof Error ? error.message : '未知错误'}`;

        try {
          await streamService.sendTextMessage(conversationId, errorMessage);
        } catch (sendError) {
          logger.error('发送错误消息失败:', sendError);
        }
      }
    }
  );

  // 启动 Stream 服务（内置重连机制）
  try {
    await streamService.start();
    logger.log('✅ Stream 模式已启动');
    logger.log('   - 无需内网穿透，钉钉会主动推送消息');
    logger.log(`   - 自动重连: 已启用 (最多 ${config.stream.maxReconnectAttempts} 次)`);
    logger.log('   - 在你的钉钉应用后台配置 Stream 模式即可');

    // 绑定 Stream 服务到告警模块
    setStreamService(streamService);

    // 发送服务启动通知
    if (isAlertEnabled()) {
      notifyServiceStart().catch(err => logger.error('发送启动通知失败:', err));
    }
  } catch (error) {
    logger.error('❌ Stream 模式启动失败:', error);
    logger.error('   请检查网络连接和配置是否正确');
    process.exit(1);
  }
}

// 优雅关闭处理
async function cleanupResources(): Promise<void> {
  logger.log('🧹 开始清理资源...');

  // 停止 Stream 服务
  if (globalStreamService) {
    try {
      logger.log('   - 停止 Stream 服务...');
      await globalStreamService.stop();
      logger.log('   ✅ Stream 服务已停止');
    } catch (error) {
      logger.error('   ❌ 停止 Stream 服务时出错:', error);
    }
  }

  // 停止 Gateway
  if (globalGateway) {
    try {
      logger.log('   - 停止 Gateway 服务...');
      await globalGateway.stop();
      logger.log('   ✅ Gateway 服务已停止');
    } catch (error) {
      logger.error('   ❌ 停止 Gateway 服务时出错:', error);
    }
  }

  // 清理会话管理器
  if (globalSessionManager) {
    try {
      logger.log('   - 清理会话管理器...');
      globalSessionManager.stopCleanupService();
      logger.log('   ✅ 会话管理器已清理');
    } catch (error) {
      logger.error('   ❌ 清理会话管理器时出错:', error);
    }
  }

  // 停止调度器
  if (globalScheduler) {
    try {
      logger.log('   - 停止调度器...');
      globalScheduler.stop();
      logger.log('   ✅ 调度器已停止');
    } catch (error) {
      logger.error('   ❌ 停止调度器时出错:', error);
    }
  }

  // 关闭存储（SQLite 连接）
  try {
    logger.log('   - 关闭存储连接...');
    closeStorage();
    logger.log('   ✅ 存储连接已关闭');
  } catch (error) {
    logger.error('   ❌ 关闭存储时出错:', error);
  }

  logger.log('✅ 所有资源清理完成');
}

// eslint-disable-next-line @typescript-eslint/no-misused-promises
process.on('SIGINT', async () => {
  logger.log('\n🛑 接收到关闭信号，正在清理...');
  if (isAlertEnabled()) {
    notifyServiceStop('收到 SIGINT 信号').catch(err =>
      logger.warn('关闭通知发送失败:', err instanceof Error ? err.message : String(err))
    );
  }
  await cleanupResources();
  process.exit(0);
});

// eslint-disable-next-line @typescript-eslint/no-misused-promises
process.on('SIGTERM', async () => {
  logger.log('\n🛑 接收到终止信号，正在清理...');
  if (isAlertEnabled()) {
    notifyServiceStop('收到 SIGTERM 信号').catch(err =>
      logger.warn('关闭通知发送失败:', err instanceof Error ? err.message : String(err))
    );
  }
  await cleanupResources();
  process.exit(0);
});

// 捕获未处理的 Promise 拒绝
process.on('unhandledRejection', (reason, promise) => {
  logger.error('❌ 未处理的 Promise 拒绝:');
  logger.error('   原因:', reason);
  logger.error('   Promise:', promise);

  // 发送告警
  if (isAlertEnabled()) {
    const reasonStr = reason instanceof Error ? reason.message : String(reason);
    notifyError('未处理的 Promise 拒绝', reasonStr).catch(err =>
      logger.warn('错误告警发送失败:', err instanceof Error ? err.message : String(err))
    );
  }
});

// 捕获未捕获的异常
// eslint-disable-next-line @typescript-eslint/no-misused-promises
process.on('uncaughtException', async error => {
  logger.error('❌ 未捕获的异常:');
  logger.error('   错误:', error.message);
  logger.error('   堆栈:', error.stack);

  // 发送告警
  if (isAlertEnabled()) {
    await notifyError('未捕获的异常', error.message, error.stack).catch(err =>
      logger.warn('错误告警发送失败:', err instanceof Error ? err.message : String(err))
    );
  }

  // 严重错误，清理后退出
  try {
    await cleanupResources();
  } catch (_e) {
    // ignore
  }
  process.exit(1);
});

main().catch(error => {
  logger.error('❌ 启动过程中发生错误:', error);
  process.exit(1);
});
