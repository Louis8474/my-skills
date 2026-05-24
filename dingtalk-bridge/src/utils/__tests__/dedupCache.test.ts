import { LRUCache, MessageDeduplicator, createDeduplicator } from '../dedupCache';

describe('LRUCache', () => {
  it('should set and get values', () => {
    const cache = new LRUCache<string, number>(3);
    cache.set('a', 1);
    expect(cache.get('a')).toBe(1);
  });

  it('should return undefined for non-existent keys', () => {
    const cache = new LRUCache<string, number>(3);
    expect(cache.get('nonexistent')).toBeUndefined();
  });

  it('should evict oldest entry when capacity is exceeded', () => {
    const cache = new LRUCache<string, number>(2);
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3); // Should evict 'a'
    expect(cache.get('a')).toBeUndefined();
    expect(cache.get('b')).toBe(2);
    expect(cache.get('c')).toBe(3);
  });

  it('should update existing key and not exceed capacity', () => {
    const cache = new LRUCache<string, number>(2);
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('a', 10); // Update, should not evict
    expect(cache.get('a')).toBe(10);
    expect(cache.get('b')).toBe(2);
  });

  it('should move accessed item to most recent', () => {
    const cache = new LRUCache<string, number>(2);
    cache.set('a', 1);
    cache.set('b', 2);
    cache.get('a'); // Access 'a', makes it most recent
    cache.set('c', 3); // Should evict 'b', not 'a'
    expect(cache.get('a')).toBe(1);
    expect(cache.get('b')).toBeUndefined();
  });

  it('should delete entries', () => {
    const cache = new LRUCache<string, number>(3);
    cache.set('a', 1);
    expect(cache.delete('a')).toBe(true);
    expect(cache.get('a')).toBeUndefined();
    expect(cache.delete('nonexistent')).toBe(false);
  });

  it('should clear all entries', () => {
    const cache = new LRUCache<string, number>(3);
    cache.set('a', 1);
    cache.set('b', 2);
    cache.clear();
    expect(cache.size()).toBe(0);
  });

  it('should report correct size', () => {
    const cache = new LRUCache<string, number>(3);
    expect(cache.size()).toBe(0);
    cache.set('a', 1);
    expect(cache.size()).toBe(1);
    cache.set('b', 2);
    expect(cache.size()).toBe(2);
  });
});

describe('MessageDeduplicator', () => {
  it('should detect duplicate messages', () => {
    const dedup = new MessageDeduplicator({ timeWindow: 60000 });
    dedup.record('Hello', 'user1');
    expect(dedup.isDuplicate('Hello', 'user1')).toBe(true);
  });

  it('should not detect duplicates for different users', () => {
    const dedup = new MessageDeduplicator({ timeWindow: 60000 });
    dedup.record('Hello', 'user1');
    expect(dedup.isDuplicate('Hello', 'user2')).toBe(false);
  });

  it('should not detect duplicates for different messages', () => {
    const dedup = new MessageDeduplicator({ timeWindow: 60000 });
    dedup.record('Hello', 'user1');
    expect(dedup.isDuplicate('World', 'user1')).toBe(false);
  });

  it('should expire old entries after timeWindow', async () => {
    const dedup = new MessageDeduplicator({ timeWindow: 100 }); // 100ms
    dedup.record('Hello', 'user1');
    expect(dedup.isDuplicate('Hello', 'user1')).toBe(true);
    
    await new Promise(resolve => setTimeout(resolve, 150));
    
    expect(dedup.isDuplicate('Hello', 'user1')).toBe(false);
  });

  it('should clear cache correctly', () => {
    const dedup = new MessageDeduplicator();
    dedup.record('Hello', 'user1');
    dedup.clear();
    expect(dedup.isDuplicate('Hello', 'user1')).toBe(false);
  });

  it('should use only first 100 characters for fingerprint', () => {
    const dedup = new MessageDeduplicator({ timeWindow: 60000 });
    const longMessage1 = 'A'.repeat(150);
    const longMessage2 = 'A'.repeat(100) + 'B'.repeat(50);
    
    dedup.record(longMessage1, 'user1');
    // Both messages have same first 100 characters
    expect(dedup.isDuplicate(longMessage2, 'user1')).toBe(true);
  });

  it('createDeduplicator should create instance with default config', () => {
    const dedup = createDeduplicator();
    expect(dedup).toBeInstanceOf(MessageDeduplicator);
  });
});