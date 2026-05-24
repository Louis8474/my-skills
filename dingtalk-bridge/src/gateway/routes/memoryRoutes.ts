/**
 * 项目记忆管理路由
 */
import { Router, Request, Response } from 'express';
import type { MemoryManager, MemoryCategory, MemorySource } from '../../memory';
import { isValidId, parsePositiveInt, parseNonNegativeInt } from '../../utils/validators';

export function createMemoryRoutes(getMemoryManager: () => MemoryManager | null): Router {
  const router = Router();

  router.get('/api/memory/stats', (_req: Request, res: Response) => {
    const memoryManager = getMemoryManager();
    if (!memoryManager) {
      res.status(503).json({ success: false, message: '记忆模块未启用' });
      return;
    }
    const stats = memoryManager.getStats();
    res.json({ success: true, data: { stats } });
  });

  router.get('/api/memory/entries', (req: Request, res: Response) => {
    const memoryManager = getMemoryManager();
    if (!memoryManager) {
      res.status(503).json({ success: false, message: '记忆模块未启用' });
      return;
    }
    const { category, source, query, limit, offset } = req.query as Record<string, string>;
    const filter: {
      category?: MemoryCategory;
      source?: MemorySource;
      query?: string;
      limit?: number;
      offset?: number;
    } = {};
    if (category) filter.category = category as MemoryCategory;
    if (source) filter.source = source as MemorySource;
    if (query) filter.query = query;
    if (limit) filter.limit = parsePositiveInt(limit, 20, 100);
    if (offset) filter.offset = parseNonNegativeInt(offset, 0);
    const entries = memoryManager.searchMemories(filter);
    res.json({ success: true, data: { entries } });
  });

  router.post('/api/memory/entries', (req: Request, res: Response) => {
    const memoryManager = getMemoryManager();
    if (!memoryManager) {
      res.status(503).json({ success: false, message: '记忆模块未启用' });
      return;
    }
    const { key, value, category, source, relevanceScore } = req.body;
    if (!key || !value || !category) {
      res.status(400).json({ success: false, message: '缺少必要参数：key, value, category' });
      return;
    }
    if (
      relevanceScore !== undefined &&
      (typeof relevanceScore !== 'number' || relevanceScore < 0 || relevanceScore > 1)
    ) {
      res.status(400).json({ success: false, message: 'relevanceScore 必须为 0-1 之间的数值' });
      return;
    }
    try {
      const entry = memoryManager.createMemory({
        key,
        value,
        category,
        source: source ?? 'manual',
        relevanceScore,
      });
      res.json({ success: true, data: { entry } });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      res.status(400).json({ success: false, message: msg });
    }
  });

  router.patch('/api/memory/entries/:id', (req: Request, res: Response) => {
    const memoryManager = getMemoryManager();
    if (!memoryManager) {
      res.status(503).json({ success: false, message: '记忆模块未启用' });
      return;
    }
    if (!isValidId(req.params.id)) {
      res.status(400).json({ success: false, message: '无效的记忆 ID' });
      return;
    }
    const { key, value, category, source, relevanceScore } = req.body;
    if (
      relevanceScore !== undefined &&
      (typeof relevanceScore !== 'number' || relevanceScore < 0 || relevanceScore > 1)
    ) {
      res.status(400).json({ success: false, message: 'relevanceScore 必须为 0-1 之间的数值' });
      return;
    }
    const updated = memoryManager.updateMemory(req.params.id, {
      key,
      value,
      category,
      source,
      relevanceScore,
    });
    if (updated) {
      res.json({ success: true, data: { updated } });
    } else {
      res.status(404).json({ success: false, message: '记忆条目不存在' });
    }
  });

  router.delete('/api/memory/entries/:id', (req: Request, res: Response) => {
    const memoryManager = getMemoryManager();
    if (!memoryManager) {
      res.status(503).json({ success: false, message: '记忆模块未启用' });
      return;
    }
    if (!isValidId(req.params.id)) {
      res.status(400).json({ success: false, message: '无效的记忆 ID' });
      return;
    }
    const deleted = memoryManager.deleteMemory(req.params.id);
    res.json({ success: deleted, message: deleted ? '记忆已删除' : '记忆条目不存在' });
  });

  router.post('/api/memory/cleanup', (_req: Request, res: Response) => {
    const memoryManager = getMemoryManager();
    if (!memoryManager) {
      res.status(503).json({ success: false, message: '记忆模块未启用' });
      return;
    }
    const removed = memoryManager.cleanup();
    res.json({ success: true, data: { removed } });
  });

  return router;
}
