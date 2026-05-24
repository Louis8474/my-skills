/**
 * Agent 注册表 - 管理所有 AI Agent 实例
 */
import type { Agent } from './types';
import { createSafeLogger } from '../utils/logger';

const logger = createSafeLogger('AgentRegistry');

class AgentRegistry {
  private agents: Map<string, Agent> = new Map();
  private defaultAgent: string = '';

  register(agent: Agent, isDefault: boolean = false): void {
    if (this.agents.has(agent.name)) {
      logger.warn(`Agent "${agent.name}" 已注册，将覆盖`);
    }
    this.agents.set(agent.name, agent);
    if (isDefault || this.agents.size === 1) {
      this.defaultAgent = agent.name;
    }
    logger.log(`Agent "${agent.name}" (${agent.type}) 已注册${isDefault ? ' (默认)' : ''}`);
  }

  get(name: string): Agent | undefined {
    return this.agents.get(name);
  }

  getDefault(): Agent | undefined {
    return this.agents.get(this.defaultAgent);
  }

  getDefaultName(): string {
    return this.defaultAgent;
  }

  setDefault(name: string): boolean {
    if (this.agents.has(name)) {
      this.defaultAgent = name;
      return true;
    }
    return false;
  }

  list(): Array<{ name: string; type: string }> {
    return Array.from(this.agents.values()).map(a => ({ name: a.name, type: a.type }));
  }

  get size(): number {
    return this.agents.size;
  }

  unregister(name: string): boolean {
    if (name === this.defaultAgent && this.agents.size > 1) {
      // 如果删除的是默认 Agent，切换到第一个
      const remaining = Array.from(this.agents.keys()).filter(n => n !== name);
      if (remaining.length > 0) {
        this.defaultAgent = remaining[0];
      } else {
        this.defaultAgent = '';
      }
    } else if (name === this.defaultAgent) {
      this.defaultAgent = '';
    }
    return this.agents.delete(name);
  }
}

// 全局单例
export const agentRegistry = new AgentRegistry();
export { AgentRegistry };
