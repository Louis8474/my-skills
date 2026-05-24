/**
 * Gateway 流式处理回调
 * 将流式卡片的回调创建逻辑从 index.ts 提取出来
 */
import axios from 'axios';
import type { DingtalkService } from '../dingtalk/dingtalk';
import type { SessionCallbacks } from '../claude/session';
import { DisplayFilter } from '../display';
import { createSafeLogger } from '../utils/logger';

const logger = createSafeLogger('Gateway:Streaming');

/**
 * 创建流式卡片的 markdown 降级发送回调
 */
export function createMarkdownSender(
  dingtalkService: DingtalkService,
  sessionWebhook: string | undefined
): (convId: string, title: string, text: string) => Promise<boolean> {
  return async (_convId: string, title: string, text: string) => {
    try {
      if (sessionWebhook) {
        await axios.post(
          sessionWebhook,
          { msgtype: 'markdown', markdown: { title, text } },
          { timeout: 10000 }
        );
        return true;
      }
      const accessToken = await dingtalkService.getAccessToken();
      await dingtalkService.sendMarkdownMessage(accessToken, title, text);
      return true;
    } catch {
      return false;
    }
  };
}

/**
 * 创建流式卡片的文本降级发送回调
 */
export function createTextSender(
  dingtalkService: DingtalkService,
  sessionWebhook: string | undefined
): (convId: string, text: string) => Promise<boolean> {
  return async (_convId: string, text: string) => {
    try {
      if (sessionWebhook) {
        await axios.post(
          sessionWebhook,
          { msgtype: 'text', text: { content: text } },
          { timeout: 10000 }
        );
        return true;
      }
      const accessToken = await dingtalkService.getAccessToken();
      await dingtalkService.sendTextMessage(accessToken, text);
      return true;
    } catch {
      return false;
    }
  };
}

/**
 * 创建持久化会话的流式回调（onText/onThinking/onToolUse）
 */
export function createPersistentSessionCallbacks(
  displayFilter: DisplayFilter,
  streamHandle: { appendChunk: (text: string) => Promise<void> }
): SessionCallbacks {
  return {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    onText: async (text: string) => {
      logger.log(
        `[Gateway] onText callback fired: "${text.substring(0, 80).replace(/"/g, '\\"')}"`
      );
      const filtered = displayFilter.filter({ type: 'text', content: text });
      if (filtered.shouldSend && filtered.content) {
        logger.log(
          `[Gateway] onText: filtered.shouldSend=true, appending ${filtered.content.length} chars`
        );
        await streamHandle.appendChunk(filtered.content);
        logger.log(`onText: appendChunk done`);
      } else {
        logger.log(`onText: filtered.shouldSend=false, skipping`);
      }
    },
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    onThinking: async (text: string) => {
      const filtered = displayFilter.filter({ type: 'thinking', content: text });
      if (filtered.shouldSend && filtered.content) {
        await streamHandle.appendChunk(filtered.content);
      }
    },
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    onToolUse: async (name: string, input: Record<string, unknown>) => {
      const filtered = displayFilter.filter({
        type: 'tool_use',
        content: JSON.stringify(input).substring(0, 200),
        toolName: name,
      });
      if (filtered.shouldSend && filtered.content) {
        await streamHandle.appendChunk(filtered.content);
      }
    },
  };
}

/**
 * 创建非持久化会话的流式 chunk 回调（用于 Claude executeStream）
 */
export function createStreamChunkCallback(
  displayFilter: DisplayFilter,
  streamHandle: { appendChunk: (text: string) => Promise<void> }
): (chunk: string) => Promise<void> {
  return async (chunk: string) => {
    const filtered = displayFilter.filter({ type: 'text', content: chunk });
    if (filtered.shouldSend && filtered.content) {
      await streamHandle.appendChunk(filtered.content);
    }
  };
}
