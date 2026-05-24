/**
 * 互动卡片模块 - 构建和发送钉钉互动卡片消息
 */
import axios from 'axios';
import { createSafeLogger } from '../utils/logger';

const logger = createSafeLogger('Cards');

export interface CardButton {
  text: string;
  value: string;
  type?: 'primary' | 'default' | 'danger';
}

export interface CardConfig {
  title: string;
  content: string;
  buttons?: CardButton[];
  imageUrl?: string;
}

export interface CardCallbackData {
  conversationId: string;
  userId: string;
  action: string;
  cardId: string;
}

type CardCallbackFn = (data: CardCallbackData) => Promise<void>;

/**
 * 卡片构建器 - 构建钉钉互动卡片消息体
 */
export class CardBuilder {
  static createMarkdownCard(config: CardConfig): Record<string, unknown> {
    const text = config.imageUrl
      ? `![image](${config.imageUrl})\n\n${config.content}`
      : config.content;

    if (config.buttons && config.buttons.length === 1) {
      return {
        msgtype: 'actionCard',
        actionCard: {
          title: config.title,
          text,
          singleTitle: config.buttons[0].text,
          singleURL: `action://${config.buttons[0].value}`,
          btnOrientation: '0',
        },
      };
    }

    if (config.buttons && config.buttons.length > 1) {
      return {
        msgtype: 'actionCard',
        actionCard: {
          title: config.title,
          text,
          btnOrientation: '0',
          btns: config.buttons.map(btn => ({
            title: btn.text,
            actionURL: `action://${btn.value}`,
          })),
        },
      };
    }

    return {
      msgtype: 'markdown',
      markdown: {
        title: config.title,
        text,
      },
    };
  }

  static createActionCard(
    title: string,
    content: string,
    buttons: CardButton[]
  ): Record<string, unknown> {
    return CardBuilder.createMarkdownCard({ title, content, buttons });
  }

  static createConfirmCard(
    title: string,
    content: string,
    confirmText: string,
    cancelText: string
  ): Record<string, unknown> {
    return CardBuilder.createMarkdownCard({
      title,
      content,
      buttons: [
        { text: confirmText, value: 'confirm', type: 'primary' },
        { text: cancelText, value: 'cancel', type: 'default' },
      ],
    });
  }
}

/**
 * 卡片回调处理器 - 处理用户点击卡片按钮的回调
 */
export class CardCallbackHandler {
  private handlers: Map<string, CardCallbackFn> = new Map();
  private defaultHandler: CardCallbackFn | null = null;

  registerHandler(action: string, handler: CardCallbackFn): void {
    this.handlers.set(action, handler);
    logger.log(`Registered handler for action: ${action}`);
  }

  setDefaultHandler(handler: CardCallbackFn): void {
    this.defaultHandler = handler;
  }

  async handleCallback(data: CardCallbackData): Promise<void> {
    const handler = this.handlers.get(data.action);
    if (handler) {
      logger.log(`Handling action: ${data.action}`);
      await handler(data);
    } else if (this.defaultHandler) {
      logger.log(`Using default handler for action: ${data.action}`);
      await this.defaultHandler(data);
    } else {
      logger.warn(`No handler for action: ${data.action}`);
    }
  }

  removeHandler(action: string): void {
    this.handlers.delete(action);
  }

  listHandlers(): string[] {
    return Array.from(this.handlers.keys());
  }
}
