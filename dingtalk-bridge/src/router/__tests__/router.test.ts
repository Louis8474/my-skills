import { ProviderRegistry } from '../provider';
import { MessageRouter } from '../router';
import type { AIProvider, RoutingRule } from '../index';

describe('ProviderRegistry', () => {
  let registry: ProviderRegistry;

  beforeEach(() => {
    registry = new ProviderRegistry();
  });

  const defaultProvider: AIProvider = {
    name: 'default',
    type: 'opencode',
    command: 'opencode',
    timeout: 120000,
    enabled: true,
  };

  const claudeProvider: AIProvider = {
    name: 'claude',
    type: 'claude',
    command: 'claude',
    timeout: 120000,
    enabled: true,
  };

  test('registers and retrieves providers', () => {
    registry.register(defaultProvider);
    expect(registry.get('default')).toEqual(defaultProvider);
    expect(registry.size()).toBe(1);
  });

  test('unregisters providers', () => {
    registry.register(defaultProvider);
    expect(registry.unregister('default')).toBe(true);
    expect(registry.get('default')).toBeUndefined();
    expect(registry.size()).toBe(0);
  });

  test('lists all providers', () => {
    registry.register(defaultProvider);
    registry.register(claudeProvider);
    expect(registry.list()).toHaveLength(2);
  });

  test('getDefault returns first registered when no default set', () => {
    registry.register(defaultProvider);
    expect(registry.getDefault().name).toBe('default');
  });

  test('setDefault changes default provider', () => {
    registry.register(defaultProvider);
    registry.register(claudeProvider);
    registry.setDefault('claude');
    expect(registry.getDefault().name).toBe('claude');
  });

  test('setDefault throws for unknown provider', () => {
    expect(() => registry.setDefault('unknown')).toThrow('not found');
  });

  test('getDefault throws when no providers registered', () => {
    expect(() => registry.getDefault()).toThrow('No AI providers registered');
  });
});

describe('MessageRouter', () => {
  let registry: ProviderRegistry;
  let router: MessageRouter;

  beforeEach(() => {
    registry = new ProviderRegistry();
    registry.register({
      name: 'default',
      type: 'opencode',
      command: 'opencode',
      timeout: 120000,
      enabled: true,
    });
    registry.register({
      name: 'claude',
      type: 'claude',
      command: 'claude',
      timeout: 120000,
      enabled: true,
    });
    router = new MessageRouter(registry);
  });

  test('routes to default when no rules', () => {
    const provider = router.route('hello', 'user1', 'conv1');
    expect(provider.name).toBe('default');
  });

  test('routes by keyword (any match)', () => {
    router.addRule({
      name: 'Code questions to Claude',
      enabled: true,
      priority: 1,
      condition: { type: 'keyword', keywords: ['代码', 'code', '编程'], match: 'any' },
      provider: 'claude',
    });

    const provider = router.route('帮我写代码', 'user1', 'conv1');
    expect(provider.name).toBe('claude');
  });

  test('routes by keyword (all match)', () => {
    router.addRule({
      name: 'All keywords',
      enabled: true,
      priority: 1,
      condition: { type: 'keyword', keywords: ['代码', 'python'], match: 'all' },
      provider: 'claude',
    });

    expect(router.route('python 代码', 'user1', 'conv1').name).toBe('claude');
    expect(router.route('写代码', 'user1', 'conv1').name).toBe('default');
  });

  test('routes by keyword (prefix match)', () => {
    router.addRule({
      name: 'Prefix route',
      enabled: true,
      priority: 1,
      condition: { type: 'keyword', keywords: ['/claude'], match: 'prefix' },
      provider: 'claude',
    });

    expect(router.route('/claude 帮我写代码', 'user1', 'conv1').name).toBe('claude');
    expect(router.route('帮我 /claude 写代码', 'user1', 'conv1').name).toBe('default');
  });

  test('routes by user', () => {
    router.addRule({
      name: 'Admin uses Claude',
      enabled: true,
      priority: 1,
      condition: { type: 'user', userIds: ['admin-1', 'admin-2'] },
      provider: 'claude',
    });

    expect(router.route('hello', 'admin-1', 'conv1').name).toBe('claude');
    expect(router.route('hello', 'user-1', 'conv1').name).toBe('default');
  });

  test('routes by conversation', () => {
    router.addRule({
      name: 'Special conversation',
      enabled: true,
      priority: 1,
      condition: { type: 'conversation', conversationIds: ['conv-special'] },
      provider: 'claude',
    });

    expect(router.route('hello', 'user1', 'conv-special').name).toBe('claude');
    expect(router.route('hello', 'user1', 'conv-normal').name).toBe('default');
  });

  test('routes by regex', () => {
    router.addRule({
      name: 'Regex route',
      enabled: true,
      priority: 1,
      condition: { type: 'regex', pattern: '^/claude\\s' },
      provider: 'claude',
    });

    expect(router.route('/claude write code', 'user1', 'conv1').name).toBe('claude');
    expect(router.route('use /claude please', 'user1', 'conv1').name).toBe('default');
  });

  test('respects priority order', () => {
    router.addRule({
      name: 'Low priority',
      enabled: true,
      priority: 10,
      condition: { type: 'default' },
      provider: 'default',
    });
    router.addRule({
      name: 'High priority',
      enabled: true,
      priority: 1,
      condition: { type: 'keyword', keywords: ['urgent'], match: 'any' },
      provider: 'claude',
    });

    expect(router.route('urgent task', 'user1', 'conv1').name).toBe('claude');
  });

  test('skips disabled rules', () => {
    router.addRule({
      name: 'Disabled rule',
      enabled: false,
      priority: 1,
      condition: { type: 'keyword', keywords: ['code'], match: 'any' },
      provider: 'claude',
    });

    expect(router.route('write code', 'user1', 'conv1').name).toBe('default');
  });

  test('falls back when matched provider is disabled', () => {
    registry.register({
      name: 'disabled-provider',
      type: 'custom',
      command: 'custom',
      timeout: 120000,
      enabled: false,
    });

    router.addRule({
      name: 'Route to disabled',
      enabled: true,
      priority: 1,
      condition: { type: 'keyword', keywords: ['test'], match: 'any' },
      provider: 'disabled-provider',
    });

    expect(router.route('test message', 'user1', 'conv1').name).toBe('default');
  });

  test('removes rule', () => {
    const rule = router.addRule({
      name: 'Removable',
      enabled: true,
      priority: 1,
      condition: { type: 'keyword', keywords: ['code'], match: 'any' },
      provider: 'claude',
    });

    expect(router.removeRule(rule.id)).toBe(true);
    expect(router.listRules()).toHaveLength(0);
  });

  test('toggles rule', () => {
    const rule = router.addRule({
      name: 'Toggleable',
      enabled: true,
      priority: 1,
      condition: { type: 'keyword', keywords: ['code'], match: 'any' },
      provider: 'claude',
    });

    const toggled = router.toggleRule(rule.id);
    expect(toggled?.enabled).toBe(false);

    const toggledBack = router.toggleRule(rule.id);
    expect(toggledBack?.enabled).toBe(true);
  });

  test('returns null for non-existent rule', () => {
    expect(router.getRule('non-existent')).toBeUndefined();
    expect(router.removeRule('non-existent')).toBe(false);
    expect(router.toggleRule('non-existent')).toBeNull();
  });
});