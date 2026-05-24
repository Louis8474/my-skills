/**
 * 多 Agent 路由管理路由
 */
import { Router, Request, Response } from 'express';
import type { ProviderRegistry, MessageRouter } from '../../router';
import { isPositiveInteger, isNonNegativeInteger, isValidId } from '../../utils/validators';

export function createRouterRoutes(
  getProviderRegistry: () => ProviderRegistry | null,
  getMessageRouter: () => MessageRouter | null
): Router {
  const router = Router();

  // Provider 管理
  router.get('/api/router/providers', (_req: Request, res: Response) => {
    const registry = getProviderRegistry();
    if (!registry) {
      res.status(503).json({ success: false, message: 'Router 未启用' });
      return;
    }
    res.json({
      success: true,
      data: {
        providers: registry.list(),
        default: registry.getDefaultName(),
      },
    });
  });

  router.post('/api/router/providers', (req: Request, res: Response) => {
    const registry = getProviderRegistry();
    if (!registry) {
      res.status(503).json({ success: false, message: 'Router 未启用' });
      return;
    }
    try {
      const { name, type, command, args, timeout, enabled } = req.body;
      if (!name || !type || !command) {
        res.status(400).json({ success: false, message: '缺少必要参数：name, type, command' });
        return;
      }
      if (typeof command === 'string' && command.includes('..')) {
        res.status(400).json({ success: false, message: 'command 不允许包含路径遍历字符' });
        return;
      }
      const timeoutValue =
        timeout !== undefined ? (isPositiveInteger(timeout) ? timeout : undefined) : undefined;
      registry.register({
        name,
        type,
        command,
        args: args || [],
        timeout: timeoutValue ?? 120000,
        enabled: enabled !== false,
      });
      res.json({ success: true, message: `Provider "${name}" 已注册` });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      res.status(500).json({ success: false, message: msg });
    }
  });

  router.delete('/api/router/providers/:name', (req: Request, res: Response) => {
    const registry = getProviderRegistry();
    if (!registry) {
      res.status(503).json({ success: false, message: 'Router 未启用' });
      return;
    }
    const deleted = registry.unregister(req.params.name);
    res.json({ success: deleted, message: deleted ? 'Provider 已注销' : 'Provider 不存在' });
  });

  // Rule 管理
  router.get('/api/router/rules', (_req: Request, res: Response) => {
    const messageRouter = getMessageRouter();
    if (!messageRouter) {
      res.status(503).json({ success: false, message: 'Router 未启用' });
      return;
    }
    res.json({ success: true, data: { rules: messageRouter.listRules() } });
  });

  router.post('/api/router/rules', (req: Request, res: Response) => {
    const messageRouter = getMessageRouter();
    if (!messageRouter) {
      res.status(503).json({ success: false, message: 'Router 未启用' });
      return;
    }
    try {
      const { name, enabled, priority, condition, provider } = req.body;
      if (!name || !condition || !provider) {
        res
          .status(400)
          .json({ success: false, message: '缺少必要参数：name, condition, provider' });
        return;
      }
      const priorityValue =
        priority !== undefined
          ? isNonNegativeInteger(priority)
            ? priority
            : undefined
          : undefined;
      const rule = messageRouter.addRule({
        name,
        enabled: enabled !== false,
        priority: priorityValue ?? 100,
        condition,
        provider,
      });
      res.json({ success: true, data: { rule } });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      res.status(500).json({ success: false, message: msg });
    }
  });

  router.delete('/api/router/rules/:id', (req: Request, res: Response) => {
    const messageRouter = getMessageRouter();
    if (!messageRouter) {
      res.status(503).json({ success: false, message: 'Router 未启用' });
      return;
    }
    if (!isValidId(req.params.id)) {
      res.status(400).json({ success: false, message: '无效的规则 ID' });
      return;
    }
    const deleted = messageRouter.removeRule(req.params.id);
    res.json({ success: deleted, message: deleted ? '规则已删除' : '规则不存在' });
  });

  router.patch('/api/router/rules/:id/toggle', (req: Request, res: Response) => {
    const messageRouter = getMessageRouter();
    if (!messageRouter) {
      res.status(503).json({ success: false, message: 'Router 未启用' });
      return;
    }
    if (!isValidId(req.params.id)) {
      res.status(400).json({ success: false, message: '无效的规则 ID' });
      return;
    }
    const rule = messageRouter.toggleRule(req.params.id);
    if (rule) {
      res.json({ success: true, data: { rule } });
    } else {
      res.status(404).json({ success: false, message: '规则不存在' });
    }
  });

  return router;
}
