/**
 * MemoryStore 单元测试
 */
import Database from 'better-sqlite3';
import { MemoryStore } from '../memoryStore';
import type { CreateMemoryInput, MemoryFilter } from '../memoryStore';

// 创建内存数据库用于测试
function createTestStore(): { store: MemoryStore; db: Database.Database } {
  const db = new Database(':memory:');
  db.pragma('journal_mode = WAL');
  const store = new MemoryStore(db);
  return { store, db };
}

describe('MemoryStore', () => {
  let store: MemoryStore;
  let db: Database.Database;

  beforeEach(() => {
    const result = createTestStore();
    store = result.store;
    db = result.db;
  });

  afterEach(() => {
    db.close();
  });

  describe('create', () => {
    it('should create a memory entry with all fields', () => {
      const input: CreateMemoryInput = {
        key: 'tech_stack',
        value: 'TypeScript, Express, SQLite',
        category: 'project',
        source: 'manual',
        relevanceScore: 1.5,
      };

      const entry = store.create(input);

      expect(entry.id).toMatch(/^mem_/);
      expect(entry.key).toBe('tech_stack');
      expect(entry.value).toBe('TypeScript, Express, SQLite');
      expect(entry.category).toBe('project');
      expect(entry.source).toBe('manual');
      expect(entry.relevanceScore).toBe(1.5);
      expect(entry.createdAt).toBeGreaterThan(0);
      expect(entry.updatedAt).toBeGreaterThan(0);
    });

    it('should default source to manual and relevanceScore to 1.0', () => {
      const entry = store.create({
        key: 'test_key',
        value: 'test_value',
        category: 'preference',
      });

      expect(entry.source).toBe('manual');
      expect(entry.relevanceScore).toBe(1.0);
    });

    it('should trim whitespace from key and value', () => {
      const entry = store.create({
        key: '  spaced_key  ',
        value: '  spaced value  ',
        category: 'project',
      });

      expect(entry.key).toBe('spaced_key');
      expect(entry.value).toBe('spaced value');
    });

    it('should throw on empty key', () => {
      expect(() => {
        store.create({ key: '', value: 'val', category: 'project' });
      }).toThrow('Memory key must not be empty');
    });

    it('should throw on empty value', () => {
      expect(() => {
        store.create({ key: 'key', value: '', category: 'project' });
      }).toThrow('Memory value must not be empty');
    });

    it('should throw on invalid category', () => {
      expect(() => {
        store.create({ key: 'key', value: 'val', category: 'invalid' as any });
      }).toThrow('Invalid category');
    });

    it('should throw on invalid source', () => {
      expect(() => {
        store.create({ key: 'key', value: 'val', category: 'project', source: 'invalid' as any });
      }).toThrow('Invalid source');
    });
  });

  describe('getById', () => {
    it('should retrieve a memory by id', () => {
      const created = store.create({
        key: 'get_test',
        value: 'find me',
        category: 'project',
      });

      const found = store.getById(created.id);
      expect(found).not.toBeNull();
      expect(found!.key).toBe('get_test');
      expect(found!.value).toBe('find me');
    });

    it('should return null for non-existent id', () => {
      const found = store.getById('nonexistent');
      expect(found).toBeNull();
    });
  });

  describe('getByKey', () => {
    it('should retrieve a memory by key', () => {
      store.create({
        key: 'unique_key',
        value: 'unique value',
        category: 'preference',
      });

      const found = store.getByKey('unique_key');
      expect(found).not.toBeNull();
      expect(found!.value).toBe('unique value');
    });

    it('should return null for non-existent key', () => {
      const found = store.getByKey('missing_key');
      expect(found).toBeNull();
    });
  });

  describe('search', () => {
    beforeEach(() => {
      store.create({ key: 'stack_frontend', value: 'React + TypeScript', category: 'project', source: 'manual' });
      store.create({ key: 'stack_backend', value: 'Node.js + Express', category: 'project', source: 'manual' });
      store.create({ key: 'user_pref_style', value: '中文交流', category: 'preference', source: 'auto' });
      store.create({ key: 'conv_summary_1', value: '讨论了 API 设计', category: 'conversation', source: 'auto' });
    });

    it('should filter by category', () => {
      const results = store.search({ category: 'project' });
      expect(results).toHaveLength(2);
      expect(results.every(r => r.category === 'project')).toBe(true);
    });

    it('should filter by source', () => {
      const results = store.search({ source: 'auto' });
      expect(results).toHaveLength(2);
      expect(results.every(r => r.source === 'auto')).toBe(true);
    });

    it('should filter by query text', () => {
      const results = store.search({ query: 'TypeScript' });
      expect(results.length).toBeGreaterThanOrEqual(1);
      const hasTypeScript = results.some(r => r.value.includes('TypeScript'));
      expect(hasTypeScript).toBe(true);
    });

    it('should combine filters', () => {
      const results = store.search({ category: 'conversation', source: 'auto' });
      expect(results).toHaveLength(1);
      expect(results[0].key).toBe('conv_summary_1');
    });

    it('should respect limit and offset', () => {
      const all = store.search({});
      expect(all.length).toBe(4);

      const limited = store.search({ limit: 2 });
      expect(limited.length).toBe(2);

      const offset = store.search({ limit: 2, offset: 2 });
      expect(offset.length).toBe(2);
    });

    it('should return empty array when no matches', () => {
      const results = store.search({ query: 'nonexistent_xyz' });
      expect(results).toHaveLength(0);
    });
  });

  describe('update', () => {
    it('should update memory fields', () => {
      const created = store.create({
        key: 'update_test',
        value: 'original',
        category: 'project',
      });

      const updated = store.update(created.id, {
        value: 'updated value',
        relevanceScore: 2.5,
      });

      expect(updated).not.toBeNull();
      expect(updated!.value).toBe('updated value');
      expect(updated!.relevanceScore).toBe(2.5);
      expect(updated!.key).toBe('update_test'); // unchanged
      expect(updated!.updatedAt).toBeGreaterThanOrEqual(created.updatedAt);
    });

    it('should return null for non-existent id', () => {
      const updated = store.update('nonexistent', { value: 'x' });
      expect(updated).toBeNull();
    });

    it('should throw on invalid category update', () => {
      const created = store.create({ key: 'k', value: 'v', category: 'project' });
      expect(() => {
        store.update(created.id, { category: 'invalid' as any });
      }).toThrow('Invalid category');
    });

    it('should return entry unchanged when no fields provided', () => {
      const created = store.create({ key: 'k', value: 'v', category: 'project' });
      const updated = store.update(created.id, {});
      expect(updated).not.toBeNull();
      expect(updated!.value).toBe(created.value);
    });
  });

  describe('delete', () => {
    it('should delete a memory entry', () => {
      const created = store.create({ key: 'delete_test', value: 'bye', category: 'project' });
      const deleted = store.delete(created.id);
      expect(deleted).toBe(true);
      expect(store.getById(created.id)).toBeNull();
    });

    it('should return false for non-existent id', () => {
      const deleted = store.delete('nonexistent');
      expect(deleted).toBe(false);
    });
  });

  describe('deleteByCategory', () => {
    it('should delete all memories in a category', () => {
      store.create({ key: 'p1', value: 'v1', category: 'project' });
      store.create({ key: 'p2', value: 'v2', category: 'project' });
      store.create({ key: 'pref1', value: 'v3', category: 'preference' });

      const count = store.deleteByCategory('project');
      expect(count).toBe(2);

      const remaining = store.search({ category: 'preference' });
      expect(remaining).toHaveLength(1);
    });
  });

  describe('searchByRelevance', () => {
    it('should find memories by keyword overlap', () => {
      store.create({ key: 'tech_react', value: '前端使用 React 框架', category: 'project', relevanceScore: 1.0 });
      store.create({ key: 'tech_database', value: '使用 SQLite 作为持久化存储', category: 'project', relevanceScore: 1.0 });
      store.create({ key: 'team_size', value: '团队有5名开发者', category: 'project', relevanceScore: 1.0 });

      const results = store.searchByRelevance('React SQLite', 5);
      expect(results.length).toBeGreaterThanOrEqual(2);
      // Results with more keyword hits should rank higher
      const keys = results.map(r => r.key);
      expect(keys).toContain('tech_react');
      expect(keys).toContain('tech_database');
    });

    it('should fall back to general search on empty query', () => {
      store.create({ key: 'k1', value: 'v1', category: 'project' });
      const results = store.searchByRelevance('', 10);
      expect(results.length).toBeGreaterThanOrEqual(1);
    });

    it('should respect limit', () => {
      for (let i = 0; i < 15; i++) {
        store.create({ key: `key_${i}`, value: `value ${i}`, category: 'project' });
      }
      const results = store.searchByRelevance('value', 5);
      expect(results.length).toBeLessThanOrEqual(5);
    });
  });

  describe('boostRelevance', () => {
    it('should increase relevance score', () => {
      const created = store.create({ key: 'boost_test', value: 'to boost', category: 'project', relevanceScore: 1.0 });
      const boosted = store.boostRelevance(created.id, 0.5);

      expect(boosted).toBe(true);
      const updated = store.getById(created.id);
      expect(updated!.relevanceScore).toBeCloseTo(1.5, 1);
    });

    it('should cap relevance at 10.0', () => {
      const created = store.create({ key: 'cap_test', value: 'at max', category: 'project', relevanceScore: 9.8 });
      store.boostRelevance(created.id, 0.5);

      const updated = store.getById(created.id);
      expect(updated!.relevanceScore).toBe(10.0);
    });

    it('should return false for non-existent id', () => {
      const result = store.boostRelevance('nonexistent', 0.1);
      expect(result).toBe(false);
    });
  });

  describe('getStats', () => {
    it('should return accurate statistics', () => {
      store.create({ key: 'p1', value: 'v', category: 'project', source: 'manual' });
      store.create({ key: 'p2', value: 'v', category: 'project', source: 'auto' });
      store.create({ key: 'c1', value: 'v', category: 'conversation', source: 'auto' });

      const stats = store.getStats();
      expect(stats.total).toBe(3);
      expect(stats.byCategory.project).toBe(2);
      expect(stats.byCategory.conversation).toBe(1);
      expect(stats.byCategory.preference).toBe(0);
      expect(stats.bySource.manual).toBe(1);
      expect(stats.bySource.auto).toBe(2);
    });

    it('should return zero stats for empty store', () => {
      const stats = store.getStats();
      expect(stats.total).toBe(0);
      expect(stats.byCategory.project).toBe(0);
      expect(stats.bySource.manual).toBe(0);
    });
  });

  describe('cleanup', () => {
    it('should remove old auto-generated memories but keep manual ones', () => {
      // Create a manual memory (should not be cleaned up regardless of age)
      store.create({ key: 'manual_keep', value: 'keep this', category: 'project', source: 'manual' });

      // Create an auto memory
      const autoEntry = store.create({ key: 'auto_old', value: 'old auto memory', category: 'conversation', source: 'auto' });

      // Manually set the auto entry's updatedAt to 100 days ago
      const hundredDaysAgo = Date.now() - 100 * 24 * 60 * 60 * 1000;
      const db = (store as any).db as import('better-sqlite3').Database;
      db.prepare('UPDATE project_memories SET updatedAt = ? WHERE id = ?').run(hundredDaysAgo, autoEntry.id);

      // Cleanup with maxAge=90 days should remove the old auto entry
      const ninetyDays = 90 * 24 * 60 * 60 * 1000;
      const removed = store.cleanup(ninetyDays);
      expect(removed).toBe(1);

      // Manual memory should remain regardless of age
      const remaining = store.search({});
      expect(remaining).toHaveLength(1);
      expect(remaining[0].source).toBe('manual');
    });

    it('should not remove recent auto memories', () => {
      store.create({ key: 'auto_recent', value: 'recent auto', category: 'conversation', source: 'auto' });
      store.create({ key: 'manual_recent', value: 'recent manual', category: 'project', source: 'manual' });

      // Cleanup with 90-day maxAge should not remove recent entries
      const ninetyDays = 90 * 24 * 60 * 60 * 1000;
      const removed = store.cleanup(ninetyDays);
      expect(removed).toBe(0);

      const remaining = store.search({});
      expect(remaining).toHaveLength(2);
    });
  });
});
