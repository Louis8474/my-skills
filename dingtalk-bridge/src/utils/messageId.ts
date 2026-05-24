/**
 * 消息 ID 生成器
 * 使用简化版雪花算法生成分布式唯一 ID
 */

/**
 * 生成雪花 ID
 * 格式：timestamp(41bit) + machineId(10bit) + sequence(12bit)
 */
export class SnowflakeIdGenerator {
  private machineId: number;
  private sequence = 0;
  private lastTimestamp = -1;

  constructor(machineId?: number) {
    // 使用随机数或进程 PID 作为机器 ID
    this.machineId = machineId ?? Math.floor(Math.random() * 1024);
  }

  /**
   * 生成唯一 ID
   */
  generate(): string {
    let timestamp = this.timestamp();

    // 如果当前时间小于上次生成时间，等待
    while (timestamp < this.lastTimestamp) {
      timestamp = this.timestamp();
    }

    // 同一毫秒内序列号递增
    if (timestamp === this.lastTimestamp) {
      this.sequence = (this.sequence + 1) & 0xfff;
      if (this.sequence === 0) {
        // 序列号溢出，等待下一毫秒
        timestamp = this.waitNextMillis();
      }
    } else {
      this.sequence = 0;
    }

    this.lastTimestamp = timestamp;

    // 组合 ID
    const id = ((timestamp - this.epoch) << 22) | (this.machineId << 12) | this.sequence;

    return id.toString(36).toUpperCase();
  }

  /**
   * 获取当前时间戳（毫秒）
   */
  private timestamp(): number {
    return Date.now();
  }

  /**
   * 等待到下一毫秒
   */
  private waitNextMillis(): number {
    let ts = this.timestamp();
    while (ts <= this.lastTimestamp) {
      ts = this.timestamp();
    }
    return ts;
  }

  /**
   * 纪元时间（2024-01-01）
   */
  private epoch = 1704067200000;
}

/**
 * 生成短消息 ID
 * 格式：m_ + 时间戳 + 随机数
 */
export function generateMessageId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `m_${timestamp}${random}`;
}

/**
 * 生成对话 ID
 */
export function generateConversationId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `c_${timestamp}${random}`;
}

/**
 * 全局 ID 生成器实例（内部使用）
 */
const messageIdGenerator = new SnowflakeIdGenerator();

/**
 * 生成全局唯一的对话 ID
 */
export function generateUniqueId(prefix: string = 'id'): string {
  return `${prefix}_${messageIdGenerator.generate()}`;
}
