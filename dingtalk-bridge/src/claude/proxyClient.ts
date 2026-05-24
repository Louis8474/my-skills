/**
 * Claude Proxy 客户端
 *
 * 功能：
 * - 连接 Proxy 进程（Unix Socket / Named Pipe）
 * - 解析 Claude CLI 的 JSON 流事件
 * - 格式化工具调用和结果
 * - 自动启动 Proxy 进程（如果不存在）
 */

import { spawn, execSync } from 'child_process';
import { createHash } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as net from 'net';

import { formatToolCall, formatToolResult } from '../utils/toolFormatter';
import { createSafeLogger } from '../utils/logger';

const logger = createSafeLogger('ClaudeProxy');

// ==================== 类型定义 ====================

export interface StreamMessageOptions {
  messages: { role: string; content: string }[];
  onChunk: (chunk: string) => Promise<void>;
  onComplete: () => Promise<void>;
  onError?: (error: Error) => Promise<void>;
  onImage?: (filePath: string) => Promise<void>;
}

export interface ClaudeStreamEvent {
  type: string;
  subtype?: string;
  message?: {
    content?: Array<{
      type: string;
      id?: string;
      text?: string;
      name?: string;
      input?: Record<string, unknown>;
      tool_use_id?: string;
      content?: unknown;
      is_error?: boolean;
    }>;
  };
  content?: string;
  text?: string;
  is_error?: boolean;
  duration_ms?: number;
  num_turns?: number;
  total_cost_usd?: number;
}

interface PendingRequest {
  resolve: () => void;
  reject: (err: Error) => void;
  onChunk: (chunk: string) => Promise<void>;
  onComplete: () => Promise<void>;
  onError?: (error: Error) => Promise<void>;
  onImage?: (filePath: string) => Promise<void>;
  timeoutTimer: NodeJS.Timeout;
}

interface ToolUseInfo {
  name: string;
  input: Record<string, unknown>;
}

// ==================== 工具方法 ====================

function generateUUIDFromString(str: string): string {
  const hash = createHash('sha256').update(str).digest('hex');
  return `${hash.substring(0, 8)}-${hash.substring(8, 12)}-4${hash.substring(13, 16)}-${hash.substring(16, 20)}-${hash.substring(20, 32)}`;
}

// ==================== 格式化方法 ====================

const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp']);

function formatResultStats(event: ClaudeStreamEvent): string {
  const parts: string[] = [];
  if (event.num_turns) parts.push(`${event.num_turns} turns`);
  if (event.duration_ms) parts.push(`${(event.duration_ms / 1000).toFixed(1)}s`);
  if (event.total_cost_usd) parts.push(`$${event.total_cost_usd.toFixed(4)}`);
  if (parts.length === 0) return '';
  return `\n\n*⏱ ${parts.join(' · ')}*`;
}

/** 默认响应超时（毫秒） */
const RESPONSE_TIMEOUT_MS = 60 * 60 * 1000; // 60 分钟

// ==================== 主类 ====================

export class ClaudeProxyClient {
  private processName: string;
  private sessionId: string;
  private socket: net.Socket | null = null;
  private buffer: string = '';
  private pendingRequest: PendingRequest | null = null;
  private connected: boolean = false;
  private toolUseMap: Map<string, ToolUseInfo> = new Map();
  private lastEventWasTool: boolean = false;

  constructor(processName: string = 'default', sessionId?: string) {
    this.processName = processName;
    this.sessionId = sessionId || generateUUIDFromString(processName);
    logger.info('ClaudeProxyClient created', { processName, sessionId: this.sessionId });
  }

  private get pipePath(): string {
    const isWindows = os.platform() === 'win32';
    return isWindows
      ? `\\\\.\\pipe\\claude-bot-${this.processName}`
      : path.join(os.tmpdir(), `claude-bot-${this.processName}.sock`);
  }

  private get pidFile(): string {
    return path.join(os.tmpdir(), `claude-proxy-${this.processName}.pid`);
  }

  private isProxyAlive(): boolean {
    try {
      if (!fs.existsSync(this.pidFile)) return false;
      const pid = parseInt(fs.readFileSync(this.pidFile, 'utf-8').trim());
      if (isNaN(pid)) return false;
      process.kill(pid, 0);
      return true;
    } catch {
      logger.debug('进程不存在或无权限');
      return false;
    }
  }

  private startProxy(): void {
    if (this.isProxyAlive()) {
      logger.info('Proxy already running', { processName: this.processName });
      return;
    }

    logger.info('Starting Claude proxy...', {
      processName: this.processName,
      sessionId: this.sessionId,
    });

    const jsProxy = path.join(process.cwd(), 'proxy.js');

    let args: string[];
    if (fs.existsSync(jsProxy)) {
      args = [jsProxy, this.processName, this.sessionId];
    } else {
      logger.error('Proxy script not found', { jsProxy });
      throw new Error('Proxy script not found');
    }

    const child = spawn(process.execPath, args, {
      detached: true,
      stdio: 'ignore',
      cwd: process.cwd(),
      windowsHide: true,
    });
    child.unref();

    logger.info('Proxy process spawned', { pid: child.pid, processName: this.processName });
  }

  private connectToProxy(): Promise<void> {
    return new Promise((resolve, reject) => {
      const socket = net.connect(this.pipePath);
      let resolved = false;

      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          socket.destroy();
          reject(new Error('Connection timeout'));
        }
      }, 5000);

      socket.on('connect', () => {
        if (resolved) return;
        resolved = true;
        clearTimeout(timeout);

        this.socket = socket;
        this.connected = true;
        this.buffer = '';

        socket.on('data', (data: Buffer) => {
          this.handleData(data.toString());
        });

        socket.on('close', () => {
          logger.warn('Disconnected from Claude proxy');
          this.connected = false;
          this.socket = null;

          if (this.pendingRequest) {
            const pending = this.pendingRequest;
            this.pendingRequest = null;
            clearTimeout(pending.timeoutTimer);
            pending.reject(new Error('Proxy connection lost'));
          }
        });

        socket.on('error', err => {
          logger.error('Socket error', { error: err.message });
        });

        logger.info('Connected to Claude proxy', {
          processName: this.processName,
          pipePath: this.pipePath,
        });
        resolve();
      });

      socket.on('error', err => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          reject(err);
        }
      });
    });
  }

  async connect(): Promise<boolean> {
    try {
      await this.connectToProxy();
      logger.info('Connected to existing proxy');
      return true;
    } catch {
      logger.info('No existing proxy found, starting one...');
    }

    this.startProxy();

    const maxRetries = 5;
    for (let i = 0; i < maxRetries; i++) {
      const delay = 2000 + i * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
      try {
        await this.connectToProxy();
        logger.info('Connected to proxy after starting it');
        return true;
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        logger.debug(`Connection attempt ${i + 1}/${maxRetries} failed`, { error: message });
      }
    }

    logger.error('Failed to connect to Claude proxy after all retries');
    return false;
  }

  private async ensureConnected(): Promise<boolean> {
    if (this.connected && this.socket && !this.socket.destroyed) {
      return true;
    }
    logger.info('Connection lost, reconnecting...');
    return this.connect();
  }

  private handleData(rawData: string): void {
    this.buffer += rawData;

    const lines = this.buffer.split('\n');
    this.buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.trim()) continue;

      let msg: ClaudeStreamEvent;
      try {
        msg = JSON.parse(line) as ClaudeStreamEvent;
      } catch {
        logger.debug('无法解析代理输出行，跳过');
        continue;
      }

      logger.debug('Event', { type: msg.type, subtype: msg.subtype });

      const pending = this.pendingRequest;

      switch (msg.type) {
        case 'system':
          if (msg.subtype === 'init') {
            logger.info('Claude initialized');
          }
          break;

        case 'assistant':
          if (!msg.message?.content) break;
          for (const block of msg.message.content) {
            if (block.type === 'text' && block.text) {
              if (pending?.onChunk) {
                if (this.lastEventWasTool) {
                  pending.onChunk('\n\n---\n\n');
                  this.lastEventWasTool = false;
                }
                pending.onChunk(block.text);
              }
            } else if (block.type === 'tool_use' && block.name) {
              logger.info('Tool call', { tool: block.name, toolUseId: block.id });

              if (block.id) {
                this.toolUseMap.set(block.id, {
                  name: block.name,
                  input: block.input || {},
                });
              }

              const formatted = formatToolCall(block.name, block.input || {});
              if (pending?.onChunk) {
                pending.onChunk(formatted);
              }
              this.lastEventWasTool = true;
            }
          }
          break;

        case 'user':
          if (!msg.message?.content) break;
          for (const block of msg.message.content) {
            if (block.type === 'tool_result' && block.tool_use_id) {
              const toolInfo = this.toolUseMap.get(block.tool_use_id);
              const toolName = toolInfo?.name || 'unknown';

              logger.info('Tool result', {
                tool: toolName,
                toolUseId: block.tool_use_id,
                isError: block.is_error,
              });

              if (block.is_error) {
                const errContent =
                  typeof block.content === 'string' ? block.content : JSON.stringify(block.content);
                const formatted = `\n\n> ❌ ${errContent.substring(0, 500)}`;
                if (pending?.onChunk) {
                  pending.onChunk(formatted);
                }
                break;
              }

              const formatted = formatToolResult(toolName, block.content);
              if (formatted && pending?.onChunk) {
                pending.onChunk(formatted);
              }

              if (!block.is_error && toolInfo && pending?.onImage) {
                let imagePath: string | null = null;

                if (toolName === 'Write') {
                  const fp = (toolInfo.input.file_path as string) || '';
                  const ext = path.extname(fp).toLowerCase();
                  if (IMAGE_EXTENSIONS.has(ext)) imagePath = fp;
                } else if (toolName === 'Bash') {
                  const cmd = (toolInfo.input.command as string) || '';
                  const output = typeof block.content === 'string' ? block.content : '';
                  const combined = cmd + '\n' + output;
                  // 匹配包含路径分隔符的图片路径，避免误匹配纯文件名
                  const imgMatch = combined.match(
                    /(?:[A-Za-z]:[\\/]|[/~][\w.\-\\/]+)[\w.\-\\/]*\.(?:png|jpg|jpeg|gif|bmp|webp)\b/i
                  );
                  if (imgMatch) {
                    imagePath = imgMatch[0].replace(/\\/g, '/');
                  }
                } else if (
                  toolName.startsWith('mcp__playwright__browser_take_screenshot') ||
                  toolName.startsWith('mcp__computer_use__')
                ) {
                  const fp = (toolInfo.input.path as string) || '';
                  if (fp) imagePath = fp;
                }

                if (imagePath) {
                  logger.info('Image file detected', { tool: toolName, filePath: imagePath });
                  pending.onImage(imagePath).catch((e: unknown) => {
                    const message = e instanceof Error ? e.message : String(e);
                    logger.error('onImage callback failed', { error: message });
                  });
                }
              }
            }
          }
          break;

        case 'result':
          logger.info('Response complete');
          if (pending) {
            const stats = formatResultStats(msg);
            if (stats && pending.onChunk) {
              pending.onChunk(stats);
            }
            if (pending.onComplete) pending.onComplete();
            clearTimeout(pending.timeoutTimer);
            pending.resolve();
            this.pendingRequest = null;
          }
          break;

        case 'error': {
          const errorMsg = msg.content || msg.text || 'Unknown error';
          logger.error('Claude error', { error: errorMsg });
          if (pending) {
            clearTimeout(pending.timeoutTimer);
            if (pending.onError) pending.onError(new Error(errorMsg));
            pending.reject(new Error(errorMsg));
            this.pendingRequest = null;
          }
          break;
        }

        default:
          logger.debug('Unknown event type', { type: msg.type });
      }
    }
  }

  async sendMessage(options: StreamMessageOptions): Promise<void> {
    const { messages, onChunk, onComplete, onError, onImage } = options;
    const userMessage = messages[messages.length - 1]?.content || '';

    logger.info('========================================');
    logger.info('User message', { message: userMessage.substring(0, 100) });

    const ok = await this.ensureConnected();
    if (!ok) {
      const err = new Error('Failed to connect to Claude proxy');
      if (onError) await onError(err);
      await onComplete();
      return;
    }

    if (this.pendingRequest) {
      // 旧请求尚未完成，先拒绝
      const old = this.pendingRequest;
      this.pendingRequest = null;
      clearTimeout(old.timeoutTimer);
      old.reject(new Error('Request superseded by new message'));
    }

    this.toolUseMap.clear();
    this.lastEventWasTool = false;

    await this.sendToProxyInternal(userMessage, onChunk, onComplete, onError, onImage);
  }

  private sendToProxyInternal(
    content: string,
    onChunk: (chunk: string) => Promise<void>,
    onComplete: () => Promise<void>,
    onError?: (error: Error) => Promise<void>,
    onImage?: (filePath: string) => Promise<void>
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket || this.socket.destroyed) {
        reject(new Error('Not connected to proxy'));
        return;
      }

      // 超时定时器
      const timeoutTimer = setTimeout(() => {
        if (this.pendingRequest) {
          const pending = this.pendingRequest;
          this.pendingRequest = null;
          const timeoutError = new Error('Response timeout after 60 minutes');
          if (pending.onError) pending.onError(timeoutError);
          pending.reject(timeoutError);
        }
      }, RESPONSE_TIMEOUT_MS);

      this.pendingRequest = {
        resolve,
        reject,
        onChunk,
        onComplete,
        onError,
        onImage,
        timeoutTimer,
      };

      const payload = JSON.stringify({
        type: 'user',
        message: { role: 'user', content: content },
      });
      logger.debug('Sending message', { content: content.substring(0, 50) });

      this.socket.write(payload + '\n');
    });
  }

  disconnect(): void {
    if (this.socket && !this.socket.destroyed) {
      this.socket.destroy();
    }
    this.socket = null;
    this.connected = false;
    if (this.pendingRequest) {
      clearTimeout(this.pendingRequest.timeoutTimer);
      this.pendingRequest = null;
    }
    this.toolUseMap.clear();
    logger.info('Disconnected from proxy (proxy still running)');
  }

  stopProxy(): void {
    this.disconnect();
    try {
      if (fs.existsSync(this.pidFile)) {
        const pid = parseInt(fs.readFileSync(this.pidFile, 'utf-8').trim());
        if (!isNaN(pid)) {
          const isWindows = os.platform() === 'win32';
          if (isWindows) {
            execSync(`taskkill /PID ${pid} /T /F`, { timeout: 5000 });
          } else {
            process.kill(pid, 'SIGTERM');
          }
          logger.info('Proxy process stopped', { processName: this.processName, pid });
        }
        fs.unlinkSync(this.pidFile);
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      logger.debug('stopProxy cleanup error', { error: message });
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  getProxyInfo(): {
    processName: string;
    sessionId: string;
    connected: boolean;
    proxyAlive: boolean;
  } {
    return {
      processName: this.processName,
      sessionId: this.sessionId,
      connected: this.connected,
      proxyAlive: this.isProxyAlive(),
    };
  }
}
