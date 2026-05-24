/**
 * 流式卡片管理器 - 实现钉钉互动卡片的流式输出
 *
 * 核心流程：
 * 1. 调用 AICardService.createCard() 创建并投放 AI Card
 * 2. 调用 AICardService.streamUpdate() 流式更新卡片内容
 * 3. AI 执行完毕：调用 AICardService.finish() 完成卡片
 * 4. 降级兜底：如果 AI Card 创建失败，回退到 sessionWebhook 发送 markdown
 *
 * 新增功能：
 * - 工具调用格式化（📖 Read / ⚡ Bash / ✏️ Edit）
 * - 多卡片分页（超长内容自动分卡）
 * - 防抖更新（200ms debounce）
 */
import axios from 'axios';
import { randomUUID } from 'crypto';
import { config } from '../config';
import type { StreamingConfig } from '../config';
import { AICardService, type AICardInstance } from './aiCardService';
import { createSafeLogger } from '../utils/logger';

const logger = createSafeLogger('StreamingCard');

// ==================== 配置常量 ====================

/** 卡片更新最小间隔（毫秒），参考 dingtalk-openclaw-connector updateInterval */
const CARD_UPDATE_INTERVAL = 800;

/** 单个卡片最大字符数 */
const MAX_CARD_CONTENT = 8000;

/** 卡片分页阈值（超过此长度时分卡） */
const CARD_SPLIT_THRESHOLD = 6000;

/** 流式会话 TTL（毫秒） */
const STREAM_TTL_MS = 10 * 60 * 1000;

/** 清理间隔（毫秒） */
const CLEANUP_INTERVAL_MS = 60 * 1000;

/** 忙等待超时（毫秒） */
const BUSY_WAIT_TIMEOUT_MS = 5000;

/** 打字机效果：触发阈值（超过此长度的 chunk 视为完整响应，需要模拟流式） */
const TYPEWRITER_THRESHOLD = 50;

/** 打字机效果：每步喂入字符数 */
const TYPEWRITER_CHUNK_SIZE = 20;

/** 打字机效果：每步间隔（毫秒） */
const TYPEWRITER_INTERVAL_MS = 150;

/** 活跃的流式会话 */
interface ActiveStream {
  /** 卡片唯一标识 */
  outTrackId: string;
  /** 钉钉会话 ID */
  conversationId: string;
  /** 回复 webhook（降级时使用） */
  sessionWebhook: string;
  /** AI Card 实例（使用 AI Card 时） */
  card: AICardInstance | null;
  /** 积累的完整文本 */
  fullText: string;
  /** 上次已推送到卡片的文本 */
  lastSentText: string;
  /** 上次推送时间 */
  lastSentAt: number;
  /** 定时刷新器（AI Card 和降级模式共用） */
  updateTimer: NodeJS.Timeout | null;
  /** 是否已降级（使用 sessionWebhook） */
  degraded: boolean;
  /** 连续更新失败次数 */
  failureCount: number;
  /** 是否已完成 */
  finished: boolean;
  /** 发送者类型 */
  senderType: 'user' | 'group';
  /** 当前卡片编号（0-based，用于分卡） */
  cardPartIndex: number;
  /** 当前卡片对应的文本偏移量 */
  cardContentOffset: number;
  /** 是否正在分卡（防止并发） */
  isSplitting: boolean;
  /** 是否正在更新（防抖） */
  isUpdating: boolean;
  /** 打字机队列：待逐步喂入的文本 */
  typewriterPending: string;
  /** 打字机定时器 */
  typewriterTimer: NodeJS.Timeout | null;
}

/** 流式卡片句柄 - 返回给调用者用于追加文本 */
export interface StreamCardHandle {
  outTrackId: string;
  /** 追加流式文本 */
  appendChunk(chunk: string): Promise<void>;
  /** 获取已积累的全部文本 */
  getFullText(): string;
  /** 完成流式，发送最终内容 */
  finish(finalText?: string): Promise<void>;
  /** 获取卡片是否已降级 */
  isDegraded(): boolean;
}

/**
 * 截断卡片内容 — 优先保留头部
 */
function truncateCardContent(content: string): string {
  if (content.length <= MAX_CARD_CONTENT) return content;

  const truncateNotice = '\n\n---\n\n> ⚠️ *内容过长，已截断后部分*\n';
  const keepStart = MAX_CARD_CONTENT - truncateNotice.length;
  const head = content.substring(0, keepStart);
  // 在最近的换行处截断，避免切断行
  const lastNewline = head.lastIndexOf('\n');
  const cleanHead = lastNewline > keepStart * 0.8 ? head.substring(0, lastNewline) : head;
  return cleanHead + truncateNotice;
}

export class StreamingCardManager {
  private streams: Map<string, ActiveStream> = new Map();
  private config: StreamingConfig;
  private cardService: AICardService;
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(streamingConfig?: Partial<StreamingConfig>) {
    this.config = {
      enabled: streamingConfig?.enabled ?? config.streaming.enabled,
      intervalMs: streamingConfig?.intervalMs ?? CARD_UPDATE_INTERVAL,
      minDeltaChars: streamingConfig?.minDeltaChars ?? config.streaming.minDeltaChars,
      maxChars: streamingConfig?.maxChars ?? MAX_CARD_CONTENT,
      thinkingText: streamingConfig?.thinkingText ?? config.streaming.thinkingText,
      cardTemplateId: streamingConfig?.cardTemplateId ?? config.streaming.cardTemplateId,
    };
    this.cardService = new AICardService();
    this.startCleanupTimer();
  }

  /**
   * 启动定时清理过期 stream
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      const now = Date.now();
      for (const [id, stream] of this.streams) {
        if (now - stream.lastSentAt > STREAM_TTL_MS && !stream.finished) {
          logger.warn(
            `清理过期 stream: ${id} (空闲 ${Math.round((now - stream.lastSentAt) / 60000)}min)`
          );
          if (stream.updateTimer) {
            clearInterval(stream.updateTimer);
          }
          stream.finished = true;
          this.streams.delete(id);
        }
      }
    }, CLEANUP_INTERVAL_MS);
  }

  /**
   * 开始流式：创建 AI Card，完成后发送最终结果
   */
  async startStream(
    conversationId: string,
    sessionWebhook: string,
    senderType: 'user' | 'group' = 'group',
    sendMarkdownFn?: (conversationId: string, title: string, text: string) => Promise<boolean>,
    sendTextFn?: (conversationId: string, text: string) => Promise<boolean>,
    userId: string = ''
  ): Promise<StreamCardHandle> {
    const outTrackId = `stream-${randomUUID()}`;

    let card: AICardInstance | null = null;
    let useDegraded = false;

    if (this.config.enabled) {
      try {
        logger.log(`尝试创建 AI Card: ${conversationId.substring(0, 30)}...`);
        card = await this.cardService.createCard(conversationId, senderType, userId);

        if (!card) {
          logger.warn('AI Card 创建失败，使用降级模式');
          useDegraded = true;
        } else {
          logger.log(`AI Card 创建成功：${card.cardInstanceId}`);
        }
      } catch (err) {
        logger.error('AI Card 创建异常，使用降级模式:', err);
        useDegraded = true;
      }
    } else {
      logger.log('流式未启用，使用降级模式');
      useDegraded = true;
    }

    const stream: ActiveStream = {
      outTrackId,
      conversationId,
      sessionWebhook,
      card,
      fullText: '',
      lastSentText: '',
      lastSentAt: 0,
      updateTimer: null,
      degraded: useDegraded,
      failureCount: 0,
      finished: false,
      senderType,
      cardPartIndex: 0,
      cardContentOffset: 0,
      isSplitting: false,
      isUpdating: false,
      typewriterPending: '',
      typewriterTimer: null,
    };

    this.streams.set(outTrackId, stream);

    return this.createHandle(stream, sendMarkdownFn, sendTextFn);
  }

  /**
   * 创建流式句柄
   */
  private createHandle(
    stream: ActiveStream,
    sendMarkdownFn?: (conversationId: string, title: string, text: string) => Promise<boolean>,
    sendTextFn?: (conversationId: string, text: string) => Promise<boolean>
  ): StreamCardHandle {
    return {
      outTrackId: stream.outTrackId,
      appendChunk: (chunk: string): Promise<void> => {
        if (stream.finished) return Promise.resolve();

        // 打字机模拟：大块文本（-p 模式一次性返回的完整响应）分片喂入，
        // 小块文本（真流式 delta）直接追加
        if (stream.typewriterTimer || chunk.length > TYPEWRITER_THRESHOLD) {
          stream.typewriterPending += chunk;
          if (!stream.typewriterTimer) {
            if (!stream.updateTimer) {
              this.startFlushTimer(stream, sendMarkdownFn);
            }
            this.startTypewriter(stream);
          }
        } else {
          stream.fullText += chunk;
          if (!stream.updateTimer) {
            this.startFlushTimer(stream, sendMarkdownFn);
          }
        }
        return Promise.resolve();
      },
      getFullText: () => stream.fullText,
      finish: async (finalText?: string) => {
        if (stream.finished) return;
        stream.finished = true;

        // 立即刷入打字机队列中的剩余文本
        if (stream.typewriterPending) {
          stream.fullText += stream.typewriterPending;
          stream.typewriterPending = '';
        }
        if (stream.typewriterTimer) {
          clearInterval(stream.typewriterTimer);
          stream.typewriterTimer = null;
        }

        if (finalText !== undefined) {
          stream.fullText = finalText;
        }

        // 清除定时器
        if (stream.updateTimer) {
          clearInterval(stream.updateTimer);
          stream.updateTimer = null;
        }

        // 等待进行中的更新/分卡完成（带超时保护）
        const deadline = Date.now() + BUSY_WAIT_TIMEOUT_MS;
        while ((stream.isUpdating || stream.isSplitting) && Date.now() < deadline) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
        if (stream.isUpdating || stream.isSplitting) {
          logger.warn('等待卡片更新超时，强制完成');
          stream.isUpdating = false;
          stream.isSplitting = false;
        }

        // 使用 AI Card：先逐步推送，再 finish
        if (!stream.degraded && stream.card) {
          try {
            // 最终更新
            const finalContent = stream.fullText.substring(stream.cardContentOffset);
            await this.cardService.streamUpdate(
              stream.card,
              truncateCardContent(finalContent),
              false
            );
            await this.cardService.finish(
              stream.card,
              truncateCardContent(stream.fullText) || '（无内容）'
            );
            logger.log(
              `AI Card 完成：${stream.outTrackId}, totalCards: ${stream.cardPartIndex + 1}`
            );
          } catch (error) {
            logger.error('AI Card 完成失败，尝试降级:', error);
            await this.sendFallback(stream, sendMarkdownFn, sendTextFn);
          }
        } else {
          await this.sendFallback(stream, sendMarkdownFn, sendTextFn);
        }

        this.streams.delete(stream.outTrackId);
      },
      isDegraded: () => stream.degraded,
    };
  }

  /**
   * 降级发送
   */
  private async sendFallback(
    stream: ActiveStream,
    sendMarkdownFn?: (conversationId: string, title: string, text: string) => Promise<boolean>,
    sendTextFn?: (conversationId: string, text: string) => Promise<boolean>
  ): Promise<void> {
    const title = 'AI 回复';
    const text = stream.fullText || '（无内容）';

    if (sendMarkdownFn) {
      try {
        const sent = await sendMarkdownFn(stream.conversationId, title, text);
        if (sent) return;
      } catch (error) {
        logger.error('降级 markdown 发送失败:', error);
      }
    }

    // 兜底
    try {
      await axios.post(
        stream.sessionWebhook,
        {
          msgtype: 'markdown',
          markdown: { title, text },
        },
        { timeout: 10000 }
      );
    } catch (error) {
      logger.error('兜底发送失败:', error);
      if (sendTextFn) {
        try {
          await sendTextFn(stream.conversationId, text.substring(0, 2000));
        } catch (e) {
          logger.error('文本发送也失败:', e);
        }
      }
    }
  }

  /**
   * 获取当前卡片的内容
   */
  private getCurrentCardContent(stream: ActiveStream): string {
    return stream.fullText.substring(stream.cardContentOffset);
  }

  /**
   * 分卡：finalize 当前卡片，创建新卡片
   */
  private async splitCard(
    stream: ActiveStream,
    _sendMarkdownFn?: (conversationId: string, title: string, text: string) => Promise<boolean>
  ): Promise<void> {
    if (stream.isSplitting || stream.degraded || !stream.card) return;
    stream.isSplitting = true;

    try {
      // Finalize 当前卡片
      const currentContent = this.getCurrentCardContent(stream);
      const truncated = truncateCardContent(currentContent);
      const partLabel = stream.cardPartIndex > 0 ? ` (Part ${stream.cardPartIndex + 1})` : '';
      const finalContent = truncated + `\n\n---\n*↓ 内容继续到下一张卡片${partLabel}...*`;

      logger.log('Card split: finalizing current card', {
        conversationId: stream.conversationId,
        part: stream.cardPartIndex + 1,
        contentLength: currentContent.length,
      });

      // 完成当前卡片
      await this.cardService.streamUpdate(stream.card, finalContent, false);
      await this.cardService.finish(stream.card, finalContent);

      // 创建新卡片
      const newCard = await this.cardService.createCard(
        stream.conversationId,
        stream.senderType,
        ''
      );

      if (newCard) {
        stream.card = newCard;
        logger.log('Card split: new card created', {
          conversationId: stream.conversationId,
          part: stream.cardPartIndex + 2,
          cardInstanceId: newCard.cardInstanceId,
        });
      } else {
        logger.warn('Card split: failed to create new card, degrading');
        stream.degraded = true;
      }

      stream.cardPartIndex++;
      stream.cardContentOffset = stream.fullText.length;
      stream.lastSentText = '';
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      logger.error('Card split failed', { error: message });
    } finally {
      stream.isSplitting = false;
    }
  }

  /**
   * 启动打字机效果定时器
   *
   * 将大块文本（-p 模式一次性返回的完整响应）分片逐步喂入 fullText，
   * 配合 startFlushTimer 的 800ms 间隔自然产生逐段推送效果。
   */
  private startTypewriter(stream: ActiveStream): void {
    if (stream.typewriterTimer) return;

    stream.typewriterTimer = setInterval(() => {
      if (stream.finished || !stream.typewriterPending) {
        if (stream.typewriterTimer) {
          clearInterval(stream.typewriterTimer);
          stream.typewriterTimer = null;
        }
        return;
      }

      const segment = stream.typewriterPending.substring(0, TYPEWRITER_CHUNK_SIZE);
      stream.typewriterPending = stream.typewriterPending.substring(TYPEWRITER_CHUNK_SIZE);
      stream.fullText += segment;

      if (!stream.typewriterPending) {
        clearInterval(stream.typewriterTimer!);
        stream.typewriterTimer = null;
      }
    }, TYPEWRITER_INTERVAL_MS);
  }

  /**
   * 启动定时刷新器
   * 参考 dingtalk-openclaw-connector: 用 lastSentAt 时间戳控制最小更新间隔
   * 首次更新立即触发，后续按 CARD_UPDATE_INTERVAL 控制频率
   * 与全局 token-bucket 限流器配合使用
   */
  private startFlushTimer(
    stream: ActiveStream,
    sendMarkdownFn?: (conversationId: string, title: string, text: string) => Promise<boolean>
  ): void {
    // 用 100ms 快速轮询间隔（检测时间条件是否满足）
    stream.updateTimer = setInterval(() => {
      void (async () => {
        if (stream.finished || stream.isUpdating || stream.isSplitting) return;

        const now = Date.now();

        // 参考项目模式：检查距上次更新的时间间隔
        // 首次更新(lastSentAt===0)立即触发，后续等待 minInterval
        if (stream.lastSentAt > 0 && now - stream.lastSentAt < CARD_UPDATE_INTERVAL) {
          return; // 距上次发送未满 interval，跳过
        }

        const cardContent = this.getCurrentCardContent(stream);
        const currentContent = truncateCardContent(cardContent);

        // 内容和上次一样，无需更新
        if (currentContent === stream.lastSentText) return;

        // 检查是否需要分卡
        if (cardContent.length > CARD_SPLIT_THRESHOLD && !stream.degraded && stream.card) {
          await this.splitCard(stream, sendMarkdownFn);
          return;
        }

        stream.isUpdating = true;
        try {
          if (!stream.degraded && stream.card) {
            await this.cardService.streamUpdate(stream.card, currentContent, false);
            stream.lastSentText = currentContent;
            stream.lastSentAt = now;
            logger.log('Card updated (lastSentAt gating)', {
              conversationId: stream.conversationId,
              part: stream.cardPartIndex + 1,
              contentLength: currentContent.length,
              deltaMs: stream.lastSentAt > 0 ? now - stream.lastSentAt : 0,
            });
          } else if (sendMarkdownFn) {
            await sendMarkdownFn(stream.conversationId, 'AI 回复', currentContent);
            stream.lastSentText = currentContent;
            stream.lastSentAt = now;
          }
        } catch (error) {
          logger.error('Card update failed:', error);
          stream.failureCount++;
          if (stream.failureCount >= 3) {
            logger.warn('连续失败 3 次，降级到 sessionWebhook 模式');
            stream.degraded = true;
          }
        } finally {
          stream.isUpdating = false;
        }
      })();
    }, 100); // 100ms 快速轮询，实际更新频率由 lastSentAt 控制
  }

  /**
   * 清理所有流式会话
   */
  cleanup(): void {
    for (const stream of Array.from(this.streams.values())) {
      if (stream.updateTimer) {
        clearInterval(stream.updateTimer);
      }
      if (stream.typewriterTimer) {
        clearInterval(stream.typewriterTimer);
      }
    }
    this.streams.clear();
  }

  /**
   * 销毁管理器
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.cleanup();
  }

  /**
   * 获取活跃流数
   */
  getActiveStreamCount(): number {
    return this.streams.size;
  }

  /**
   * 获取配置
   */
  getConfig(): StreamingConfig {
    return { ...this.config };
  }
}
