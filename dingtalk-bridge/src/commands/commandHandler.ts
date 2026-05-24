/**
 * 命令处理器 - 处理解析后的命令并返回响应
 */
import { ParsedCommand, COMMANDS, CommandName } from './commandParser';
import { SessionManager } from '../session-manager';
import { MessageQueue } from '../message-queue/messageQueue';
import { config } from '../config';

export interface CommandDeps {
  sessionManager: SessionManager;
  messageQueue: MessageQueue;
  aiProviderStatus?: { opencode: boolean; claude: boolean };
  stopSession?: (conversationId: string) => Promise<boolean>;
  resetSession?: (conversationId: string) => Promise<boolean>;
}

export class CommandHandler {
  private deps: CommandDeps;

  constructor(deps: CommandDeps) {
    this.deps = deps;
  }

  /**
   * 处理命令，返回 markdown 格式的响应
   */
  async handle(parsed: ParsedCommand, userId: string, conversationId: string): Promise<string> {
    const { command, args } = parsed;

    if (!this.isValidCommand(command)) {
      return `❌ 未知命令：/${command}\n\n输入 /help 查看可用命令`;
    }

    switch (command) {
      case 'help':
        return this.handleHelp();
      case 'status':
        return this.handleStatus();
      case 'model':
        return this.handleModel(args);
      case 'mode':
        return this.handleMode(args);
      case 'history':
        return this.handleHistory(conversationId, args);
      case 'stop':
        return this.handleStop(conversationId);
      case 'list':
        return this.handleList(userId);
      case 'switch':
        return this.handleSwitch(userId, args);
      case 'queue':
        return this.handleQueue();
      case 'config':
        return this.handleConfig();
      case 'reset':
        return this.handleReset(conversationId);
      case 'new':
        return this.handleNew(conversationId);
      case 'remember':
        return this.handleRemember(args);
      default:
        return `❌ 未知命令：/${command}`;
    }
  }

  private isValidCommand(command: string): command is CommandName {
    return command in COMMANDS;
  }

  private handleHelp(): string {
    const lines = ['## 📋 可用命令\n'];
    for (const [name, def] of Object.entries(COMMANDS)) {
      lines.push(`- \`/${name}\` ${def.description}`);
    }
    return lines.join('\n');
  }

  private handleStatus(): string {
    const queueStatus = this.deps.messageQueue.getStatus();
    const provider = config.aiProvider;
    const aiStatus = this.deps.aiProviderStatus
      ? `\n- **OpenCode**: ${this.deps.aiProviderStatus.opencode ? '✅ 可用' : '❌ 不可用'}\n- **Claude Code**: ${this.deps.aiProviderStatus.claude ? '✅ 可用' : '❌ 不可用'}`
      : '';

    return [
      '## 📊 系统状态\n',
      `- **AI Provider**: ${provider}`,
      `- **队列等待**: ${queueStatus.queued}`,
      `- **队列处理中**: ${queueStatus.processing}`,
      `- **高优先级**: ${queueStatus.byPriority.high}`,
      `- **普通优先级**: ${queueStatus.byPriority.normal}`,
      `- **低优先级**: ${queueStatus.byPriority.low}`,
      aiStatus,
    ].join('\n');
  }

  private handleModel(args: string[]): string {
    if (args.length === 0) {
      return `## 🤖 当前模型\n\n- **Provider**: ${config.aiProvider}\n- **Model**: ${config.aiProvider === 'claude' ? config.claude.model : config.ai.model}`;
    }

    const newProvider = args[0].toLowerCase();
    if (newProvider !== 'opencode' && newProvider !== 'claude') {
      return '❌ 不支持的模型，可选：`opencode` 或 `claude`';
    }

    // 注意：运行时切换 provider 需要修改 config
    // 这里仅返回提示信息，实际切换需要重启服务或修改环境变量
    return `⚠️ 模型切换需要修改环境变量 AI_PROVIDER=${newProvider} 并重启服务\n\n当前: ${config.aiProvider}`;
  }

  private handleMode(args: string[]): string {
    const validModes = ['default', 'plan', 'auto-edit', 'full-auto'];

    if (args.length === 0) {
      return [
        '## 🔐 权限模式\n',
        '当前模式: **default**\n',
        '可用模式：',
        '- `default` — 默认权限（需确认才执行命令）',
        '- `plan` — 只读计划模式（不修改任何文件）',
        '- `auto-edit` — 自动编辑文件（不自动执行命令）',
        '- `full-auto` — 全自动（自动执行所有操作）\n',
        '使用 `/mode <模式名>` 切换',
      ].join('\n');
    }

    const newMode = args[0].toLowerCase();
    if (!validModes.includes(newMode)) {
      return `❌ 不支持的模式：${newMode}\n\n可用模式：${validModes.map(m => `\`${m}\``).join('、')}`;
    }

    // 注意：实际切换需要通过 Agent 接口的 ModeSwitcher 传递给 CLI
    // 当前版本仅记录意图，后续 Agent 抽象层集成后生效
    return `✅ 权限模式已设置为 **${newMode}**\n\n> ⚠️ 此功能需要等待 Agent 抽象层集成后完全生效，当前为预留接口`;
  }

  private async handleHistory(conversationId: string, args: string[]): Promise<string> {
    const limit = args.length > 0 ? parseInt(args[0], 10) || 5 : 5;
    const history = await this.deps.sessionManager.getHistory(conversationId, limit);

    if (history.length === 0) {
      return '📋 暂无对话历史';
    }

    const lines = [`## 📜 最近 ${history.length} 条对话\n`];
    for (const msg of history) {
      const role = msg.type === 'user' ? '👤' : '🤖';
      const content = msg.content.length > 100 ? msg.content.slice(0, 100) + '...' : msg.content;
      lines.push(`${role} ${content}`);
    }
    return lines.join('\n');
  }

  private async handleStop(conversationId: string): Promise<string> {
    if (!this.deps.stopSession) {
      return '❌ 停止功能未配置';
    }
    const stopped = await this.deps.stopSession(conversationId);
    if (stopped) {
      return '✅ 已终止当前会话的 AI 执行';
    }
    return '⚠️ 当前没有正在执行的任务';
  }

  private handleQueue(): string {
    const status = this.deps.messageQueue.getStatus();
    return [
      '## 📬 消息队列\n',
      `- **等待中**: ${status.queued}`,
      `- **处理中**: ${status.processing}`,
      `- **高优先级**: ${status.byPriority.high}`,
      `- **普通优先级**: ${status.byPriority.normal}`,
      `- **低优先级**: ${status.byPriority.low}`,
    ].join('\n');
  }

  private handleConfig(): string {
    // 脱敏配置
    const maskKey = (key: string | undefined): string => {
      if (!key) return '(未设置)';
      if (key.length <= 8) return '****';
      return key.slice(0, 4) + '****' + key.slice(-4);
    };

    return [
      '## ⚙️ 当前配置\n',
      `- **AI Provider**: ${config.aiProvider}`,
      `- **Gateway**: ${config.gateway.host}:${config.gateway.port}`,
      `- **Session TTL**: ${config.session.ttl / 1000}s`,
      `- **Max History**: ${config.session.maxHistoryMessages}`,
      `- **Queue Persistence**: ${config.messageQueue.enablePersistence ? '开启' : '关闭'}`,
      `- **Rate Limit**: ${config.messageQueue.rateLimitMaxTokens} tokens`,
      `- **Dingtalk AppKey**: ${maskKey(config.dingtalk.appKey)}`,
    ].join('\n');
  }

  private async handleReset(conversationId: string): Promise<string> {
    await this.deps.sessionManager.endSession(conversationId);
    return '✅ 会话已重置（内存清空，session 文件保留，下次可恢复上下文）';
  }

  private async handleNew(conversationId: string): Promise<string> {
    await this.deps.sessionManager.endSession(conversationId);
    if (this.deps.resetSession) {
      await this.deps.resetSession(conversationId);
    }
    return '✅ 会话已完全重置（内存 + session 文件均已清除，等价于全新对话）';
  }

  private async handleList(userId: string): Promise<string> {
    const sessions = await this.deps.sessionManager.getUserSessions(userId);

    if (sessions.length === 0) {
      return '📋 暂无会话记录';
    }

    const lines = [`## 📋 你的会话列表\n`];
    for (const s of sessions.slice(0, 10)) {
      const stateIcon = s.state === 'active' ? '🟢' : s.state === 'idle' ? '🟡' : '⚪';
      const ago = Math.round((Date.now() - s.lastActivityAt) / 60000);
      const msgCount = s.context?.metadata?.messageCount ?? 0;
      lines.push(
        `${stateIcon} \`${s.conversationId.slice(0, 8)}\` — ${msgCount} 条消息，${ago}min 前活跃`
      );
    }
    lines.push(`\n使用 \`/switch <id前缀>\` 切换会话`);
    return lines.join('\n');
  }

  private async handleSwitch(userId: string, args: string[]): Promise<string> {
    if (args.length === 0) {
      return '❌ 用法：/switch <会话ID前缀>\n\n使用 /list 查看可用会话';
    }

    const prefix = args[0];
    if (prefix.length < 8) {
      return '❌ 会话ID前缀至少需要 8 个字符，请使用 /list 查看完整ID';
    }

    const sessions = await this.deps.sessionManager.getUserSessions(userId);
    const target = sessions.find(s => s.conversationId.startsWith(prefix));

    if (!target) {
      return `❌ 未找到以 \`${prefix}\` 开头的会话\n\n使用 /list 查看可用会话`;
    }

    const switched = await this.deps.sessionManager.switchSession(userId, target.conversationId);
    if (switched) {
      return `✅ 已切换到会话 \`${switched.conversationId.slice(0, 8)}\`（${switched.context.metadata.messageCount} 条消息）`;
    }
    return '❌ 切换失败，该会话不可用';
  }

  private handleRemember(args: string[]): string {
    if (args.length < 2) {
      return '❌ 用法：/remember <key> <value>\n\n例如：/remember project_dir /path/to/project';
    }
    // 记忆功能由 memory 模块实现，这里仅返回提示
    return '⚠️ 记忆功能需要启用 memory 模块（feature/project-memory）\n\n当前版本暂不支持持久化记忆';
  }
}
