#!/bin/bash

# Dingtalk-to-OpenCode Bridge Daemon Manager

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

PID_FILE="$PROJECT_DIR/.dingtalk.pid"
LOG_FILE="$PROJECT_DIR/logs/daemon.log"

start_daemon() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p "$PID" > /dev/null 2>&1; then
            echo "Bridge is already running (PID: $PID)"
            return 1
        else
            rm -f "$PID_FILE"
        fi
    fi

    mkdir -p "$PROJECT_DIR/logs"

    echo "Starting Dingtalk-to-OpenCode bridge..."
    npm run dev > "$LOG_FILE" 2>&1 &
    PID=$!
    echo $PID > "$PID_FILE"
    echo "Bridge started (PID: $PID)"
    echo "Logs: $LOG_FILE"
}

stop_daemon() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p "$PID" > /dev/null 2>&1; then
            kill "$PID"
            rm -f "$PID_FILE"
            echo "Bridge stopped (PID: $PID)"
        else
            rm -f "$PID_FILE"
            echo "Bridge was not running"
        fi
    else
        # Try to find and kill any running instance
        pkill -f "ts-node src/index.ts" 2>/dev/null
        pkill -f "node dist/index.js" 2>/dev/null
        echo "Bridge stopped"
    fi
}

status_daemon() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p "$PID" > /dev/null 2>&1; then
            echo "Bridge is running (PID: $PID)"
            return 0
        fi
    fi

    # Check if any instance is running
    if pgrep -f "ts-node src/index.ts" > /dev/null 2>&1 || pgrep -f "node dist/index.js" > /dev/null 2>&1; then
        echo "Bridge is running (process found)"
        return 0
    fi

    echo "Bridge is not running"
    return 1
}

case "$1" in
    start)
        start_daemon
        ;;
    stop)
        stop_daemon
        ;;
    status)
        status_daemon
        ;;
    restart)
        stop_daemon
        sleep 1
        start_daemon
        ;;
    *)
        echo "Usage: $0 {start|stop|status|restart}"
        exit 1
        ;;
esac