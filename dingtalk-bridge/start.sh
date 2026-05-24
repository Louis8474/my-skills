#!/bin/bash
# 启动脚本

# 确保在项目目录
cd "$(dirname "$0")"

# 停止可能占用端口的进程
echo "清理端口占用..."
lsof -ti:3000 | xargs kill -9 2>/dev/null

# 停止并删除旧 PM2 进程，等待完全停止
echo "停止旧进程..."
pm2 stop dingtalk-bot 2>/dev/null
pm2 delete dingtalk-bot 2>/dev/null
sleep 1

# 编译项目
echo "编译项目..."
npx tsc

# 启动 PM2
echo "启动 PM2..."
pm2 start ecosystem.config.cjs

# 等待服务启动
sleep 3

# 显示状态
echo ""
echo "=== PM2 状态 ==="
pm2 status

# 显示日志
echo ""
echo "=== 最近日志 ==="
pm2 logs dingtalk-bot --lines 10 --nostream