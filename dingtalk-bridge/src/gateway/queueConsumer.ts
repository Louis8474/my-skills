/**
 * 队列消费者
 * 负责从消息队列中消费消息并处理
 */

import { MessageQueue, QueuedMessage } from '../message-queue/messageQueue';
import { ConcurrencyController } from '../message-queue/concurrencyController';
import { RateLimiter } from '../message-queue/rateLimiter';
import { MessageDeduplicator } from '../utils/dedupCache';
import { createSafeLogger } from '../utils/logger';
import { SessionManager } from '../session-manager';
import { OpenCodeExecutor, MessageContext } from '../opencode';
import { ClaudeCodeExecutor } from '../claude';
import { UserMessage, AIMessage } from '../types/message';
import type { Session } from '../types/session';
import { generateMessageId } from '../utils/messageId';

const logger = createSafeLogger('QueueConsumer');
import { buildHistory } from '../utils/historyBuilder';
import { config } from '../config';
import { hookRunner } from '../hooks';
import type { HookEvent } from '../hooks';
import { formatError, getCLIInstallSuggestion } from './errorFormatter';

/**
 * 消息处理结果
 */
export interface ProcessResult {
  success: boolean;
  message: string;
  data?: {
    result?: string;
    conversationId?: string;
    executionTime?: number;
    messageId?: string;
  };
}

/**
 * 消息处理器类型
 */
export type MessageProcessor = (
  msg: string,
  userId: string,
  userName: string
) => Promise<ProcessResult>;

/**
 * 队列消费者配置
 */
export interface QueueConsumerConfig {
  pollInterval: number;
  batchSize: number;
}

const DEFAULT_CONFIG: QueueConsumerConfig = {
  pollInterval: 100, // 100ms
  batchSize: 5,
};

/**
 * 队列消费者类
 */
export class QueueConsumer {
  private queue: MessageQueue;
  private rateLimiter: RateLimiter;
  private concurrencyController: ConcurrencyController;
  private deduplicator: MessageDeduplicator;
  private sessionManager: SessionManager;
  private openCodeExecutor: OpenCodeExecutor;
  private claudeCodeExecutor: ClaudeCodeExecutor;
  private config: QueueConsumerConfig;
  private isRunning: boolean = false;
  private timer: NodeJS.Timeout | null = null;
  private messageHandler: MessageProcessor | null = null;

  constructor(
    queue: MessageQueue,
    rateLimiter: RateLimiter,
    concurrencyController: ConcurrencyController,
    deduplicator: MessageDeduplicator,
    sessionManager: SessionManager,
    openCodeExecutor: OpenCodeExecutor,
    claudeCodeExecutor: ClaudeCodeExecutor,
    config?: Partial<QueueConsumerConfig>
  ) {
    this.queue = queue;
    this.rateLimiter = rateLimiter;
    this.concurrencyController = concurrencyController;
    this.deduplicator = deduplicator;
    this.sessionManager = sessionManager;
    this.openCodeExecutor = openCodeExecutor;
    this.claudeCodeExecutor = claudeCodeExecutor;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * 设置消息处理器（可选，用于替代默认处理逻辑）
   */
  setMessageHandler(handler: MessageProcessor): void {
    this.messageHandler = handler;
  }

  /**
   * 启动消费者
   */
  start(): void {
    if (this.isRunning) {
      logger.log('已经在运行中');
      return;
    }

    this.isRunning = true;
    logger.log('消息消费者已启动');
    logger.log(`  - 轮询间隔: ${this.config.pollInterval}ms`);
    logger.log(`  - 批处理大小: ${this.config.batchSize}`);

    this.timer = setTimeout(() => this.consumeLoop(), 0);
    this.timer.unref();
  }

  /**
   * 停止消费者
   */
  stop(): void {
    this.isRunning = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    logger.log('消息消费者已停止');
  }

  /**
   * 消费循环
   */
  private consumeLoop(): void {
    if (!this.isRunning) return;

    this.processBatch()
      .catch(error => {
        logger.error('处理消息时发生错误:', error);
      })
      .finally(() => {
        if (this.isRunning) {
          this.timer = setTimeout(() => this.consumeLoop(), this.config.pollInterval);
          this.timer.unref();
        }
      });
  }

  /**
   * 批量处理消息
   */
  private async processBatch(): Promise<void> {
    const messages = this.queue.batchDequeue(this.config.batchSize);
    if (messages.length === 0) return;

    logger.log(`从队列获取 ${messages.length} 条消息`);

    const processPromises = messages.map(msg => this.processQueuedMessage(msg));
    await Promise.all(processPromises);
  }

  /**
   * 处理单条队列消息
   */
  private async processQueuedMessage(queuedMsg: QueuedMessage): Promise<void> {
    const { message, retryCount } = queuedMsg;

    try {
      logger.log(`处理消息：${message.content.substring(0, 50)}...`);

      if (this.messageHandler) {
        await this.messageHandler(message.content, message.userId, message.username || '用户');
      } else {
        await this.processMessageInternal(message);
      }

      this.queue.complete(message.id);
      logger.log(`消息处理完成: ${message.id}`);
    } catch (error: unknown) {
      logger.error(`消息处理失败: ${message.id}`, error);
      this.queue.fail(message.id);

      if (retryCount >= 3) {
        logger.error(`消息重试次数过多，将丢弃: ${message.id}`);
      }
    }
  }

  /**
   * 内部消息处理逻辑（编排方法）
   */
  private async processMessageInternal(message: UserMessage): Promise<ProcessResult> {
    const startTime = Date.now();
    const messageId = generateMessageId();

    const validationError = this.validateAndPrepare(message, messageId);
    if (validationError) return validationError;

    const sessionSlot = await this.acquireSessionAndSlot(message);
    if ('success' in sessionSlot && !sessionSlot.success) return sessionSlot;
    const { session, requestId } = sessionSlot as { session: Session; requestId: string };

    try {
      const context = await this.buildExecutionContext(session, message);

      const result = await this.executeAI(message.content, context);

      return this.processResultAndSave(result, session, message, messageId, startTime);
    } finally {
      this.concurrencyController.releaseSlot(message.userId, requestId);
    }
  }

  /**
   * 验证消息（去重 + 限流），返回 null 表示通过
   */
  private validateAndPrepare(message: UserMessage, _messageId: string): ProcessResult | null {
    if (this.deduplicator.isDuplicate(message.content, message.userId)) {
      logger.log(`检测到重复消息: ${message.id}`);
      return { success: false, message: '消息已处理，请勿重复发送' };
    }
    this.deduplicator.record(message.content, message.userId);

    const rateLimitResult = this.rateLimiter.checkRateLimit(message.userId);
    if (!rateLimitResult.allowed) {
      logger.log(`流量限制: ${message.userId}`);
      return {
        success: false,
        message: `请求过于频繁，请稍后再试（剩余配额：${rateLimitResult.remaining}）`,
      };
    }
    this.rateLimiter.consumeToken(message.userId);

    return null;
  }

  /**
   * 获取会话 + 并发槽位
   */
  private async acquireSessionAndSlot(
    message: UserMessage
  ): Promise<ProcessResult | { session: Session; requestId: string }> {
    let session: Session;
    try {
      session = await this.sessionManager.getOrCreateSession(message.userId);
    } catch (error: unknown) {
      logger.error(`创建会话失败:`, error);
      return { success: false, message: '会话创建失败，请稍后重试' };
    }

    const requestId = generateMessageId();
    try {
      await this.concurrencyController.acquireSlot(message.userId, requestId, 30000);
    } catch (error: unknown) {
      logger.error(`获取并发槽位失败:`, error);
      return {
        success: false,
        message:
          error instanceof Error && error.message.includes('超时')
            ? '系统繁忙，请稍后重试'
            : '系统资源不足，请稍后重试',
      };
    }

    return { session, requestId };
  }

  /**
   * 构建执行上下文（添加消息 + 钩子 + 历史）
   */
  private async buildExecutionContext(
    session: Session,
    message: UserMessage
  ): Promise<MessageContext> {
    await this.sessionManager.addMessage(session.conversationId, message);

    hookRunner
      .trigger('message_received', {
        userId: message.userId,
        userName: message.username,
        conversationId: session.conversationId,
        content: message.content.substring(0, 200),
      })
      .catch(err =>
        logger.warn(
          'Hook message_received 触发失败:',
          err instanceof Error ? err.message : String(err)
        )
      );

    const history = await this.buildHistory(session.conversationId);

    return {
      userId: message.userId,
      userName: message.username,
      conversationId: session.conversationId,
      history,
    };
  }

  /**
   * 调用 AI Provider 执行
   */
  private async executeAI(
    content: string,
    context: MessageContext
  ): Promise<{ success: boolean; output?: string; error?: string }> {
    if (config.aiProvider === 'claude') {
      return this.claudeCodeExecutor.execute(content, context);
    }
    return this.openCodeExecutor.execute(content, context);
  }

  /**
   * 处理执行结果并保存 AI 消息
   */
  private processResultAndSave(
    result: { success: boolean; output?: string; error?: string },
    session: Session,
    message: UserMessage,
    messageId: string,
    startTime: number
  ): ProcessResult {
    let responseContent: string;

    if (result.success && result.output) {
      responseContent = result.output;
    } else if (result.error) {
      if (
        result.error.includes('未安装') ||
        result.error.includes('找不到命令') ||
        result.error.includes('ENOENT')
      ) {
        responseContent = getCLIInstallSuggestion(config.aiProvider);
      } else {
        responseContent = formatError(result.error, messageId);
      }
    } else {
      responseContent = '处理完成，但没有返回结果。';
    }

    const aiMessage: AIMessage = {
      id: generateMessageId(),
      type: 'ai',
      conversationId: session.conversationId,
      userId: message.userId,
      content: responseContent,
      metadata: {
        timestamp: Date.now(),
        source: 'ai',
      },
    };

    this.sessionManager.addMessage(session.conversationId, aiMessage);

    const totalTime = Date.now() - startTime;
    logger.log(`消息处理完成，耗时：${totalTime}ms`);

    return {
      success: result.success,
      message: result.success ? '处理成功' : '处理失败',
      data: {
        result: responseContent,
        conversationId: session.conversationId,
        executionTime: totalTime,
        messageId,
      },
    };
  }

  /**
   * 构建对话历史
   */
  private async buildHistory(
    conversationId: string
  ): Promise<Array<{ role: 'user' | 'assistant'; content: string }>> {
    return buildHistory(this.sessionManager, conversationId, 20);
  }

  /**
   * 获取消费者状态
   */
  getStatus(): { isRunning: boolean; pollInterval: number; batchSize: number } {
    return {
      isRunning: this.isRunning,
      pollInterval: this.config.pollInterval,
      batchSize: this.config.batchSize,
    };
  }
}

/**
 * 创建队列消费者实例
 */
export function createQueueConsumer(
  queue: MessageQueue,
  rateLimiter: RateLimiter,
  concurrencyController: ConcurrencyController,
  deduplicator: MessageDeduplicator,
  sessionManager: SessionManager,
  openCodeExecutor: OpenCodeExecutor,
  claudeCodeExecutor: ClaudeCodeExecutor,
  config?: Partial<QueueConsumerConfig>
): QueueConsumer {
  return new QueueConsumer(
    queue,
    rateLimiter,
    concurrencyController,
    deduplicator,
    sessionManager,
    openCodeExecutor,
    claudeCodeExecutor,
    config
  );
}
