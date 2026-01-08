#!/bin/bash

# Athena 一键启动脚本
# 功能：同时启动前端和后端服务，并自动打开浏览器

set -e

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 项目根目录
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"

# PID 文件
BACKEND_PID_FILE="$PROJECT_DIR/.backend.pid"
FRONTEND_PID_FILE="$PROJECT_DIR/.frontend.pid"

# 清理函数
cleanup() {
    echo -e "\n${YELLOW}正在停止服务...${NC}"
    if [ -f "$BACKEND_PID_FILE" ]; then
        BACKEND_PID=$(cat "$BACKEND_PID_FILE")
        if ps -p $BACKEND_PID > /dev/null 2>&1; then
            kill $BACKEND_PID 2>/dev/null || true
        fi
        rm -f "$BACKEND_PID_FILE"
    fi
    
    if [ -f "$FRONTEND_PID_FILE" ]; then
        FRONTEND_PID=$(cat "$FRONTEND_PID_FILE")
        if ps -p $FRONTEND_PID > /dev/null 2>&1; then
            kill $FRONTEND_PID 2>/dev/null || true
        fi
        rm -f "$FRONTEND_PID_FILE"
    fi
    
    # 清理可能的残留进程
    pkill -f "uvicorn.*app.main:app" 2>/dev/null || true
    pkill -f "next dev" 2>/dev/null || true
    
    echo -e "${GREEN}服务已停止${NC}"
    exit 0
}

# 注册清理函数
trap cleanup SIGINT SIGTERM

# 检查函数
check_dependencies() {
    echo -e "${YELLOW}检查依赖...${NC}"
    
    # 检查 Python
    if ! command -v python3 &> /dev/null; then
        echo -e "${RED}错误: 未找到 Python3，请先安装 Python 3.10+${NC}"
        exit 1
    fi
    
    # 检查 Node.js
    if ! command -v node &> /dev/null; then
        echo -e "${RED}错误: 未找到 Node.js，请先安装 Node.js 18+${NC}"
        exit 1
    fi
    
    # 检查后端依赖
    if [ ! -d "$BACKEND_DIR/venv" ] && [ ! -f "$BACKEND_DIR/.dependencies_installed" ]; then
        echo -e "${YELLOW}后端依赖未安装，正在安装...${NC}"
        cd "$BACKEND_DIR"
        pip3 install -r requirements.txt > /dev/null 2>&1 || {
            echo -e "${RED}后端依赖安装失败，请手动运行: cd backend && pip install -r requirements.txt${NC}"
            exit 1
        }
        touch "$BACKEND_DIR/.dependencies_installed"
    fi
    
    # 检查前端依赖
    if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
        echo -e "${YELLOW}前端依赖未安装，正在安装...${NC}"
        cd "$FRONTEND_DIR"
        npm install > /dev/null 2>&1 || {
            echo -e "${RED}前端依赖安装失败，请手动运行: cd frontend && npm install${NC}"
            exit 1
        }
    fi
    
    echo -e "${GREEN}依赖检查完成${NC}"
}

# 启动后端
start_backend() {
    echo -e "${YELLOW}启动后端服务...${NC}"
    cd "$BACKEND_DIR"
    
    # 检查 .env 文件
    if [ ! -f "$BACKEND_DIR/.env" ]; then
        echo -e "${RED}错误: 未找到 backend/.env 文件${NC}"
        exit 1
    fi
    
    # 启动后端（后台运行）
    python3 run.py > "$PROJECT_DIR/.backend.log" 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > "$BACKEND_PID_FILE"
    
    # 等待后端启动
    echo -e "${YELLOW}等待后端服务启动...${NC}"
    for i in {1..30}; do
        if curl -s http://localhost:8000/health > /dev/null 2>&1; then
            echo -e "${GREEN}后端服务已启动 (PID: $BACKEND_PID)${NC}"
            return 0
        fi
        sleep 1
    done
    
    echo -e "${RED}后端服务启动超时，请检查日志: cat .backend.log${NC}"
    exit 1
}

# 启动前端
start_frontend() {
    echo -e "${YELLOW}启动前端服务...${NC}"
    cd "$FRONTEND_DIR"
    
    # 检查 .env.local 文件
    if [ ! -f "$FRONTEND_DIR/.env.local" ]; then
        echo -e "${RED}错误: 未找到 frontend/.env.local 文件${NC}"
        exit 1
    fi
    
    # 启动前端（后台运行）
    npm run dev > "$PROJECT_DIR/.frontend.log" 2>&1 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > "$FRONTEND_PID_FILE"
    
    # 等待前端启动
    echo -e "${YELLOW}等待前端服务启动...${NC}"
    for i in {1..60}; do
        if curl -s http://localhost:3000 > /dev/null 2>&1; then
            echo -e "${GREEN}前端服务已启动 (PID: $FRONTEND_PID)${NC}"
            return 0
        fi
        sleep 1
    done
    
    echo -e "${RED}前端服务启动超时，请检查日志: cat .frontend.log${NC}"
    exit 1
}

# 打开浏览器
open_browser() {
    echo -e "${YELLOW}等待服务完全就绪...${NC}"
    sleep 2
    
    echo -e "${GREEN}正在打开浏览器...${NC}"
    if command -v open &> /dev/null; then
        # macOS
        open http://localhost:3000
    elif command -v xdg-open &> /dev/null; then
        # Linux
        xdg-open http://localhost:3000
    elif command -v start &> /dev/null; then
        # Windows (Git Bash)
        start http://localhost:3000
    else
        echo -e "${YELLOW}无法自动打开浏览器，请手动访问: http://localhost:3000${NC}"
    fi
}

# 主函数
main() {
    echo -e "${GREEN}"
    echo "╔══════════════════════════════════════╗"
    echo "║   Athena 一键启动脚本                ║"
    echo "╚══════════════════════════════════════╝"
    echo -e "${NC}"
    
    # 检查是否已有服务运行
    if [ -f "$BACKEND_PID_FILE" ] || [ -f "$FRONTEND_PID_FILE" ]; then
        echo -e "${YELLOW}检测到已有服务运行，正在停止...${NC}"
        cleanup
        sleep 2
    fi
    
    # 执行启动流程
    check_dependencies
    start_backend
    start_frontend
    open_browser
    
    echo -e "\n${GREEN}═══════════════════════════════════════${NC}"
    echo -e "${GREEN}✅ 所有服务已启动成功！${NC}"
    echo -e "${GREEN}═══════════════════════════════════════${NC}"
    echo -e "\n${YELLOW}服务信息:${NC}"
    echo -e "  前端: ${GREEN}http://localhost:3000${NC}"
    echo -e "  后端: ${GREEN}http://localhost:8000${NC}"
    echo -e "  API 文档: ${GREEN}http://localhost:8000/docs${NC}"
    echo -e "\n${YELLOW}日志文件:${NC}"
    echo -e "  后端日志: ${GREEN}.backend.log${NC}"
    echo -e "  前端日志: ${GREEN}.frontend.log${NC}"
    echo -e "\n${YELLOW}按 Ctrl+C 停止所有服务${NC}\n"
    
    # 保持脚本运行，等待用户中断
    while true; do
        sleep 1
        # 检查进程是否还在运行
        if [ -f "$BACKEND_PID_FILE" ]; then
            BACKEND_PID=$(cat "$BACKEND_PID_FILE")
            if ! ps -p $BACKEND_PID > /dev/null 2>&1; then
                echo -e "${RED}后端服务意外停止${NC}"
                cleanup
                exit 1
            fi
        fi
        
        if [ -f "$FRONTEND_PID_FILE" ]; then
            FRONTEND_PID=$(cat "$FRONTEND_PID_FILE")
            if ! ps -p $FRONTEND_PID > /dev/null 2>&1; then
                echo -e "${RED}前端服务意外停止${NC}"
                cleanup
                exit 1
            fi
        fi
    done
}

# 运行主函数
main

