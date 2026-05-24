/**
 * 告警通知模块测试
 */
import {
  setStreamService,
  updateAdminSessionWebhook,
  getAdminConversationId,
  sendAlert,
  notifyServiceStart,
  notifyServiceStop,
  notifyError,
  isAlertEnabled,
  getAlertConfig,
} from '../alert';

// Reset modules between tests to get fresh alert state
beforeEach(() => {
  jest.restoreAllMocks();
  // Clear env-based state by resetting modules
  jest.resetModules();
});

describe('sendAlert', () => {
  let mockStreamService: {
    sendTextMessage: jest.Mock;
    sendMarkdownMessage: jest.Mock;
  };

  beforeEach(() => {
    jest.resetModules();
    mockStreamService = {
      sendTextMessage: jest.fn().mockResolvedValue(true),
      sendMarkdownMessage: jest.fn().mockResolvedValue(true),
    };
  });

  it('should log only when alert is not enabled', async () => {
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const { sendAlert: send } = require('../alert');

    const result = await send('Test Title', 'Test Content', 'error');
    expect(result).toBe(false);
    expect(consoleLogSpy).toHaveBeenCalledWith('[Alert]', expect.stringContaining('告警未启用'));

    consoleLogSpy.mockRestore();
  });

  it('should cache alert when stream service is not bound', async () => {
    // Set ALERT_ADMIN_USER_ID to enable alerts
    process.env.ALERT_ADMIN_USER_ID = 'admin123';
    jest.resetModules();

    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const { sendAlert: send } = require('../alert');

    const result = await send('Test', 'Content', 'warning');
    expect(result).toBe(false);
    expect(consoleLogSpy).toHaveBeenCalledWith(
      '[Alert]',
      expect.stringContaining('Stream 服务未绑定')
    );

    consoleLogSpy.mockRestore();
    delete process.env.ALERT_ADMIN_USER_ID;
  });

  it('should cache alert when admin sessionWebhook is missing', async () => {
    process.env.ALERT_ADMIN_USER_ID = 'admin123';
    jest.resetModules();

    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const { sendAlert: send, setStreamService: setStream } = require('../alert');
    setStream(mockStreamService);

    const result = await send('Test', 'Content', 'info');
    expect(result).toBe(false);
    expect(consoleLogSpy).toHaveBeenCalledWith(
      '[Alert]',
      expect.stringContaining('管理员尚未发送消息')
    );

    consoleLogSpy.mockRestore();
    delete process.env.ALERT_ADMIN_USER_ID;
  });

  it('should send markdown message when everything is ready', async () => {
    process.env.ALERT_ADMIN_USER_ID = 'admin123';
    jest.resetModules();

    const {
      sendAlert: send,
      setStreamService: setStream,
      updateAdminSessionWebhook: updateWebhook,
    } = require('../alert');
    setStream(mockStreamService);
    updateWebhook('admin123', 'https://hook.example.com/session=test');

    const result = await send('Test Title', 'Test Content', 'error');
    expect(result).toBe(true);
    expect(mockStreamService.sendMarkdownMessage).toHaveBeenCalled();

    delete process.env.ALERT_ADMIN_USER_ID;
  });
});

describe('getAdminConversationId', () => {
  it('should return empty string when alert is not configured', () => {
    // Fresh require without env set
    jest.resetModules();
    const { getAdminConversationId: getAdminId } = require('../alert');
    expect(getAdminId()).toBe('');
  });
});

describe('isAlertEnabled', () => {
  it('should return false when alert is not enabled and stream is not bound', () => {
    jest.resetModules();
    const { isAlertEnabled: checkEnabled } = require('../alert');
    expect(checkEnabled()).toBe(false);
  });
});

describe('getAlertConfig', () => {
  it('should return a copy of alert config', () => {
    jest.resetModules();
    const { getAlertConfig: getConfig } = require('../alert');
    const config = getConfig();
    expect(config).toHaveProperty('enabled');
    expect(config).toHaveProperty('adminUserId');
    expect(config).toHaveProperty('adminSessionWebhook');
    expect(config).toHaveProperty('mentionUsers');
    expect(config).toHaveProperty('mentionAll');
  });
});
