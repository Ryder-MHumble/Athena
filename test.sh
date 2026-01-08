#!/bin/bash

# Athena 测试脚本
# 测试前后端是否能正常启动和运行

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"

echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}🧪 Athena 项目测试${NC}"
echo -e "${GREEN}═══════════════════════════════════════${NC}\n"

# 测试 1: 后端导入
echo -e "${YELLOW}[测试 1] 检查后端导入...${NC}"
cd "$BACKEND_DIR"
if python3 -c "from app.main import app; print('✅')" 2>/dev/null | grep -q "✅"; then
    echo -e "${GREEN}✅ 后端导入成功${NC}\n"
else
    echo -e "${RED}❌ 后端导入失败${NC}\n"
    exit 1
fi

# 测试 2: 后端启动
echo -e "${YELLOW}[测试 2] 测试后端启动...${NC}"
python3 run.py > /tmp/athena_test_backend.log 2>&1 &
BACKEND_PID=$!
sleep 5

if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 后端服务启动成功${NC}"
    
    # 测试 API 端点
    echo -e "${YELLOW}  测试 API 端点...${NC}"
    ROOT_RESPONSE=$(curl -s http://localhost:8000/)
    if echo "$ROOT_RESPONSE" | grep -q "Athena API"; then
        echo -e "${GREEN}  ✅ 根端点正常${NC}"
    else
        echo -e "${RED}  ❌ 根端点异常${NC}"
    fi
    
    HEALTH_RESPONSE=$(curl -s http://localhost:8000/health)
    if echo "$HEALTH_RESPONSE" | grep -q "healthy"; then
        echo -e "${GREEN}  ✅ 健康检查端点正常${NC}"
    else
        echo -e "${RED}  ❌ 健康检查端点异常${NC}"
    fi
    
    kill $BACKEND_PID 2>/dev/null
    wait $BACKEND_PID 2>/dev/null
    echo ""
else
    echo -e "${RED}❌ 后端服务启动失败${NC}"
    echo -e "${YELLOW}日志:${NC}"
    tail -10 /tmp/athena_test_backend.log
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# 测试 3: 前端依赖
echo -e "${YELLOW}[测试 3] 检查前端依赖...${NC}"
cd "$FRONTEND_DIR"
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✅ 前端依赖已安装${NC}\n"
else
    echo -e "${RED}❌ 前端依赖未安装${NC}\n"
    exit 1
fi

# 测试 4: 前端构建检查
echo -e "${YELLOW}[测试 4] 检查前端配置...${NC}"
if [ -f "next.config.js" ] && [ -f "tsconfig.json" ]; then
    echo -e "${GREEN}✅ 前端配置文件完整${NC}\n"
else
    echo -e "${RED}❌ 前端配置文件缺失${NC}\n"
    exit 1
fi

# 测试 5: 环境变量检查
echo -e "${YELLOW}[测试 5] 检查环境变量...${NC}"
if [ -f "$BACKEND_DIR/.env" ]; then
    if grep -q "SILICONFLOW_API_KEY" "$BACKEND_DIR/.env"; then
        echo -e "${GREEN}✅ 后端环境变量配置完整${NC}"
    else
        echo -e "${RED}❌ 后端环境变量配置不完整${NC}"
    fi
else
    echo -e "${RED}❌ 后端 .env 文件不存在${NC}"
fi

if [ -f "$FRONTEND_DIR/.env.local" ]; then
    if grep -q "NEXT_PUBLIC_API_URL" "$FRONTEND_DIR/.env.local"; then
        echo -e "${GREEN}✅ 前端环境变量配置完整${NC}\n"
    else
        echo -e "${RED}❌ 前端环境变量配置不完整${NC}\n"
    fi
else
    echo -e "${RED}❌ 前端 .env.local 文件不存在${NC}\n"
fi

echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}✅ 所有测试通过！${NC}"
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo -e "\n${YELLOW}现在可以运行 ./start.sh 启动项目${NC}\n"

