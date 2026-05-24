# Runbook

## Deployment

### PM2 生产部署

```bash
# 构建
npm run build

# 启动（PM2）
pm2 start ecosystem.config.cjs

# 常用命令
pm2 status          # 查看进程状态
pm2 logs            # 查看日志
pm2 restart all     # 重启
pm2 stop all        # 停止
pm2 monit           # 实时监控
```

### 环境变量检查

启动前确认 `.env` 中已配置：

- `DINGTALK_APP_KEY` + `DINGTALK_APP_SECRET`（必填）
- `AI_PROVIDER`（必填：`opencode` 或 `claude`）
- `GATEWAY_PORT`（默认 3000）

## Health Checks

### HTTP 端点

| 端点                | 用途     | 预期响应                                |
| ------------------- | -------- | --------------------------------------- |
| `GET /health`       | 健康检查 | `200 { "status": "ok" }`                |
| `GET /api/status`   | 系统状态 | 200 + JSON（会话、队列、provider 信息） |
| `GET /api/doctor`   | 诊断检查 | 200 + JSON（配置检查、连接测试）        |
| `GET /api/queue`    | 队列状态 | 200 + JSON（队列长度、并发数）          |
| `GET /api/sessions` | 会话列表 | 200 + JSON（活跃会话）                  |

### 诊断命令

```bash
# 快速健康检查
curl http://localhost:3000/health

# 完整诊断
curl http://localhost:3000/api/doctor

# 队列状态
curl http://localhost:3000/api/queue
```

## Common Issues

### 1. 钉钉 Stream 连接断开

**症状**: 日志显示 `Stream disconnected` 或消息无响应

**排查**:

1. 检查 `DINGTALK_APP_KEY` / `DINGTALK_APP_SECRET` 是否正确
2. 检查网络连通性（钉钉 API 需要出站 HTTPS）
3. 查看 `STREAM_MAX_RECONNECT` 配置（默认 10 次）
4. 检查 PM2 日志：`pm2 logs --lines 100`

**修复**:

- Stream 模块自动重连，等待重连完成
- 如持续失败，重启进程：`pm2 restart all`

### 2. AI CLI 执行超时

**症状**: 消息长时间无回复，日志显示 timeout

**排查**:

1. 确认 AI CLI 已安装：`which claude` 或 `which opencode`
2. 检查 `CLAUDE_TIMEOUT` / `OPENCODE_TIMEOUT` 配置
3. 查看 `MQ_MAX_CONCURRENT_PER_USER` 和 `MQ_MAX_CONCURRENT_GLOBAL` 是否合理

**修复**:

- 增大超时值（如 `CLAUDE_TIMEOUT=300000`）
- 减少并发数避免 CLI 过载
- 检查 `CLAUDE_PERMISSION_MODE` 是否设为 `default`（需人工确认）

### 3. 流式卡片不更新

**症状**: AI Card 创建后内容不变化

**排查**:

1. 确认 `STREAMING_ENABLED=true`
2. 检查 `STREAMING_CARD_TEMPLATE_ID` 是否有效
3. 查看 Gateway 日志中 `onText callback fired` 是否出现
4. 检查 DisplayFilter 模式（`DISPLAY_MODE=quiet` 会缓冲文本）

**修复**:

- 验证卡片模板 ID 在钉钉开放平台是否有效
- 切换 `DISPLAY_MODE=compact` 调试
- 查看 `STREAMING_INTERVAL_MS` 和 `STREAMING_MIN_DELTA_CHARS` 是否合理

### 4. 消息队列堆积

**症状**: `/api/queue` 显示大量待处理消息

**排查**:

1. 检查并发限制是否过低
2. 查看 AI CLI 响应时间是否异常
3. 检查 `MQ_ENABLE_PERSISTENCE` 是否启用（重启后消息不丢失）

**修复**:

- 适当调高 `MQ_MAX_CONCURRENT_GLOBAL`
- 检查 AI CLI 进程是否卡死（`ps aux | grep claude`）
- 清理积压：`curl -X POST http://localhost:3000/api/test` 发送测试消息验证

### 5. 持久化会话冷启动

**症状**: 首条消息响应慢（>10s）

**排查**:

1. 确认 `PERSISTENT_SESSION_ENABLED=true`
2. 检查 `PERSISTENT_SESSION_MAX_SESSIONS` 配置
3. 查看日志中 `持久化会话池已启用` 信息

**修复**:

- 启用持久化会话池
- 调整 `PERSISTENT_SESSION_IDLE_TIMEOUT` 控制会话存活时间

## Rollback

```bash
# 1. 停止当前版本
pm2 stop all

# 2. 回退到上一版本
git log --oneline -5        # 找到目标 commit
git checkout <commit-hash>
npm run build

# 3. 重启
pm2 start ecosystem.config.cjs

# 4. 验证
curl http://localhost:3000/health
```

## Alerting

### 关键指标

| 指标         | 告警阈值  | 检查方式                   |
| ------------ | --------- | -------------------------- |
| 进程状态     | 非 online | `pm2 status`               |
| 内存使用     | > 512MB   | `pm2 monit`                |
| 队列长度     | > 100     | `GET /api/queue`           |
| 消息处理延迟 | > 30s     | `GET /api/status`          |
| Stream 连接  | 断开      | 日志 `Stream disconnected` |

### 告警通知

系统内置钉钉告警（`src/utils/alert.ts`），配置 `ADMIN_SESSION_WEBHOOK` 环境变量可接收告警推送。

## Useful Commands

```bash
# 查看实时日志
pm2 logs --raw

# 查看特定模块日志
pm2 logs --lines 200 | grep -i "stream\|error\|timeout"

# 检查 SQLite 数据库
sqlite3 ./data/dingtalk.db ".tables"
sqlite3 ./data/dingtalk.db "SELECT COUNT(*) FROM messages;"

# 清理过期会话
curl -X POST http://localhost:3000/api/memory/cleanup

# 重置所有会话（慎用）
# 通过钉钉发送 /reset 命令
```
