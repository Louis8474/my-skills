/**
 * 状态路由测试
 */
import express from 'express';
import request from 'supertest';
import { createStatusRoutes } from '../statusRoutes';

// Mock dependencies
const mockGetSessionManager = jest.fn();
const mockGetMessageQueue = jest.fn();
const mockGetRateLimiter = jest.fn();
const mockGetConcurrencyController = jest.fn();
const mockGetRetrySender = jest.fn();
const mockGetOpenCodeExecutor = jest.fn();
const mockGetClaudeCodeExecutor = jest.fn();

function setupMocks() {
  mockGetSessionManager.mockReturnValue({
    getStats: jest.fn().mockResolvedValue({ total: 5, active: 2 }),
  });
  mockGetMessageQueue.mockReturnValue({
    getStatus: jest.fn().mockReturnValue({ pending: 3, processing: 1 }),
  });
  mockGetRateLimiter.mockReturnValue({
    getStatus: jest.fn().mockReturnValue({ tokens: 10 }),
  });
  mockGetConcurrencyController.mockReturnValue({
    getStatus: jest.fn().mockReturnValue({ active: 1, queued: 0 }),
  });
  mockGetRetrySender.mockReturnValue({
    getStats: jest.fn().mockReturnValue({ retries: 2 }),
  });
  mockGetOpenCodeExecutor.mockReturnValue({
    isAvailable: jest.fn().mockResolvedValue(true),
  });
  mockGetClaudeCodeExecutor.mockReturnValue({
    isAvailable: jest.fn().mockResolvedValue(false),
  });
}

function createApp() {
  const app = express();
  const router = createStatusRoutes({
    getSessionManager: mockGetSessionManager,
    getMessageQueue: mockGetMessageQueue,
    getRateLimiter: mockGetRateLimiter,
    getConcurrencyController: mockGetConcurrencyController,
    getRetrySender: mockGetRetrySender,
    getOpenCodeExecutor: mockGetOpenCodeExecutor,
    getClaudeCodeExecutor: mockGetClaudeCodeExecutor,
  });
  app.use(router);
  return app;
}

describe('createStatusRoutes', () => {
  beforeEach(() => {
    setupMocks();
  });

  it('GET /health should return ok', async () => {
    const app = createApp();
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body).toHaveProperty('timestamp');
    expect(res.body).toHaveProperty('mode', 'stream');
  });

  it('POST /api/test should return 501', async () => {
    const app = createApp();
    const res = await request(app).post('/api/test');
    expect(res.status).toBe(501);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/queue should return queue status', async () => {
    const app = createApp();
    const res = await request(app).get('/api/queue');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
  });
});
