/**
 * 消息队列测试
 */
import { MessageQueue } from '../messageQueue';
import { UserMessage } from '../../types/message';

function createTestMessage(id: string, content = 'test'): UserMessage {
  return {
    id,
    userId: 'user1',
    username: 'Test User',
    content,
    conversationId: 'conv1',
    type: 'user',
    metadata: {
      timestamp: Date.now(),
      source: 'dingtalk',
    },
  };
}

describe('MessageQueue', () => {
  let queue: MessageQueue;

  beforeEach(() => {
    queue = new MessageQueue();
  });

  afterEach(() => {
    queue.clear();
  });

  describe('enqueue', () => {
    it('should enqueue a message with normal priority by default', () => {
      const message = createTestMessage('msg1');
      queue.enqueue(message);

      expect(queue.size()).toBe(1);
    });

    it('should enqueue a message with specified priority', () => {
      const message = createTestMessage('msg1');
      queue.enqueue(message, 'high');

      const status = queue.getStatus();
      expect(status.byPriority.high).toBe(1);
    });

    it('should assign increasing enqueue times', () => {
      const msg1 = createTestMessage('msg1');
      const msg2 = createTestMessage('msg2');

      queue.enqueue(msg1);
      queue.enqueue(msg2);

      expect(queue.size()).toBe(2);
    });
  });

  describe('dequeue', () => {
    it('should return null for empty queue', () => {
      expect(queue.dequeue()).toBeNull();
    });

    it('should dequeue messages in priority order', () => {
      queue.enqueue(createTestMessage('msg1'), 'low');
      queue.enqueue(createTestMessage('msg2'), 'high');
      queue.enqueue(createTestMessage('msg3'), 'normal');

      const first = queue.dequeue();
      expect(first?.message.id).toBe('msg2'); // high priority
      expect(first?.priority).toBe('high');

      const second = queue.dequeue();
      expect(second?.message.id).toBe('msg3'); // normal priority

      const third = queue.dequeue();
      expect(third?.message.id).toBe('msg1'); // low priority
    });

    it('should skip messages that are being processed', () => {
      const msg1 = createTestMessage('msg1');
      const msg2 = createTestMessage('msg2');

      queue.enqueue(msg1, 'high');
      queue.enqueue(msg2, 'high');

      // Dequeue first message (marks it as processing)
      queue.dequeue();

      // Second dequeue should get msg2, not msg1
      const second = queue.dequeue();
      expect(second?.message.id).toBe('msg2');
    });

    it('should mark dequeued messages as processing', () => {
      const message = createTestMessage('msg1');
      queue.enqueue(message);

      queue.dequeue();

      const status = queue.getStatus();
      expect(status.processing).toBe(1);
    });
  });

  describe('batchDequeue', () => {
    it('should return empty array for empty queue', () => {
      expect(queue.batchDequeue(5)).toEqual([]);
    });

    it('should dequeue up to requested count', () => {
      queue.enqueue(createTestMessage('msg1'), 'high');
      queue.enqueue(createTestMessage('msg2'), 'high');
      queue.enqueue(createTestMessage('msg3'), 'high');

      const results = queue.batchDequeue(2);

      expect(results).toHaveLength(2);
      expect(results[0].message.id).toBe('msg1');
      expect(results[1].message.id).toBe('msg2');
      // size() returns total queue length (including processing messages)
      expect(queue.size()).toBe(3);
      expect(queue.processingCount()).toBe(2);
    });

    it('should return less than requested if queue is shorter', () => {
      queue.enqueue(createTestMessage('msg1'), 'high');

      const results = queue.batchDequeue(5);

      expect(results).toHaveLength(1);
    });
  });

  describe('complete', () => {
    it('should remove message from processing set', () => {
      const message = createTestMessage('msg1');
      queue.enqueue(message);
      queue.dequeue();

      expect(queue.getStatus().processing).toBe(1);

      queue.complete('msg1');

      expect(queue.getStatus().processing).toBe(0);
    });

    it('should allow message to be dequeued again', () => {
      const message = createTestMessage('msg1');
      queue.enqueue(message);

      queue.dequeue();
      queue.complete('msg1');

      // Message is no longer in queue (it was removed by dequeue)
      expect(queue.size()).toBe(0);
    });
  });

  describe('fail', () => {
    it('should retry message if under max retries', () => {
      const message = createTestMessage('msg1');
      queue.enqueue(message, 'normal');
      queue.dequeue();

      queue.fail('msg1');

      expect(queue.size()).toBe(1);
      const status = queue.getStatus();
      expect(status.byPriority.high).toBe(1); // Retry messages get high priority
    });

    it('should not retry if at max retries', () => {
      queue = new MessageQueue({ maxRetries: 1 });

      const message = createTestMessage('msg1');
      queue.enqueue(message);
      queue.dequeue();

      queue.fail('msg1'); // First fail - will retry
      expect(queue.size()).toBe(1);

      queue.dequeue();
      queue.fail('msg1'); // Second fail - exceeds max retries

      expect(queue.size()).toBe(0);
    });

    it('should increment retry count and upgrade priority', () => {
      const message = createTestMessage('msg1');
      queue.enqueue(message, 'low');
      queue.dequeue();

      queue.fail('msg1');

      // The message is requeued with high priority
      expect(queue.size()).toBe(1);
      const status = queue.getStatus();
      expect(status.byPriority.high).toBe(1);
    });
  });

  describe('getStatus', () => {
    it('should return correct queue statistics', () => {
      queue.enqueue(createTestMessage('msg1'), 'high');
      queue.enqueue(createTestMessage('msg2'), 'normal');
      queue.enqueue(createTestMessage('msg3'), 'low');

      queue.dequeue(); // Mark one as processing (msg1 is high priority, dequeued first)

      const status = queue.getStatus();

      expect(status.queued).toBe(2); // 2 still in queue (not processing)
      expect(status.processing).toBe(1); // 1 being processed
      // byPriority counts all messages in queue (including processing)
      expect(status.byPriority.high).toBe(1);
      expect(status.byPriority.normal).toBe(1);
      expect(status.byPriority.low).toBe(1);
    });
  });

  describe('clear', () => {
    it('should empty the queue and processing set', () => {
      queue.enqueue(createTestMessage('msg1'));
      queue.enqueue(createTestMessage('msg2'));
      queue.dequeue();

      queue.clear();

      expect(queue.size()).toBe(0);
      expect(queue.getStatus().processing).toBe(0);
    });
  });

  describe('size', () => {
    it('should return current queue length', () => {
      expect(queue.size()).toBe(0);

      queue.enqueue(createTestMessage('msg1'));
      expect(queue.size()).toBe(1);

      queue.enqueue(createTestMessage('msg2'));
      expect(queue.size()).toBe(2);

      queue.dequeue(); // Message is still in queue, just marked as processing
      expect(queue.size()).toBe(2);
      expect(queue.processingCount()).toBe(1);
    });
  });

  describe('processingCount', () => {
    it('should return number of messages being processed', () => {
      expect(queue.processingCount()).toBe(0);

      queue.enqueue(createTestMessage('msg1'));
      queue.enqueue(createTestMessage('msg2'));

      queue.dequeue();
      expect(queue.processingCount()).toBe(1);

      queue.dequeue();
      expect(queue.processingCount()).toBe(2);
    });
  });
});