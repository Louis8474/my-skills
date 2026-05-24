/**
 * 消息路由器 - 根据规则将消息路由到不同的 AI Provider
 */
import { randomUUID } from 'crypto';
import { AIProvider, ProviderRegistry } from './provider';
import { createSafeLogger } from '../utils/logger';

const logger = createSafeLogger('Router');

export type RoutingCondition =
  | { type: 'keyword'; keywords: string[]; match: 'any' | 'all' | 'prefix' }
  | { type: 'user'; userIds: string[] }
  | { type: 'conversation'; conversationIds: string[] }
  | { type: 'regex'; pattern: string }
  | { type: 'default' };

export interface RoutingRule {
  id: string;
  name: string;
  enabled: boolean;
  priority: number;
  condition: RoutingCondition;
  provider: string;
}

export class MessageRouter {
  private rules: RoutingRule[] = [];
  private registry: ProviderRegistry;

  constructor(registry: ProviderRegistry) {
    this.registry = registry;
  }

  addRule(rule: Omit<RoutingRule, 'id'>): RoutingRule {
    const newRule: RoutingRule = {
      ...rule,
      id: randomUUID(),
    };
    this.rules.push(newRule);
    this.rules.sort((a, b) => a.priority - b.priority);
    logger.log(
      `添加路由规则: ${newRule.name} (priority: ${newRule.priority}, provider: ${newRule.provider})`
    );
    return newRule;
  }

  removeRule(id: string): boolean {
    const index = this.rules.findIndex(r => r.id === id);
    if (index === -1) return false;
    const removed = this.rules.splice(index, 1)[0];
    logger.log(`移除路由规则: ${removed.name}`);
    return true;
  }

  listRules(): RoutingRule[] {
    return [...this.rules];
  }

  getRule(id: string): RoutingRule | undefined {
    return this.rules.find(r => r.id === id);
  }

  toggleRule(id: string): RoutingRule | null {
    const rule = this.rules.find(r => r.id === id);
    if (!rule) return null;
    rule.enabled = !rule.enabled;
    return rule;
  }

  route(message: string, userId: string, conversationId: string): AIProvider {
    for (const rule of this.rules) {
      if (!rule.enabled) continue;

      if (this.matchCondition(rule.condition, message, userId, conversationId)) {
        const provider = this.registry.get(rule.provider);
        if (provider && provider.enabled) {
          logger.log(`消息匹配规则 "${rule.name}"，路由到 Provider: ${provider.name}`);
          return provider;
        }
        logger.warn(`规则 "${rule.name}" 匹配但 Provider "${rule.provider}" 不可用，继续匹配`);
      }
    }

    const defaultProvider = this.registry.getDefault();
    logger.log(`无规则匹配，使用默认 Provider: ${defaultProvider.name}`);
    return defaultProvider;
  }

  private matchCondition(
    condition: RoutingCondition,
    message: string,
    userId: string,
    conversationId: string
  ): boolean {
    switch (condition.type) {
      case 'keyword': {
        const lowerMsg = message.toLowerCase();
        if (condition.match === 'any') {
          return condition.keywords.some(kw => lowerMsg.includes(kw.toLowerCase()));
        }
        if (condition.match === 'all') {
          return condition.keywords.every(kw => lowerMsg.includes(kw.toLowerCase()));
        }
        if (condition.match === 'prefix') {
          return condition.keywords.some(kw => lowerMsg.startsWith(kw.toLowerCase()));
        }
        return false;
      }

      case 'user':
        return condition.userIds.includes(userId);

      case 'conversation':
        return condition.conversationIds.includes(conversationId);

      case 'regex':
        try {
          return new RegExp(condition.pattern, 'i').test(message);
        } catch {
          logger.warn(`正则表达式无效: ${condition.pattern}`);
          return false;
        }

      case 'default':
        return true;

      default:
        return false;
    }
  }
}
