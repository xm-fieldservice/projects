#!/bin/bash

# 智能问答系统 v3.0 快速启动脚本
# 一键部署演示版本，适合开发和测试环境

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# 显示横幅
show_banner() {
    clear
    echo -e "${PURPLE}"
    cat << "EOF"
    ╔══════════════════════════════════════════════════════════╗
    ║                                                          ║
    ║            智能问答系统 v3.0 快速启动                   ║
    ║                                                          ║
    ║     🚀 基于AI的智能问答和笔记管理系统                   ║
    ║     📖 支持多轮对话、知识管理、数据分析                 ║
    ║     🔒 完整的用户认证和权限管理                         ║
    ║                                                          ║
    ╚══════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
}

# 日志函数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# 检查系统要求
check_system() {
    log_step "检查系统要求..."
    
    # 检查操作系统
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        log_info "操作系统: Linux ✓"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        log_info "操作系统: macOS ✓"
    else
        log_warn "未完全测试的操作系统: $OSTYPE"
    fi
    
    # 检查Docker
    if command -v docker &> /dev/null; then
        DOCKER_VERSION=$(docker --version | cut -d' ' -f3 | cut -d',' -f1)
        log_info "Docker: $DOCKER_VERSION ✓"
    else
        log_error "Docker 未安装"
        echo "请先安装Docker: https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    # 检查Docker Compose
    if command -v docker-compose &> /dev/null || docker compose version &> /dev/null; then
        if command -v docker-compose &> /dev/null; then
            COMPOSE_VERSION=$(docker-compose --version | cut -d' ' -f3 | cut -d',' -f1)
        else
            COMPOSE_VERSION=$(docker compose version --short)
        fi
        log_info "Docker Compose: $COMPOSE_VERSION ✓"
    else
        log_error "Docker Compose 未安装"
        echo "请先安装Docker Compose"
        exit 1
    fi
    
    # 检查内存
    if command -v free &> /dev/null; then
        MEM_GB=$(free -g | awk '/^Mem:/{print $2}')
        if [[ $MEM_GB -ge 4 ]]; then
            log_info "内存: ${MEM_GB}GB ✓"
        else
            log_warn "内存不足4GB，可能影响性能"
        fi
    fi
    
    # 检查磁盘空间
    DISK_AVAIL=$(df . | awk 'NR==2 {print int($4/1024/1024)}')
    if [[ $DISK_AVAIL -ge 5 ]]; then
        log_info "磁盘空间: ${DISK_AVAIL}GB 可用 ✓"
    else
        log_warn "磁盘空间不足5GB"
    fi
    
    echo
}

# 检查端口
check_ports() {
    log_step "检查端口占用..."
    
    local ports=(8000 5432 6379 80 443)
    local occupied_ports=()
    
    for port in "${ports[@]}"; do
        if netstat -tuln 2>/dev/null | grep -q ":$port " || \
           lsof -i :$port &>/dev/null; then
            occupied_ports+=($port)
        fi
    done
    
    if [[ ${#occupied_ports[@]} -gt 0 ]]; then
        log_warn "以下端口已被占用: ${occupied_ports[*]}"
        echo "继续部署可能会导致冲突"
        read -p "是否继续? [y/N]: " -r
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    else
        log_info "所有必需端口都可用 ✓"
    fi
    
    echo
}

# 环境配置
setup_environment() {
    log_step "配置环境文件..."
    
    # 如果没有.env文件，从模板创建
    if [[ ! -f .env ]]; then
        if [[ -f .env.example ]]; then
            cp .env.example .env
            log_info "从.env.example创建.env文件"
        elif [[ -f env.production.template ]]; then
            cp env.production.template .env
            log_info "从env.production.template创建.env文件"
        else
            # 创建基本的.env文件
            cat > .env << EOF
# 基本配置
ENVIRONMENT=development
DEBUG=true
HOST=0.0.0.0
PORT=8000

# 安全配置
SECRET_KEY=$(openssl rand -hex 32)

# 数据库配置
DB_HOST=db
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres123
DB_NAME=qa_system_v3

# Redis配置
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_DB=0

# AI服务配置（请配置您的API密钥）
OPENAI_API_KEY=your-openai-api-key
CLAUDE_API_KEY=your-claude-api-key

# CORS配置
CORS_ORIGINS=http://localhost:3000,http://localhost:8080,http://localhost

# 日志配置
LOG_LEVEL=INFO
EOF
            log_info "创建默认.env文件"
        fi
        
        # 生成安全密钥
        if command -v openssl &> /dev/null; then
            SECRET_KEY=$(openssl rand -hex 32)
            sed -i.bak "s/your-secret-key.*/$SECRET_KEY/" .env 2>/dev/null || \
            sed -i "s/your-secret-key.*/$SECRET_KEY/" .env 2>/dev/null
            log_info "生成安全密钥"
        fi
    else
        log_info ".env文件已存在"
    fi
    
    echo
}

# 创建必要的目录
create_directories() {
    log_step "创建数据目录..."
    
    local dirs=(
        "data/uploads"
        "data/logs" 
        "data/postgres"
        "data/redis"
        "data/backups"
        "ssl"
        "static"
    )
    
    for dir in "${dirs[@]}"; do
        mkdir -p "$dir"
        log_info "创建目录: $dir"
    done
    
    echo
}

# 生成SSL证书
generate_ssl() {
    log_step "生成SSL证书..."
    
    if [[ ! -f ssl/qa-system.crt ]] || [[ ! -f ssl/qa-system.key ]]; then
        if command -v openssl &> /dev/null; then
            openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
                -keyout ssl/qa-system.key \
                -out ssl/qa-system.crt \
                -subj "/C=CN/ST=State/L=City/O=QA-System/CN=localhost" \
                &>/dev/null
            
            chmod 600 ssl/qa-system.key
            chmod 644 ssl/qa-system.crt
            
            log_info "生成自签名SSL证书 ✓"
        else
            log_warn "OpenSSL未安装，跳过SSL证书生成"
        fi
    else
        log_info "SSL证书已存在 ✓"
    fi
    
    echo
}

# 拉取Docker镜像
pull_images() {
    log_step "拉取Docker镜像..."
    
    log_info "拉取PostgreSQL镜像..."
    docker pull postgres:15-alpine &>/dev/null || log_warn "PostgreSQL镜像拉取失败"
    
    log_info "拉取Redis镜像..."
    docker pull redis:7-alpine &>/dev/null || log_warn "Redis镜像拉取失败"
    
    log_info "拉取Nginx镜像..."
    docker pull nginx:alpine &>/dev/null || log_warn "Nginx镜像拉取失败"
    
    log_info "Docker镜像准备完成 ✓"
    echo
}

# 启动服务
start_services() {
    log_step "启动服务..."
    
    # 选择compose文件
    local compose_file="docker-compose.yml"
    if [[ -f "docker-compose.prod.yml" ]] && [[ "$1" == "prod" ]]; then
        compose_file="docker-compose.prod.yml"
        log_info "使用生产环境配置"
    else
        log_info "使用开发环境配置"
    fi
    
    # 构建并启动服务
    log_info "构建应用镜像..."
    if docker-compose -f "$compose_file" build &>/dev/null; then
        log_info "应用镜像构建成功 ✓"
    else
        log_error "应用镜像构建失败"
        return 1
    fi
    
    log_info "启动数据库和Redis..."
    docker-compose -f "$compose_file" up -d db redis
    
    # 等待数据库启动
    log_info "等待数据库启动..."
    local retries=30
    while [[ $retries -gt 0 ]]; do
        if docker-compose -f "$compose_file" exec -T db pg_isready -U postgres &>/dev/null; then
            break
        fi
        sleep 2
        ((retries--))
        printf "."
    done
    echo
    
    if [[ $retries -eq 0 ]]; then
        log_error "数据库启动超时"
        return 1
    fi
    
    log_info "数据库启动成功 ✓"
    
    # 启动应用
    log_info "启动应用服务..."
    docker-compose -f "$compose_file" up -d app
    
    # 如果有nginx配置，启动nginx
    if docker-compose -f "$compose_file" config 2>/dev/null | grep -q "nginx:"; then
        log_info "启动Nginx..."
        docker-compose -f "$compose_file" up -d nginx
    fi
    
    log_info "所有服务启动完成 ✓"
    echo
}

# 健康检查
health_check() {
    log_step "执行健康检查..."
    
    sleep 5  # 等待服务完全启动
    
    # 检查应用健康状态
    local health_url="http://localhost:8000/health"
    if command -v curl &> /dev/null; then
        if curl -sf "$health_url" &>/dev/null; then
            log_info "应用健康检查: ✓"
        else
            log_warn "应用健康检查: ✗"
        fi
    fi
    
    # 检查API文档
    local docs_url="http://localhost:8000/api/v1/docs"
    if curl -sf "$docs_url" &>/dev/null; then
        log_info "API文档可访问: ✓"
    else
        log_warn "API文档不可访问: ✗"
    fi
    
    echo
}

# 显示访问信息
show_access_info() {
    log_step "部署完成！"
    
    echo -e "${CYAN}╔══════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║              访问信息                    ║${NC}"
    echo -e "${CYAN}╠══════════════════════════════════════════╣${NC}"
    echo -e "${CYAN}║${NC} 🌐 主页: http://localhost:8000         ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC} 📖 API文档: http://localhost:8000/api/v1/docs ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC} ❤️ 健康检查: http://localhost:8000/health ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC} 📊 系统信息: http://localhost:8000/api/v1/system/info ${CYAN}║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════╝${NC}"
    echo
    
    echo -e "${GREEN}管理命令:${NC}"
    echo "  查看日志: docker-compose logs -f"
    echo "  停止服务: docker-compose down"
    echo "  重启服务: docker-compose restart"
    echo "  查看状态: docker-compose ps"
    echo
    
    echo -e "${YELLOW}默认配置:${NC}"
    echo "  数据库: PostgreSQL (localhost:5432)"
    echo "  缓存: Redis (localhost:6379)"
    echo "  用户名/密码: 通过API注册"
    echo
    
    if [[ ! -f .env ]] || grep -q "your-openai-api-key" .env 2>/dev/null; then
        echo -e "${RED}重要提醒:${NC}"
        echo "  请编辑 .env 文件配置您的AI服务API密钥"
        echo "  OPENAI_API_KEY=your-actual-api-key"
        echo "  然后重启服务: docker-compose restart app"
        echo
    fi
}

# 显示服务状态
show_status() {
    echo -e "${BLUE}服务状态:${NC}"
    docker-compose ps 2>/dev/null || docker-compose -f docker-compose.prod.yml ps 2>/dev/null
    echo
}

# 清理资源
cleanup() {
    log_step "清理资源..."
    
    # 停止服务
    docker-compose down 2>/dev/null || docker-compose -f docker-compose.prod.yml down 2>/dev/null
    
    # 清理临时文件
    rm -f .env.bak
    
    log_info "清理完成"
}

# 显示帮助
show_help() {
    cat << EOF
智能问答系统 v3.0 快速启动脚本

用法: $0 [选项] [命令]

命令:
  start     启动系统 (默认)
  stop      停止系统
  restart   重启系统
  status    查看状态
  logs      查看日志
  clean     清理系统
  help      显示帮助

选项:
  --prod    使用生产环境配置
  --dev     使用开发环境配置 (默认)
  --force   强制执行，跳过确认
  --check   只检查系统要求

示例:
  $0                    # 启动开发环境
  $0 start --prod       # 启动生产环境
  $0 stop               # 停止系统
  $0 logs               # 查看日志
  $0 clean --force      # 强制清理

EOF
}

# 主函数
main() {
    local command="start"
    local env_mode="dev"
    local force=false
    local check_only=false
    
    # 解析参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            start|stop|restart|status|logs|clean|help)
                command="$1"
                shift
                ;;
            --prod)
                env_mode="prod"
                shift
                ;;
            --dev)
                env_mode="dev"
                shift
                ;;
            --force)
                force=true
                shift
                ;;
            --check)
                check_only=true
                shift
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            *)
                log_error "未知参数: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    # 显示横幅
    show_banner
    
    # 执行命令
    case $command in
        start)
            check_system
            if [[ "$check_only" == true ]]; then
                log_info "系统检查完成"
                exit 0
            fi
            
            check_ports
            setup_environment
            create_directories
            generate_ssl
            pull_images
            start_services "$env_mode"
            health_check
            show_access_info
            ;;
        stop)
            log_step "停止服务..."
            docker-compose down 2>/dev/null || docker-compose -f docker-compose.prod.yml down 2>/dev/null
            log_info "服务已停止"
            ;;
        restart)
            log_step "重启服务..."
            docker-compose restart 2>/dev/null || docker-compose -f docker-compose.prod.yml restart 2>/dev/null
            health_check
            log_info "服务已重启"
            ;;
        status)
            show_status
            ;;
        logs)
            log_info "显示服务日志 (Ctrl+C 退出):"
            docker-compose logs -f 2>/dev/null || docker-compose -f docker-compose.prod.yml logs -f 2>/dev/null
            ;;
        clean)
            if [[ "$force" == true ]] || (echo -n "确认清理所有数据? [y/N]: " && read -r && [[ $REPLY =~ ^[Yy]$ ]]); then
                cleanup
                log_info "系统已清理"
            else
                log_info "操作已取消"
            fi
            ;;
        help)
            show_help
            ;;
    esac
}

# 脚本入口
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi 