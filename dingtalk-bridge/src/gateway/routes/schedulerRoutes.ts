/**
 * 定时任务路由
 */
import { Router, Request, Response } from 'express';
import type { Scheduler } from '../../scheduler';
import { isValidCron, isValidId } from '../../utils/validators';

export function createSchedulerRouter(getScheduler: () => Scheduler | null): Router {
  const router = Router();

  router.get('/api/scheduler', (_req: Request, res: Response) => {
    const scheduler = getScheduler();
    if (!scheduler) {
      res.json({ success: false, message: '调度器未启用' });
      return;
    }
    res.json({ success: true, data: scheduler.getStatus() });
  });

  router.post('/api/scheduler', (req: Request, res: Response) => {
    const scheduler = getScheduler();
    if (!scheduler) {
      res.json({ success: false, message: '调度器未启用' });
      return;
    }
    const { name, cron, prompt, conversationId, enabled } = req.body;
    if (!name || !cron || !prompt || !conversationId) {
      res.json({
        success: false,
        message: '缺少必填字段: name, cron, prompt, conversationId',
      });
      return;
    }
    if (!isValidCron(cron)) {
      res.json({
        success: false,
        message: 'cron 表达式格式无效，需要 5 字段格式（分 时 日 月 周）',
      });
      return;
    }
    const task = scheduler.addTask({ name, cron, prompt, conversationId, enabled });
    res.json({ success: true, task });
  });

  router.delete('/api/scheduler/:id', (req: Request, res: Response) => {
    const scheduler = getScheduler();
    if (!scheduler) {
      res.json({ success: false, message: '调度器未启用' });
      return;
    }
    if (!isValidId(req.params.id)) {
      res.status(400).json({ success: false, message: '无效的任务 ID' });
      return;
    }
    const removed = scheduler.removeTask(req.params.id);
    res.json({ success: removed, message: removed ? '任务已删除' : '任务不存在' });
  });

  router.patch('/api/scheduler/:id/toggle', (req: Request, res: Response) => {
    const scheduler = getScheduler();
    if (!scheduler) {
      res.json({ success: false, message: '调度器未启用' });
      return;
    }
    if (!isValidId(req.params.id)) {
      res.status(400).json({ success: false, message: '无效的任务 ID' });
      return;
    }
    const task = scheduler.toggleTask(req.params.id);
    res.json({
      success: !!task,
      task: task,
      message: task ? `任务已${task.enabled ? '启用' : '停用'}` : '任务不存在',
    });
  });

  return router;
}
