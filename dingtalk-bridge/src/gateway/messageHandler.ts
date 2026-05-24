/**
 * Gateway 消息处理
 * 将 processMessage、handleStreamMessage、sendReply 等核心消息处理逻辑
 * 从 index.ts 提取出来
 */
import type { DingtalkService } from '../dingtalk/dingtalk';
import type { SessionManager } from '../session-manager';
import type { MessageQueue } from '../message-queue/messageQueue';
import type { RateLimiter } from '../message-queue/rateLimiter';
import type { ConcurrencyController } from '../message-queue/concurrencyController';
import type { MessageDeduplicator } from '../utils/dedupCache';
import type { OpenCodeExecutor, MessageContext } from '../opencode';
import type { ClaudeCodeExecutor } from '../claude';
import type { StreamingCardManager } from '../dingtalk/streamingCard';
import type { CommandHandler } from '../commands/commandHandler';
import type { MemoryManager } from '../memory';
import { parseCommand } from '../commands/commandParser';
import { config } from '../config';
import { UserMessage, AIMessage } from '../types/message';
import { generateMessageId } from '../utils/messageId';
import { renderMarkdown, preprocessDingTalkMarkdown } from '../utils/markdown';
import { hookRunner } from '../hooks';
import { buildHistory } from '../utils/historyBuilder';
import {
  formatError,
  getCLIInstallSuggestion,
  formatRateLimitMessage,
  formatBusyMessage,
} from './errorFormatter';
import type { RetrySender } from './retrySender';
import type { ProcessResult } from './queueConsumer';
import type { GatewayRequest, GatewayResponse } from './types';
import { DisplayFilter } from '../display';
import {
  createMarkdownSender,
  createTextSender,
  createPersistentSessionCallbacks,
  createStreamChunkCallback,
} from './streamingCallbacks';
import { createSafeLogger } from '../utils/logger';

const logger = createSafeLogger('Gateway:MessageHandler');

/**
 * 消息处理器 - 封装 Gateway 的核心消息处理逻辑
 */
export class MessageHandler {
  private dingtalkService: DingtalkService;
  private sessionManager: SessionManager;
  private messageQueue: MessageQueue;
  private rateLimiter: RateLimiter;
  private concurrencyController: ConcurrencyController;
  private deduplicator: MessageDeduplicator;
  private openCodeExecutor: OpenCodeExecutor;
  private claudeCodeExecutor: ClaudeCodeExecutor;
  private retrySender: RetrySender;
  private commandHandler: CommandHandler;
  private memoryManager: MemoryManager | null;
  private streamingCardManager: StreamingCardManager | null;

  // 消费者循环控制
  private consumerRunning: boolean = false;
  private consumerTimer: NodeJS.Timeout | null = null;

  constructor(deps: {
    dingtalkService: DingtalkService;
    sessionManager: SessionManager;
    messageQueue: MessageQueue;
    rateLimiter: RateLimiter;
    concurrencyController: ConcurrencyController;
    deduplicator: MessageDeduplicator;
    openCodeExecutor: OpenCodeExecutor;
    claudeCodeExecutor: ClaudeCodeExecutor;
    retrySender: RetrySender;
    commandHandler: CommandHandler;
    memoryManager: MemoryManager | null;
    streamingCardManager: StreamingCardManager | null;
  }) {
    this.dingtalkService = deps.dingtalkService;
    this.sessionManager = deps.sessionManager;
    this.messageQueue = deps.messageQueue;
    this.rateLimiter = deps.rateLimiter;
    this.concurrencyController = deps.concurrencyController;
    this.deduplicator = deps.deduplicator;
    this.openCodeExecutor = deps.openCodeExecutor;
    this.claudeCodeExecutor = deps.claudeCodeExecutor;
    this.retrySender = deps.retrySender;
    this.commandHandler = deps.commandHandler;
    this.memoryManager = deps.memoryManager;
    this.streamingCardManager = deps.streamingCardManager;
  }

  /** 更新流式卡片管理器（外部设置后同步） */
  setStreamingCardManager(manager: StreamingCardManager | null): void {
    this.streamingCardManager = manager;
  }

  /**
   * 核心消息处理方法
   */
  async processMessage(
    request: GatewayRequest,
    useQueue: boolean = false
  ): Promise<GatewayResponse> {
    const { msg, userId = 'unknown', userName = '用户' } = request;

    if (useQueue) {
      logger.log(
        `[Gateway] 接收到用户 ${userName}(${userId}) 的消息，加入队列：${msg.substring(0, 50)}...`
      );

      try {
        const userMessage: UserMessage = {
          id: generateMessageId(),
          type: 'user',
          conversationId: '',
          userId,
          username: userName,
          content: msg,
          metadata: {
            timestamp: Date.now(),
            source: 'dingtalk',
          },
        };

        this.messageQueue.enqueue(userMessage, 'normal');

        return {
          success: true,
          message: '消息已接收，正在处理中',
          data: {
            messageId: userMessage.id,
          },
        };
      } catch (error: unknown) {
        logger.error('入队消息失败:', error);
        return {
          success: false,
          message: '消息接收失败',
        };
      }
    } else {
      return this.processMessageInternal(request);
    }
  }

  /**
   * 处理来自 Stream 的消息并发送回复
   */
  async handleStreamMessage(msg: string, userId: string, userName: string): Promise<void> {
    logger.log(`收到 Stream 消息：用户 ${userName}(${userId}) - ${msg}`);

    hookRunner
      .trigger('message_received', {
        userId,
        userName,
        conversationId: '',
        content: msg.substring(0, 200),
      })
      .catch(err =>
        logger.warn(
          'Hook message_received 触发失败:',
          err instanceof Error ? err.message : String(err)
        )
      );

    const maxRetries = 3;
    let lastError: Error | null = null;
    let conversationId = '';

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await this.processMessage({ msg, userId, userName });

        if (result.data?.conversationId) {
          conversationId = result.data.conversationId;
        }

        // 流式模式下，卡片已经在 processMessage 中发送，不需要再发送 markdown
        const useStreaming = config.streaming.enabled && this.streamingCardManager;
        if (useStreaming) {
          logger.log(`流式模式下卡片已发送，跳过 markdown 消息`);
          return;
        }

        const accessToken = await this.dingtalkService.getAccessToken();
        await this.sendReply(result, conversationId, accessToken, userId, userName);
        return;
      } catch (error: unknown) {
        lastError = error instanceof Error ? error : new Error(String(error));
        logger.error(`第 ${attempt} 次处理失败:`, lastError.message);

        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          logger.log(`${delay}ms 后重试...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // 所有重试均失败
    logger.error('消息处理最终失败:', lastError);
    try {
      const accessToken = await this.dingtalkService.getAccessToken();
      const errorMessage = formatError(lastError?.message || '未知错误', undefined, true);

      if (conversationId) {
        const queueId = generateMessageId();
        this.retrySender.add(queueId, conversationId, 'text', errorMessage);
      }

      await this.dingtalkService.sendTextMessage(
        accessToken,
        '⚠️ 消息处理遇到问题，系统将自动重试，请稍候查看回复。'
      );
    } catch (_sendError) {
      logger.error('发送错误回复失败:', _sendError);
    }
  }

  /**
   * 发送回复消息（成功发 markdown，失败发 text），发送失败时加入重试队列
   */
  private async sendReply(
    result: ProcessResult,
    conversationId: string,
    accessToken: string,
    userId: string,
    userName: string
  ): Promise<void> {
    const replyTitle = config.aiProvider === 'claude' ? 'Claude Code 回复' : 'AI 回复';

    if (result.success && result.data?.result) {
      const markdownText = preprocessDingTalkMarkdown(renderMarkdown(result.data.result));

      try {
        await this.dingtalkService.sendMarkdownMessage(accessToken, replyTitle, markdownText);
        hookRunner
          .trigger('message_sent', {
            userId,
            userName,
            conversationId,
            content: result.data?.result?.substring(0, 200),
          })
          .catch(err =>
            logger.warn(
              'Hook message_sent 触发失败:',
              err instanceof Error ? err.message : String(err)
            )
          );
      } catch (_sendError) {
        logger.error(`发送回复失败，添加到重试队列`);
        const queueId = generateMessageId();
        this.retrySender.add(queueId, conversationId, 'markdown', markdownText, {
          title: replyTitle,
        });
        await this.dingtalkService.sendTextMessage(
          accessToken,
          '📬 您的消息已收到，回复正在发送中，请稍候...'
        );
      }
    } else {
      const errorMsg = formatError(result.message, result.data?.messageId);

      try {
        await this.dingtalkService.sendTextMessage(accessToken, errorMsg);
      } catch (_sendError) {
        logger.error(`发送错误回复失败，添加到重试队列`);
        const queueId = generateMessageId();
        this.retrySender.add(queueId, conversationId, 'text', errorMsg);
      }
    }
  }

  /**
   * 启动消费者循环
   */
  startConsumer(): void {
    if (this.consumerRunning) return;

    this.consumerRunning = true;
    logger.log('消息消费者已启动');
    this.consumeLoop();
  }

  /**
   * 停止消费者循环
   */
  stopConsumer(): void {
    this.consumerRunning = false;
    if (this.consumerTimer) {
      clearTimeout(this.consumerTimer);
      this.consumerTimer = null;
    }
    logger.log('消息消费者已停止');
  }

  /**
   * 消费循环
   */
  private consumeLoop(): void {
    if (!this.consumerRunning) return;

    this.processQueuedMessages()
      .catch(error => {
        logger.error('处理队列消息时发生错误:', error);
      })
      .finally(() => {
        if (this.consumerRunning) {
          this.consumerTimer = setTimeout(
            () => this.consumeLoop(),
            config.messageQueue.pollInterval
          );
        }
      });
  }

  /**
   * 处理队列中的消息
   */
  private async processQueuedMessages(): Promise<void> {
    const queuedMessages = this.messageQueue.batchDequeue(5);
    if (queuedMessages.length === 0) return;

    logger.log(`从队列中获取到 ${queuedMessages.length} 条消息`);

    const processPromises = queuedMessages.map(async queuedMsg => {
      const { message, retryCount } = queuedMsg;

      try {
        logger.log(`处理队列消息：${message.content.substring(0, 50)}...`);
        await this.processMessageInternal({
          msg: message.content,
          userId: message.userId,
          userName: message.username || '用户',
        });
        this.messageQueue.complete(message.id);
        logger.log(`队列消息处理完成: ${message.id}`);
      } catch (error: unknown) {
        logger.error(`处理队列消息失败: ${message.id}`, error);
        this.messageQueue.fail(message.id);

        if (retryCount >= 3) {
          logger.error(`消息重试次数过多，将丢弃: ${message.id}`);
        }
      }
    });

    await Promise.all(processPromises);
  }

  /**
   * 内部消息处理方法
   */
  private async processMessageInternal(request: GatewayRequest): Promise<GatewayResponse> {
    const { msg, userId = 'unknown', userName = '用户', sessionWebhook } = request;

    // 检查是否为 / 命令
    const { parseCommand } = await import('../commands/commandParser');
    const parsedCommand = parseCommand(msg);
    if (parsedCommand) {
      logger.log(`Command detected: /${parsedCommand.command} from ${userName}`);
      try {
        const response = await this.commandHandler.handle(parsedCommand, userId, '');
        return {
          success: true,
          message: '命令处理完成',
          data: { result: response },
        };
      } catch (error: unknown) {
        return {
          success: false,
          message: error instanceof Error ? error.message : '命令处理失败',
        };
      }
    }

    const startTime = Date.now();
    const messageId = generateMessageId();

    logger.log(`[${messageId}] 处理消息：${userName}(${userId}): ${msg.substring(0, 50)}...`);

    // 1. 基础验证
    if (!msg || msg.trim() === '') {
      return {
        success: false,
        message: '消息内容为空',
      };
    }

    // 2. 消息去重检查
    if (this.deduplicator.isDuplicate(msg, userId)) {
      logger.log(`检测到重复消息，已忽略：${msg.substring(0, 50)}`);
      return {
        success: false,
        message: '消息已处理，请勿重复发送',
      };
    }
    this.deduplicator.record(msg, userId);

    // 3. 流量控制检查
    const rateLimitResult = this.rateLimiter.checkRateLimit(userId);
    if (!rateLimitResult.allowed) {
      logger.log(`[${messageId}] 流量控制：剩余配额 ${rateLimitResult.remaining}`);
      return {
        success: false,
        message: formatRateLimitMessage(rateLimitResult.remaining),
      };
    }
    this.rateLimiter.consumeToken(userId);

    // 4. 获取或创建会话
    let session;
    try {
      session = await this.sessionManager.getOrCreateSession(userId);
      logger.log(`[${messageId}] 步骤 3-4: 验证通过，会话已获取 ${session.conversationId}`);
    } catch (error: unknown) {
      logger.error(`[${messageId}] 创建会话失败:`, error);
      return {
        success: false,
        message: '会话创建失败，请稍后重试',
      };
    }

    // 5. 并发控制
    const requestId = generateMessageId();
    try {
      await this.concurrencyController.acquireSlot(userId, requestId, 30000);
      logger.log(`[${messageId}] 步骤 5: 并发控制通过`);
    } catch (error: unknown) {
      logger.error(`[${messageId}] 获取并发槽位失败:`, error);
      return {
        success: false,
        message: formatBusyMessage(),
      };
    }

    try {
      // 6. 创建用户消息对象
      const userMessage: UserMessage = {
        id: generateMessageId(),
        type: 'user',
        conversationId: session.conversationId,
        userId,
        username: userName,
        content: msg,
        metadata: {
          timestamp: Date.now(),
          source: 'dingtalk',
        },
      };

      // 7. 添加消息到会话历史
      await this.sessionManager.addMessage(session.conversationId, userMessage);

      // 8. 获取对话历史
      const history = await this.buildHistoryForOpenCode(session.conversationId);

      // 8.5 注入项目记忆上下文
      let memoryContext = '';
      if (this.memoryManager) {
        memoryContext = this.memoryManager.buildMemoryContext(msg);
        // 异步触发自动摘要（不阻塞消息处理）
        this.memoryManager.maybeSummarizeConversation(session.conversationId, userId).catch(err => {
          logger.error('自动摘要失败:', err);
        });
      }

      // 9. 构建 OpenCode 上下文
      const opencodeContext: MessageContext = {
        userId,
        userName,
        conversationId: session.conversationId,
        history,
        memoryContext: memoryContext || undefined,
      };

      // 10. 根据配置调用 AI 执行器
      const providerName = config.aiProvider === 'claude' ? 'Claude Code' : 'OpenCode';
      logger.log(`[${messageId}] 步骤 6-9: 消息创建、历史构建完成，准备调用 ${providerName}`);

      let result;
      const useStreaming = config.streaming.enabled && this.streamingCardManager;
      const usePersistentSession =
        config.persistentSession.enabled && config.aiProvider === 'claude';

      if (useStreaming) {
        // 流式输出模式 - 使用 AI Card
        const senderType: 'group' | 'user' = request.conversationType || 'group';
        const streamHandle = await this.streamingCardManager!.startStream(
          session.conversationId,
          sessionWebhook || '',
          senderType,
          createMarkdownSender(this.dingtalkService, sessionWebhook),
          createTextSender(this.dingtalkService, sessionWebhook),
          userId || ''
        );

        const displayFilter = new DisplayFilter();

        try {
          if (usePersistentSession) {
            const callbacks = createPersistentSessionCallbacks(displayFilter, streamHandle);
            result = await this.claudeCodeExecutor.executeSession(
              session.conversationId,
              msg,
              undefined,
              opencodeContext,
              callbacks
            );
          } else if (config.aiProvider === 'claude') {
            result = await this.claudeCodeExecutor.executeStream(
              msg,
              createStreamChunkCallback(displayFilter, streamHandle),
              opencodeContext
            );
          } else {
            result = await this.openCodeExecutor.executeStream(
              msg,
              async chunk => {
                await streamHandle.appendChunk(chunk);
              },
              opencodeContext
            );
          }
        } catch (error: unknown) {
          logger.error(`[${messageId}] 流式 AI 执行失败:`, error);
          const accumulatedText = streamHandle.getFullText() || 'AI 处理失败，请稍后重试';
          await streamHandle.finish(accumulatedText);
          return {
            success: false,
            message: 'AI 处理失败',
          };
        }

        // 刷新 DisplayFilter 缓冲区并完成卡片
        const flushed = displayFilter.flush();
        if (flushed.shouldSend && flushed.content) {
          await streamHandle.appendChunk(flushed.content);
        }
        const finalText = result?.output || streamHandle.getFullText() || '处理完成';
        await streamHandle.finish(finalText);
      } else {
        // 非流式模式
        if (usePersistentSession) {
          result = await this.claudeCodeExecutor.executeSession(
            session.conversationId,
            msg,
            undefined,
            opencodeContext
          );
        } else if (config.aiProvider === 'claude') {
          result = await this.claudeCodeExecutor.execute(msg, opencodeContext);
        } else {
          result = await this.openCodeExecutor.execute(msg, opencodeContext);
        }
      }

      logger.log(
        `[${messageId}] ${providerName} 完成: success=${result.success},  time=${result.executionTime}ms`
      );

      // 11. 处理结果
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

      // 12. 创建 AI 消息对象并保存
      const aiMessage: AIMessage = {
        id: generateMessageId(),
        type: 'ai',
        conversationId: session.conversationId,
        userId,
        content: responseContent,
        metadata: {
          timestamp: Date.now(),
          source: 'ai',
        },
      };

      await this.sessionManager.addMessage(session.conversationId, aiMessage);

      // 13. 返回结果
      const totalTime = Date.now() - startTime;
      logger.log(`[${messageId}] 消息处理完成，总耗时：${totalTime}ms`);

      return {
        success: result.success,
        message: result.success ? '处理成功' : '处理失败',
        data: {
          result: responseContent,
          conversationId: session.conversationId,
          executionTime: totalTime,
          messageId,
          streamingSent: !!useStreaming,
        },
      };
    } finally {
      // 14. 释放并发槽位
      this.concurrencyController.releaseSlot(userId, requestId);
    }
  }

  /**
   * 构建传递给 OpenCode 的对话历史
   */
  private async buildHistoryForOpenCode(
    conversationId: string
  ): Promise<Array<{ role: 'user' | 'assistant'; content: string }>> {
    return buildHistory(this.sessionManager, conversationId, 20);
  }
}
