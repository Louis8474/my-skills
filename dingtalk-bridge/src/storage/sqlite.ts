/**
 * SQLite 持久化存储
 * 提供消息队列、会话管理等的持久化支持
 */
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { UserMessage, ConversationMessage } from '../types/message';
import { createSafeLogger } from '../utils/logger';

const logger = createSafeLogger('SQLite');

/**
 * 存储配置
 */
export interface StorageConfig {
  dbPath: string;
  enableWAL: boolean;
  busyTimeout: number;
}

const DEFAULT_CONFIG: StorageConfig = {
  dbPath: path.join(process.cwd(), 'data', 'dingtalk.db'),
  enableWAL: true,
  busyTimeout: 5000,
};

/**
 * 队列消息记录
 */
export interface PersistedQueueMessage {
  id: string;
  conversationId: string;
  userId: string;
  username?: string;
  content: string;
  priority: string;
  status: string;
  retryCount: number;
  createdAt: number;
  updatedAt: number;
  lastError?: string;
}

/**
 * 会话记录
 */
export interface PersistedSession {
  conversationId: string;
  userId: string;
  state: string;
  createdAt: number;
  lastActivityAt: number;
  metadata: string;
}

/**
 * SQLite 存储类
 */
export class SQLiteStorage {
  private db: Database.Database;
  private config: StorageConfig;
  private isInitialized: boolean = false;

  constructor(config?: Partial<StorageConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.db = this.initialize();
  }

  /**
   * 初始化数据库
   */
  private initialize(): Database.Database {
    // 确保数据目录存在
    const dbDir = path.dirname(this.config.dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    const db = new Database(this.config.dbPath);

    // 配置数据库
    db.pragma('journal_mode = WAL');
    db.pragma('busy_timeout = 5000');
    db.pragma('synchronous = NORMAL');

    // 创建表
    this.createTables(db);

    this.isInitialized = true;
    logger.log(`数据库已初始化: ${this.config.dbPath}`);

    return db;
  }

  /**
   * 创建数据表
   */
  private createTables(db: Database.Database): void {
    // 消息队列表
    db.exec(`
      CREATE TABLE IF NOT EXISTS queue_messages (
        id TEXT PRIMARY KEY,
        conversationId TEXT NOT NULL,
        userId TEXT NOT NULL,
        username TEXT,
        content TEXT NOT NULL,
        priority TEXT DEFAULT 'normal',
        status TEXT DEFAULT 'pending',
        retryCount INTEGER DEFAULT 0,
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL,
        lastError TEXT
      );
      
      CREATE INDEX IF NOT EXISTS idx_queue_status ON queue_messages(status);
      CREATE INDEX IF NOT EXISTS idx_queue_created ON queue_messages(createdAt);
    `);

    // 会话表
    db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        conversationId TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        state TEXT DEFAULT 'active',
        createdAt INTEGER NOT NULL,
        lastActivityAt INTEGER NOT NULL,
        metadata TEXT
      );
      
      CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(userId);
      CREATE INDEX IF NOT EXISTS idx_sessions_activity ON sessions(lastActivityAt);
    `);

    // 消息历史表
    db.exec(`
      CREATE TABLE IF NOT EXISTS message_history (
        id TEXT PRIMARY KEY,
        conversationId TEXT NOT NULL,
        type TEXT NOT NULL,
        userId TEXT NOT NULL,
        username TEXT,
        content TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        source TEXT DEFAULT 'dingtalk'
      );
      
      CREATE INDEX IF NOT EXISTS idx_history_conv ON message_history(conversationId);
      CREATE INDEX IF NOT EXISTS idx_history_time ON message_history(timestamp);
    `);

    // 重试队列表
    db.exec(`
      CREATE TABLE IF NOT EXISTS retry_queue (
        id TEXT PRIMARY KEY,
        conversationId TEXT NOT NULL,
        type TEXT NOT NULL,
        content TEXT NOT NULL,
        title TEXT,
        mentionList TEXT,
        retryCount INTEGER DEFAULT 0,
        status TEXT DEFAULT 'pending',
        createdAt INTEGER NOT NULL,
        lastAttemptAt INTEGER,
        lastError TEXT
      );
      
      CREATE INDEX IF NOT EXISTS idx_retry_status ON retry_queue(status);
      CREATE INDEX IF NOT EXISTS idx_retry_created ON retry_queue(createdAt);
    `);
  }

  // ==================== 队列消息操作 ====================

  /**
   * 保存队列消息
   */
  saveQueueMessage(msg: PersistedQueueMessage): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO queue_messages 
      (id, conversationId, userId, username, content, priority, status, retryCount, createdAt, updatedAt, lastError)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      msg.id,
      msg.conversationId,
      msg.userId,
      msg.username || null,
      msg.content,
      msg.priority,
      msg.status,
      msg.retryCount,
      msg.createdAt,
      msg.updatedAt,
      msg.lastError || null
    );
  }

  /**
   * 获取待处理的队列消息
   */
  getPendingQueueMessages(limit: number = 100): PersistedQueueMessage[] {
    const stmt = this.db.prepare(`
      SELECT * FROM queue_messages 
      WHERE status = 'pending'
      ORDER BY priority DESC, createdAt ASC
      LIMIT ?
    `);

    return stmt.all(limit) as PersistedQueueMessage[];
  }

  /**
   * 更新队列消息状态
   */
  updateQueueMessageStatus(id: string, status: string, lastError?: string): void {
    const stmt = this.db.prepare(`
      UPDATE queue_messages 
      SET status = ?, updatedAt = ?, lastError = ?, retryCount = retryCount + 1
      WHERE id = ?
    `);

    stmt.run(status, Date.now(), lastError || null, id);
  }

  /**
   * 删除队列消息
   */
  deleteQueueMessage(id: string): void {
    const stmt = this.db.prepare('DELETE FROM queue_messages WHERE id = ?');
    stmt.run(id);
  }

  /**
   * 清理过期的队列消息
   */
  cleanupQueueMessages(maxAge: number = 24 * 60 * 60 * 1000): number {
    const cutoff = Date.now() - maxAge;
    const stmt = this.db.prepare(`
      DELETE FROM queue_messages 
      WHERE status IN ('completed', 'failed') AND updatedAt < ?
    `);
    const result = stmt.run(cutoff);
    return result.changes;
  }

  /**
   * 获取队列统计信息
   */
  getQueueStats(): { pending: number; processing: number; completed: number; failed: number } {
    const stmt = this.db.prepare(`
      SELECT status, COUNT(*) as count 
      FROM queue_messages 
      GROUP BY status
    `);

    const rows = stmt.all() as Array<{ status: string; count: number }>;
    const stats = { pending: 0, processing: 0, completed: 0, failed: 0 };

    for (const row of rows) {
      if (row.status in stats) {
        stats[row.status as keyof typeof stats] = row.count;
      }
    }

    return stats;
  }

  // ==================== 会话操作 ====================

  /**
   * 保存会话
   */
  saveSession(session: PersistedSession): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO sessions 
      (conversationId, userId, state, createdAt, lastActivityAt, metadata)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      session.conversationId,
      session.userId,
      session.state,
      session.createdAt,
      session.lastActivityAt,
      session.metadata || null
    );
  }

  /**
   * 获取会话
   */
  getSession(conversationId: string): PersistedSession | null {
    const stmt = this.db.prepare('SELECT * FROM sessions WHERE conversationId = ?');
    return stmt.get(conversationId) as PersistedSession | null;
  }

  /**
   * 获取用户的活跃会话
   */
  getUserActiveSession(userId: string): PersistedSession | null {
    const stmt = this.db.prepare(`
      SELECT * FROM sessions 
      WHERE userId = ? AND state = 'active'
      ORDER BY lastActivityAt DESC
      LIMIT 1
    `);
    return stmt.get(userId) as PersistedSession | null;
  }

  /**
   * 更新会话活动时间
   */
  updateSessionActivity(conversationId: string): void {
    const stmt = this.db.prepare(`
      UPDATE sessions SET lastActivityAt = ? WHERE conversationId = ?
    `);
    stmt.run(Date.now(), conversationId);
  }

  /**
   * 更新会话状态
   */
  updateSessionState(conversationId: string, state: string): void {
    const stmt = this.db.prepare(`
      UPDATE sessions SET state = ?, lastActivityAt = ? WHERE conversationId = ?
    `);
    stmt.run(state, Date.now(), conversationId);
  }

  /**
   * 清理过期会话
   */
  cleanupSessions(maxAge: number = 30 * 60 * 1000): number {
    const cutoff = Date.now() - maxAge;
    const stmt = this.db.prepare(`
      DELETE FROM sessions WHERE state = 'active' AND lastActivityAt < ?
    `);
    const result = stmt.run(cutoff);
    return result.changes;
  }

  // ==================== 消息历史操作 ====================

  /**
   * 保存消息到历史
   */
  saveMessageHistory(msg: ConversationMessage): void {
    const stmt = this.db.prepare(`
      INSERT INTO message_history 
      (id, conversationId, type, userId, username, content, timestamp, source)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      msg.id,
      msg.conversationId,
      msg.type,
      msg.userId,
      (msg as UserMessage).username || null,
      msg.content,
      msg.metadata.timestamp,
      msg.metadata.source
    );
  }

  /**
   * 获取会话消息历史
   */
  getMessageHistory(conversationId: string, limit: number = 50): ConversationMessage[] {
    const stmt = this.db.prepare(`
      SELECT * FROM message_history 
      WHERE conversationId = ?
      ORDER BY timestamp DESC
      LIMIT ?
    `);

    const rows = stmt.all(conversationId, limit) as Array<{
      id: string;
      conversationId: string;
      type: string;
      userId: string;
      username: string | null;
      content: string;
      timestamp: number;
      source: string;
    }>;

    return rows.reverse().map(row => ({
      id: row.id,
      conversationId: row.conversationId,
      type: row.type as 'user' | 'ai' | 'system',
      userId: row.userId,
      username: row.username || undefined,
      content: row.content,
      metadata: {
        timestamp: row.timestamp,
        source: row.source as 'dingtalk' | 'system' | 'ai',
      },
    }));
  }

  /**
   * 清理消息历史
   */
  cleanupMessageHistory(conversationId: string, keepCount: number = 50): number {
    // 先获取保留的消息ID
    const keepStmt = this.db.prepare(`
      SELECT id FROM message_history 
      WHERE conversationId = ?
      ORDER BY timestamp DESC
      LIMIT ?
    `);
    const keepIds = (keepStmt.all(conversationId, keepCount) as Array<{ id: string }>).map(
      r => r.id
    );

    if (keepIds.length === 0) return 0;

    // 删除其他消息
    const placeholders = keepIds.map(() => '?').join(',');
    const deleteStmt = this.db.prepare(`
      DELETE FROM message_history 
      WHERE conversationId = ? AND id NOT IN (${placeholders})
    `);
    const result = deleteStmt.run(conversationId, ...keepIds);
    return result.changes;
  }

  // ==================== 重试队列操作 ====================

  /**
   * 保存重试消息
   */
  saveRetryMessage(msg: {
    id: string;
    conversationId: string;
    type: string;
    content: string;
    title?: string;
    mentionList?: string[];
    retryCount?: number;
    status?: string;
  }): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO retry_queue 
      (id, conversationId, type, content, title, mentionList, retryCount, status, createdAt, lastAttemptAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      msg.id,
      msg.conversationId,
      msg.type,
      msg.content,
      msg.title || null,
      msg.mentionList ? JSON.stringify(msg.mentionList) : null,
      msg.retryCount || 0,
      msg.status || 'pending',
      Date.now(),
      null
    );
  }

  /**
   * 获取待重试的消息
   */
  getPendingRetryMessages(limit: number = 100): Array<{
    id: string;
    conversationId: string;
    type: string;
    content: string;
    title: string | null;
    mentionList: string | null;
    retryCount: number;
    status: string;
    createdAt: number;
    lastAttemptAt: number | null;
    lastError: string | null;
  }> {
    const stmt = this.db.prepare(`
      SELECT * FROM retry_queue 
      WHERE status = 'pending'
      ORDER BY createdAt ASC
      LIMIT ?
    `);

    return stmt.all(limit) as Array<{
      id: string;
      conversationId: string;
      type: string;
      content: string;
      title: string | null;
      mentionList: string | null;
      retryCount: number;
      status: string;
      createdAt: number;
      lastAttemptAt: number | null;
      lastError: string | null;
    }>;
  }

  /**
   * 更新重试消息状态
   */
  updateRetryMessageStatus(id: string, status: string, lastError?: string): void {
    const stmt = this.db.prepare(`
      UPDATE retry_queue 
      SET status = ?, retryCount = retryCount + 1, lastAttemptAt = ?, lastError = ?
      WHERE id = ?
    `);
    stmt.run(status, Date.now(), lastError || null, id);
  }

  /**
   * 删除重试消息
   */
  deleteRetryMessage(id: string): void {
    const stmt = this.db.prepare('DELETE FROM retry_queue WHERE id = ?');
    stmt.run(id);
  }

  /**
   * 清理重试队列
   */
  cleanupRetryMessages(maxRetries: number = 5): number {
    const stmt = this.db.prepare('DELETE FROM retry_queue WHERE retryCount >= ?');
    const result = stmt.run(maxRetries);
    return result.changes;
  }

  // ==================== 通用操作 ====================

  /**
   * 执行事务
   */
  transaction<T>(fn: () => T): T {
    return this.db.transaction(fn)();
  }

  /**
   * 执行批量操作
   */
  batch<T>(operations: Array<() => T>): T[] {
    const results: T[] = [];
    const txn = this.db.transaction(() => {
      for (const op of operations) {
        results.push(op());
      }
    });
    txn();
    return results;
  }

  /**
   * 获取数据库路径
   */
  getDbPath(): string {
    return this.config.dbPath;
  }

  /**
   * 检查是否已初始化
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * 获取底层数据库实例（供高级模块使用，如记忆存储）
   */
  getDb(): Database.Database {
    return this.db;
  }

  /**
   * 关闭数据库连接
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.isInitialized = false;
      logger.log('数据库连接已关闭');
    }
  }

  /**
   * 优化数据库
   */
  optimize(): void {
    this.db.pragma('optimize');
    this.db.exec('VACUUM');
    logger.log('数据库优化完成');
  }

  /**
   * 获取数据库统计信息
   */
  getStats(): {
    queueMessages: number;
    sessions: number;
    messageHistory: number;
    retryQueue: number;
    dbSize: number;
  } {
    const queueCount = this.db.prepare('SELECT COUNT(*) as count FROM queue_messages').get() as {
      count: number;
    };
    const sessionsCount = this.db.prepare('SELECT COUNT(*) as count FROM sessions').get() as {
      count: number;
    };
    const historyCount = this.db.prepare('SELECT COUNT(*) as count FROM message_history').get() as {
      count: number;
    };
    const retryCount = this.db.prepare('SELECT COUNT(*) as count FROM retry_queue').get() as {
      count: number;
    };

    let dbSize = 0;
    try {
      const stats = fs.statSync(this.config.dbPath);
      dbSize = stats.size;
    } catch (err: unknown) {
      logger.debug('获取数据库文件大小失败:', err instanceof Error ? err.message : String(err));
    }

    return {
      queueMessages: queueCount.count,
      sessions: sessionsCount.count,
      messageHistory: historyCount.count,
      retryQueue: retryCount.count,
      dbSize,
    };
  }
}

// 单例实例
let storageInstance: SQLiteStorage | null = null;

/**
 * 获取存储实例
 */
export function getStorage(config?: Partial<StorageConfig>): SQLiteStorage {
  if (!storageInstance) {
    storageInstance = new SQLiteStorage(config);
  }
  return storageInstance;
}

/**
 * 关闭存储实例
 */
export function closeStorage(): void {
  if (storageInstance) {
    storageInstance.close();
    storageInstance = null;
  }
}
