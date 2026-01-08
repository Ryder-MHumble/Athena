#!/bin/bash

# Athena 停止脚本
# 功能：停止所有运行中的前后端服务

set -e

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 项目根目录
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_PID_FILE="$PROJECT_DIR/.backend.pid"
FRONTEND_PID_FILE="$PROJECT_DIR/.frontend.pid"

echo -e "${YELLOW}正在停止 Athena 服务...${NC}"

# 停止后端
if [ -f "$BACKEND_PID_FILE" ]; then
    BACKEND_PID=$(cat "$BACKEND_PID_FILE")
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        echo -e "${YELLOW}停止后端服务 (PID: $BACKEND_PID)...${NC}"
        kill $BACKEND_PID 2>/dev/null || true
        sleep 1
        # 如果还在运行，强制杀死
        if ps -p $BACKEND_PID > /dev/null 2>&1; then
            kill -9 $BACKEND_PID 2>/dev/null || true
        fi
    fi
    rm -f "$BACKEND_PID_FILE"
    echo -e "${GREEN}后端服务已停止${NC}"
fi

# 停止前端
if [ -f "$FRONTEND_PID_FILE" ]; then
    FRONTEND_PID=$(cat "$FRONTEND_PID_FILE")
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        echo -e "${YELLOW}停止前端服务 (PID: $FRONTEND_PID)...${NC}"
        kill $FRONTEND_PID 2>/dev/null || true
        sleep 1
        # 如果还在运行，强制杀死
        if ps -p $FRONTEND_PID > /dev/null 2>&1; then
            kill -9 $FRONTEND_PID 2>/dev/null || true
        fi
    fi
    rm -f "$FRONTEND_PID_FILE"
    echo -e "${GREEN}前端服务已停止${NC}"
fi

# 清理可能的残留进程
echo -e "${YELLOW}清理残留进程...${NC}"
pkill -f "uvicorn.*app.main:app" 2>/dev/null || true
pkill -f "next dev" 2>/dev/null || true

echo -e "${GREEN}所有服务已停止${NC}"

