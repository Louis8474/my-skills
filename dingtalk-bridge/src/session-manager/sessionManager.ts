/**
 * 会话管理模块
 * 负责管理用户对话会话，支持会话持久化和历史管理
 */
import { Session, SessionState, SessionConfig, DEFAULT_SESSION_CONFIG } from '../types/session';
import { ConversationMessage } from '../types/message';
import { config } from '../config';
import { generateConversationId } from '../utils/messageId';
import { createSafeLogger } from '../utils/logger';

const logger = createSafeLogger('SessionManager');

/**
 * 内存中的会话存储
 */
interface SessionStore {
  [conversationId: string]: Session;
}

/**
 * 会话管理器选项
 */
export interface SessionManagerOptions {
  config?: Partial<SessionConfig>;
  autoCleanup?: boolean;
  cleanupInterval?: number;
}

/**
 * 会话统计信息
 */
export interface SessionStats {
  total: number;
  active: number;
  idle: number;
  expired: number;
  terminated: number;
}

/**
 * 会话管理器
 */
export class SessionManager {
  private sessions: SessionStore = {};
  private sessionConfig: SessionConfig;
  private autoCleanup: boolean;
  private cleanupInterval: number;
  private cleanupTimer?: NodeJS.Timeout;

  constructor(options: SessionManagerOptions = {}) {
    this.sessionConfig = {
      ...DEFAULT_SESSION_CONFIG,
      ttl: config.session.ttl,
      maxHistoryMessages: config.session.maxHistoryMessages,
      ...options.config,
    };
    this.autoCleanup = options.autoCleanup ?? true;
    this.cleanupInterval = options.cleanupInterval ?? 60000;

    if (this.autoCleanup) {
      this.startCleanupService();
    }
  }

  /**
   * 创建新会话
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  async createSession(userId: string): Promise<Session> {
    // 检查并强制执行容量限制
    this.enforceCapacityLimit();

    const conversationId = generateConversationId();
    const now = Date.now();

    const session: Session = {
      conversationId,
      userId,
      state: SessionState.Active,
      config: this.sessionConfig,
      context: {
        conversationId,
        messages: [],
        metadata: {
          createdAt: now,
          lastActivityAt: now,
          messageCount: 0,
        },
      },
      createdAt: now,
      lastActivityAt: now,
    };

    this.sessions[conversationId] = session;
    logger.log(`✅ 创建会话：${conversationId} (用户：${userId})`);

    return session;
  }

  /**
   * 强制执行容量限制（LRU 淘汰）
   */
  private enforceCapacityLimit(): void {
    const sessionIds = Object.keys(this.sessions);
    if (sessionIds.length >= this.sessionConfig.maxSessions) {
      // 按最后活动时间排序，淘汰最老的会话
      const sorted = sessionIds
        .filter(id => this.sessions[id].state === SessionState.Active)
        .sort((a, b) => this.sessions[a].lastActivityAt - this.sessions[b].lastActivityAt);

      const toRemove = sorted.slice(0, sessionIds.length - this.sessionConfig.maxSessions + 1);
      for (const id of toRemove) {
        delete this.sessions[id];
      }
      if (toRemove.length > 0) {
        logger.log(`达到容量限制，淘汰 ${toRemove.length} 个最老会话`);
      }
    }
  }

  /**
   * 获取会话
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  async getSession(conversationId: string): Promise<Session | null> {
    return this.sessions[conversationId] || null;
  }

  /**
   * 获取或创建会话
   * 空闲超时的会话自动归档为 idle，创建新会话（防上下文漂移）
   * 过期的会话标记为 expired 并创建新会话
   */
  async getOrCreateSession(userId: string): Promise<Session> {
    const now = Date.now();

    // 查找用户的活跃会话
    const activeSession = Object.values(this.sessions).find(
      s => s.userId === userId && s.state === SessionState.Active
    );

    if (activeSession) {
      const idleDuration = now - activeSession.lastActivityAt;

      // 检查是否过期（超过 TTL）
      if (idleDuration >= this.sessionConfig.ttl) {
        activeSession.state = SessionState.Expired;
        return this.createSession(userId);
      }

      // 检查是否空闲轮转（超过 idle reset 阈值，但未过期）
      if (idleDuration >= config.session.idleResetMs) {
        activeSession.state = SessionState.Idle;
        logger.log(
          `🔄 会话空闲轮转：${activeSession.conversationId} (空闲 ${Math.round(idleDuration / 60000)}min)`
        );
        return this.createSession(userId);
      }

      return activeSession;
    }

    // 创建新会话
    return this.createSession(userId);
  }

  /**
   * 获取用户的所有会话（含历史）
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  async getUserSessions(userId: string): Promise<Session[]> {
    return Object.values(this.sessions)
      .filter(s => s.userId === userId)
      .sort((a, b) => b.lastActivityAt - a.lastActivityAt);
  }

  /**
   * 切换到指定会话（重新激活 idle 会话）
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  async switchSession(userId: string, conversationId: string): Promise<Session | null> {
    const session = this.sessions[conversationId];
    if (!session || session.userId !== userId) {
      return null;
    }

    if (session.state === SessionState.Idle || session.state === SessionState.Expired) {
      if (session.state === SessionState.Expired) {
        logger.warn(`⚠️ 切换到已过期会话：${conversationId} (用户：${userId})，上下文可能已过时`);
      }

      // 将当前活跃会话归档
      const currentActive = Object.values(this.sessions).find(
        s => s.userId === userId && s.state === SessionState.Active
      );
      if (currentActive) {
        currentActive.state = SessionState.Idle;
      }

      // 重新激活目标会话
      session.state = SessionState.Active;
      session.lastActivityAt = Date.now();
      logger.log(`🔀 切换会话：${conversationId} (用户：${userId})`);
      return session;
    }

    return session;
  }

  /**
   * 更新会话
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  async updateSession(session: Session): Promise<void> {
    session.lastActivityAt = Date.now();
    session.context.metadata.lastActivityAt = Date.now();
    this.sessions[session.conversationId] = session;
  }

  /**
   * 添加消息到会话历史
   */
  async addMessage(conversationId: string, message: ConversationMessage): Promise<void> {
    const session = await this.getSession(conversationId);
    if (!session) {
      throw new Error(`Session not found: ${conversationId}`);
    }

    session.context.messages.push(message);
    session.context.metadata.messageCount = session.context.messages.length;

    // 裁剪历史消息
    if (session.context.messages.length > this.sessionConfig.maxHistoryMessages) {
      this.trimMessages(session);
    }

    await this.updateSession(session);
  }

  /**
   * 获取会话历史
   */
  async getHistory(conversationId: string, limit?: number): Promise<ConversationMessage[]> {
    const session = await this.getSession(conversationId);
    if (!session) {
      return [];
    }

    const messages = session.context.messages;
    if (limit && messages.length > limit) {
      return messages.slice(-limit);
    }

    return messages;
  }

  /**
   *结束会话
   */
  async endSession(
    conversationId: string,
    state: SessionState = SessionState.Terminated
  ): Promise<void> {
    const session = await this.getSession(conversationId);
    if (session) {
      session.state = state;
      logger.log(`📋 会话结束：${conversationId} (${state})`);
    }
  }

  /**
   * 裁剪消息历史
   */
  private trimMessages(session: Session): void {
    const maxMessages = this.sessionConfig.maxHistoryMessages;
    if (session.context.messages.length > maxMessages) {
      const removed = session.context.messages.length - maxMessages;
      session.context.messages = session.context.messages.slice(-maxMessages);
      logger.log(`📝 裁剪消息历史：${session.conversationId} (${removed} 条)`);
    }
  }

  /**
   * 构建上下文
   */
  async buildContext(conversationId: string): Promise<string> {
    const session = await this.getSession(conversationId);
    if (!session) {
      return '';
    }

    const { messages } = session.context;
    const recentMessages = messages.slice(-this.sessionConfig.maxHistoryMessages);

    return recentMessages
      .map(msg => `${msg.type === 'user' ? '用户' : 'AI'}: ${msg.content}`)
      .join('\n');
  }

  /**
   * 开始清理服务
   */
  private startCleanupService(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpiredSessions();
    }, this.cleanupInterval);

    logger.log(`🔄 会话清理服务已启动 (间隔：${this.cleanupInterval / 1000}秒)`);
  }

  /**
   * 停止清理服务
   */
  stopCleanupService(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
  }

  /**
   * 清理过期会话
   */
  private cleanupExpiredSessions(): void {
    const now = Date.now();
    const ttl = this.sessionConfig.ttl;
    let cleanedCount = 0;

    for (const [conversationId, session] of Object.entries(this.sessions)) {
      if (session.state === SessionState.Active && now - session.lastActivityAt > ttl) {
        session.state = SessionState.Expired;
        cleanedCount++;
      }

      // 删除终止和过期超过 1 小时的会话
      if (
        (session.state === SessionState.Terminated || session.state === SessionState.Expired) &&
        now - session.lastActivityAt > ttl * 2
      ) {
        delete this.sessions[conversationId];
      }
    }

    if (cleanedCount > 0) {
      logger.log(`🧹 清理了 ${cleanedCount} 个过期会话`);
    }
  }

  /**
   * 获取统计信息
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  async getStats(): Promise<SessionStats> {
    const stats: SessionStats = {
      total: Object.keys(this.sessions).length,
      active: 0,
      idle: 0,
      expired: 0,
      terminated: 0,
    };

    for (const session of Object.values(this.sessions)) {
      switch (session.state) {
        case SessionState.Active:
          stats.active++;
          break;
        case SessionState.Idle:
          stats.idle++;
          break;
        case SessionState.Expired:
          stats.expired++;
          break;
        case SessionState.Terminated:
          stats.terminated++;
          break;
      }
    }

    return stats;
  }

  /**
   * 获取所有会话
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  async getAllSessions(): Promise<Session[]> {
    return Object.values(this.sessions);
  }

  /**
   * 清空所有会话
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  async clearAllSessions(): Promise<void> {
    this.sessions = {};
    logger.log('🧹 已清空所有会话');
  }
}
