/**
 * Web Admin API 路由
 * 为 Gateway 的 Express 应用扩展管理 API
 */
import { Router, Request, Response } from 'express';
import { agentRegistry } from '../agents';
import { hookRunner } from '../hooks';
import type { ApiResponse } from './types';

/**
 * 创建管理 API 路由
 */
export function createAdminRouter(): Router {
  const router = Router();

  // ===== Agent 管理 =====

  /** 列出所有 Agent */
  router.get('/api/admin/agents', (_req: Request, res: Response) => {
    res.json({
      success: true,
      data: {
        agents: agentRegistry.list(),
        default: agentRegistry.getDefaultName(),
      },
    } as ApiResponse);
  });

  /** 设置默认 Agent */
  router.patch('/api/admin/agents/:name/default', (req: Request, res: Response) => {
    const success = agentRegistry.setDefault(req.params.name);
    if (success) {
      res.json({ success: true, message: `默认 Agent 已设为 ${req.params.name}` } as ApiResponse);
    } else {
      res
        .status(404)
        .json({ success: false, message: `Agent "${req.params.name}" 不存在` } as ApiResponse);
    }
  });

  // ===== Hooks 管理 =====

  /** 列出所有钩子 */
  router.get('/api/admin/hooks', (_req: Request, res: Response) => {
    res.json({
      success: true,
      data: {
        hooks: hookRunner.list(),
      },
    } as ApiResponse);
  });

  /** 切换钩子启用状态 */
  router.patch('/api/admin/hooks/:id/toggle', (req: Request, res: Response) => {
    const success = hookRunner.toggle(req.params.id);
    if (success) {
      res.json({ success: true, message: `钩子 ${req.params.id} 状态已切换` } as ApiResponse);
    } else {
      res
        .status(404)
        .json({ success: false, message: `钩子 "${req.params.id}" 不存在` } as ApiResponse);
    }
  });

  // ===== 流式输出状态 =====

  router.get('/api/admin/streaming', (_req: Request, res: Response) => {
    // 从 config 获取流式配置
    res.json({
      success: true,
      data: {
        note: 'StreamingCardManager status requires runtime instance',
      },
    } as ApiResponse);
  });

  // ===== 系统概览 =====

  router.get('/api/admin/overview', (_req: Request, res: Response) => {
    res.json({
      success: true,
      data: {
        agents: agentRegistry.size,
        hooks: hookRunner.list().length,
      },
    } as ApiResponse);
  });

  return router;
}
