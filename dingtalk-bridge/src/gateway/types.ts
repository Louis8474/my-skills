/**
 * Gateway 类型定义
 * 集中管理 Gateway 模块的接口类型
 */
import type { SessionManager } from '../session-manager';
import type { MessageQueue } from '../message-queue/messageQueue';
import type { RateLimiter } from '../message-queue/rateLimiter';
import type { ConcurrencyController } from '../message-queue/concurrencyController';
import type { MessageDeduplicator } from '../utils/dedupCache';
import type { OpenCodeExecutor } from '../opencode';
import type { ClaudeCodeExecutor } from '../claude';
import type { MemoryManager } from '../memory';

/** Gateway 依赖接口 */
export interface GatewayDeps {
  sessionManager: SessionManager;
  messageQueue: MessageQueue;
  rateLimiter: RateLimiter;
  concurrencyController: ConcurrencyController;
  deduplicator: MessageDeduplicator;
  openCodeExecutor?: OpenCodeExecutor;
  claudeCodeExecutor?: ClaudeCodeExecutor;
  memoryManager?: MemoryManager;
}

/** Gateway 请求 */
export interface GatewayRequest {
  msg: string;
  userId?: string;
  userName?: string;
  conversationId?: string;
  sessionWebhook?: string;
  conversationType?: 'group' | 'user';
}

/** Gateway 响应 */
export interface GatewayResponse {
  success: boolean;
  message: string;
  data?: {
    result?: string;
    conversationId?: string;
    executionTime?: number;
    messageId?: string;
    streamingSent?: boolean;
  };
}
