/**
 * 消息重试队列测试
 */
import { MessageRetryQueue, QueuedMessage } from '../messageRetryQueue';

describe('MessageRetryQueue', () => {
  let queue: MessageRetryQueue;

  beforeEach(() => {
    jest.useFakeTimers();
    // Spy console to avoid noise
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    queue = new MessageRetryQueue();
  });

  afterEach(() => {
    queue.stop();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe('add', () => {
    it('should add a message with text type', () => {
      queue.add('msg1', 'conv1', 'text', 'hello world');
      const pending = queue.getPending();
      expect(pending).toHaveLength(1);
      expect(pending[0].id).toBe('msg1');
      expect(pending[0].status).toBe('pending');
    });

    it('should add a markdown message with title', () => {
      queue.add('msg2', 'conv2', 'markdown', '**bold**', { title: 'Test Title' });
      const pending = queue.getPending();
      expect(pending[0].title).toBe('Test Title');
      expect(pending[0].type).toBe('markdown');
    });
  });

  describe('getPending', () => {
    it('should return matching by created time (oldest first)', () => {
      queue.add('msg1', 'conv1', 'text', 'old', { title: '1' });
      queue.add('msg2', 'conv1', 'text', 'new', { title: '2' });
      const pending = queue.getPending();
      expect(pending[0].id).toBe('msg1');
    });

    it('should only return status pending', () => {
      queue.add('msg1', 'conv1', 'text', 'a');
      queue.add('msg2', 'conv1', 'text', 'b');
      queue.startSending('msg2');
      queue.markSent('msg2');
      const pending = queue.getPending();
      expect(pending).toHaveLength(1);
      expect(pending[0].id).toBe('msg1');
    });
  });

  describe('startSending', () => {
    it('should transition from pending to sending', () => {
      queue.add('msg1', 'conv1', 'text', 'test');
      const msg = queue.startSending('msg1');
      expect(msg?.status).toBe('sending');
      expect(msg?.lastAttemptAt).toBeDefined();
    });

    it('should return undefined for non-existent message', () => {
      expect(queue.startSending('nonexistent')).toBeUndefined();
    });
  });

  describe('markSent', () => {
    it('should mark message as sent', () => {
      queue.add('msg1', 'conv1', 'text', 'test');
      queue.startSending('msg1');
      queue.markSent('msg1');
      const stats = queue.getStats();
      expect(stats.sent).toBe(1);
    });
  });

  describe('markFailed', () => {
    it('should increment retry count and set back to pending', () => {
      queue.add('msg1', 'conv1', 'text', 'test');
      queue.startSending('msg1');
      queue.markFailed('msg1', 'network error');
      const pending = queue.getPending();
      expect(pending[0].retryCount).toBe(1);
      expect(pending[0].status).toBe('pending');
    });

    it('should mark as failed when maxRetries reached', () => {
      const smallQueue = new MessageRetryQueue({ maxRetries: 1, baseDelay: 100 });
      smallQueue.add('msg1', 'conv1', 'text', 'test');
      smallQueue.startSending('msg1');
      smallQueue.markFailed('msg1', 'error');
      smallQueue.startSending('msg1');
      smallQueue.markFailed('msg1', 'error again');
      const stats = smallQueue.getStats();
      expect(stats.failed).toBe(1);
      smallQueue.stop();
    });
  });

  describe('getStats', () => {
    it('should return counts by status', () => {
      queue.add('m1', 'c1', 'text', 'a');
      queue.add('m2', 'c1', 'text', 'b');
      queue.add('m3', 'c1', 'text', 'c');
      queue.startSending('m1');
      queue.markSent('m1');

      const stats = queue.getStats();
      expect(stats.total).toBe(3);
      expect(stats.sent).toBe(1);
      expect(stats.pending).toBe(2);
    });
  });

  describe('getFailedMessages', () => {
    it('should return only failed messages', () => {
      const sq = new MessageRetryQueue({ maxRetries: 1, baseDelay: 100 });
      sq.add('fail1', 'c1', 'text', 'test');
      sq.startSending('fail1');
      sq.markFailed('fail1', 'err1');
      sq.startSending('fail1');
      sq.markFailed('fail1', 'err2');
      const failed = sq.getFailedMessages();
      expect(failed).toHaveLength(1);
      expect(failed[0].status).toBe('failed');
      sq.stop();
    });
  });

  describe('cleanup', () => {
    it('should clean up old sent messages', () => {
      const sq = new MessageRetryQueue({ baseDelay: 100 });
      sq.add('old1', 'c1', 'text', 'test');
      sq.startSending('old1');
      sq.markSent('old1');

      // Advance time past 1 hour
      jest.advanceTimersByTime(61 * 60 * 1000);
      jest.runOnlyPendingTimers();

      const stats = sq.getStats();
      expect(stats.total).toBe(0);
      sq.stop();
    });
  });

  describe('stop', () => {
    it('should clear the cleanup interval', () => {
      const sq = new MessageRetryQueue();
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
      sq.stop();
      expect(clearIntervalSpy).toHaveBeenCalled();
      clearIntervalSpy.mockRestore();
    });
  });
});
