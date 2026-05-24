import {
  generateMessageId,
  generateConversationId,
  SnowflakeIdGenerator,
  generateUniqueId,
} from '../messageId';

describe('MessageId', () => {
  describe('generateMessageId', () => {
    it('should generate message ID with correct format', () => {
      const id = generateMessageId();
      expect(id).toMatch(/^m_[a-z0-9]+$/);
    });

    it('should generate unique IDs', () => {
      const ids = new Set<string>();
      for (let i = 0; i < 1000; i++) {
        ids.add(generateMessageId());
      }
      expect(ids.size).toBe(1000);
    });

    it('should generate ID with prefix "m_"', () => {
      const id = generateMessageId();
      expect(id.startsWith('m_')).toBe(true);
    });
  });

  describe('generateConversationId', () => {
    it('should generate conversation ID with correct format', () => {
      const id = generateConversationId();
      expect(id).toMatch(/^c_[a-z0-9]+$/);
    });

    it('should generate unique conversation IDs', () => {
      const ids = new Set<string>();
      for (let i = 0; i < 1000; i++) {
        ids.add(generateConversationId());
      }
      expect(ids.size).toBe(1000);
    });

    it('should generate ID with prefix "c_"', () => {
      const id = generateConversationId();
      expect(id.startsWith('c_')).toBe(true);
    });
  });

  describe('SnowflakeIdGenerator', () => {
    it('should generate unique IDs', () => {
      const generator = new SnowflakeIdGenerator(1);
      const ids = new Set<string>();
      for (let i = 0; i < 1000; i++) {
        ids.add(generator.generate());
      }
      expect(ids.size).toBe(1000);
    });

    it('should generate IDs with correct format', () => {
      const generator = new SnowflakeIdGenerator(1);
      const id = generator.generate();
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });
  });

  describe('generateUniqueId', () => {
    it('should generate ID with custom prefix', () => {
      const id = generateUniqueId('test');
      expect(id.startsWith('test_')).toBe(true);
    });

    it('should generate ID with default prefix', () => {
      const id = generateUniqueId();
      expect(id.startsWith('id_')).toBe(true);
    });
  });
});