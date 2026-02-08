#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════════════
# Athena 一键启动脚本
# 功能：自动检测并安装所需环境，启动前后端服务，自动打开浏览器
# 支持：macOS / Linux / Windows (Git Bash/WSL)
# ═══════════════════════════════════════════════════════════════════════════════

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# 项目根目录
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"

# PID 文件
BACKEND_PID_FILE="$PROJECT_DIR/.backend.pid"
FRONTEND_PID_FILE="$PROJECT_DIR/.frontend.pid"

# 最低版本要求
MIN_NODE_VERSION=18
MIN_PYTHON_VERSION="3.9"

# ═══════════════════════════════════════════════════════════════════════════════
# 工具函数
# ═══════════════════════════════════════════════════════════════════════════════

print_banner() {
    echo -e "${CYAN}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                                                              ║"
    echo "║     █████╗ ████████╗██╗  ██╗███████╗███╗   ██╗ █████╗        ║"
    echo "║    ██╔══██╗╚══██╔══╝██║  ██║██╔════╝████╗  ██║██╔══██╗       ║"
    echo "║    ███████║   ██║   ███████║█████╗  ██╔██╗ ██║███████║       ║"
    echo "║    ██╔══██║   ██║   ██╔══██║██╔══╝  ██║╚██╗██║██╔══██║       ║"
    echo "║    ██║  ██║   ██║   ██║  ██║███████╗██║ ╚████║██║  ██║       ║"
    echo "║    ╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝╚══════╝╚═╝  ╚═══╝╚═╝  ╚═╝       ║"
    echo "║                                                              ║"
    echo "║              AI 战略分析师智能工作台                         ║"
    echo "║                                                              ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[!]${NC} $1"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
}

log_step() {
    echo -e "\n${BOLD}${CYAN}━━━ $1 ━━━${NC}\n"
}

# 检测操作系统
detect_os() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        OS="linux"
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
        OS="windows"
    else
        OS="unknown"
    fi
    echo $OS
}

# 版本比较函数
version_gte() {
    # 返回 0 如果 $1 >= $2
    [ "$(printf '%s\n' "$2" "$1" | sort -V | head -n1)" = "$2" ]
}

# ═══════════════════════════════════════════════════════════════════════════════
# 环境检测与安装
# ═══════════════════════════════════════════════════════════════════════════════

# 检查并安装 Homebrew (macOS)
install_homebrew() {
    if ! command -v brew &> /dev/null; then
        log_warn "未检测到 Homebrew，正在安装..."
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        
        # 添加到 PATH
        if [[ -f /opt/homebrew/bin/brew ]]; then
            eval "$(/opt/homebrew/bin/brew shellenv)"
        elif [[ -f /usr/local/bin/brew ]]; then
            eval "$(/usr/local/bin/brew shellenv)"
        fi
        
        if command -v brew &> /dev/null; then
            log_success "Homebrew 安装成功"
        else
            log_error "Homebrew 安装失败，请手动安装: https://brew.sh"
            exit 1
        fi
    else
        log_success "Homebrew 已安装"
    fi
}

# 检查并安装 Python
check_install_python() {
    log_step "检查 Python 环境"
    
    local python_cmd=""
    
    # 检查各种 Python 命令
    for cmd in python3 python; do
        if command -v $cmd &> /dev/null; then
            local version=$($cmd --version 2>&1 | grep -oE '[0-9]+\.[0-9]+')
            if version_gte "$version" "$MIN_PYTHON_VERSION"; then
                python_cmd=$cmd
                log_success "Python $version 已安装 ($cmd)"
                break
            fi
        fi
    done
    
    if [ -z "$python_cmd" ]; then
        log_warn "未检测到 Python $MIN_PYTHON_VERSION+，正在安装..."
        
        local os=$(detect_os)
        case $os in
            macos)
                install_homebrew
                brew install python@3.11
                python_cmd="python3"
                ;;
            linux)
                if command -v apt-get &> /dev/null; then
                    sudo apt-get update
                    sudo apt-get install -y python3 python3-pip python3-venv
                elif command -v yum &> /dev/null; then
                    sudo yum install -y python3 python3-pip
                elif command -v dnf &> /dev/null; then
                    sudo dnf install -y python3 python3-pip
                else
                    log_error "无法自动安装 Python，请手动安装 Python $MIN_PYTHON_VERSION+"
                    exit 1
                fi
                python_cmd="python3"
                ;;
            windows)
                log_error "Windows 用户请手动安装 Python: https://www.python.org/downloads/"
                log_info "安装完成后请重新运行此脚本"
                exit 1
                ;;
            *)
                log_error "未知操作系统，请手动安装 Python $MIN_PYTHON_VERSION+"
                exit 1
                ;;
        esac
        
        if command -v $python_cmd &> /dev/null; then
            log_success "Python 安装成功"
        else
            log_error "Python 安装失败"
            exit 1
        fi
    fi
    
    # 检查 pip
    if ! $python_cmd -m pip --version &> /dev/null; then
        log_warn "正在安装 pip..."
        $python_cmd -m ensurepip --upgrade 2>/dev/null || {
            curl -sS https://bootstrap.pypa.io/get-pip.py | $python_cmd
        }
    fi
    log_success "pip 已就绪"
    
    # 导出 Python 命令供后续使用
    export PYTHON_CMD=$python_cmd
}

# 检查并安装 Node.js
check_install_node() {
    log_step "检查 Node.js 环境"
    
    if command -v node &> /dev/null; then
        local version=$(node --version | grep -oE '[0-9]+' | head -1)
        if [ "$version" -ge "$MIN_NODE_VERSION" ]; then
            log_success "Node.js v$(node --version | tr -d 'v') 已安装"
            return 0
        fi
    fi
    
    log_warn "未检测到 Node.js $MIN_NODE_VERSION+，正在安装..."
    
    local os=$(detect_os)
    case $os in
        macos)
            install_homebrew
            brew install node@20
            # 添加到 PATH
            export PATH="/opt/homebrew/opt/node@20/bin:$PATH"
            ;;
        linux)
            # 使用 NodeSource 安装最新 LTS 版本
            log_info "使用 NodeSource 安装 Node.js 20.x..."
            curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
            if command -v apt-get &> /dev/null; then
                sudo apt-get install -y nodejs
            elif command -v yum &> /dev/null; then
                curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
                sudo yum install -y nodejs
            fi
            ;;
        windows)
            log_error "Windows 用户请手动安装 Node.js: https://nodejs.org/"
            log_info "推荐下载 LTS 版本，安装完成后请重新运行此脚本"
            exit 1
            ;;
        *)
            log_error "未知操作系统，请手动安装 Node.js $MIN_NODE_VERSION+"
            exit 1
            ;;
    esac
    
    if command -v node &> /dev/null; then
        log_success "Node.js $(node --version) 安装成功"
    else
        log_error "Node.js 安装失败"
        exit 1
    fi
    
    # 检查 npm
    if ! command -v npm &> /dev/null; then
        log_error "npm 未找到，请重新安装 Node.js"
        exit 1
    fi
    log_success "npm $(npm --version) 已就绪"
}

# ═══════════════════════════════════════════════════════════════════════════════
# 项目依赖安装
# ═══════════════════════════════════════════════════════════════════════════════

# 安装后端依赖
install_backend_deps() {
    log_step "安装后端依赖"
    
    cd "$BACKEND_DIR"
    
    # 检查是否需要安装
    if [ -f "$BACKEND_DIR/.deps_installed" ]; then
        local req_hash=$(md5sum "$BACKEND_DIR/requirements.txt" 2>/dev/null | cut -d' ' -f1 || md5 -q "$BACKEND_DIR/requirements.txt")
        local installed_hash=$(cat "$BACKEND_DIR/.deps_installed" 2>/dev/null)
        if [ "$req_hash" = "$installed_hash" ]; then
            log_success "后端依赖已是最新"
            return 0
        fi
    fi
    
    log_info "正在安装 Python 依赖包..."
    
    # 直接使用系统 pip 安装依赖
    $PYTHON_CMD -m pip install --upgrade pip -q
    $PYTHON_CMD -m pip install -r requirements.txt -q
    
    if [ $? -eq 0 ]; then
        # 记录安装的依赖版本
        md5sum "$BACKEND_DIR/requirements.txt" 2>/dev/null | cut -d' ' -f1 > "$BACKEND_DIR/.deps_installed" || \
        md5 -q "$BACKEND_DIR/requirements.txt" > "$BACKEND_DIR/.deps_installed"
        log_success "后端依赖安装完成"
    else
        log_error "后端依赖安装失败"
        log_info "请尝试手动运行: cd backend && pip install -r requirements.txt"
        exit 1
    fi
}

# 安装前端依赖
install_frontend_deps() {
    log_step "安装前端依赖"
    
    cd "$FRONTEND_DIR"
    
    if [ -d "$FRONTEND_DIR/node_modules" ]; then
        # 检查 package.json 是否有变化
        local pkg_hash=$(md5sum "$FRONTEND_DIR/package.json" 2>/dev/null | cut -d' ' -f1 || md5 -q "$FRONTEND_DIR/package.json")
        local installed_hash=$(cat "$FRONTEND_DIR/.deps_installed" 2>/dev/null)
        if [ "$pkg_hash" = "$installed_hash" ]; then
            log_success "前端依赖已是最新"
            return 0
        fi
    fi
    
    log_info "正在安装 Node.js 依赖包..."
    
    # 使用 npm 安装
    npm install --legacy-peer-deps 2>&1 | while read line; do
        # 只显示关键信息
        if [[ "$line" == *"added"* ]] || [[ "$line" == *"packages"* ]]; then
            echo -e "${BLUE}  $line${NC}"
        fi
    done
    
    if [ ${PIPESTATUS[0]} -eq 0 ]; then
        # 记录安装的依赖版本
        md5sum "$FRONTEND_DIR/package.json" 2>/dev/null | cut -d' ' -f1 > "$FRONTEND_DIR/.deps_installed" || \
        md5 -q "$FRONTEND_DIR/package.json" > "$FRONTEND_DIR/.deps_installed"
        log_success "前端依赖安装完成"
    else
        log_error "前端依赖安装失败"
        log_info "请尝试手动运行: cd frontend && npm install"
        exit 1
    fi
}

# ═══════════════════════════════════════════════════════════════════════════════
# 环境配置文件
# ═══════════════════════════════════════════════════════════════════════════════

setup_env_files() {
    log_step "检查配置文件"
    
    # 后端 .env 文件
    if [ ! -f "$BACKEND_DIR/.env" ]; then
        log_warn "后端 .env 文件不存在，正在创建..."
        cat > "$BACKEND_DIR/.env" << 'EOF'
# Athena 后端配置文件
# 请根据需要修改以下配置

# Supabase 配置 (用于知识库向量检索)
SUPABASE_URL=your_supabase_url_here
SUPABASE_SERVICE_KEY=your_supabase_service_key_here

# 其他配置（可选）
# DEBUG=true
EOF
        log_info "已创建 backend/.env 文件"
        log_warn "请在设置页面配置 SiliconFlow API Key"
    else
        log_success "后端 .env 文件已存在"
    fi
    
    # 前端 .env.local 文件
    if [ ! -f "$FRONTEND_DIR/.env.local" ]; then
        log_warn "前端 .env.local 文件不存在，正在创建..."
        cat > "$FRONTEND_DIR/.env.local" << 'EOF'
# Athena 前端配置文件

# 后端 API 地址
NEXT_PUBLIC_API_URL=http://localhost:8000
EOF
        log_info "已创建 frontend/.env.local 文件"
    else
        log_success "前端 .env.local 文件已存在"
    fi
}

# ═══════════════════════════════════════════════════════════════════════════════
# 服务启动
# ═══════════════════════════════════════════════════════════════════════════════

# 停止服务（不退出脚本）
stop_services() {
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

    # 清理可能的残留进程和端口占用
    pkill -f "uvicorn.*app.main:app" 2>/dev/null || true
    pkill -f "next dev" 2>/dev/null || true
    lsof -ti:8000 | xargs kill -9 2>/dev/null || true
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true

    echo -e "${GREEN}服务已停止${NC}"
}

# 清理函数（用于 trap，退出脚本）
cleanup() {
    stop_services
    exit 0
}

# 注册清理函数
trap cleanup SIGINT SIGTERM

# 启动后端
start_backend() {
    log_step "启动后端服务"

    cd "$BACKEND_DIR"

    # 确保端口 8000 空闲
    local port_pid=$(lsof -ti:8000 2>/dev/null)
    if [ -n "$port_pid" ]; then
        log_warn "端口 8000 被占用 (PID: $port_pid)，正在释放..."
        echo "$port_pid" | xargs kill -9 2>/dev/null || true
        sleep 1
    fi

    # 启动后端（后台运行）
    $PYTHON_CMD run.py > "$PROJECT_DIR/.backend.log" 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > "$BACKEND_PID_FILE"
    
    # 等待后端启动
    log_info "等待后端服务启动..."
    local dots=""
    for i in {1..30}; do
        if curl -s http://localhost:8000/health > /dev/null 2>&1; then
            echo ""
            log_success "后端服务已启动 (端口: 8000, PID: $BACKEND_PID)"
            return 0
        fi
        dots="${dots}."
        echo -ne "\r${BLUE}[INFO]${NC} 等待中${dots}   "
        sleep 1
    done
    
    echo ""
    log_error "后端服务启动超时"
    log_info "查看日志: cat .backend.log"
    exit 1
}

# 启动前端
start_frontend() {
    log_step "启动前端服务"

    cd "$FRONTEND_DIR"

    # 确保端口 3000 空闲
    local port_pid=$(lsof -ti:3000 2>/dev/null)
    if [ -n "$port_pid" ]; then
        log_warn "端口 3000 被占用 (PID: $port_pid)，正在释放..."
        echo "$port_pid" | xargs kill -9 2>/dev/null || true
        sleep 1
    fi

    # 启动前端（后台运行）
    npm run dev > "$PROJECT_DIR/.frontend.log" 2>&1 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > "$FRONTEND_PID_FILE"
    
    # 等待前端启动
    log_info "等待前端服务启动..."
    local dots=""
    for i in {1..60}; do
        if curl -s http://localhost:3000 > /dev/null 2>&1; then
            echo ""
            log_success "前端服务已启动 (端口: 3000, PID: $FRONTEND_PID)"
            return 0
        fi
        dots="${dots}."
        if [ ${#dots} -gt 10 ]; then dots="."; fi
        echo -ne "\r${BLUE}[INFO]${NC} 等待中${dots}   "
        sleep 1
    done
    
    echo ""
    log_error "前端服务启动超时"
    log_info "查看日志: cat .frontend.log"
    exit 1
}

# 打开浏览器
open_browser() {
    sleep 2
    
    log_info "正在打开浏览器..."
    if command -v open &> /dev/null; then
        open http://localhost:3000
    elif command -v xdg-open &> /dev/null; then
        xdg-open http://localhost:3000
    elif command -v start &> /dev/null; then
        start http://localhost:3000
    else
        log_warn "无法自动打开浏览器，请手动访问: http://localhost:3000"
    fi
}

# ═══════════════════════════════════════════════════════════════════════════════
# 主函数
# ═══════════════════════════════════════════════════════════════════════════════

main() {
    print_banner
    
    # 检查是否已有服务运行
    if [ -f "$BACKEND_PID_FILE" ] || [ -f "$FRONTEND_PID_FILE" ]; then
        log_warn "检测到已有服务运行，正在停止..."
        stop_services
        sleep 2
    fi
    
    # 环境检测与安装
    check_install_python
    check_install_node
    
    # 安装项目依赖
    install_backend_deps
    install_frontend_deps
    
    # 配置文件检查
    setup_env_files
    
    # 启动服务
    start_backend
    start_frontend
    open_browser
    
    # 显示成功信息
    echo ""
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                                                              ║${NC}"
    echo -e "${GREEN}║              ✅ Athena 启动成功！                            ║${NC}"
    echo -e "${GREEN}║                                                              ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${BOLD}服务地址:${NC}"
    echo -e "  ${CYAN}前端应用${NC}    →  ${GREEN}http://localhost:3000${NC}"
    echo -e "  ${CYAN}后端 API${NC}    →  ${GREEN}http://localhost:8000${NC}"
    echo -e "  ${CYAN}API 文档${NC}    →  ${GREEN}http://localhost:8000/docs${NC}"
    echo ""
    echo -e "${BOLD}日志文件:${NC}"
    echo -e "  ${CYAN}后端日志${NC}    →  ${YELLOW}.backend.log${NC}"
    echo -e "  ${CYAN}前端日志${NC}    →  ${YELLOW}.frontend.log${NC}"
    echo ""
    echo -e "${BOLD}首次使用:${NC}"
    echo -e "  1. 访问 ${GREEN}http://localhost:3000/settings${NC}"
    echo -e "  2. 配置你的 ${YELLOW}SiliconFlow API Key${NC}"
    echo -e "  3. 开始使用所有功能！"
    echo ""
    echo -e "${YELLOW}按 Ctrl+C 停止所有服务${NC}"
    echo ""
    
    # 保持脚本运行
    while true; do
        sleep 5
        
        # 检查进程是否还在运行
        if [ -f "$BACKEND_PID_FILE" ]; then
            BACKEND_PID=$(cat "$BACKEND_PID_FILE")
            if ! ps -p $BACKEND_PID > /dev/null 2>&1; then
                log_error "后端服务意外停止，查看日志: cat .backend.log"
                stop_services
                exit 1
            fi
        fi

        if [ -f "$FRONTEND_PID_FILE" ]; then
            FRONTEND_PID=$(cat "$FRONTEND_PID_FILE")
            if ! ps -p $FRONTEND_PID > /dev/null 2>&1; then
                log_error "前端服务意外停止，查看日志: cat .frontend.log"
                stop_services
                exit 1
            fi
        fi
    done
}

# 运行主函数
main
