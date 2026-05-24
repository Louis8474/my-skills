/**
 * 钩子执行器 - 在生命周期事件触发时执行用户自定义动作
 */

/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { exec } from 'child_process';
import axios, { type Method } from 'axios';
import type { Hook, HookAction, HookContext, HookEvent } from './types';
import { createSafeLogger } from '../utils/logger';

const logger = createSafeLogger('Hooks');

class HookRunner {
  private hooks: Map<string, Hook> = new Map();

  /** 注册钩子 */
  register(hook: Hook): void {
    this.hooks.set(hook.id, hook);
    logger.log(`注册钩子: ${hook.id} (event: ${hook.event})`);
  }

  /** 注销钩子 */
  unregister(id: string): boolean {
    return this.hooks.delete(id);
  }

  /** 触发事件 - 执行所有匹配的钩子 */
  async trigger(event: HookEvent, context: HookContext = {}): Promise<void> {
    const matchingHooks = Array.from(this.hooks.values()).filter(
      h => h.event === event && h.enabled
    );

    if (matchingHooks.length === 0) return;

    logger.log(`触发事件: ${event}，匹配 ${matchingHooks.length} 个钩子`);

    for (const hook of matchingHooks) {
      const isAsync = hook.async !== false; // 默认异步

      try {
        if (isAsync) {
          // 异步执行，不等待结果
          this.executeAction(hook.action, context).catch(err => {
            logger.error(`钩子 ${hook.id} 执行失败:`, err.message);
          });
        } else {
          // 同步执行，等待结果
          await this.executeAction(hook.action, context);
        }
      } catch (error) {
        logger.error(`钩子 ${hook.id} 执行失败:`, error);
      }
    }
  }

  /** 执行钩子动作 */
  private async executeAction(action: HookAction, context: HookContext): Promise<void> {
    switch (action.type) {
      case 'shell':
        await this.executeShell(action.command, context);
        break;
      case 'http':
        await this.executeHttp(action, context);
        break;
    }
  }

  /** 执行 Shell 命令 */
  private executeShell(command: string, context: HookContext): Promise<void> {
    // 替换上下文变量
    let resolvedCommand = command;
    for (const [key, value] of Object.entries(context)) {
      resolvedCommand = resolvedCommand.replace(
        new RegExp(`\\{\\{${key}\\}\\}`, 'g'),
        typeof value === 'string' ? value : value != null ? JSON.stringify(value) : ''
      );
    }

    return new Promise((resolve, reject) => {
      exec(resolvedCommand, (error, stdout, _stderr) => {
        if (error) {
          reject(new Error(`Shell 执行失败: ${error.message}`));
          return;
        }
        if (stdout) {
          logger.log(`Shell 输出: ${stdout.substring(0, 200)}`);
        }
        resolve();
      });
    });
  }

  /** 执行 HTTP 请求 */
  private async executeHttp(
    action: { url: string; method: string; body?: string; headers?: Record<string, string> },
    context: HookContext
  ): Promise<void> {
    let resolvedBody = action.body || '';
    for (const [key, value] of Object.entries(context)) {
      resolvedBody = resolvedBody.replace(
        new RegExp(`\\{\\{${key}\\}\\}`, 'g'),
        typeof value === 'string' ? value : value != null ? JSON.stringify(value) : ''
      );
    }

    await axios({
      method: action.method,
      url: action.url,
      data: resolvedBody || undefined,
      headers: action.headers,
      timeout: 10000,
    });
  }

  /** 获取所有钩子 */
  list(): Hook[] {
    return Array.from(this.hooks.values());
  }

  /** 获取指定事件的钩子 */
  getByEvent(event: HookEvent): Hook[] {
    return Array.from(this.hooks.values()).filter(h => h.event === event);
  }

  /** 切换钩子启用状态 */
  toggle(id: string): boolean {
    const hook = this.hooks.get(id);
    if (hook) {
      hook.enabled = !hook.enabled;
      return true;
    }
    return false;
  }
}

// 全局单例
export const hookRunner = new HookRunner();
export { HookRunner };
