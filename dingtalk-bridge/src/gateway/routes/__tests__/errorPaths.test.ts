/**
 * 路由错误处理路径测试
 * 验证 503（router 未启用）和 500（内部异常）分支
 */
import express from 'express';
import request from 'supertest';
import { createRouterRoutes } from '../routerRoutes';
import { createSchedulerRouter } from '../schedulerRoutes';
import type { ProviderRegistry } from '../../../router/provider';
import type { MessageRouter } from '../../../router/router';
import type { Scheduler } from '../../../scheduler/scheduler';

describe('routerRoutes error paths', () => {
  it('POST /api/router/providers returns 500 when registry.register throws', async () => {
    const registry = {
      list: jest.fn(),
      getDefaultName: jest.fn(),
      register: jest.fn().mockImplementation(() => {
        throw new Error('register failed');
      }),
      unregister: jest.fn(),
    };
    const app = express();
    app.use(express.json());
    app.use(
      createRouterRoutes(
        () => registry as unknown as ProviderRegistry | null,
        () => null
      )
    );
    const res = await request(app).post('/api/router/providers').send({
      name: 'p',
      type: 'cli',
      command: '/bin/x',
    });
    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('register failed');
  });

  it('POST /api/router/rules returns 500 when router.addRule throws', async () => {
    const router = {
      listRules: jest.fn(),
      addRule: jest.fn().mockImplementation(() => {
        throw new Error('bad rule');
      }),
      removeRule: jest.fn(),
      toggleRule: jest.fn(),
    };
    const app = express();
    app.use(express.json());
    app.use(
      createRouterRoutes(
        () => null,
        () => router as unknown as MessageRouter | null
      )
    );
    const res = await request(app)
      .post('/api/router/rules')
      .send({ name: 'r', condition: { userId: 'u' }, provider: 'claude' });
    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });

  it('DELETE /api/router/providers returns 503 when router disabled', async () => {
    const app = express();
    app.use(
      createRouterRoutes(
        () => null,
        () => null
      )
    );
    const res = await request(app).delete('/api/router/providers/foo');
    expect(res.status).toBe(503);
  });

  it('PATCH /api/router/rules/:id/toggle returns 404 when rule missing', async () => {
    const router = {
      listRules: jest.fn(),
      addRule: jest.fn(),
      removeRule: jest.fn(),
      toggleRule: jest.fn().mockReturnValue(null),
    };
    const app = express();
    app.use(
      createRouterRoutes(
        () => null,
        () => router as unknown as MessageRouter | null
      )
    );
    const res = await request(app).patch('/api/router/rules/missing/toggle');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/router/providers normalizes invalid timeout to default', async () => {
    const register = jest.fn();
    const registry = {
      list: jest.fn(),
      getDefaultName: jest.fn(),
      register,
      unregister: jest.fn(),
    };
    const app = express();
    app.use(express.json());
    app.use(
      createRouterRoutes(
        () => registry as unknown as ProviderRegistry | null,
        () => null
      )
    );
    await request(app)
      .post('/api/router/providers')
      .send({ name: 'p', type: 'cli', command: '/x', timeout: -1 });
    expect(register).toHaveBeenCalledWith(expect.objectContaining({ timeout: 120000 }));
  });
});

describe('schedulerRoutes error paths', () => {
  it('GET /api/scheduler returns disabled when scheduler is null', async () => {
    const app = express();
    app.use(createSchedulerRouter(() => null));
    const res = await request(app).get('/api/scheduler');
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('调度器未启用');
  });

  it('POST /api/scheduler returns disabled message when scheduler is null', async () => {
    const app = express();
    app.use(express.json());
    app.use(createSchedulerRouter(() => null));
    const res = await request(app).post('/api/scheduler').send({
      name: 'x',
      cron: '* * * * *',
      prompt: 'hi',
      conversationId: 'c',
    });
    expect(res.body.success).toBe(false);
  });

  it('DELETE /api/scheduler/:id returns disabled when scheduler is null', async () => {
    const app = express();
    app.use(createSchedulerRouter(() => null));
    const res = await request(app).delete('/api/scheduler/task-1');
    expect(res.body.success).toBe(false);
  });

  it('PATCH toggle returns disabled when scheduler is null', async () => {
    const app = express();
    app.use(createSchedulerRouter(() => null));
    const res = await request(app).patch('/api/scheduler/task-1/toggle');
    expect(res.body.success).toBe(false);
  });

  it('PATCH toggle returns not-found when task missing', async () => {
    const scheduler = {
      getStatus: jest.fn(),
      addTask: jest.fn(),
      removeTask: jest.fn(),
      toggleTask: jest.fn().mockReturnValue(null),
    };
    const app = express();
    app.use(createSchedulerRouter(() => scheduler as unknown as Scheduler | null));
    const res = await request(app).patch('/api/scheduler/missing/toggle');
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('任务不存在');
  });
});
