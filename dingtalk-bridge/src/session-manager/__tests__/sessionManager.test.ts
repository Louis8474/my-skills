import { SessionManager } from '../sessionManager';
import { SessionState, DEFAULT_SESSION_CONFIG } from '../../types/session';
import { UserMessage, AIMessage } from '../../types/message';

describe('SessionManager', () => {
  let sessionManager: SessionManager;

  beforeEach(() => {
    sessionManager = new SessionManager({
      config: {
        ttl: 60000, // 1 minute
        maxHistoryMessages: 10,
      },
      autoCleanup: false,
    });
  });

  afterEach(() => {
    sessionManager.stopCleanupService();
  });

  describe('createSession', () => {
    it('should create a new session', async () => {
      const session = await sessionManager.createSession('user1');
      
      expect(session.userId).toBe('user1');
      expect(session.conversationId).toMatch(/^c_/);
      expect(session.state).toBe(SessionState.Active);
      expect(session.context.messages).toHaveLength(0);
    });

    it('should create unique conversation IDs', async () => {
      const session1 = await sessionManager.createSession('user1');
      const session2 = await sessionManager.createSession('user1');
      
      expect(session1.conversationId).not.toBe(session2.conversationId);
    });
  });

  describe('getSession', () => {
    it('should return session by conversationId', async () => {
      const created = await sessionManager.createSession('user1');
      const session = await sessionManager.getSession(created.conversationId);
      
      expect(session).not.toBeNull();
      expect(session?.conversationId).toBe(created.conversationId);
    });

    it('should return null for non-existent session', async () => {
      const session = await sessionManager.getSession('nonexistent');
      expect(session).toBeNull();
    });
  });

  describe('getOrCreateSession', () => {
    it('should create new session if none exists', async () => {
      const session = await sessionManager.getOrCreateSession('user1');
      
      expect(session.userId).toBe('user1');
      expect(session.state).toBe(SessionState.Active);
    });

    it('should return existing active session', async () => {
      const session1 = await sessionManager.getOrCreateSession('user1');
      
      // Add a message to identify the session
      await sessionManager.addMessage(session1.conversationId, {
        id: 'msg1',
        type: 'user',
        userId: 'user1',
        content: 'Hello',
        conversationId: session1.conversationId,
        metadata: { timestamp: Date.now(), source: 'dingtalk' },
      });
      
      const session2 = await sessionManager.getOrCreateSession('user1');
      
      expect(session2.conversationId).toBe(session1.conversationId);
      expect(session2.context.messages).toHaveLength(1);
    });
  });

  describe('addMessage', () => {
    it('should add message to session history', async () => {
      const session = await sessionManager.createSession('user1');
      
      const userMessage: UserMessage = {
        id: 'msg1',
        type: 'user',
        userId: 'user1',
        content: 'Hello',
        conversationId: session.conversationId,
        metadata: { timestamp: Date.now(), source: 'dingtalk' },
      };
      
      await sessionManager.addMessage(session.conversationId, userMessage);
      
      const history = await sessionManager.getHistory(session.conversationId);
      expect(history).toHaveLength(1);
      expect(history[0].content).toBe('Hello');
    });

    it('should trim messages when exceeding maxHistoryMessages', async () => {
      // Create manager with maxHistoryMessages=3
      const sm = new SessionManager({
        config: { ttl: 60000, maxHistoryMessages: 3 },
        autoCleanup: false,
      });
      
      const session = await sm.createSession('user1');
      
      for (let i = 1; i <= 5; i++) {
        await sm.addMessage(session.conversationId, {
          id: `msg${i}`,
          type: 'user',
          userId: 'user1',
          content: `Message ${i}`,
          conversationId: session.conversationId,
          metadata: { timestamp: Date.now(), source: 'dingtalk' },
        });
      }
      
      const history = await sm.getHistory(session.conversationId);
      expect(history).toHaveLength(3);
      expect(history[0].content).toBe('Message 3');
      expect(history[2].content).toBe('Message 5');
    });
  });

  describe('getHistory', () => {
    it('should return empty array for non-existent session', async () => {
      const history = await sessionManager.getHistory('nonexistent');
      expect(history).toHaveLength(0);
    });

    it('should limit returned messages', async () => {
      const session = await sessionManager.createSession('user1');
      
      for (let i = 1; i <= 10; i++) {
        await sessionManager.addMessage(session.conversationId, {
          id: `msg${i}`,
          type: 'user',
          userId: 'user1',
          content: `Message ${i}`,
          conversationId: session.conversationId,
          metadata: { timestamp: Date.now(), source: 'dingtalk' },
        });
      }
      
      const history = await sessionManager.getHistory(session.conversationId, 5);
      expect(history).toHaveLength(5);
    });
  });

  describe('endSession', () => {
    it('should update session state to terminated', async () => {
      const session = await sessionManager.createSession('user1');
      
      await sessionManager.endSession(session.conversationId, SessionState.Terminated);
      
      // getSession 对 terminated 状态的会话仍返回结果，但状态已更新
      const updated = await sessionManager.getSession(session.conversationId);
      expect(updated).not.toBeNull();
      expect(updated?.state).toBe(SessionState.Terminated);
    });
  });
});
