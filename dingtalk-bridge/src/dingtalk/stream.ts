/**
 * DingTalk Stream Service - Enhanced Version
 * Features:
 * 1. Immediate ACK to DingTalk server to prevent timeout/retry
 * 2. Async message processing without blocking
 * 3. Enhanced logging and monitoring
 * 4. Auto-reconnect with exponential backoff
 * 5. Connection health monitoring
 */
import { DWClient, TOPIC_ROBOT, DWClientDownStream } from 'dingtalk-stream';
import { config } from '../config';
import axios from 'axios';
import type { StreamMessageData } from '../types/dingtalk-api';
import {
  updateAdminSessionWebhook,
  getAdminConversationId,
  notifyError,
  isAlertEnabled,
} from '../utils/alert';
import { parseCommand } from '../commands/commandParser';
import type { CommandHandler } from '../commands/commandHandler';
import type { MediaProcessor } from '../media/mediaProcessor';
import { createSafeLogger } from '../utils/logger';

const logger = createSafeLogger('Stream');

/** DWClient 扩展类型：包含未在类型定义中声明的 API */
interface DWClientExtended {
  config?: { subscriptions?: { type: string; topic: string }[] };
  registerCallbackListener(topic: string, cb: (msg: DWClientDownStream) => Promise<void>): void;
  socketCallBackResponse(messageId: string, data: Record<string, unknown>): void;
  disconnect(): void;
  on(event: string, cb: (...args: unknown[]) => void): void;
  connect(): Promise<void>;
}

export interface MessageHandler {
  (
    userId: string,
    userName: string,
    content: string,
    conversationId: string,
    sessionWebhook: string,
    conversationType?: 'group' | 'user'
  ): Promise<void>;
}

const DEFAULT_SUBSCRIPTIONS = [{ type: 'CALLBACK', topic: TOPIC_ROBOT }];

interface SessionInfo {
  conversationId: string;
  sessionWebhook: string;
  timestamp: number;
  lastUsedAt: number; // 最后使用时间
  healthStatus: 'healthy' | 'unknown' | 'failed'; // 健康状态
  failureCount: number; // 连续失败计数
}

/** 安全访问 DWClient 的扩展 API（类型定义中未声明的属性） */
function ext(client: DWClient): DWClientExtended {
  return client;
}

export class DingtalkStreamService {
  private client: DWClient | null = null;
  private messageHandler: MessageHandler | null = null;
  private commandHandler: CommandHandler | null = null;
  private isConnected: boolean = false;
  private connectionStartTime: number = 0;
  private lastHeartbeatTime: number = 0;
  private lastMessageTime: number = 0;
  private pendingMessages: Map<string, SessionInfo> = new Map();
  private cleanupTimer: NodeJS.Timeout | null = null;
  private heartbeatMonitorTimer: NodeJS.Timeout | null = null;
  private readonly messageTTL: number = 30 * 60 * 1000;
  private readonly heartbeatTimeout: number = 120 * 1000;

  // 重连相关
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isManualDisconnect: boolean = false;
  private mediaProcessor: MediaProcessor | null = null;

  constructor() {
    this.maxReconnectAttempts = config.stream.maxReconnectAttempts;
    logger.log('Service initialized (enhanced version)');
    logger.log(`  Topics: ${DEFAULT_SUBSCRIPTIONS.map(s => s.topic).join(', ')}`);
    logger.log(
      `  Auto-reconnect: max ${this.maxReconnectAttempts} attempts, delay ${config.stream.reconnectBaseDelay || 1000}ms - ${config.stream.reconnectMaxDelay || 60000}ms`
    );

    this.cleanupTimer = setInterval(
      () => {
        this.cleanupExpiredMessages();
      },
      5 * 60 * 1000
    );

    this.startHeartbeatMonitor();
  }

  setMessageHandler(handler: MessageHandler): void {
    this.messageHandler = handler;
  }

  setCommandHandler(handler: CommandHandler): void {
    this.commandHandler = handler;
  }

  setMediaProcessor(processor: MediaProcessor): void {
    this.mediaProcessor = processor;
    logger.log('Media processor set');
  }

  async start(): Promise<void> {
    // 重置重连状态
    this.isManualDisconnect = false;
    this.reconnectAttempts = 0;

    const { appKey, appSecret } = config.dingtalk;

    if (!appKey || !appSecret) {
      throw new Error('Missing DINGTALK_APP_KEY or DINGTALK_APP_SECRET');
    }

    logger.log('Initializing client...');

    this.client = new DWClient({
      clientId: appKey,
      clientSecret: appSecret,
      keepAlive: true,
      debug: true,
    });

    // 安全设置 subscriptions（兼容测试环境）
    if (ext(this.client).config) {
      ext(this.client).config!.subscriptions = DEFAULT_SUBSCRIPTIONS;
    }

    this.client.on('ready', () => {
      this.connectionStartTime = Date.now();
      this.isConnected = true;
      this.lastHeartbeatTime = Date.now();
      this.reconnectAttempts = 0;
      logger.log(`Connection established at ${new Date().toISOString()}`);
    });

    this.client.on('close', () => {
      this.isConnected = false;
      const duration = this.connectionStartTime
        ? Math.round((Date.now() - this.connectionStartTime) / 1000)
        : 0;
      logger.warn(`Connection closed (duration: ${duration}s)`);

      // 如果不是手动断开，尝试重新连接
      if (!this.isManualDisconnect) {
        this.handleDisconnect();
      }
    });

    this.client.on('error', (error: Error) => {
      this.isConnected = false;
      logger.error('Connection error:', error.message);

      // 如果不是手动断开，尝试重新连接
      if (!this.isManualDisconnect) {
        this.handleDisconnect();
      }
    });

    ext(this.client).registerCallbackListener(TOPIC_ROBOT, async (msg: DWClientDownStream) => {
      logger.log(`Received callback: msgId=${msg.headers.messageId}, topic=${msg.headers.topic}`);

      await this.handleMessage(msg).catch(error => {
        logger.error('Failed to handle message:', error);
      });
    });

    try {
      logger.log('Connecting to DingTalk Stream...');
      await ext(this.client).connect();
      logger.log('Connected, waiting for messages...');
    } catch (error) {
      logger.error('Connection failed:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  private startHeartbeatMonitor(): void {
    this.heartbeatMonitorTimer = setInterval(() => {
      if (this.isConnected && this.lastHeartbeatTime > 0) {
        const timeSinceLastHeartbeat = Date.now() - this.lastHeartbeatTime;
        if (timeSinceLastHeartbeat > this.heartbeatTimeout) {
          logger.warn(
            `Heartbeat timeout (${Math.round(timeSinceLastHeartbeat / 1000)}s), triggering reconnect...`
          );
          // 心跳超时，主动触发重连
          this.isConnected = false;
          this.handleDisconnect();
          return;
        }
      }

      if (this.lastMessageTime > 0) {
        const timeSinceLastMessage = Date.now() - this.lastMessageTime;
        logger.log(
          `Status: connected=${this.isConnected}, lastMsg=${Math.round(timeSinceLastMessage / 1000)}s ago, pending=${this.pendingMessages.size}`
        );
      }
    }, 60 * 1000);
  }

  updateHeartbeat(time?: number): void {
    this.lastHeartbeatTime = time ?? Date.now();
  }

  /**
   * 处理断开连接事件 - 自动重连
   */
  private handleDisconnect(): void {
    if (this.isManualDisconnect) {
      return;
    }

    this.reconnectAttempts++;

    if (this.reconnectAttempts > this.maxReconnectAttempts) {
      logger.error(`重连次数超过限制 (${this.maxReconnectAttempts}次)，停止重连`);
      logger.error('请检查网络连接或钉钉配置，然后手动重启服务');

      // 发送告警
      if (isAlertEnabled()) {
        notifyError('钉钉 Stream 连接失败', `已重连 ${this.reconnectAttempts} 次，均失败`).catch(
          () => {}
        );
      }
      return;
    }

    // 计算指数退避延迟
    const baseDelay = config.stream.reconnectBaseDelay || 1000;
    const maxDelay = config.stream.reconnectMaxDelay || 60000;
    const delay = Math.min(baseDelay * Math.pow(2, this.reconnectAttempts - 1), maxDelay);

    logger.log(
      `准备重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts}), 等待 ${delay / 1000}s...`
    );

    // 清除之前的重连定时器
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    // 设置重连定时器
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    this.reconnectTimer = setTimeout(async () => {
      logger.log(`执行重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

      try {
        await this.start();
        logger.log('重连成功');
      } catch (error) {
        logger.error('重连失败:', error instanceof Error ? error.message : error);
        // handleDisconnect 会通过 close 事件被再次调用
      }
    }, delay);
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async stop(): Promise<void> {
    logger.log('Stopping service...');

    // 标记为手动断开，不进行重连
    this.isManualDisconnect = true;

    // 清除重连定时器
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }

    if (this.heartbeatMonitorTimer) {
      clearInterval(this.heartbeatMonitorTimer);
      this.heartbeatMonitorTimer = null;
    }

    if (this.client) {
      try {
        ext(this.client).disconnect();
      } catch (error) {
        logger.error('Error disconnecting:', error);
      }
      this.client = null;
    }

    this.isConnected = false;
    this.pendingMessages.clear();
    this.reconnectAttempts = 0;
    logger.log('Service stopped');
  }

  /**
   * 清理定时器（用于测试）
   */
  clearTimers(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    if (this.heartbeatMonitorTimer) {
      clearInterval(this.heartbeatMonitorTimer);
      this.heartbeatMonitorTimer = null;
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * KEY FIX: Handle received message
   * 1. ACK DingTalk server immediately (first line calls socketCallBackResponse)
   * 2. Async message processing without blocking
   * 3. Support multiple message types
   */
  private async handleMessage(msg: DWClientDownStream): Promise<void> {
    const messageId = msg.headers.messageId;

    // KEY FIX: ACK to DingTalk immediately to prevent timeout
    if (this.client) {
      ext(this.client).socketCallBackResponse(messageId, { received: true });
    }

    try {
      const data: StreamMessageData =
        typeof msg.data === 'string' ? JSON.parse(msg.data) : msg.data;

      this.lastMessageTime = Date.now();
      this.updateHeartbeat();

      logger.log(
        `[${messageId}] type=${data.msgtype}, hasText=${!!(typeof data.text === 'object' ? data.text?.content : data.text)}`
      );

      const {
        senderId,
        senderNick,
        text,
        msgtype,
        conversationId,
        sessionWebhook,
        content,
        chatType,
      } = data;

      const userId = senderId || 'unknown';

      // allow_from 访问控制
      if (!this.isUserAllowed(userId)) {
        logger.log(`[${messageId}] 用户 ${userId} 不在允许列表中，忽略消息`);
        return;
      }

      // chatType: "group" = 群聊，"person" = 单聊
      const conversationType: 'group' | 'user' = chatType === 'group' ? 'group' : 'user';
      const userName = senderNick || 'Unknown';

      // Extract message content (support multiple types)
      let messageContent: string | undefined;

      // Handle media message types
      const mediaTypes = ['voice', 'picture', 'richText', 'video', 'file'];
      if (msgtype && mediaTypes.includes(msgtype)) {
        logger.log(`[${messageId}] Received media message type: ${msgtype}`);

        if (this.mediaProcessor) {
          try {
            let processedMedia;
            if (msgtype === 'voice' && data.voice) {
              processedMedia = await this.mediaProcessor.processVoice(
                data.voice.mediaId,
                String(data.voice.duration),
                data.voice.format
              );
            } else if (msgtype === 'picture' && data.picture) {
              processedMedia = await this.mediaProcessor.processImage(
                data.picture.downloadCode,
                data.picture.downloadUrl
              );
            } else if (msgtype === 'video' && data.video) {
              processedMedia = await this.mediaProcessor.processVideo(data.video.mediaId);
            } else if (msgtype === 'file' && data.file) {
              processedMedia = await this.mediaProcessor.processFile(
                data.file.mediaId,
                data.file.fileName || 'unknown'
              );
            } else if (msgtype === 'richText') {
              processedMedia = {
                type: 'file' as const,
                text: '[富文本消息] 用户发送了富文本消息',
                meta: {},
              };
            }

            if (processedMedia) {
              messageContent = processedMedia.text;
            }
          } catch (error) {
            logger.error(`[${messageId}] Failed to process ${msgtype} message:`, error);
            messageContent = `[${msgtype}消息] 用户发送了${msgtype}消息（处理失败）`;
          }
        } else {
          // No media processor, use placeholder
          const placeholders: Record<string, string> = {
            voice: '[语音消息] 用户发送了语音消息',
            picture: '[图片消息] 用户发送了一张图片',
            video: '[视频消息] 用户发送了视频',
            file: '[文件消息] 用户发送了文件',
            richText: '[富文本消息] 用户发送了富文本消息',
          };
          messageContent = placeholders[msgtype] || `[${msgtype}消息] 用户发送了${msgtype}消息`;
        }
      } else if (msgtype === 'text' && text && typeof text === 'object' && 'content' in text) {
        messageContent = text.content;
      } else if (typeof content === 'string' && content) {
        messageContent = content;
      } else if (text && typeof text === 'string') {
        messageContent = text;
      }

      // Save session info for replies
      if (conversationId && sessionWebhook) {
        this.pendingMessages.set(conversationId, {
          conversationId,
          sessionWebhook,
          timestamp: Date.now(),
          lastUsedAt: Date.now(),
          healthStatus: 'unknown' as const,
          failureCount: 0,
        });

        const adminUserId = getAdminConversationId();
        if (adminUserId && userId === adminUserId) {
          updateAdminSessionWebhook(conversationId, sessionWebhook);
        }
      }

      // Process messages with content
      if (messageContent && messageContent.trim() !== '') {
        logger.log(
          `[${messageId}] From ${userName}(${userId}): ${messageContent.substring(0, 80)}${messageContent.length > 80 ? '...' : ''}`
        );

        // Call message handler (async, don't wait)
        // 检查是否为 / 命令
        const parsedCommand = parseCommand(messageContent);
        if (parsedCommand && this.commandHandler) {
          logger.log(`[${messageId}] Command detected: /${parsedCommand.command}`);
          try {
            const response = await this.commandHandler.handle(
              parsedCommand,
              userId,
              conversationId || ''
            );
            if (sessionWebhook && conversationId) {
              await this.sendMarkdownMessage(conversationId, '命令结果', response);
            }
          } catch (error) {
            logger.error(`[${messageId}] Command handling failed:`, error);
            if (sessionWebhook && conversationId) {
              await this.sendTextMessage(conversationId, '❌ 命令处理失败，请稍后重试');
            }
          }
          return; // 命令处理完毕，不进入 AI 流程
        }

        if (this.messageHandler && sessionWebhook && conversationId) {
          logger.log(`[${messageId}] Starting async processing...`);

          // Async processing without blocking
          // 使用 void 明确表明我们不等待这个 Promise
          void this.messageHandler(
            userId,
            userName,
            messageContent,
            conversationId,
            sessionWebhook,
            conversationType
          )
            .then(() => {
              // 只在 debug 模式下输出完成日志，避免测试污染
              if (process.env.NODE_ENV !== 'test') {
                logger.log(`[${messageId}] Async processing completed`);
              }
            })
            .catch(error => {
              // 错误总是输出
              logger.error(`[${messageId}] Async processing failed:`, error.message);
            });
        } else {
          if (!this.messageHandler) {
            logger.warn(`[${messageId}] Message handler not set`);
          }
          if (!sessionWebhook) {
            logger.warn(`[${messageId}] No sessionWebhook, cannot reply`);
          }
        }
      } else {
        // Non-text messages are not supported
      }
    } catch (error) {
      logger.error(
        `[${messageId}] Failed to parse message:`,
        error instanceof Error ? error.message : error
      );
      // Already ACKed at function start
    }
  }

  async sendTextMessage(
    conversationId: string,
    content: string,
    mentionList?: string[]
  ): Promise<boolean> {
    try {
      if (!this.client) {
        throw new Error('Stream client not connected');
      }

      const sessionInfo = this.pendingMessages.get(conversationId);

      if (!sessionInfo?.sessionWebhook) {
        throw new Error(`sessionWebhook not found for ${conversationId}`);
      }

      // 更新最后使用时间
      sessionInfo.lastUsedAt = Date.now();

      logger.log(`Sending text: ${content.substring(0, 50)}...`);

      const messageBody = {
        msgtype: 'text',
        text: {
          content,
          at: {
            atUserIds: mentionList || [],
            isAtAll: mentionList?.includes('ALL') || false,
          },
        },
      };

      await axios.post(sessionInfo.sessionWebhook, messageBody, {
        timeout: 10000,
      });

      // 发送成功，更新健康状态
      sessionInfo.healthStatus = 'healthy';
      sessionInfo.failureCount = 0;

      return true;
    } catch (error: unknown) {
      logger.error('Failed to send text:', error instanceof Error ? error.message : String(error));

      const sessionInfo = this.pendingMessages.get(conversationId);
      if (sessionInfo) {
        sessionInfo.failureCount++;
        sessionInfo.healthStatus = 'failed';

        if (sessionInfo.failureCount >= 3) {
          logger.warn(`Webhook 连续失败 3 次，标记为不可用：${conversationId}`);
        }
      }
      return false;
    }
  }

  async sendMarkdownMessage(conversationId: string, title: string, text: string): Promise<boolean> {
    try {
      if (!this.client) {
        throw new Error('Stream client not connected');
      }

      const sessionInfo = this.pendingMessages.get(conversationId);

      if (!sessionInfo?.sessionWebhook) {
        throw new Error(`sessionWebhook not found for ${conversationId}`);
      }

      // 更新最后使用时间
      sessionInfo.lastUsedAt = Date.now();

      logger.log(`Sending markdown: ${title}`);

      const messageBody = {
        msgtype: 'markdown',
        markdown: {
          title,
          text,
        },
      };

      await axios.post(sessionInfo.sessionWebhook, messageBody, {
        timeout: 10000,
      });

      // 发送成功，更新健康状态
      sessionInfo.healthStatus = 'healthy';
      sessionInfo.failureCount = 0;

      return true;
    } catch (error: any) {
      logger.error('Failed to send markdown:', error.message);

      const sessionInfo = this.pendingMessages.get(conversationId);
      if (sessionInfo) {
        sessionInfo.failureCount++;
        sessionInfo.healthStatus = 'failed';

        if (sessionInfo.failureCount >= 3) {
          logger.warn(`Webhook 连续失败 3 次，标记为不可用：${conversationId}`);
        }
      }
      return false;
    }
  }

  private cleanupExpiredMessages(): void {
    const now = Date.now();
    let cleanedCount = 0;
    let staleCount = 0;

    for (const [conversationId, sessionInfo] of this.pendingMessages.entries()) {
      // 清理过期会话
      if (now - sessionInfo.timestamp > this.messageTTL) {
        this.pendingMessages.delete(conversationId);
        cleanedCount++;
        continue;
      }

      // 清理连续失败 3 次以上的会话（提前失效）
      if (sessionInfo.failureCount >= 3 && now - sessionInfo.lastUsedAt > 5 * 60 * 1000) {
        this.pendingMessages.delete(conversationId);
        staleCount++;
        logger.log(
          `Cleaned stale webhook (${sessionInfo.failureCount} failures): ${conversationId.substring(0, 30)}...`
        );
      }
    }

    if (cleanedCount > 0) {
      logger.log(`Cleaned ${cleanedCount} expired sessions`);
    }
    if (staleCount > 0) {
      logger.log(`Cleaned ${staleCount} stale sessions`);
    }
  }

  /**
   * 获取健康会话数量
   */
  getHealthySessionCount(): number {
    let count = 0;
    for (const sessionInfo of this.pendingMessages.values()) {
      if (sessionInfo.healthStatus === 'healthy' || sessionInfo.healthStatus === 'unknown') {
        count++;
      }
    }
    return count;
  }

  /**
   * 获取失败会话数量
   */
  getFailedSessionCount(): number {
    let count = 0;
    for (const sessionInfo of this.pendingMessages.values()) {
      if (sessionInfo.healthStatus === 'failed') {
        count++;
      }
    }
    return count;
  }

  getStatus() {
    const now = Date.now();
    return {
      connected: this.isConnected,
      uptimeSeconds: this.connectionStartTime
        ? Math.round((now - this.connectionStartTime) / 1000)
        : 0,
      lastHeartbeatSecondsAgo: this.lastHeartbeatTime
        ? Math.round((now - this.lastHeartbeatTime) / 1000)
        : -1,
      lastMessageSecondsAgo: this.lastMessageTime
        ? Math.round((now - this.lastMessageTime) / 1000)
        : -1,
      pendingMessages: this.pendingMessages.size,
      healthySessions: this.getHealthySessionCount(),
      failedSessions: this.getFailedSessionCount(),
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts,
    };
  }

  /**
   * 发送互动卡片消息
   */
  async sendCardMessage(
    conversationId: string,
    cardData: Record<string, unknown>
  ): Promise<boolean> {
    try {
      if (!this.client) {
        throw new Error('Stream client not connected');
      }

      const sessionInfo = this.pendingMessages.get(conversationId);

      if (!sessionInfo?.sessionWebhook) {
        throw new Error(`sessionWebhook not found for ${conversationId}`);
      }

      sessionInfo.lastUsedAt = Date.now();

      logger.log(`Sending card message to ${conversationId.substring(0, 30)}...`);

      await axios.post(sessionInfo.sessionWebhook, cardData, {
        timeout: 10000,
      });

      sessionInfo.healthStatus = 'healthy';
      sessionInfo.failureCount = 0;

      return true;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      logger.error('Failed to send card message:', msg);

      const sessionInfo = this.pendingMessages.get(conversationId);
      if (sessionInfo) {
        sessionInfo.failureCount++;
        sessionInfo.healthStatus = 'failed';
      }

      return false;
    }
  }

  private isUserAllowed(userId: string): boolean {
    const allowFrom = config.dingtalk.allowFrom;
    if (allowFrom === '*') return true;
    const allowedUsers = allowFrom
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    if (allowedUsers.length === 0) {
      logger.warn('DINGTALK_ALLOW_FROM 非通配符但解析后为空列表，将允许所有用户');
      return true;
    }
    return allowedUsers.includes(userId);
  }
}
