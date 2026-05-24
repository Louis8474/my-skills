# 钉钉机器人 + AI CLI 集成系统 - 使用指南

## 概述

本系统通过钉钉机器人实现与 AI CLI（OpenCode 或 Claude Code）的交互，在钉钉群聊中使用 AI 助手，支持多轮对话、聊天命令、项目记忆、媒体处理、多 Agent 路由、定时任务等生产级特性。

## 快速开始

### 1. 环境准备

- Node.js >= 18.0.0
- 至少安装以下之一：
  - OpenCode CLI: `npm install -g opencode`
  - Claude Code CLI: `brew install anthropic/claude/claude`

```bash
# 安装依赖
npm install

# 编译项目
npm run build
```

### 2. 配置环境变量

```bash
cp .env.example .env
```

**必填配置**：

```bash
# 钉钉配置
DINGTALK_APP_KEY=your_app_key
DINGTALK_APP_SECRET=your_app_secret
```

**选择 AI Provider**：

```bash
# 选择 AI CLI 类型: opencode 或 claude
AI_PROVIDER=opencode
```

**可选配置**：

```bash
# ========== AI Provider 配置 ==========
# OpenCode（默认）
OPENCODE_COMMAND=opencode          # 自定义命令
OPENCODE_TIMEOUT=120000            # 超时(毫秒)
OPENCODE_MAX_RETRIES=3             # 最大重试次数
OPENCODE_MODEL=                    # 模型名称，留空使用CLI默认
OPENCODE_WORKING_DIR=/path/to/dir  # 工作目录

# Claude Code
CLAUDE_COMMAND=claude              # 自定义命令
CLAUDE_TIMEOUT=120000              # 超时(毫秒)
CLAUDE_MAX_RETRIES=3               # 最大重试次数
CLAUDE_MODEL=                      # 模型名称，留空使用CLI默认
CLAUDE_WORKING_DIR=/path/to/dir    # 工作目录

# ========== Gateway 配置 ==========
GATEWAY_PORT=3000
GATEWAY_HOST=0.0.0.0
GATEWAY_API_TOKEN=your_token       # 保护敏感接口

# ========== Stream 模式配置 ==========
STREAM_ENABLED=true
STREAM_MAX_RECONNECT=10
STREAM_RECONNECT_BASE_DELAY=1000   # 重连基础延迟(毫秒)
STREAM_RECONNECT_MAX_DELAY=60000   # 重连最大延迟(毫秒)

# ========== 消息队列配置 ==========
MQ_MAX_CONCURRENT_PER_USER=3
MQ_MAX_CONCURRENT_GLOBAL=10
MQ_RATE_LIMIT_TOKENS=10
MQ_ENABLE_PERSISTENCE=true         # 启用 SQLite 持久化

# ========== 会话管理配置 ==========
SESSION_TTL=1800000                # 会话超时(毫秒)
SESSION_MAX_HISTORY=50             # 最大历史消息数

# ========== 媒体处理配置 ==========
MEDIA_ENABLED=true                 # 启用媒体处理
MEDIA_VOICE_TRANSCRIPTION=false    # 启用语音转文字
MEDIA_IMAGE_DESCRIPTION=false      # 启用图片描述
MEDIA_MAX_FILE_SIZE=10485760       # 最大文件大小(10MB)
MEDIA_DOWNLOAD_TIMEOUT=30000       # 下载超时(毫秒)

# ========== 多 Agent 路由配置 ==========
ROUTER_ENABLED=false               # 启用路由功能
ROUTER_PROVIDERS=                  # Provider 列表(JSON)
ROUTER_RULES=                      # 路由规则列表(JSON)

# ========== 定时任务配置 ==========
SCHEDULER_ENABLED=false            # 启用定时任务
SCHEDULER_TASKS=                   # 任务列表(JSON)

# ========== 项目记忆配置 ==========
MEMORY_ENABLED=true                # 启用项目记忆
MEMORY_AUTO_SUMMARIZE=true         # 启用自动摘要
MEMORY_SUMMARIZE_THRESHOLD=20      # 摘要触发阈值(消息数)
MEMORY_MAX_CONTEXT=10              # 上下文最大记忆数
```

### 3. 启动应用

```bash
# 生产模式 (PM2)
npm run build
pm2 start ecosystem.config.cjs

# 开发模式
npm run dev
```

## AI Provider 选择

### OpenCode（默认）

- **适用场景**：日常聊天对话
- **优点**：免费模型、多平台支持
- **安装**：`npm install -g opencode`
- **配置**：`AI_PROVIDER=opencode`

### Claude Code

- **适用场景**：项目开发任务
- **优点**：强大的编程能力、高级推理
- **安装**：`brew install anthropic/claude/claude`
- **配置**：`AI_PROVIDER=claude`

## 消息模式说明

### Stream 模式（推荐）

- 使用 WebSocket 长连接接收消息
- 无需内网穿透，钉钉主动推送消息
- 消息延迟低（实时）
- 支持自动重连

### 轮询模式（已禁用）

轮询模式当前已禁用，系统仅支持 Stream 模式。

## 核心模块

### 会话管理器 (SessionManager)

维护用户对话会话：

- 会话生命周期：创建、获取、结束、过期清理
- 上下文管理：保存历史消息，构建对话上下文
- 自动清理：定期清理过期会话（默认 30 分钟 TTL）

### 流量控制器 (RateLimiter)

令牌桶算法实现流量控制：

- 每用户独立桶，防止单个用户滥用
- 按固定速率补充令牌
- 可配置容量

### 并发控制器 (ConcurrencyController)

控制用户和全局并发请求数：

- 用户级限制：防止单用户占用过多资源
- 全局限制：保护系统不被压垮
- 公平队列：先到先得

### 消息去重器 (MessageDeduplicator)

LRU 缓存实现消息去重：

- 时间窗口内重复消息会被过滤
- 基于用户 ID + 消息内容去重

### 聊天命令 (CommandHandler)

在钉钉群聊中发送 `/` 开头的消息即可触发命令：

| 命令 | 说明 | 示例 |
|------|------|------|
| `/help` | 显示所有可用命令 | `/help` |
| `/status` | 显示系统状态 | `/status` |
| `/model` | 查看当前模型 | `/model` |
| `/model <provider>` | 切换模型（需重启） | `/model claude` |
| `/history` | 显示最近 5 条对话 | `/history` |
| `/history <n>` | 显示最近 n 条对话 | `/history 10` |
| `/queue` | 显示消息队列状态 | `/queue` |
| `/config` | 显示当前配置（脱敏） | `/config` |
| `/reset` | 重置当前会话 | `/reset` |
| `/remember <key> <value>` | 保存记忆 | `/remember project_dir /path/to/project` |

### 项目记忆 (MemoryManager)

自动记忆对话上下文，跨会话保留关键信息：

- **自动记忆**：自动提取对话中的关键信息
- **自动摘要**：当会话消息达到阈值时自动生成摘要
- **上下文注入**：在发送消息给 AI 时自动注入相关记忆
- **访问权重提升**：被引用的记忆权重自动增加
- **过期清理**：自动记忆有最大存活时间，过期后自动清理

### 媒体处理 (MediaProcessor)

处理钉钉消息中的富媒体内容：

- **语音转文字**：将语音消息转录为文本后交给 AI 处理
- **图片描述**：对图片内容生成描述后交给 AI 处理
- **文件下载**：自动下载钉钉消息中的媒体文件

配置示例：

```bash
MEDIA_ENABLED=true
MEDIA_VOICE_TRANSCRIPTION=true
MEDIA_IMAGE_DESCRIPTION=true
```

### 多 Agent 路由 (MessageRouter)

根据消息内容自动选择不同的 AI Provider 处理：

- **Provider 注册**：注册多个 AI Provider（OpenCode、Claude 等）
- **路由规则**：按关键词、正则等条件匹配消息到对应 Provider
- **降级回退**：Provider 不可用时自动回退到默认

配置示例：

```bash
ROUTER_ENABLED=true
ROUTER_PROVIDERS=[{"name":"opencode","command":"opencode"},{"name":"claude","command":"claude"}]
ROUTER_RULES=[{"pattern":"代码|编程|bug","provider":"claude"},{"pattern":"聊天|闲聊","provider":"opencode"}]
```

### 定时任务调度器 (Scheduler)

支持 Cron 格式的定时消息处理：

- **Cron 表达式**：标准 5 字段 cron 格式
- **任务管理**：动态添加/删除/暂停任务
- **消息队列集成**：任务触发后通过消息队列处理

配置示例：

```bash
SCHEDULER_ENABLED=true
SCHEDULER_TASKS=[{"name":"daily-report","cron":"0 9 * * *","message":"生成本日工作摘要"}]
```

## API 端点

```bash
# 健康检查
curl http://localhost:3000/health

# AI Provider 状态
curl http://localhost:3000/api/status

# 会话统计
curl http://localhost:3000/api/sessions

# 测试消息处理
curl -X POST http://localhost:3000/api/test \
  -H "Content-Type: application/json" \
  -d '{"msg": "你好", "userId": "test-user"}'
```

## 使用示例

### 基本对话

在钉钉群聊中发送消息，系统自动维护对话上下文：

```
用户：帮我创建一个用户登录功能
AI：好的，我来帮你创建...

用户：加上验证码功能
AI：好的，在之前的登录功能基础上添加验证码...
```

### 多轮对话

系统自动管理会话上下文：

```
# 第一轮
用户：帮我写一个 Python 函数

# 第二轮（基于上下文）
用户：加上异常处理
```

## 调试技巧

### 测试端点

```bash
curl -X POST http://localhost:3000/api/test \
  -H "Content-Type: application/json" \
  -d '{"msg": "测试消息", "userId": "test"}'
```

### 查看会话状态

```bash
curl http://localhost:3000/api/sessions
```

### 查看 AI Provider 状态

```bash
# 查看当前使用的 AI Provider 和两个 CLI 的可用状态
curl http://localhost:3000/api/status | jq '.data.aiProvider, .data.opencode.available, .data.claude.available'
```

## 常见问题

**Q: 如何切换 AI Provider？**
A: 修改 `.env` 中的 `AI_PROVIDER`，然后重启服务。

**Q: 消息重复发送怎么办？**
A: 系统已实现消息去重，1 分钟内相同用户的相同消息会被自动过滤。

**Q: 如何调整并发限制？**
A: 修改 `.env` 中的 `MQ_MAX_CONCURRENT_PER_USER` 和 `MQ_MAX_CONCURRENT_GLOBAL`。

**Q: 会话多久过期？**
A: 默认 30 分钟无活动后过期，可通过 `SESSION_TTL` 调整。

**Q: OpenCode CLI 不响应怎么办？**
A: 检查 CLI 是否正确安装，确认 `OPENCODE_TIMEOUT` 设置合理。

**Q: Claude Code 在 Claude Code 会话中无法运行？**
A: 使用 `unset CLAUDECODE` 后再启动服务。在 Claude Code 会话中启动本服务会导致子进程网络请求被拦截。

**Q: 如何使用 PM2 管理服务？**
A: 先 `npm run build`，然后 `pm2 start ecosystem.config.cjs`。停止用 `pm2 stop dingtalk-bot`，重启用 `pm2 restart dingtalk-bot`，查看日志用 `pm2 logs dingtalk-bot`。

**Q: 项目记忆如何工作？**
A: 记忆模块默认启用，自动提取对话关键信息并持久化到 SQLite。下次对话时自动注入相关记忆作为上下文。

**Q: 如何启用语音/图片处理？**
A: 设置 `MEDIA_ENABLED=true`、`MEDIA_VOICE_TRANSCRIPTION=true` 和 `MEDIA_IMAGE_DESCRIPTION=true`。

## License

MIT