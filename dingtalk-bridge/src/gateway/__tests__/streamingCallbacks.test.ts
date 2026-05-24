/**
 * 流式处理回调边缘情况测试
 */
import axios from 'axios';
import {
  createMarkdownSender,
  createTextSender,
  createPersistentSessionCallbacks,
  createStreamChunkCallback,
} from '../streamingCallbacks';
import { DisplayFilter } from '../../display';
import type { DingtalkService } from '../../dingtalk/dingtalk';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

function createDingtalkStub(
  opts: {
    getAccessToken?: jest.Mock;
    sendMarkdownMessage?: jest.Mock;
    sendTextMessage?: jest.Mock;
  } = {}
): DingtalkService {
  return {
    getAccessToken: opts.getAccessToken ?? jest.fn().mockResolvedValue('token'),
    sendMarkdownMessage: opts.sendMarkdownMessage ?? jest.fn().mockResolvedValue(undefined),
    sendTextMessage: opts.sendTextMessage ?? jest.fn().mockResolvedValue(undefined),
  } as unknown as DingtalkService;
}

describe('createMarkdownSender', () => {
  beforeEach(() => {
    mockedAxios.post.mockReset();
  });

  it('uses sessionWebhook when provided', async () => {
    mockedAxios.post.mockResolvedValue({ data: { errcode: 0 } });
    const sender = createMarkdownSender(createDingtalkStub(), 'https://webhook.example/test');
    const ok = await sender('conv-1', 'title', 'body');
    expect(ok).toBe(true);
    expect(mockedAxios.post).toHaveBeenCalledWith(
      'https://webhook.example/test',
      expect.objectContaining({ msgtype: 'markdown' }),
      expect.any(Object)
    );
  });

  it('falls back to access token when webhook missing', async () => {
    const sendMarkdownMessage = jest.fn().mockResolvedValue(undefined);
    const sender = createMarkdownSender(createDingtalkStub({ sendMarkdownMessage }), undefined);
    const ok = await sender('conv-1', 't', 'b');
    expect(ok).toBe(true);
    expect(sendMarkdownMessage).toHaveBeenCalledWith('token', 't', 'b');
  });

  it('returns false on webhook failure (swallowed)', async () => {
    mockedAxios.post.mockRejectedValue(new Error('network down'));
    const sender = createMarkdownSender(createDingtalkStub(), 'https://webhook.example/test');
    await expect(sender('c', 't', 'b')).resolves.toBe(false);
  });

  it('returns false when fallback access token retrieval fails', async () => {
    const sender = createMarkdownSender(
      createDingtalkStub({ getAccessToken: jest.fn().mockRejectedValue(new Error('boom')) }),
      undefined
    );
    await expect(sender('c', 't', 'b')).resolves.toBe(false);
  });
});

describe('createTextSender', () => {
  beforeEach(() => {
    mockedAxios.post.mockReset();
  });

  it('sends text via webhook when available', async () => {
    mockedAxios.post.mockResolvedValue({ data: { errcode: 0 } });
    const sender = createTextSender(createDingtalkStub(), 'https://webhook.example/test');
    await expect(sender('c', 'hi')).resolves.toBe(true);
    expect(mockedAxios.post).toHaveBeenCalledWith(
      'https://webhook.example/test',
      expect.objectContaining({ msgtype: 'text', text: { content: 'hi' } }),
      expect.any(Object)
    );
  });

  it('falls back to access token when webhook missing', async () => {
    const sendTextMessage = jest.fn().mockResolvedValue(undefined);
    const sender = createTextSender(createDingtalkStub({ sendTextMessage }), undefined);
    await expect(sender('c', 'hi')).resolves.toBe(true);
    expect(sendTextMessage).toHaveBeenCalledWith('token', 'hi');
  });

  it('returns false when both paths fail', async () => {
    mockedAxios.post.mockRejectedValue(new Error('fail'));
    const sender = createTextSender(createDingtalkStub(), 'https://webhook.example/test');
    await expect(sender('c', 'x')).resolves.toBe(false);
  });
});

describe('createPersistentSessionCallbacks', () => {
  function makeHandle() {
    return { appendChunk: jest.fn().mockResolvedValue(undefined) };
  }

  it('appendChunk is called when filter shouldSend is true', async () => {
    const filter = new DisplayFilter('full');
    const handle = makeHandle();
    const cbs = createPersistentSessionCallbacks(filter, handle);
    await cbs.onText!('hello world');
    expect(handle.appendChunk).toHaveBeenCalled();
  });

  it('skips empty text without invoking appendChunk', async () => {
    const filter = new DisplayFilter('full');
    const handle = makeHandle();
    const cbs = createPersistentSessionCallbacks(filter, handle);
    await cbs.onText!('');
    expect(handle.appendChunk).not.toHaveBeenCalled();
  });

  it('onThinking suppressed in quiet mode', async () => {
    const filter = new DisplayFilter('quiet');
    const handle = makeHandle();
    const cbs = createPersistentSessionCallbacks(filter, handle);
    await cbs.onThinking!('inner thought');
    expect(handle.appendChunk).not.toHaveBeenCalled();
  });

  it('onToolUse passes tool name into filter', async () => {
    const filter = new DisplayFilter('full');
    const handle = makeHandle();
    const cbs = createPersistentSessionCallbacks(filter, handle);
    await cbs.onToolUse!('Bash', { command: 'ls' });
    expect(handle.appendChunk).toHaveBeenCalled();
  });
});

describe('createStreamChunkCallback', () => {
  it('forwards filtered content to appendChunk', async () => {
    const filter = new DisplayFilter('full');
    const appendChunk = jest.fn().mockResolvedValue(undefined);
    const cb = createStreamChunkCallback(filter, { appendChunk });
    await cb('chunk-data');
    expect(appendChunk).toHaveBeenCalledWith(expect.stringContaining('chunk-data'));
  });

  it('handles empty chunk gracefully', async () => {
    const filter = new DisplayFilter('full');
    const appendChunk = jest.fn().mockResolvedValue(undefined);
    const cb = createStreamChunkCallback(filter, { appendChunk });
    await cb('');
    expect(appendChunk).not.toHaveBeenCalled();
  });
});
