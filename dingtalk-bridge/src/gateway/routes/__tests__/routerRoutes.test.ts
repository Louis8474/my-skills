/**
 * 路由管理路由测试
 */
import express from 'express';
import request from 'supertest';
import { createRouterRoutes } from '../routerRoutes';
import type { ProviderRegistry } from '../../../router/provider';
import type { MessageRouter } from '../../../router/router';

function createMockProviderRegistry() {
  return {
    list: jest.fn().mockReturnValue([{ name: 'claude', type: 'cli' }]),
    getDefaultName: jest.fn().mockReturnValue('claude'),
    register: jest.fn(),
    unregister: jest.fn().mockReturnValue(true),
  };
}

function createMockMessageRouter() {
  return {
    listRules: jest.fn().mockReturnValue([]),
    addRule: jest
      .fn()
      .mockImplementation((rule: Record<string, unknown>) => ({ id: 'rule-1', ...rule })),
    removeRule: jest.fn().mockReturnValue(true),
    toggleRule: jest.fn().mockReturnValue({
      id: 'rule-1',
      name: 'test',
      enabled: false,
      condition: {},
      provider: 'claude',
    }),
  };
}

describe('createRouterRoutes', () => {
  let app: express.Express;

  beforeEach(() => {
    const registry = createMockProviderRegistry();
    const router = createMockMessageRouter();
    app = express();
    app.use(express.json());
    app.use(
      createRouterRoutes(
        () => registry as unknown as ProviderRegistry | null,
        () => router as unknown as MessageRouter | null
      )
    );
  });

  describe('Provider routes', () => {
    it('GET /api/router/providers should list providers', async () => {
      const res = await request(app).get('/api/router/providers');
      console.log('Router providers response:', JSON.stringify(res.body));
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
    });

    it('GET /api/router/providers should return 503 when router is null', async () => {
      const nullApp = express();
      nullApp.use(
        createRouterRoutes(
          () => null,
          () => null
        )
      );
      const res = await request(nullApp).get('/api/router/providers');
      expect(res.status).toBe(503);
    });

    it('POST /api/router/providers should register a provider', async () => {
      const res = await request(app).post('/api/router/providers').send({
        name: 'test-provider',
        type: 'cli',
        command: '/usr/bin/test',
      });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('POST /api/router/providers should reject missing fields', async () => {
      const res = await request(app).post('/api/router/providers').send({ name: 'incomplete' });
      expect(res.status).toBe(400);
    });

    it('POST /api/router/providers should reject path traversal in command', async () => {
      const res = await request(app).post('/api/router/providers').send({
        name: 'evil',
        type: 'cli',
        command: '../bin/evil',
      });
      expect(res.status).toBe(400);
    });

    it('DELETE /api/router/providers/:name should unregister a provider', async () => {
      const res = await request(app).delete('/api/router/providers/test-provider');
      expect(res.status).toBe(200);
    });
  });

  describe('Rule routes', () => {
    it('GET /api/router/rules should list rules', async () => {
      const res = await request(app).get('/api/router/rules');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('GET /api/router/rules should return 503 when router is null', async () => {
      const nullApp = express();
      nullApp.use(
        createRouterRoutes(
          () => null,
          () => null
        )
      );
      const res = await request(nullApp).get('/api/router/rules');
      expect(res.status).toBe(503);
    });

    it('POST /api/router/rules should create a rule', async () => {
      const res = await request(app)
        .post('/api/router/rules')
        .send({
          name: 'test-rule',
          condition: { userId: 'u1' },
          provider: 'claude',
        });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('POST /api/router/rules should reject missing fields', async () => {
      const res = await request(app).post('/api/router/rules').send({ name: 'incomplete' });
      expect(res.status).toBe(400);
    });

    it('DELETE /api/router/rules/:id should delete a rule', async () => {
      const res = await request(app).delete('/api/router/rules/rule-1');
      expect(res.status).toBe(200);
    });

    it('DELETE /api/router/rules/:id should reject invalid ID', async () => {
      const res = await request(app).delete('/api/router/rules/  ');
      // Whitespace ID doesn't match route pattern, returns 404
      expect(res.status).toBe(404);
    });

    it('PATCH /api/router/rules/:id/toggle should toggle a rule', async () => {
      const res = await request(app).patch('/api/router/rules/rule-1/toggle');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
