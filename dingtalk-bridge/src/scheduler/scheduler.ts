/**
 * 定时任务调度器
 * 支持 cron 表达式定时触发任务，结果通过消息队列推送到钉钉群
 */

import cron, { ScheduledTask } from 'node-cron';
import { randomUUID } from 'crypto';
import { MessageQueue } from '../message-queue/messageQueue';
import { UserMessage } from '../types/message';
import { generateMessageId } from '../utils/messageId';
import { SQLiteStorage, getStorage } from '../storage/sqlite';
import { createSafeLogger } from '../utils/logger';

const logger = createSafeLogger('Scheduler');

export interface SchedulerTask {
  id: string;
  name: string;
  cron: string;
  prompt: string;
  conversationId: string;
  enabled: boolean;
  createdAt: number;
  lastRunAt?: number;
}

export interface SchedulerTaskConfig {
  name: string;
  cron: string;
  prompt: string;
  conversationId: string;
  enabled?: boolean;
}

export interface SchedulerConfig {
  enabled: boolean;
  tasks: SchedulerTaskConfig[];
}

const DEFAULT_CONFIG: SchedulerConfig = {
  enabled: false,
  tasks: [],
};

export class Scheduler {
  private tasks: Map<string, ScheduledTask> = new Map();
  private taskDefinitions: Map<string, SchedulerTask> = new Map();
  private messageQueue: MessageQueue | null = null;
  private storage: SQLiteStorage | null = null;
  private config: SchedulerConfig;

  constructor(config?: Partial<SchedulerConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * 设置消息队列（用于推送定时任务结果）
   */
  setMessageQueue(queue: MessageQueue): void {
    this.messageQueue = queue;
  }

  /**
   * 初始化调度器
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  async init(): Promise<void> {
    if (!this.config.enabled) {
      logger.log('调度器未启用');
      return;
    }

    // 初始化存储
    try {
      this.storage = getStorage();
      this.initStorage();
      this.restoreTasks();
    } catch (error) {
      logger.error('存储初始化失败，使用内存模式:', error);
    }

    // 加载配置中的任务
    for (const taskConfig of this.config.tasks) {
      const existing = Array.from(this.taskDefinitions.values()).find(
        t => t.name === taskConfig.name
      );
      if (!existing) {
        this.addTask(taskConfig);
      }
    }

    // 启动所有已启用的任务
    for (const [id, task] of this.taskDefinitions) {
      if (task.enabled) {
        this.scheduleTask(id);
      }
    }

    logger.log(`调度器已启动，${this.taskDefinitions.size} 个任务`);
  }

  /**
   * 初始化存储表
   */
  private initStorage(): void {
    if (!this.storage) return;
    const db = this.storage.getDb();
    if (!db) return;

    db.exec(`
      CREATE TABLE IF NOT EXISTS scheduler_tasks (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        cron TEXT NOT NULL,
        prompt TEXT NOT NULL,
        conversationId TEXT NOT NULL,
        enabled INTEGER DEFAULT 1,
        createdAt INTEGER NOT NULL,
        lastRunAt INTEGER
      );
      CREATE INDEX IF NOT EXISTS idx_scheduler_enabled ON scheduler_tasks(enabled);
    `);
  }

  /**
   * 从存储恢复任务
   */
  private restoreTasks(): void {
    if (!this.storage) return;
    const db = this.storage.getDb();
    if (!db) return;

    try {
      const rows = db.prepare('SELECT * FROM scheduler_tasks').all() as SchedulerTask[];
      for (const row of rows) {
        this.taskDefinitions.set(row.id, {
          ...row,
          enabled: Boolean(row.enabled),
        });
      }
      logger.log(`从存储恢复 ${rows.length} 个任务`);
    } catch (error) {
      logger.error('恢复任务失败:', error);
    }
  }

  /**
   * 添加定时任务
   */
  addTask(config: SchedulerTaskConfig): SchedulerTask {
    const task: SchedulerTask = {
      id: randomUUID(),
      name: config.name,
      cron: config.cron,
      prompt: config.prompt,
      conversationId: config.conversationId,
      enabled: config.enabled ?? true,
      createdAt: Date.now(),
    };

    this.taskDefinitions.set(task.id, task);

    // 持久化
    this.persistTask(task);

    // 如果已启用且调度器运行中，立即调度
    if (task.enabled && this.config.enabled) {
      this.scheduleTask(task.id);
    }

    logger.log(`添加任务: ${task.name} (${task.cron})`);
    return task;
  }

  /**
   * 删除定时任务
   */
  removeTask(id: string): boolean {
    const task = this.taskDefinitions.get(id);
    if (!task) return false;

    this.stopTask(id);
    this.taskDefinitions.delete(id);

    // 从存储删除
    if (this.storage) {
      const db = this.storage.getDb();
      if (db) {
        try {
          db.prepare('DELETE FROM scheduler_tasks WHERE id = ?').run(id);
        } catch (error) {
          logger.error('删除任务存储失败:', error);
        }
      }
    }

    logger.log(`删除任务: ${task.name}`);
    return true;
  }

  /**
   * 切换任务启用/停用
   */
  toggleTask(id: string): SchedulerTask | null {
    const task = this.taskDefinitions.get(id);
    if (!task) return null;

    task.enabled = !task.enabled;

    if (task.enabled) {
      this.scheduleTask(id);
    } else {
      this.stopTask(id);
    }

    // 更新存储
    this.persistTask(task);

    logger.log(`任务 ${task.name} ${task.enabled ? '已启用' : '已停用'}`);
    return task;
  }

  /**
   * 列出所有任务
   */
  listTasks(): SchedulerTask[] {
    return Array.from(this.taskDefinitions.values());
  }

  /**
   * 获取单个任务
   */
  getTask(id: string): SchedulerTask | null {
    return this.taskDefinitions.get(id) || null;
  }

  /**
   * 调度任务
   */
  private scheduleTask(id: string): void {
    const task = this.taskDefinitions.get(id);
    if (!task) return;

    // 验证 cron 表达式
    if (!cron.validate(task.cron)) {
      logger.error(`无效的 cron 表达式: ${task.cron}`);
      return;
    }

    // 停止已有的调度
    this.stopTask(id);

    const scheduledTask = cron.schedule(task.cron, () => {
      this.executeTask(id);
    });

    this.tasks.set(id, scheduledTask);
    logger.log(`已调度: ${task.name} (${task.cron})`);
  }

  /**
   * 停止任务调度
   */
  private stopTask(id: string): void {
    const scheduledTask = this.tasks.get(id);
    if (scheduledTask) {
      scheduledTask.stop();
      this.tasks.delete(id);
    }
  }

  /**
   * 执行任务
   */
  private executeTask(id: string): void {
    const task = this.taskDefinitions.get(id);
    if (!task || !task.enabled) return;

    logger.log(`执行任务: ${task.name}`);

    // 更新最后执行时间
    task.lastRunAt = Date.now();
    this.persistTask(task);

    // 将任务推送到消息队列
    if (this.messageQueue) {
      const message: UserMessage = {
        id: generateMessageId(),
        type: 'user',
        conversationId: task.conversationId,
        userId: 'scheduler',
        username: '定时任务',
        content: task.prompt,
        metadata: {
          timestamp: Date.now(),
          source: 'scheduler',
        },
      };

      this.messageQueue.enqueue(message, 'normal');
      logger.log(`任务 ${task.name} 已入队`);
    } else {
      logger.warn(`消息队列未设置，任务 ${task.name} 无法执行`);
    }
  }

  /**
   * 持久化任务到存储
   */
  private persistTask(task: SchedulerTask): void {
    if (!this.storage) return;
    const db = this.storage.getDb();
    if (!db) return;

    try {
      db.prepare(
        `
        INSERT OR REPLACE INTO scheduler_tasks (id, name, cron, prompt, conversationId, enabled, createdAt, lastRunAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `
      ).run(
        task.id,
        task.name,
        task.cron,
        task.prompt,
        task.conversationId,
        task.enabled ? 1 : 0,
        task.createdAt,
        task.lastRunAt || null
      );
    } catch (error) {
      logger.error('持久化任务失败:', error);
    }
  }

  /**
   * 停止所有任务
   */
  stop(): void {
    for (const [id] of this.tasks) {
      this.stopTask(id);
    }
    logger.log('调度器已停止');
  }

  /**
   * 获取调度器状态
   */
  getStatus(): {
    enabled: boolean;
    totalTasks: number;
    activeTasks: number;
    tasks: SchedulerTask[];
  } {
    return {
      enabled: this.config.enabled,
      totalTasks: this.taskDefinitions.size,
      activeTasks: this.tasks.size,
      tasks: this.listTasks(),
    };
  }
}
