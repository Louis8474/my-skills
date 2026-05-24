/**
 * 定时任务路由测试
 */
import express from 'express';
import request from 'supertest';
import { createSchedulerRouter } from '../schedulerRoutes';
import type { Scheduler } from '../../../scheduler/scheduler';

function createMockScheduler() {
  return {
    getStatus: jest.fn().mockReturnValue({ tasks: [], enabled: true }),
    addTask: jest.fn().mockImplementation((opts: Record<string, unknown>) => ({
      id: 'task-1',
      ...opts,
      enabled: opts.enabled !== false,
    })),
    removeTask: jest.fn().mockReturnValue(true),
    toggleTask: jest.fn().mockImplementation((id: string) => ({
      id,
      name: 'test',
      enabled: true,
      cron: '* * * * *',
      prompt: 'test',
      conversationId: 'conv-1',
    })),
  };
}

describe('createSchedulerRouter', () => {
  let app: express.Express;

  beforeEach(() => {
    const scheduler = createMockScheduler();
    app = express();
    app.use(express.json());
    app.use(createSchedulerRouter(() => scheduler as unknown as Scheduler | null));
  });

  it('GET /api/scheduler should return scheduler status', async () => {
    const res = await request(app).get('/api/scheduler');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('GET /api/scheduler should return 200 with disabled message when scheduler is null', async () => {
    const nullApp = express();
    nullApp.use(createSchedulerRouter(() => null));
    const res = await request(nullApp).get('/api/scheduler');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/scheduler should create a task', async () => {
    const res = await request(app).post('/api/scheduler').send({
      name: 'test-task',
      cron: '0 9 * * 1',
      prompt: 'hello',
      conversationId: 'conv-1',
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.task).toBeDefined();
  });

  it('POST /api/scheduler should reject missing fields', async () => {
    const res = await request(app).post('/api/scheduler').send({ name: 'incomplete' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/scheduler should reject invalid cron', async () => {
    const res = await request(app).post('/api/scheduler').send({
      name: 'bad-cron',
      cron: 'invalid',
      prompt: 'hello',
      conversationId: 'conv-1',
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(false);
  });

  it('DELETE /api/scheduler/:id should delete a task', async () => {
    const res = await request(app).delete('/api/scheduler/task-1');
    expect(res.status).toBe(200);
  });

  it('DELETE /api/scheduler/:id should reject invalid ID', async () => {
    const res = await request(app).delete('/api/scheduler/');
    expect(res.status).toBe(404);
  });

  it('PATCH /api/scheduler/:id/toggle should toggle a task', async () => {
    const res = await request(app).patch('/api/scheduler/task-1/toggle');
    expect(res.status).toBe(200);
  });
});
