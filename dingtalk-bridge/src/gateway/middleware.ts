/**
 * Gateway 中间件配置
 * 将 Express 中间件和认证逻辑从 index.ts 提取出来
 */
import express, { Express, Request, Response, NextFunction } from 'express';
import { config } from '../config';
import { createSafeLogger } from '../utils/logger';

const logger = createSafeLogger('Gateway:Middleware');

/**
 * 设置 Express 中间件（JSON 解析、认证、日志、错误处理）
 */
export function setupMiddleware(app: Express): void {
  app.use(express.json());

  // 认证中间件 - 保护敏感接口
  app.use('/api/test', authMiddleware);
  app.use('/api/sessions', authMiddleware);
  app.use('/api/queue', authMiddleware);
  app.use('/api/status', authMiddleware);
  app.use('/api/doctor', authMiddleware);
  app.use('/api/scheduler', authMiddleware);
  app.use('/api/router', authMiddleware);
  app.use('/api/memory', authMiddleware);

  app.use((req: Request, _res: Response, next: NextFunction) => {
    logger.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });

  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    logger.error('请求处理错误:', err);
    res.status(500).json({
      success: false,
      message: '内部服务器错误',
    });
  });
}

/**
 * API 认证中间件
 */
function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (!config.gateway.apiToken) {
    next();
    return;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      message: '缺少认证信息',
    });
    return;
  }

  const token = authHeader.substring(7);
  if (token !== config.gateway.apiToken) {
    res.status(401).json({
      success: false,
      message: '认证失败',
    });
    return;
  }

  next();
}
