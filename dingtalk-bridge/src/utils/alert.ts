/**
 * 告警通知模块
 * 在服务发生严重错误时通过 Stream 连接发送钉钉通知
 * 无需额外 webhook，复用现有 Stream 连接
 */
import { config } from '../config';
import { createSafeLogger } from './logger';

const logger = createSafeLogger('Alert');

// 告警配置
interface AlertConfig {
  enabled: boolean;
  adminUserId: string; // 管理员用户ID（接收告警的用户）
  adminSessionWebhook: string; // 管理员的 sessionWebhook（动态更新）
  mentionUsers: string[]; // @ 用户列表
  mentionAll: boolean; // @ 所有人
}

// 从环境变量读取告警配置
const alertConfig: AlertConfig = {
  enabled: !!process.env.ALERT_ADMIN_USER_ID,
  adminUserId: process.env.ALERT_ADMIN_USER_ID || '',
  adminSessionWebhook: '', // 动态更新
  mentionUsers: process.env.ALERT_MENTION_USERS?.split(',').filter(Boolean) || [],
  mentionAll: process.env.ALERT_MENTION_ALL === 'true',
};

// 打印告警配置（调试用）
if (alertConfig.enabled) {
  logger.log(
    `告警配置: adminUserId=${alertConfig.adminUserId}, mentionAll=${alertConfig.mentionAll}`
  );
}

// 待发送的告警队列（当 sessionWebhook 不可用时缓存）
const pendingAlerts: Array<{
  title: string;
  content: string;
  level: 'error' | 'warning' | 'info';
}> = [];

// 告警队列容量上限
const MAX_PENDING_ALERTS = 100;

/**
 * 将告警加入待发送队列（带容量保护）
 */
function enqueuePendingAlert(alert: {
  title: string;
  content: string;
  level: 'error' | 'warning' | 'info';
}): void {
  if (pendingAlerts.length >= MAX_PENDING_ALERTS) {
    pendingAlerts.shift(); // 丢弃最旧的告警
    logger.warn(`告警队列已满 (${MAX_PENDING_ALERTS})，丢弃最旧的告警`);
  }
  pendingAlerts.push(alert);
}

// Stream 服务引用（在启动时设置）
let streamService: {
  sendTextMessage: (
    conversationId: string,
    content: string,
    mentionList?: string[]
  ) => Promise<boolean>;
  sendMarkdownMessage: (conversationId: string, title: string, text: string) => Promise<boolean>;
} | null = null;

/**
 * 设置 Stream 服务引用（在服务启动时调用）
 */
export function setStreamService(service: typeof streamService): void {
  streamService = service;
  logger.log('Stream 服务已绑定，告警功能已启用');

  // 发送缓存的告警
  if (alertConfig.adminSessionWebhook && pendingAlerts.length > 0) {
    logger.log(`发送 ${pendingAlerts.length} 条缓存的告警...`);
    while (pendingAlerts.length > 0) {
      const alert = pendingAlerts.shift();
      if (alert) {
        sendAlert(alert.title, alert.content, alert.level).catch(err =>
          logger.warn('缓存告警发送失败:', err instanceof Error ? err.message : String(err))
        );
      }
    }
  }
}

/**
 * 更新管理员的 sessionWebhook（收到管理员消息时调用）
 */
export function updateAdminSessionWebhook(conversationId: string, sessionWebhook: string): void {
  if (
    conversationId === alertConfig.adminUserId ||
    conversationId.includes(alertConfig.adminUserId)
  ) {
    alertConfig.adminSessionWebhook = sessionWebhook;
    logger.log('管理员 sessionWebhook 已更新');

    // 发送缓存的告警
    if (pendingAlerts.length > 0) {
      logger.log(`发送 ${pendingAlerts.length} 条缓存的告警...`);
      while (pendingAlerts.length > 0) {
        const alert = pendingAlerts.shift();
        if (alert) {
          sendAlert(alert.title, alert.content, alert.level).catch(err =>
            logger.warn('缓存告警发送失败:', err instanceof Error ? err.message : String(err))
          );
        }
      }
    }
  }
}

/**
 * 获取管理员会话 ID（用于发送告警）
 */
export function getAdminConversationId(): string {
  return alertConfig.adminUserId;
}

/**
 * 发送告警消息
 */
export async function sendAlert(
  title: string,
  content: string,
  level: 'error' | 'warning' | 'info' = 'error'
): Promise<boolean> {
  const levelEmoji = {
    error: '🚨',
    warning: '⚠️',
    info: 'ℹ️',
  };

  const timestamp = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });

  const message =
    `## ${levelEmoji[level]} ${title}\n\n` +
    `**时间**: ${timestamp}\n\n` +
    `**级别**: ${level.toUpperCase()}\n\n` +
    `---\n\n` +
    `${content}\n\n` +
    (alertConfig.mentionAll ? '\n@所有人\n' : '') +
    (alertConfig.mentionUsers.length > 0
      ? `\n提醒: ${alertConfig.mentionUsers.map(u => `@${u}`).join(' ')}\n`
      : '');

  // 如果告警未启用，只记录日志
  if (!alertConfig.enabled) {
    logger.log(`告警未启用，仅记录: ${title}`);
    logger.log(`内容: ${content}`);
    return false;
  }

  // 如果 Stream 服务未绑定，缓存告警
  if (!streamService) {
    logger.log(`Stream 服务未绑定，缓存告警: ${title}`);
    enqueuePendingAlert({ title, content, level });
    return false;
  }

  // 如果没有 sessionWebhook，缓存告警并提示
  if (!alertConfig.adminSessionWebhook) {
    logger.log(`管理员尚未发送消息，缓存告警: ${title}`);
    logger.log(`提示: 管理员发送一条消息后将收到缓存的告警`);
    enqueuePendingAlert({ title, content, level });
    return false;
  }

  try {
    await streamService.sendMarkdownMessage(
      alertConfig.adminUserId,
      `${levelEmoji[level]} ${title}`,
      message
    );
    logger.log(`✅ 告警发送成功: ${title}`);
    return true;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error(`❌ 发送告警时发生错误: ${msg}`);
    // 发送失败，缓存告警
    enqueuePendingAlert({ title, content, level });
    return false;
  }
}

/**
 * 发送服务启动通知
 */
export async function notifyServiceStart(): Promise<void> {
  await sendAlert(
    '钉钉机器人服务启动',
    `**服务模式**: Stream 模式\n` +
      `**Gateway 端口**: ${config.gateway.port}\n` +
      `**AI 超时**: ${config.ai.timeout / 1000}秒\n` +
      `**会话 TTL**: ${config.session.ttl / 1000 / 60}分钟`,
    'info'
  );
}

/**
 * 发送服务停止通知
 */
export async function notifyServiceStop(reason: string): Promise<void> {
  await sendAlert(
    '钉钉机器人服务停止',
    `**原因**: ${reason}\n\n` + `服务正在停止，请检查是否需要手动重启。`,
    'warning'
  );
}

/**
 * 发送错误告警
 */
export async function notifyError(
  errorType: string,
  errorMessage: string,
  stack?: string
): Promise<void> {
  const content =
    `**错误类型**: ${errorType}\n\n` +
    `**错误信息**: \n\`\`\`\n${errorMessage.substring(0, 500)}\n\`\`\`\n\n` +
    (stack ? `**堆栈信息**:\n\`\`\`\n${stack.substring(0, 500)}...\n\`\`\`\n` : '');

  await sendAlert('服务异常', content, 'error');
}

/**
 * 检查告警是否启用
 */
export function isAlertEnabled(): boolean {
  return alertConfig.enabled && !!streamService;
}

/**
 * 获取告警配置
 */
export function getAlertConfig(): AlertConfig {
  return { ...alertConfig };
}
