#!/bin/bash

# 集成智能问答笔记系统 v3.0 - Linux/Mac 部署脚本

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 显示标题
echo
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                集成智能问答笔记系统 v3.0                      ║"
echo "║                     一键部署脚本                             ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo

# 检查Node.js
log_info "检查系统环境..."
if ! command -v node &> /dev/null; then
    log_error "Node.js 未安装，请先安装 Node.js v16.0.0 或更高版本"
    log_info "安装方法："
    echo "  - Ubuntu/Debian: sudo apt install nodejs npm"
    echo "  - CentOS/RHEL: sudo yum install nodejs npm"
    echo "  - macOS: brew install node"
    echo "  - 或访问: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node --version)
log_success "Node.js版本: $NODE_VERSION"

# 检查npm
if ! command -v npm &> /dev/null; then
    log_error "npm 未安装或不可用"
    exit 1
fi

NPM_VERSION=$(npm --version)
log_success "npm版本: v$NPM_VERSION"

# 检查端口占用
echo
log_info "检查端口占用..."
if lsof -i :3000 &> /dev/null; then
    log_warning "端口 3000 已被占用"
    read -p "是否继续部署? (y/N): " -r
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "取消部署"
        exit 1
    fi
else
    log_success "端口 3000 可用"
fi

# 安装依赖
echo
log_info "安装项目依赖..."
if npm install; then
    log_success "依赖安装完成"
else
    log_error "依赖安装失败"
    exit 1
fi

# 创建必要目录
echo
log_info "创建系统目录..."
mkdir -p data logs
log_success "系统目录创建完成"

# 启动服务
echo
log_info "启动集成问答系统..."
echo
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  系统即将启动，请在浏览器访问以下地址：                      ║"
echo "║                                                              ║"
echo "║  🌍 主系统：http://localhost:3000                            ║"
echo "║  🔐 登录页面：http://localhost:3000/auth                     ║"
echo "║  🤖 问答系统：http://localhost:3000/qa-system/qa-note.html   ║"
echo "║  📊 健康检查：http://localhost:3000/health                   ║"
echo "║                                                              ║"
echo "║  👤 测试账户：                                               ║"
echo "║     admin / admin123  (管理员)                              ║"
echo "║     demo / demo123    (演示用户)                            ║"
echo "║     test / test123    (测试用户)                            ║"
echo "║                                                              ║"
echo "║  按 Ctrl+C 停止服务器                                       ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo

# 启动服务
npm start 