/**
 * 记忆管理路由测试
 */
import express from 'express';
import request from 'supertest';
import { createMemoryRoutes } from '../memoryRoutes';
import type { MemoryManager } from '../../../memory/memoryManager';

function createMockMemoryManager() {
  return {
    getStats: () => ({ total: 10, categories: {} }),
    searchMemories: () => [
      { id: '1', key: 'k1', value: 'v1', category: 'general', source: 'manual' },
    ],
    createMemory: (data: Record<string, unknown>) => ({
      id: 'mem-1',
      ...data,
      createdAt: new Date().toISOString(),
    }),
    updateMemory: () => ({ id: '1', key: 'k1', value: 'updated' }),
    deleteMemory: () => true,
    cleanup: () => 3,
  };
}

describe('createMemoryRoutes', () => {
  it('GET /api/memory/stats should return stats', async () => {
    const manager = createMockMemoryManager();
    const app = express();
    app.use(createMemoryRoutes(() => manager as unknown as MemoryManager | null));
    const res = await request(app).get('/api/memory/stats');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
  });

  it('GET /api/memory/stats should return 503 when memory is null', async () => {
    const app = express();
    app.use(createMemoryRoutes(() => null));
    const res = await request(app).get('/api/memory/stats');
    expect(res.status).toBe(503);
  });

  it('GET /api/memory/entries should return entries', async () => {
    const manager = createMockMemoryManager();
    const app = express();
    app.use(createMemoryRoutes(() => manager as unknown as MemoryManager | null));
    const res = await request(app).get('/api/memory/entries');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
  });

  it('POST /api/memory/entries should create an entry', async () => {
    const manager = createMockMemoryManager();
    const app = express();
    app.use(express.json());
    app.use(createMemoryRoutes(() => manager as unknown as MemoryManager | null));
    const res = await request(app).post('/api/memory/entries').send({
      key: 'test-key',
      value: 'test-value',
      category: 'general',
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
  });

  it('POST /api/memory/entries should reject missing fields', async () => {
    const manager = createMockMemoryManager();
    const app = express();
    app.use(express.json());
    app.use(createMemoryRoutes(() => manager as unknown as MemoryManager | null));
    const res = await request(app).post('/api/memory/entries').send({ key: 'only-key' });
    expect(res.status).toBe(400);
  });

  it('POST /api/memory/entries should reject invalid relevanceScore', async () => {
    const manager = createMockMemoryManager();
    const app = express();
    app.use(express.json());
    app.use(createMemoryRoutes(() => manager as unknown as MemoryManager | null));
    const res = await request(app).post('/api/memory/entries').send({
      key: 'k',
      value: 'v',
      category: 'c',
      relevanceScore: 5,
    });
    expect(res.status).toBe(400);
  });

  it('PATCH /api/memory/entries/:id should update entry', async () => {
    const manager = createMockMemoryManager();
    const app = express();
    app.use(express.json());
    app.use(createMemoryRoutes(() => manager as unknown as MemoryManager | null));
    const res = await request(app).patch('/api/memory/entries/valid-id').send({ value: 'updated' });
    expect(res.status).toBe(200);
  });

  it('PATCH /api/memory/entries/:id should reject invalid ID', async () => {
    const manager = createMockMemoryManager();
    const app = express();
    app.use(express.json());
    app.use(createMemoryRoutes(() => manager as unknown as MemoryManager | null));
    // Invalid ID (whitespace only) doesn't match route pattern, returns 404
    const res = await request(app).patch('/api/memory/entries/  ').send({ value: 'x' });
    expect(res.status).toBe(404);
  });

  it('DELETE /api/memory/entries/:id should delete entry', async () => {
    const manager = createMockMemoryManager();
    const app = express();
    app.use(createMemoryRoutes(() => manager as unknown as MemoryManager | null));
    const res = await request(app).delete('/api/memory/entries/mem-1');
    // deleteMemory returns boolean, true means deleted
    expect(res.status).toBe(200);
  });

  it('DELETE /api/memory/entries/:id should reject invalid ID', async () => {
    const manager = createMockMemoryManager();
    const app = express();
    app.use(createMemoryRoutes(() => manager as unknown as MemoryManager | null));
    // Invalid ID (whitespace only) doesn't match route pattern, returns 404
    const res = await request(app).delete('/api/memory/entries/  ');
    expect(res.status).toBe(404);
  });

  it('POST /api/memory/cleanup should cleanup expired entries', async () => {
    const manager = createMockMemoryManager();
    const app = express();
    app.use(createMemoryRoutes(() => manager as unknown as MemoryManager | null));
    const res = await request(app).post('/api/memory/cleanup');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
  });

  it('POST /api/memory/cleanup should return 503 when memory is null', async () => {
    const app = express();
    app.use(createMemoryRoutes(() => null));
    const res = await request(app).post('/api/memory/cleanup');
    expect(res.status).toBe(503);
  });
});
