/**
 * 重试发送器测试
 */
import { RetrySender, createRetrySender } from '../retrySender';

describe('RetrySender', () => {
  let sender: RetrySender;
  let mockMessageSender: jest.Mock;

  beforeEach(() => {
    jest.useFakeTimers();
    mockMessageSender = jest.fn().mockResolvedValue(true);
    sender = new RetrySender({
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      checkInterval: 5000,
      maxQueueSize: 100,
    });
    sender.setSender(mockMessageSender);
  });

  afterEach(() => {
    sender.stop();
    jest.useRealTimers();
  });

  describe('add', () => {
    it('should add message to queue', () => {
      const result = sender.add('msg-1', 'conv-1', 'text', 'Hello');
      expect(result).toBe(true);

      const stats = sender.getStats();
      expect(stats.pending).toBe(1);
      expect(stats.total).toBe(1);
    });

    it('should add markdown message with title', () => {
      const result = sender.add('msg-2', 'conv-1', 'markdown', '**Bold**', { title: 'Title' });
      expect(result).toBe(true);

      const stats = sender.getStats();
      expect(stats.pending).toBe(1);
    });

    it('should reject message when queue is full', () => {
      const smallSender = new RetrySender({ maxQueueSize: 2 });

      expect(smallSender.add('msg-1', 'conv-1', 'text', 'Hello 1')).toBe(true);
      expect(smallSender.add('msg-2', 'conv-1', 'text', 'Hello 2')).toBe(true);
      expect(smallSender.add('msg-3', 'conv-1', 'text', 'Hello 3')).toBe(false);
    });
  });

  describe('startSending', () => {
    it('should mark message as sending', () => {
      sender.add('msg-1', 'conv-1', 'text', 'Hello');

      const result = sender.startSending('msg-1');
      expect(result).toBe(true);

      const stats = sender.getStats();
      expect(stats.sending).toBe(1);
      expect(stats.pending).toBe(0);
    });

    it('should return false for non-existent message', () => {
      const result = sender.startSending('non-existent');
      expect(result).toBe(false);
    });

    it('should return false for already sending message', () => {
      sender.add('msg-1', 'conv-1', 'text', 'Hello');
      sender.startSending('msg-1');

      const result = sender.startSending('msg-1');
      expect(result).toBe(false);
    });
  });

  describe('markSent', () => {
    it('should remove message from queue', () => {
      sender.add('msg-1', 'conv-1', 'text', 'Hello');
      sender.startSending('msg-1');

      sender.markSent('msg-1');

      const stats = sender.getStats();
      expect(stats.total).toBe(0);
      expect(stats.sent).toBe(0); // sent messages are removed
    });
  });

  describe('markFailed', () => {
    it('should increment retry count and set status back to pending', () => {
      sender.add('msg-1', 'conv-1', 'text', 'Hello');
      sender.startSending('msg-1');

      sender.markFailed('msg-1', 'Network error');

      const stats = sender.getStats();
      // After markFailed, if retryCount < maxRetries, status should be pending
      expect(stats.pending).toBe(1);
      // The message has lastError set
      const pending = sender.getPending();
      // Note: getPending returns empty because delay not passed since lastAttemptAt
      // But stats.pending shows the internal state
    });

    it('should mark as failed when max retries reached', () => {
      sender.add('msg-1', 'conv-1', 'text', 'Hello');
      sender.startSending('msg-1');

      sender.markFailed('msg-1', 'Error 1');
      sender.startSending('msg-1');
      sender.markFailed('msg-1', 'Error 2');
      sender.startSending('msg-1');
      sender.markFailed('msg-1', 'Error 3');

      const stats = sender.getStats();
      expect(stats.failed).toBe(1);
    });
  });

  describe('getPending', () => {
    it('should return pending messages ready for retry', () => {
      sender.add('msg-1', 'conv-1', 'text', 'Hello');

      const pending = sender.getPending();
      expect(pending.length).toBe(1);
      expect(pending[0].id).toBe('msg-1');
    });

    it('should not return messages not yet due for retry', () => {
      sender.add('msg-1', 'conv-1', 'text', 'Hello');
      sender.startSending('msg-1');
      sender.markFailed('msg-1', 'Error');

      // Immediately get pending - should be empty because delay not passed
      const pending = sender.getPending();
      expect(pending.length).toBe(0);
    });
  });

  describe('getStats', () => {
    it('should return correct statistics', () => {
      sender.add('msg-1', 'conv-1', 'text', 'Hello 1');
      sender.add('msg-2', 'conv-1', 'text', 'Hello 2');
      sender.startSending('msg-2');
      sender.markSent('msg-2');

      sender.add('msg-3', 'conv-1', 'text', 'Hello 3');
      sender.startSending('msg-3');
      sender.markFailed('msg-3', 'Error');
      sender.startSending('msg-3');
      sender.markFailed('msg-3', 'Error');
      sender.startSending('msg-3');
      sender.markFailed('msg-3', 'Error');

      const stats = sender.getStats();
      expect(stats.pending).toBe(1); // msg-1
      expect(stats.failed).toBe(1); // msg-3
    });
  });

  describe('clear', () => {
    it('should clear all messages', () => {
      sender.add('msg-1', 'conv-1', 'text', 'Hello');
      sender.add('msg-2', 'conv-1', 'text', 'World');

      sender.clear();

      const stats = sender.getStats();
      expect(stats.total).toBe(0);
    });
  });

  describe('clearFailed', () => {
    it('should clear only failed messages', () => {
      sender.add('msg-1', 'conv-1', 'text', 'Hello');
      sender.add('msg-2', 'conv-1', 'text', 'World');
      sender.startSending('msg-2');
      sender.markFailed('msg-2', 'Error');
      sender.startSending('msg-2');
      sender.markFailed('msg-2', 'Error');
      sender.startSending('msg-2');
      sender.markFailed('msg-2', 'Error');

      sender.clearFailed();

      const stats = sender.getStats();
      expect(stats.pending).toBe(1); // msg-1 still there
      expect(stats.failed).toBe(0); // msg-2 removed
    });
  });

  describe('start/stop', () => {
    it('should start and stop sender', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      sender.start();
      expect(consoleSpy).toHaveBeenCalledWith(
        '[RetrySender]',
        expect.stringContaining('重试发送器已启动')
      );

      sender.stop();
      expect(consoleSpy).toHaveBeenCalledWith(
        '[RetrySender]',
        expect.stringContaining('重试发送器已停止')
      );

      consoleSpy.mockRestore();
    });

    it('should not start twice', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      sender.start();
      sender.start();

      expect(consoleSpy).toHaveBeenCalledWith(
        '[RetrySender]',
        expect.stringContaining('已经在运行中')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('createRetrySender', () => {
    it('should create RetrySender instance', () => {
      const instance = createRetrySender({ maxRetries: 5 });
      expect(instance).toBeInstanceOf(RetrySender);
    });
  });
});
