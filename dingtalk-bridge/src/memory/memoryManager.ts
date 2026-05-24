/**
 * 记忆管理器 - 高层记忆管理逻辑
 * 负责自动摘要、上下文注入和相关性搜索
 */
import {
  MemoryStore,
  MemoryEntry,
  MemoryCategory,
  CreateMemoryInput,
  MemoryFilter,
} from './memoryStore';
import { SessionManager } from '../session-manager/sessionManager';
import { createSafeLogger } from '../utils/logger';

const logger = createSafeLogger('Memory');

/**
 * 记忆管理器配置
 */
export interface MemoryManagerConfig {
  /** 是否启用自动摘要 */
  autoSummarizeEnabled: boolean;
  /** 触发自动摘要的消息数量阈值 */
  summarizeThreshold: number;
  /** 上下文注入时最多包含的记忆条数 */
  maxContextMemories: number;
  /** 自动摘要后删除原始对话记忆的保留天数 */
  autoMemoryMaxAge: number;
  /** 是否启用记忆强化（访问时提升相关性分数） */
  boostOnAccess: boolean;
  /** 记忆强化增量 */
  boostIncrement: number;
}

const DEFAULT_CONFIG: MemoryManagerConfig = {
  autoSummarizeEnabled: true,
  summarizeThreshold: 20,
  maxContextMemories: 10,
  autoMemoryMaxAge: 90 * 24 * 60 * 60 * 1000, // 90 days
  boostOnAccess: true,
  boostIncrement: 0.1,
};

/**
 * 记忆管理器
 * 提供高层记忆操作：自动摘要、上下文注入、相关性搜索
 */
export class MemoryManager {
  private store: MemoryStore;
  private sessionManager: SessionManager | null;
  private config: MemoryManagerConfig;
  /** 跟踪已自动摘要的会话消息数，避免重复摘要 */
  private summarizedCounts: Map<string, number>;

  constructor(
    store: MemoryStore,
    sessionManager?: SessionManager,
    config?: Partial<MemoryManagerConfig>
  ) {
    this.store = store;
    this.sessionManager = sessionManager ?? null;
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.summarizedCounts = new Map();
  }

  // ==================== CRUD 代理 ====================

  /**
   * 创建记忆条目
   */
  createMemory(input: CreateMemoryInput): MemoryEntry {
    return this.store.create(input);
  }

  /**
   * 获取记忆
   */
  getMemory(id: string): MemoryEntry | null {
    return this.store.getById(id);
  }

  /**
   * 按键获取记忆
   */
  getMemoryByKey(key: string): MemoryEntry | null {
    return this.store.getByKey(key);
  }

  /**
   * 搜索记忆
   */
  searchMemories(filter: MemoryFilter): MemoryEntry[] {
    return this.store.search(filter);
  }

  /**
   * 更新记忆
   */
  updateMemory(
    id: string,
    input: {
      key?: string;
      value?: string;
      category?: MemoryCategory;
      source?: 'auto' | 'manual';
      relevanceScore?: number;
    }
  ): MemoryEntry | null {
    return this.store.update(id, input);
  }

  /**
   * 删除记忆
   */
  deleteMemory(id: string): boolean {
    return this.store.delete(id);
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    total: number;
    byCategory: Record<MemoryCategory, number>;
    bySource: Record<'auto' | 'manual', number>;
  } {
    return this.store.getStats();
  }

  /**
   * 清理过期记忆
   */
  cleanup(): number {
    const removed = this.store.cleanup(this.config.autoMemoryMaxAge);
    // 同时清理已不存在会话的 summarizedCounts 条目
    this.cleanupSummarizedCounts();
    return removed;
  }

  /**
   * 清理已不存在会话的 summarizedCounts 条目
   */
  private cleanupSummarizedCounts(): void {
    if (!this.sessionManager) return;
    this.sessionManager
      .getAllSessions()
      .then(sessions => {
        const activeIds = new Set(sessions.map(s => s.conversationId));
        for (const key of this.summarizedCounts.keys()) {
          if (!activeIds.has(key)) {
            this.summarizedCounts.delete(key);
          }
        }
      })
      .catch(() => {
        // 静默失败，不影响主流程
      });
  }

  // ==================== 自动摘要 ====================

  /**
   * 检查并执行自动摘要
   * 在每次消息处理后调用，当会话消息数达到阈值时提取关键信息
   */
  async maybeSummarizeConversation(
    conversationId: string,
    _userId: string
  ): Promise<MemoryEntry | null> {
    if (!this.config.autoSummarizeEnabled || !this.sessionManager) {
      return null;
    }

    const history = await this.sessionManager.getHistory(conversationId);
    const messageCount = history.length;
    const lastSummarized = this.summarizedCounts.get(conversationId) ?? 0;

    // 仅在达到阈值且有新消息时触发
    if (messageCount < this.config.summarizeThreshold + lastSummarized) {
      return null;
    }

    const summary = this.extractKeyFacts(history);
    if (!summary) {
      return null;
    }

    // 存储摘要记忆
    const entry = this.store.create({
      key: `conversation_summary_${conversationId}`,
      value: summary,
      category: 'conversation',
      source: 'auto',
      relevanceScore: 0.5,
    });

    this.summarizedCounts.set(conversationId, messageCount);
    logger.log(`自动摘要已生成: conversationId=${conversationId}, messageCount=${messageCount}`);

    return entry;
  }

  /**
   * 从对话历史中提取关键事实
   * 基于规则的事实提取（无 LLM 依赖）
   */
  private extractKeyFacts(messages: Array<{ type: string; content: string }>): string | null {
    if (messages.length === 0) {
      return null;
    }

    const facts: string[] = [];

    // 提取技术栈相关信息
    const techKeywords = [
      'typescript',
      'javascript',
      'python',
      'go',
      'rust',
      'java',
      'react',
      'vue',
      'angular',
      'node',
      'express',
      'docker',
      'kubernetes',
      'aws',
      'azure',
      'gcp',
      'postgresql',
      'mysql',
      'mongodb',
      'redis',
      'sqlite',
      'rest',
      'graphql',
      'grpc',
    ];

    const userMessages = messages.filter(m => m.type === 'user');
    const aiMessages = messages.filter(m => m.type === 'ai');
    const allContent = messages
      .map(m => m.content)
      .join(' ')
      .toLowerCase();

    // 检测技术栈
    const detectedTechs = techKeywords.filter(tech => allContent.includes(tech));
    if (detectedTechs.length > 0) {
      facts.push(`技术栈涉及: ${detectedTechs.join(', ')}`);
    }

    // 提取用户偏好
    const preferencePatterns = [
      /我喜欢(.{2,30})/g,
      /请(不要|别)(.{2,30})/g,
      /默认使用(.{2,30})/g,
      /prefer\s+(.{2,30})/gi,
      /always\s+(.{2,30})/gi,
      /never\s+(.{2,30})/gi,
    ];

    for (const msg of userMessages) {
      for (const pattern of preferencePatterns) {
        const matches = msg.content.matchAll(pattern);
        for (const match of matches) {
          facts.push(`用户偏好: ${match[0]}`);
        }
      }
    }

    // 总结对话主题
    if (userMessages.length > 0) {
      const recentTopics = userMessages
        .slice(-5)
        .map(m => m.content.substring(0, 50))
        .join('; ');
      facts.push(`最近对话主题: ${recentTopics}`);
    }

    // 统计对话量
    facts.push(`对话统计: ${userMessages.length} 条用户消息, ${aiMessages.length} 条 AI 回复`);

    if (facts.length === 0) {
      return null;
    }

    return facts.join('\n');
  }

  // ==================== 上下文注入 ====================

  /**
   * 构建记忆上下文字符串，用于注入 AI 提示
   * 根据当前用户消息搜索最相关的记忆
   */
  buildMemoryContext(userMessage: string): string {
    const memories = this.store.searchByRelevance(userMessage, this.config.maxContextMemories);

    if (memories.length === 0) {
      return '';
    }

    // 记忆强化
    if (this.config.boostOnAccess) {
      for (const memory of memories) {
        this.store.boostRelevance(memory.id, this.config.boostIncrement);
      }
    }

    const lines = memories.map(m => {
      const categoryLabel = this.getCategoryLabel(m.category);
      return `[${categoryLabel}] ${m.key}: ${m.value}`;
    });

    return `## 项目记忆\n以下是与当前对话相关的项目信息，请在回答时参考：\n\n${lines.join('\n')}`;
  }

  /**
   * 获取分类标签
   */
  private getCategoryLabel(category: MemoryCategory): string {
    const labels: Record<MemoryCategory, string> = {
      project: '项目',
      conversation: '对话',
      preference: '偏好',
    };
    return labels[category] ?? category;
  }

  // ==================== 批量操作 ====================

  /**
   * 批量创建记忆（用于初始化项目上下文）
   */
  batchCreate(inputs: CreateMemoryInput[]): MemoryEntry[] {
    const entries: MemoryEntry[] = [];
    for (const input of inputs) {
      try {
        const entry = this.store.create(input);
        entries.push(entry);
      } catch (error) {
        logger.error(`批量创建记忆失败: key=${input.key}`, error);
      }
    }
    return entries;
  }

  /**
   * 获取指定分类的所有记忆
   */
  getByCategory(category: MemoryCategory): MemoryEntry[] {
    return this.store.search({ category });
  }

  /**
   * 获取手动添加的记忆
   */
  getManualMemories(): MemoryEntry[] {
    return this.store.search({ source: 'manual' });
  }

  /**
   * 获取自动生成的记忆
   */
  getAutoMemories(): MemoryEntry[] {
    return this.store.search({ source: 'auto' });
  }

  // ==================== 会话管理 ====================

  /**
   * 设置会话管理器（延迟绑定）
   */
  setSessionManager(sessionManager: SessionManager): void {
    this.sessionManager = sessionManager;
  }

  /**
   * 获取当前配置
   */
  getConfig(): MemoryManagerConfig {
    return { ...this.config };
  }

  /**
   * 更新配置
   */
  updateConfig(partial: Partial<MemoryManagerConfig>): void {
    this.config = { ...this.config, ...partial };
  }
}
