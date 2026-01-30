#!/bin/bash

# 前端构建检查脚本
# 用于在提交前本地测试是否有 TypeScript 类型错误

echo "🔍 检查前端代码..."
echo ""

cd "$(dirname "$0")"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "📦 安装依赖..."
npm install --legacy-peer-deps > /dev/null 2>&1

echo ""
echo "🔧 运行 TypeScript 类型检查..."
npx tsc --noEmit

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ TypeScript 类型检查通过${NC}"
else
    echo ""
    echo -e "${RED}❌ TypeScript 类型检查失败${NC}"
    echo ""
    echo "请修复上述类型错误后再提交代码"
    exit 1
fi

echo ""
echo "🏗️  运行生产构建测试..."
npm run build

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ 构建成功！可以安全提交代码${NC}"
    exit 0
else
    echo ""
    echo -e "${RED}❌ 构建失败${NC}"
    echo ""
    echo "请修复上述错误后再提交代码"
    exit 1
fi


