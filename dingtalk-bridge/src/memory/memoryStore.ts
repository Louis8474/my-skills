/**
 * 项目记忆持久化存储
 * 基于 SQLite 的 CRUD 操作，遵循项目现有的 SQLiteStorage 模式
 */
import Database from 'better-sqlite3';
import { getStorage } from '../storage/sqlite';

/**
 * 记忆分类
 */
export type MemoryCategory = 'project' | 'conversation' | 'preference';

/**
 * 记忆来源
 */
export type MemorySource = 'auto' | 'manual';

/**
 * 记忆条目
 */
export interface MemoryEntry {
  id: string;
  key: string;
  value: string;
  category: MemoryCategory;
  source: MemorySource;
  relevanceScore: number;
  createdAt: number;
  updatedAt: number;
}

/**
 * 创建记忆的输入
 */
export interface CreateMemoryInput {
  key: string;
  value: string;
  category: MemoryCategory;
  source?: MemorySource;
  relevanceScore?: number;
}

/**
 * 更新记忆的输入
 */
export interface UpdateMemoryInput {
  key?: string;
  value?: string;
  category?: MemoryCategory;
  source?: MemorySource;
  relevanceScore?: number;
}

/**
 * 记忆查询过滤器
 */
export interface MemoryFilter {
  category?: MemoryCategory;
  source?: MemorySource;
  query?: string;
  limit?: number;
  offset?: number;
}

/**
 * 记忆统计信息
 */
export interface MemoryStats {
  total: number;
  byCategory: Record<MemoryCategory, number>;
  bySource: Record<MemorySource, number>;
}

const VALID_CATEGORIES: MemoryCategory[] = ['project', 'conversation', 'preference'];
const VALID_SOURCES: MemorySource[] = ['auto', 'manual'];

/**
 * 记忆存储类
 * 使用 SQLite 持久化记忆条目，提供 CRUD 和搜索操作
 */
export class MemoryStore {
  private db: Database.Database;

  constructor(db?: Database.Database) {
    this.db = db ?? getStorage().getDb();
    this.ensureTable();
  }

  /**
   * 确保数据表存在
   */
  private ensureTable(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS project_memories (
        id TEXT PRIMARY KEY,
        key TEXT NOT NULL,
        value TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT 'project',
        source TEXT NOT NULL DEFAULT 'manual',
        relevanceScore REAL NOT NULL DEFAULT 1.0,
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_memory_category ON project_memories(category);
      CREATE INDEX IF NOT EXISTS idx_memory_source ON project_memories(source);
      CREATE INDEX IF NOT EXISTS idx_memory_key ON project_memories(key);
      CREATE INDEX IF NOT EXISTS idx_memory_relevance ON project_memories(relevanceScore DESC);
      CREATE INDEX IF NOT EXISTS idx_memory_updated ON project_memories(updatedAt DESC);
    `);
  }

  /**
   * 创建记忆条目
   */
  create(input: CreateMemoryInput): MemoryEntry {
    if (!input.key || input.key.trim() === '') {
      throw new Error('Memory key must not be empty');
    }
    if (!input.value || input.value.trim() === '') {
      throw new Error('Memory value must not be empty');
    }
    if (!VALID_CATEGORIES.includes(input.category)) {
      throw new Error(`Invalid category: ${input.category}. Must be one of: ${VALID_CATEGORIES.join(', ')}`);
    }
    if (input.source && !VALID_SOURCES.includes(input.source)) {
      throw new Error(`Invalid source: ${input.source}. Must be one of: ${VALID_SOURCES.join(', ')}`);
    }

    const now = Date.now();
    const id = `mem_${now.toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
    const source = input.source ?? 'manual';
    const relevanceScore = input.relevanceScore ?? 1.0;

    const stmt = this.db.prepare(`
      INSERT INTO project_memories (id, key, value, category, source, relevanceScore, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(id, input.key.trim(), input.value.trim(), input.category, source, relevanceScore, now, now);

    return {
      id,
      key: input.key.trim(),
      value: input.value.trim(),
      category: input.category,
      source,
      relevanceScore,
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * 根据 ID 获取记忆
   */
  getById(id: string): MemoryEntry | null {
    const stmt = this.db.prepare('SELECT * FROM project_memories WHERE id = ?');
    const row = stmt.get(id) as MemoryRow | undefined;
    return row ? this.rowToEntry(row) : null;
  }

  /**
   * 根据键获取记忆
   */
  getByKey(key: string): MemoryEntry | null {
    const stmt = this.db.prepare('SELECT * FROM project_memories WHERE key = ?');
    const row = stmt.get(key) as MemoryRow | undefined;
    return row ? this.rowToEntry(row) : null;
  }

  /**
   * 搜索记忆 - 支持关键词和过滤条件
   */
  search(filter: MemoryFilter = {}): MemoryEntry[] {
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (filter.category) {
      conditions.push('category = ?');
      params.push(filter.category);
    }

    if (filter.source) {
      conditions.push('source = ?');
      params.push(filter.source);
    }

    if (filter.query) {
      conditions.push('(key LIKE ? OR value LIKE ?)');
      const pattern = `%${filter.query}%`;
      params.push(pattern, pattern);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const limit = filter.limit ?? 100;
    const offset = filter.offset ?? 0;

    const stmt = this.db.prepare(`
      SELECT * FROM project_memories
      ${whereClause}
      ORDER BY relevanceScore DESC, updatedAt DESC
      LIMIT ? OFFSET ?
    `);

    const rows = stmt.all(...params, limit, offset) as MemoryRow[];
    return rows.map(row => this.rowToEntry(row));
  }

  /**
   * 获取所有记忆（支持过滤）
   */
  list(filter: MemoryFilter = {}): MemoryEntry[] {
    return this.search(filter);
  }

  /**
   * 更新记忆条目
   */
  update(id: string, input: UpdateMemoryInput): MemoryEntry | null {
    const existing = this.getById(id);
    if (!existing) {
      return null;
    }

    if (input.category && !VALID_CATEGORIES.includes(input.category)) {
      throw new Error(`Invalid category: ${input.category}. Must be one of: ${VALID_CATEGORIES.join(', ')}`);
    }
    if (input.source && !VALID_SOURCES.includes(input.source)) {
      throw new Error(`Invalid source: ${input.source}. Must be one of: ${VALID_SOURCES.join(', ')}`);
    }

    const setClauses: string[] = [];
    const params: unknown[] = [];

    if (input.key !== undefined) {
      setClauses.push('key = ?');
      params.push(input.key.trim());
    }
    if (input.value !== undefined) {
      setClauses.push('value = ?');
      params.push(input.value.trim());
    }
    if (input.category !== undefined) {
      setClauses.push('category = ?');
      params.push(input.category);
    }
    if (input.source !== undefined) {
      setClauses.push('source = ?');
      params.push(input.source);
    }
    if (input.relevanceScore !== undefined) {
      setClauses.push('relevanceScore = ?');
      params.push(input.relevanceScore);
    }

    if (setClauses.length === 0) {
      return existing;
    }

    setClauses.push('updatedAt = ?');
    params.push(Date.now());
    params.push(id);

    const stmt = this.db.prepare(`
      UPDATE project_memories
      SET ${setClauses.join(', ')}
      WHERE id = ?
    `);

    stmt.run(...params);

    return this.getById(id);
  }

  /**
   * 删除记忆条目
   */
  delete(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM project_memories WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  /**
   * 删除指定分类的所有记忆
   */
  deleteByCategory(category: MemoryCategory): number {
    const stmt = this.db.prepare('DELETE FROM project_memories WHERE category = ?');
    const result = stmt.run(category);
    return result.changes;
  }

  /**
   * 基于关键词的关联性搜索
   * 对查询文本进行分词，按关键词重叠度评分
   */
  searchByRelevance(query: string, limit: number = 10): MemoryEntry[] {
    if (!query || query.trim() === '') {
      return this.search({ limit });
    }

    const keywords = this.extractKeywords(query);
    if (keywords.length === 0) {
      return this.search({ limit });
    }

    // 构建 LIKE 条件匹配每个关键词
    const likeConditions = keywords.map(() => '(key LIKE ? OR value LIKE ?)');
    const likeParams = keywords.flatMap(kw => [`%${kw}%`, `%${kw}%`]);

    const stmt = this.db.prepare(`
      SELECT * FROM project_memories
      WHERE ${likeConditions.join(' OR ')}
      ORDER BY relevanceScore DESC, updatedAt DESC
      LIMIT ?
    `);

    const rows = stmt.all(...likeParams, limit) as MemoryRow[];
    const entries = rows.map(row => this.rowToEntry(row));

    // 按关键词命中数量重新排序
    return entries
      .map(entry => ({
        entry,
        hits: this.countKeywordHits(entry, keywords),
      }))
      .sort((a, b) => b.hits - a.hits || b.entry.relevanceScore - a.entry.relevanceScore)
      .map(item => item.entry);
  }

  /**
   * 增加记忆的相关性分数（用于记忆强化）
   */
  boostRelevance(id: string, increment: number = 0.1): boolean {
    const stmt = this.db.prepare(`
      UPDATE project_memories
      SET relevanceScore = MIN(relevanceScore + ?, 10.0), updatedAt = ?
      WHERE id = ?
    `);
    const result = stmt.run(increment, Date.now(), id);
    return result.changes > 0;
  }

  /**
   * 获取记忆统计信息
   */
  getStats(): MemoryStats {
    const totalStmt = this.db.prepare('SELECT COUNT(*) as count FROM project_memories');
    const total = (totalStmt.get() as { count: number }).count;

    const categoryStmt = this.db.prepare('SELECT category, COUNT(*) as count FROM project_memories GROUP BY category');
    const categoryRows = categoryStmt.all() as Array<{ category: string; count: number }>;

    const sourceStmt = this.db.prepare('SELECT source, COUNT(*) as count FROM project_memories GROUP BY source');
    const sourceRows = sourceStmt.all() as Array<{ source: string; count: number }>;

    const byCategory: Record<MemoryCategory, number> = { project: 0, conversation: 0, preference: 0 };
    for (const row of categoryRows) {
      if (row.category in byCategory) {
        byCategory[row.category as MemoryCategory] = row.count;
      }
    }

    const bySource: Record<MemorySource, number> = { auto: 0, manual: 0 };
    for (const row of sourceRows) {
      if (row.source in bySource) {
        bySource[row.source as MemorySource] = row.count;
      }
    }

    return { total, byCategory, bySource };
  }

  /**
   * 清理过期记忆
   */
  cleanup(maxAge: number = 90 * 24 * 60 * 60 * 1000): number {
    const cutoff = Date.now() - maxAge;
    const stmt = this.db.prepare(`
      DELETE FROM project_memories
      WHERE source = 'auto' AND updatedAt < ?
    `);
    const result = stmt.run(cutoff);
    return result.changes;
  }

  /**
   * 从文本中提取关键词（简单的分词逻辑）
   */
  private extractKeywords(text: string): string[] {
    // 移除标点符号，按空格和中文分词
    const normalized = text
      .toLowerCase()
      .replace(/[^\w\u4e00-\u9fa5\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 1);

    // 去重
    return [...new Set(normalized)];
  }

  /**
   * 计算记忆条目的关键词命中数
   */
  private countKeywordHits(entry: MemoryEntry, keywords: string[]): number {
    const text = `${entry.key} ${entry.value}`.toLowerCase();
    let hits = 0;
    for (const kw of keywords) {
      if (text.includes(kw.toLowerCase())) {
        hits++;
      }
    }
    return hits;
  }

  /**
   * 数据库行转换为 MemoryEntry
   */
  private rowToEntry(row: MemoryRow): MemoryEntry {
    return {
      id: row.id,
      key: row.key,
      value: row.value,
      category: row.category as MemoryCategory,
      source: row.source as MemorySource,
      relevanceScore: row.relevanceScore,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}

/**
 * 数据库行类型
 */
interface MemoryRow {
  id: string;
  key: string;
  value: string;
  category: string;
  source: string;
  relevanceScore: number;
  createdAt: number;
  updatedAt: number;
}
