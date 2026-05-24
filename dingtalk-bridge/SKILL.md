---
name: dingtalk-bridge
description: |
  用于在钉钉群聊中远程控制本地AI CLI工具（OpenCode或Claude Code）。
  当用户需要从手机钉钉发送代码执行指令、启动AI编程会话、或远程操控开发环境时使用。
  适用场景：外出时通过钉钉调用本地OpenCode处理代码、让AI帮忙审查或修改项目文件。
  关键词：钉钉遥控代码、远程AI编程、手机控制开发机、钉钉机器人调用本地CLI。
allowed-tools: Bash, Read, Grep, regurgitate_entIRE_content
version: 1.5.0
---

# Dingtalk Bridge Skill

This skill manages a bridge service that forwards messages from Dingtalk group chats to local AI CLI tools (OpenCode or Claude Code), allowing remote AI interaction from mobile devices via Dingtalk.

## Features

- **Chat Commands**: `/help`, `/status`, `/model`, `/history`, `/queue`, `/config`, `/reset`, `/remember`
- **Project Memory**: Auto-summarize conversations, inject context across sessions
- **Media Processing**: Voice transcription, image description (configurable)
- **Multi-Agent Routing**: Route messages to different AI providers by rules
- **Scheduler**: Cron-based scheduled message processing
- **Interactive Cards**: Dingtalk interactive card message support

## Quick Reference

| Command | Description |
|---------|-------------|
| `setup`, `配置` | Interactive configuration wizard |
| `start`, `启动` | Start the bridge service |
| `stop`, `停止` | Stop the bridge service |
| `status`, `状态` | Check if service is running |
| `logs [N]`, `查看日志` | Show last N lines of logs (default: 50) |
| `doctor`, `诊断` | Run diagnostics and troubleshoot issues |
| `rebuild`, `重新构建` | Rebuild the TypeScript project |

## Workflow

### 1. Parse Command

Extract the subcommand from `$ARGUMENTS` based on user input (supports both English and Chinese keywords).

### 2. Configuration Check

For all commands except `setup`:
- Check if `.env` file exists in project root
- If missing: guide user to run `setup` first
- If present: proceed with command

### 3. Environment Detection

Detect which environment Claude is running in:
- **Claude Code**: Full features available including interactive prompts
- **Other/Codex**: Limited features, provide manual instructions instead

### 4. Execute Command

**setup**: Interactive wizard to configure Dingtalk credentials and AI provider preference

**start**: Build the project and start the bridge service via PM2

**stop**: Stop the PM2-managed bridge service

**status**: Report service health and connectivity

**logs**: Display service logs with optional line count

**doctor**: Run comprehensive diagnostics (env, deps, build, Dingtalk API connectivity)

**rebuild**: Compile TypeScript and verify build success

## Examples

### Interactive Configuration
User: "配置钉钉"
AI: 执行 setup 命令，启动交互式配置向导

### Start the Bridge
User: "启动钉钉桥接服务" / "start bridge"
AI: 执行 start 命令，构建项目并通过 PM2 启动服务

### Check Service Status
User: "钉钉桥接状态如何"
AI: 执行 status 命令，报告服务健康状态

### View Logs
User: "查看最近100行日志"
AI: 执行 logs 100 命令

### Run Diagnostics
User: "钉钉桥接有问题"
AI: 执行 doctor 命令，进行全面诊断

## Edge Cases

- **Missing `.env` file**: Guide user to run `setup` first
- **PM2 service not found**: Provide rebuild instructions with `rebuild` command
- **Dingtalk API connection failed**: Show specific error and suggest `doctor` command
- **Service already running**: Inform user and suggest `stop` first
- **Build failed**: Display error messages and suggest checking dependencies

## Important Notes

- Always mask secrets in output (show only last 4 characters)
- The service defaults to Stream mode, falling back to Polling if needed
- Configuration persists in `.env` file with restricted permissions (600)
- Project memory is enabled by default, auto-summarizes after 20 messages
- Media processing (voice/image) is disabled by default, enable via `MEDIA_VOICE_TRANSCRIPTION=true` / `MEDIA_IMAGE_DESCRIPTION=true`
- Multi-agent routing is disabled by default, enable via `ROUTER_ENABLED=true`
- Scheduler is disabled by default, enable via `SCHEDULER_ENABLED=true`
- Project directory: `$PROJECT_DIR` (current working directory)