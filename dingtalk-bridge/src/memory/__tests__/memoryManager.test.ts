/**
 * 记忆管理器测试
 */
import Database from 'better-sqlite3';
import { MemoryStore } from '../memoryStore';
import { MemoryManager, MemoryManagerConfig } from '../memoryManager';
import { SessionManager } from '../../session-manager';

function createTestManager(sessionManager?: SessionManager): {
  manager: MemoryManager;
  store: MemoryStore;
  db: Database.Database;
} {
  const db = new Database(':memory:');
  const store = new MemoryStore(db);
  const manager = new MemoryManager(store, sessionManager);
  return { manager, store, db };
}

describe('MemoryManager', () => {
  let manager: MemoryManager;
  let store: MemoryStore;
  let db: Database.Database;

  beforeEach(() => {
    const result = createTestManager();
    manager = result.manager;
    store = result.store;
    db = result.db;
  });

  afterEach(() => {
    db.close();
  });

  describe('createMemory', () => {
    it('should delegate to store.create', () => {
      const entry = manager.createMemory({
        key: 'test',
        value: 'value',
        category: 'project',
      });
      expect(entry.key).toBe('test');
    });
  });

  describe('getMemory', () => {
    it('should return memory by id', () => {
      const created = manager.createMemory({ key: 'k', value: 'v', category: 'project' });
      const found = manager.getMemory(created.id);
      expect(found).not.toBeNull();
      expect(found!.key).toBe('k');
    });

    it('should return null for non-existent id', () => {
      expect(manager.getMemory('nonexistent')).toBeNull();
    });
  });

  describe('getMemoryByKey', () => {
    it('should return memory with matching key', () => {
      manager.createMemory({ key: 'unique', value: 'val', category: 'project' });
      const found = manager.getMemoryByKey('unique');
      expect(found).not.toBeNull();
    });
  });

  describe('searchMemories', () => {
    it('should filter by category', () => {
      manager.createMemory({ key: 'k1', value: 'v1', category: 'project' });
      manager.createMemory({ key: 'k2', value: 'v2', category: 'preference' });
      const results = manager.searchMemories({ category: 'project' });
      expect(results).toHaveLength(1);
      expect(results[0].category).toBe('project');
    });
  });

  describe('updateMemory', () => {
    it('should update memory value', () => {
      const created = manager.createMemory({ key: 'k', value: 'old', category: 'project' });
      const updated = manager.updateMemory(created.id, { value: 'new' });
      expect(updated!.value).toBe('new');
    });
  });

  describe('deleteMemory', () => {
    it('should delete memory and return true', () => {
      const created = manager.createMemory({ key: 'k', value: 'v', category: 'project' });
      expect(manager.deleteMemory(created.id)).toBe(true);
      expect(manager.getMemory(created.id)).toBeNull();
    });

    it('should return false for non-existent', () => {
      expect(manager.deleteMemory('nonexistent')).toBe(false);
    });
  });

  describe('getStats', () => {
    it('should return stats via store', () => {
      manager.createMemory({ key: 'k', value: 'v', category: 'project' });
      const stats = manager.getStats();
      expect(stats.total).toBe(1);
    });
  });

  describe('cleanup', () => {
    it('should remove old auto memories', () => {
      // Create auto memory and make it old
      const entry = manager.createMemory({
        key: 'auto_old',
        value: 'old',
        category: 'conversation',
        source: 'auto',
      });
      const hundredDaysAgo = Date.now() - 100 * 24 * 60 * 60 * 1000;
      (store as any).db
        .prepare('UPDATE project_memories SET updatedAt = ? WHERE id = ?')
        .run(hundredDaysAgo, entry.id);

      const removed = manager.cleanup();
      expect(removed).toBe(1);
    });
  });

  describe('buildMemoryContext', () => {
    it('should return matched memories as context string', () => {
      manager.createMemory({ key: 'tech', value: 'React', category: 'project', relevanceScore: 5 });
      manager.createMemory({
        key: 'style',
        value: 'clean code',
        category: 'preference',
        relevanceScore: 3,
      });

      const context = manager.buildMemoryContext('React project');
      expect(context).toContain('项目记忆');
      expect(context).toContain('tech');
    });

    it('should return empty string when no relevant memories', () => {
      const context = manager.buildMemoryContext('nothing matches this query xyz123');
      expect(context).toBe('');
    });
  });

  describe('batchCreate', () => {
    it('should create multiple memories', () => {
      const entries = manager.batchCreate([
        { key: 'k1', value: 'v1', category: 'project' },
        { key: 'k2', value: 'v2', category: 'preference' },
      ]);
      expect(entries).toHaveLength(2);
    });
  });

  describe('getByCategory', () => {
    it('should return only preferences', () => {
      manager.createMemory({ key: 'p', value: 'v', category: 'project' });
      manager.createMemory({ key: 'pref', value: 'v', category: 'preference' });
      const prefs = manager.getByCategory('preference');
      expect(prefs).toHaveLength(1);
    });
  });

  describe('getManualMemories', () => {
    it('should return only manual memories', () => {
      manager.createMemory({ key: 'm', value: 'v', category: 'project', source: 'manual' });
      manager.createMemory({ key: 'a', value: 'v', category: 'project', source: 'auto' });
      const manual = manager.getManualMemories();
      expect(manual.every(m => m.source === 'manual')).toBe(true);
    });
  });

  describe('getAutoMemories', () => {
    it('should return only auto memories', () => {
      manager.createMemory({ key: 'm', value: 'v', category: 'project', source: 'manual' });
      manager.createMemory({ key: 'a', value: 'v', category: 'project', source: 'auto' });
      const auto = manager.getAutoMemories();
      expect(auto.every(m => m.source === 'auto')).toBe(true);
    });
  });

  describe('setSessionManager', () => {
    it('should set a session manager', () => {
      const mockSM = {} as SessionManager;
      manager.setSessionManager(mockSM);
      // No error means it worked
    });
  });

  describe('getConfig / updateConfig', () => {
    it('should return copy of config', () => {
      const config = manager.getConfig();
      expect(config).toHaveProperty('autoSummarizeEnabled');
      expect(config).toHaveProperty('maxContextMemories');
    });

    it('should update config partially', () => {
      manager.updateConfig({ maxContextMemories: 5 });
      const config = manager.getConfig();
      expect(config.maxContextMemories).toBe(5);
    });
  });

  describe('maybeSummarizeConversation', () => {
    it('should return null when no sessionManager is set', async () => {
      const result = await manager.maybeSummarizeConversation('conv1', 'user1');
      expect(result).toBeNull();
    });

    it('should summarize when message count exceeds threshold', async () => {
      const mockSessionManager = {
        getHistory: jest.fn(),
      } as unknown as SessionManager;

      const messages = Array.from({ length: 25 }, (_, i) => ({
        id: `msg${i}`,
        userId: 'user1',
        username: 'Test',
        content: i % 2 === 0 ? 'I prefer React over Vue' : 'We use TypeScript and Node.js',
        conversationId: 'conv1',
        type: (i % 2 === 0 ? 'user' : 'ai') as 'user' | 'ai',
        metadata: { timestamp: Date.now(), source: 'dingtalk' },
      }));

      (mockSessionManager.getHistory as jest.Mock).mockResolvedValue(messages);

      const { manager: mgr, db: testDb } = createTestManager(mockSessionManager);
      mgr.updateConfig({ summarizeThreshold: 20 });

      const result = await mgr.maybeSummarizeConversation('conv1', 'user1');
      expect(result).not.toBeNull();
      expect(result!.category).toBe('conversation');

      testDb.close();
    });

    it('should return null when autoSummarize is disabled', async () => {
      const mockSessionManager = {
        getHistory: jest.fn().mockResolvedValue([]),
      } as unknown as SessionManager;

      const { manager: mgr, db: testDb } = createTestManager(mockSessionManager);
      mgr.updateConfig({ autoSummarizeEnabled: false });

      const result = await mgr.maybeSummarizeConversation('conv1', 'user1');
      expect(result).toBeNull();

      testDb.close();
    });
  });
});
