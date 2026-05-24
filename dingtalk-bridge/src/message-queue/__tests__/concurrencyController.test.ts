import { ConcurrencyController } from '../concurrencyController';

describe('ConcurrencyController', () => {
  let controller: ConcurrencyController;

  beforeEach(() => {
    controller = new ConcurrencyController({
      maxConcurrentPerUser: 2,
      maxConcurrentGlobal: 5,
    });
  });

  afterEach(() => {
    controller.clear();
  });

  describe('acquireSlot', () => {
    it('should acquire slot successfully', async () => {
      const result = await controller.acquireSlot('user1', 'req1');
      expect(result).toBe(true);
    });

    it('should respect per-user limit', async () => {
      await controller.acquireSlot('user1', 'req1');
      await controller.acquireSlot('user1', 'req2');
      
      // Third request should wait (returns a promise that doesn't resolve immediately)
      const acquirePromise = controller.acquireSlot('user1', 'req3');
      
      // Should be waiting in queue
      expect(controller.getWaitingQueueLength()).toBe(1);
      
      // Clean up
      controller.releaseSlot('user1', 'req1');
      controller.releaseSlot('user1', 'req2');
      
      // Now the waiting request should resolve
      await expect(acquirePromise).resolves.toBe(true);
    });

    it('should respect global limit', async () => {
      // Acquire slots for different users
      await controller.acquireSlot('user1', 'req1');
      await controller.acquireSlot('user1', 'req2');
      await controller.acquireSlot('user2', 'req3');
      await controller.acquireSlot('user2', 'req4');
      await controller.acquireSlot('user3', 'req5');
      
      // Global limit reached, next request should wait
      const acquirePromise = controller.acquireSlot('user4', 'req6');
      expect(controller.getWaitingQueueLength()).toBe(1);
      
      // Clean up
      controller.releaseSlot('user1', 'req1');
      
      // Waiting request should be processed
      await expect(acquirePromise).resolves.toBe(true);
    });

    it('should track user concurrency correctly', async () => {
      await controller.acquireSlot('user1', 'req1');
      expect(controller.getUserConcurrency('user1')).toBe(1);
      
      await controller.acquireSlot('user1', 'req2');
      expect(controller.getUserConcurrency('user1')).toBe(2);
    });

    it('should track global concurrency correctly', async () => {
      await controller.acquireSlot('user1', 'req1');
      await controller.acquireSlot('user2', 'req2');
      expect(controller.getGlobalConcurrency()).toBe(2);
    });

    it('should timeout when waiting for slot', async () => {
      // Acquire all slots for user1
      await controller.acquireSlot('user1', 'req1');
      await controller.acquireSlot('user1', 'req2');
      
      // This request should timeout
      await expect(controller.acquireSlot('user1', 'req3', 100)).rejects.toThrow('超时');
      
      // Verify queue is cleaned up
      expect(controller.getWaitingQueueLength()).toBe(0);
    });
  });

  describe('releaseSlot', () => {
    it('should release slot and decrease concurrency', async () => {
      await controller.acquireSlot('user1', 'req1');
      expect(controller.getUserConcurrency('user1')).toBe(1);
      
      controller.releaseSlot('user1', 'req1');
      expect(controller.getUserConcurrency('user1')).toBe(0);
    });

    it('should process waiting queue after release', async () => {
      await controller.acquireSlot('user1', 'req1');
      await controller.acquireSlot('user1', 'req2');
      
      // This request should wait
      const waitingPromise = controller.acquireSlot('user1', 'req3');
      expect(controller.getWaitingQueueLength()).toBe(1);
      
      // Release a slot
      controller.releaseSlot('user1', 'req1');
      
      // Waiting request should be processed
      await expect(waitingPromise).resolves.toBe(true);
      expect(controller.getWaitingQueueLength()).toBe(0);
    });
  });

  describe('getStatus', () => {
    it('should return correct status', async () => {
      await controller.acquireSlot('user1', 'req1');
      await controller.acquireSlot('user2', 'req2');
      
      const status = controller.getStatus();
      expect(status.active).toBe(2);
      expect(status.waiting).toBe(0);
    });
  });

  describe('forceReleaseUser', () => {
    it('should release all slots for a user', async () => {
      await controller.acquireSlot('user1', 'req1');
      await controller.acquireSlot('user1', 'req2');
      
      expect(controller.getUserConcurrency('user1')).toBe(2);
      
      controller.forceReleaseUser('user1');
      expect(controller.getUserConcurrency('user1')).toBe(0);
    });
  });

  describe('clear', () => {
    it('should clear all state and reject waiting requests', async () => {
      await controller.acquireSlot('user1', 'req1');
      await controller.acquireSlot('user1', 'req2');
      
      const waitingPromise = controller.acquireSlot('user1', 'req3');
      
      controller.clear();
      
      expect(controller.getGlobalConcurrency()).toBe(0);
      await expect(waitingPromise).rejects.toThrow('Concurrency controller cleared');
    });
  });
});