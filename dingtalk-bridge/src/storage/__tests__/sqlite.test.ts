/**
 * SQLite 存储测试
 * 使用 :memory: 数据库进行测试，无需 mock
 */
import Database from 'better-sqlite3';
import { SQLiteStorage, PersistedQueueMessage, PersistedSession } from '../sqlite';

describe('SQLiteStorage', () => {
  let storage: SQLiteStorage;

  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    storage = new SQLiteStorage({ dbPath: ':memory:', enableWAL: false, busyTimeout: 5000 });
  });

  afterEach(() => {
    // Close the DB cleanly
    try {
      storage.close();
    } catch {}
    jest.restoreAllMocks();
  });

  describe('queue messages', () => {
    it('should save and retrieve pending queue messages', () => {
      const msg: PersistedQueueMessage = {
        id: 'q1',
        conversationId: 'conv1',
        userId: 'user1',
        content: 'hello',
        priority: 'high',
        status: 'pending',
        retryCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      storage.saveQueueMessage(msg);

      const pending = storage.getPendingQueueMessages(10);
      expect(pending).toHaveLength(1);
      expect(pending[0].content).toBe('hello');
      expect(pending[0].priority).toBe('high');
    });

    it('should update queue message status', () => {
      const msg: PersistedQueueMessage = {
        id: 'q1',
        conversationId: 'conv1',
        userId: 'user1',
        content: 'test',
        priority: 'normal',
        status: 'pending',
        retryCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      storage.saveQueueMessage(msg);
      storage.updateQueueMessageStatus('q1', 'processing');

      // After update, status should be 'processing' — not show in pending
      const pending = storage.getPendingQueueMessages(10);
      expect(pending).toHaveLength(0);
    });

    it('should delete queue message', () => {
      const msg: PersistedQueueMessage = {
        id: 'q1',
        conversationId: 'conv1',
        userId: 'user1',
        content: 'test',
        priority: 'normal',
        status: 'pending',
        retryCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      storage.saveQueueMessage(msg);
      storage.deleteQueueMessage('q1');

      const pending = storage.getPendingQueueMessages(10);
      expect(pending).toHaveLength(0);
    });

    it('should return queue stats', () => {
      const msg: PersistedQueueMessage = {
        id: 'q1',
        conversationId: 'conv1',
        userId: 'user1',
        content: 'test',
        priority: 'normal',
        status: 'completed',
        retryCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      storage.saveQueueMessage(msg);

      const stats = storage.getQueueStats();
      expect(stats.completed).toBe(1);
      expect(stats.pending).toBe(0);
    });
  });

  describe('sessions', () => {
    it('should save and retrieve session', () => {
      const session: PersistedSession = {
        conversationId: 'conv1',
        userId: 'user1',
        state: 'active',
        createdAt: Date.now(),
        lastActivityAt: Date.now(),
        metadata: '{}',
      };
      storage.saveSession(session);

      const retrieved = storage.getSession('conv1');
      expect(retrieved).not.toBeNull();
      expect(retrieved!.userId).toBe('user1');
    });

    it('should return null for non-existent session', () => {
      expect(storage.getSession('nonexistent')).toBeFalsy();
    });

    it('should find user active session', () => {
      const session: PersistedSession = {
        conversationId: 'conv1',
        userId: 'user1',
        state: 'active',
        createdAt: Date.now(),
        lastActivityAt: Date.now(),
        metadata: '{}',
      };
      storage.saveSession(session);

      const active = storage.getUserActiveSession('user1');
      expect(active).not.toBeNull();
      expect(active!.conversationId).toBe('conv1');
    });

    it('should update session state', () => {
      const session: PersistedSession = {
        conversationId: 'conv1',
        userId: 'user1',
        state: 'active',
        createdAt: Date.now(),
        lastActivityAt: Date.now(),
        metadata: '{}',
      };
      storage.saveSession(session);
      storage.updateSessionState('conv1', 'closed');

      const updated = storage.getSession('conv1');
      expect(updated!.state).toBe('closed');
    });
  });

  describe('message history', () => {
    it('should save and retrieve message history', () => {
      storage.saveMessageHistory({
        id: 'msg1',
        conversationId: 'conv1',
        type: 'user',
        userId: 'user1',
        username: 'Test User',
        content: 'Hello',
        metadata: { timestamp: Date.now(), source: 'dingtalk' },
      });

      storage.saveMessageHistory({
        id: 'msg2',
        conversationId: 'conv1',
        type: 'ai',
        userId: 'bot',
        content: 'Hi there!',
        metadata: { timestamp: Date.now(), source: 'ai' },
      });

      const history = storage.getMessageHistory('conv1', 10);
      expect(history).toHaveLength(2);
      const types = history.map(h => h.type);
      expect(types).toContain('user');
      expect(types).toContain('ai');
    });

    it('should return empty array for unknown conversation', () => {
      const history = storage.getMessageHistory('unknown', 10);
      expect(history).toHaveLength(0);
    });
  });

  describe('retry queue', () => {
    it('should save and retrieve retry messages', () => {
      storage.saveRetryMessage({
        id: 'retry1',
        conversationId: 'conv1',
        type: 'text',
        content: 'hello',
        retryCount: 0,
        status: 'pending',
      });

      const pending = storage.getPendingRetryMessages(10);
      expect(pending).toHaveLength(1);
      expect(pending[0].id).toBe('retry1');
    });

    it('should update retry message status', () => {
      storage.saveRetryMessage({
        id: 'retry1',
        conversationId: 'conv1',
        type: 'text',
        content: 'hello',
        retryCount: 0,
        status: 'pending',
      });

      storage.updateRetryMessageStatus('retry1', 'pending', 'timeout');

      // Verify via pending messages — still pending, retryCount incremented
      const pending = storage.getPendingRetryMessages(10);
      expect(pending).toHaveLength(1);
      expect(pending[0].retryCount).toBe(1);
    });

    it('should delete retry message', () => {
      storage.saveRetryMessage({
        id: 'retry1',
        conversationId: 'conv1',
        type: 'text',
        content: 'test',
        status: 'completed',
      });

      storage.deleteRetryMessage('retry1');
      const pending = storage.getPendingRetryMessages(10);
      expect(pending).toHaveLength(0);
    });
  });

  describe('close', () => {
    it('should close the database connection', () => {
      expect(() => storage.close()).not.toThrow();
    });
  });
});
