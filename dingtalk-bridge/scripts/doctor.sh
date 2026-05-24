#!/bin/bash

# Dingtalk-to-OpenCode Bridge Diagnostics

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

echo "=== Dingtalk-to-OpenCode Bridge Diagnostics ==="
echo ""

# Check 1: Configuration
echo "[1/6] Checking configuration..."
if [ -f "$PROJECT_DIR/.env" ]; then
    echo "✓ .env file exists"
    if [ -s "$PROJECT_DIR/.env" ]; then
        echo "✓ .env file is not empty"
    else
        echo "✗ .env file is empty"
    fi
else
    echo "✗ .env file not found"
    echo "  Run 'setup' to create configuration"
fi
echo ""

# Check 2: Dependencies
echo "[2/6] Checking dependencies..."
if [ -d "$PROJECT_DIR/node_modules" ]; then
    echo "✓ node_modules exists"
else
    echo "✗ node_modules not found"
    echo "  Run 'npm install' to install dependencies"
fi
echo ""

# Check 3: Build
echo "[3/6] Checking build..."
if [ -d "$PROJECT_DIR/dist" ]; then
    echo "✓ dist directory exists"
else
    echo "✗ dist directory not found"
    echo "  Run 'npm run build' to compile TypeScript"
fi
echo ""

# Check 4: Environment variables
echo "[4/6] Checking environment variables..."
if [ -f "$PROJECT_DIR/.env" ]; then
    source "$PROJECT_DIR/.env"
    if [ -n "$DINGTALK_APP_KEY" ]; then
        echo "✓ DINGTALK_APP_KEY is set"
    else
        echo "✗ DINGTALK_APP_KEY is not set"
    fi
    if [ -n "$DINGTALK_APP_SECRET" ]; then
        echo "✓ DINGTALK_APP_SECRET is set (masked: ${DINGTALK_APP_SECRET: -4})"
    else
        echo "✗ DINGTALK_APP_SECRET is not set"
    fi
else
    echo "  (skip - no .env file)"
fi
echo ""

# Check 5: Port availability
echo "[5/6] Checking port availability..."
PORT=${GATEWAY_PORT:-3000}
if lsof -i:$PORT > /dev/null 2>&1; then
    echo "✗ Port $PORT is in use"
    echo "  Run 'lsof -i:$PORT' to see what's using it"
else
    echo "✓ Port $PORT is available"
fi
echo ""

# Check 6: Running processes
echo "[6/6] Checking running processes..."
if pgrep -f "ts-node src/index.ts" > /dev/null 2>&1; then
    echo "✓ Bridge process is running (ts-node)"
elif pgrep -f "node dist/index.js" > /dev/null 2>&1; then
    echo "✓ Bridge process is running (node)"
else
    echo "✗ Bridge is not running"
    echo "  Run 'npm run dev' to start the bridge"
fi
echo ""

echo "=== Diagnostics Complete ==="