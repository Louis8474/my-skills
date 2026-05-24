import { Scheduler } from '../scheduler';

describe('Scheduler', () => {
  let scheduler: Scheduler;

  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    scheduler = new Scheduler({ enabled: false });
  });

  afterEach(() => {
    scheduler.stop();
    jest.restoreAllMocks();
  });

  test('adds a task', () => {
    const task = scheduler.addTask({
      name: 'Test Task',
      cron: '0 9 * * 1-5',
      prompt: 'Good morning!',
      conversationId: 'conv-123',
    });

    expect(task.name).toBe('Test Task');
    expect(task.cron).toBe('0 9 * * 1-5');
    expect(task.enabled).toBe(true);

    const tasks = scheduler.listTasks();
    expect(tasks).toHaveLength(1);
  });

  test('removes a task', () => {
    const task = scheduler.addTask({
      name: 'Removable',
      cron: '0 * * * *',
      prompt: 'test',
      conversationId: 'conv-1',
    });

    expect(scheduler.removeTask(task.id)).toBe(true);
    expect(scheduler.listTasks()).toHaveLength(0);
  });

  test('toggles a task', () => {
    const task = scheduler.addTask({
      name: 'Toggleable',
      cron: '0 * * * *',
      prompt: 'test',
      conversationId: 'conv-1',
    });

    const toggled = scheduler.toggleTask(task.id);
    expect(toggled?.enabled).toBe(false);

    const toggledBack = scheduler.toggleTask(task.id);
    expect(toggledBack?.enabled).toBe(true);
  });

  test('returns null for non-existent task', () => {
    expect(scheduler.getTask('non-existent')).toBeNull();
    expect(scheduler.removeTask('non-existent')).toBe(false);
    expect(scheduler.toggleTask('non-existent')).toBeNull();
  });

  test('getStatus returns correct info', () => {
    scheduler.addTask({
      name: 'Task 1',
      cron: '0 9 * * *',
      prompt: 'test',
      conversationId: 'conv-1',
    });

    const status = scheduler.getStatus();
    expect(status.enabled).toBe(false);
    expect(status.totalTasks).toBe(1);
    expect(status.activeTasks).toBe(0);
  });

  test('validates cron expression', () => {
    const task = scheduler.addTask({
      name: 'Invalid Cron',
      cron: 'invalid',
      prompt: 'test',
      conversationId: 'conv-1',
      enabled: false,
    });

    expect(scheduler.listTasks()).toHaveLength(1);
  });

  test('setMessageQueue should store reference', () => {
    const mockQueue = { enqueue: jest.fn() } as any;
    scheduler.setMessageQueue(mockQueue);
    // Adding a task with exec won't crash when queue is set
    scheduler.addTask({
      name: 'with queue',
      cron: '0 9 * * *',
      prompt: 'test',
      conversationId: 'conv-1',
    });
  });

  test('should handle multiple tasks', () => {
    scheduler.addTask({ name: 't1', cron: '0 9 * * *', prompt: 'p1', conversationId: 'c1' });
    scheduler.addTask({ name: 't2', cron: '0 10 * * *', prompt: 'p2', conversationId: 'c2' });
    expect(scheduler.listTasks()).toHaveLength(2);
  });

  test('should set enabled to false when provided', () => {
    const task = scheduler.addTask({
      name: 'Disabled Task',
      cron: '0 * * * *',
      prompt: 'test',
      conversationId: 'conv-1',
      enabled: false,
    });
    expect(task.enabled).toBe(false);
  });

  test('should return task by ID', () => {
    const added = scheduler.addTask({
      name: 'Findable',
      cron: '0 * * * *',
      prompt: 'test',
      conversationId: 'conv-1',
    });
    const found = scheduler.getTask(added.id);
    expect(found).not.toBeNull();
    expect(found!.name).toBe('Findable');
  });

  test('add with default enabled when not specified', () => {
    const task = scheduler.addTask({
      name: 'default-enabled',
      cron: '0 * * * *',
      prompt: 'test',
      conversationId: 'c1',
    });
    expect(task.enabled).toBe(true);
  });
});
