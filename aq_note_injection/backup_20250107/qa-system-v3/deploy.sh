#!/bin/bash

# 个人智能问答系统 v3.0 - 一键部署脚本
# 支持Linux和macOS系统

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 函数定义
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查系统要求
check_requirements() {
    print_info "检查系统要求..."
    
    # 检查Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker未安装，请先安装Docker"
        print_info "安装指南: https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    # 检查Docker Compose
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        print_error "Docker Compose未安装，请先安装Docker Compose"
        print_info "安装指南: https://docs.docker.com/compose/install/"
        exit 1
    fi
    
    # 检查端口占用
    local ports=(3000 8000 3306 6379)
    for port in "${ports[@]}"; do
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            print_warning "端口 $port 已被占用，部署可能失败"
        fi
    done
    
    print_success "系统要求检查完成"
}

# 创建必要的目录和文件
setup_environment() {
    print_info "设置部署环境..."
    
    # 创建日志目录
    mkdir -p logs uploads
    
    # 设置权限
    chmod 755 logs uploads
    
    # 创建环境变量文件
    if [ ! -f .env ]; then
        cat > .env << EOF
# 数据库配置
MYSQL_DATABASE=qa_db
MYSQL_USER=qa_user
MYSQL_PASSWORD=qa_password_$(date +%s)
MYSQL_ROOT_PASSWORD=root_password_$(date +%s)

# JWT配置
JWT_SECRET_KEY=jwt_secret_key_$(openssl rand -hex 32)

# API配置
API_BASE_URL=http://localhost:8000
CORS_ORIGINS=http://localhost:3000,http://localhost:8080

# 调试配置
DEBUG=false
LOG_LEVEL=INFO
EOF
        print_success "已创建环境配置文件 .env"
    else
        print_info "环境配置文件已存在，跳过创建"
    fi
}

# 停止现有服务
stop_existing_services() {
    print_info "停止现有服务..."
    
    if docker-compose ps -q 2>/dev/null | grep -q .; then
        docker-compose down
        print_success "已停止现有服务"
    else
        print_info "没有找到运行中的服务"
    fi
}

# 构建和启动服务
build_and_start() {
    print_info "开始构建镜像..."
    
    # 使用docker-compose或docker compose
    if command -v docker-compose &> /dev/null; then
        COMPOSE_CMD="docker-compose"
    else
        COMPOSE_CMD="docker compose"
    fi
    
    # 构建镜像
    $COMPOSE_CMD build --no-cache
    
    print_info "启动服务..."
    $COMPOSE_CMD up -d
    
    print_success "服务启动完成"
}

# 等待服务就绪
wait_for_services() {
    print_info "等待服务启动..."
    
    local max_attempts=60
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if curl -f http://localhost:3000/health >/dev/null 2>&1 && \
           curl -f http://localhost:8000/health >/dev/null 2>&1; then
            print_success "所有服务已就绪"
            return 0
        fi
        
        attempt=$((attempt + 1))
        echo -n "."
        sleep 3
    done
    
    print_error "服务启动超时，请检查日志"
    return 1
}

# 显示服务状态
show_status() {
    print_info "服务状态："
    
    if command -v docker-compose &> /dev/null; then
        docker-compose ps
    else
        docker compose ps
    fi
    
    echo ""
    print_info "访问地址："
    echo "  🌐 前端应用: http://localhost:3000"
    echo "  🔌 后端API: http://localhost:8000"
    echo "  ⚙️ 管理界面: http://localhost:3000/admin"
    echo "  🗄️ 数据库: localhost:3306"
    echo ""
    print_info "默认账户："
    echo "  管理员: admin / admin123"
    echo "  普通用户: user / user123"
}

# 显示日志
show_logs() {
    print_info "显示服务日志..."
    
    if command -v docker-compose &> /dev/null; then
        docker-compose logs -f
    else
        docker compose logs -f
    fi
}

# 主函数
main() {
    echo "🚀 个人智能问答系统 v3.0 部署脚本"
    echo "=================================="
    
    # 解析命令行参数
    case "${1:-deploy}" in
        "deploy")
            check_requirements
            setup_environment
            stop_existing_services
            build_and_start
            wait_for_services
            show_status
            ;;
        "start")
            print_info "启动服务..."
            if command -v docker-compose &> /dev/null; then
                docker-compose up -d
            else
                docker compose up -d
            fi
            show_status
            ;;
        "stop")
            print_info "停止服务..."
            if command -v docker-compose &> /dev/null; then
                docker-compose down
            else
                docker compose down
            fi
            print_success "服务已停止"
            ;;
        "restart")
            $0 stop
            sleep 3
            $0 start
            ;;
        "logs")
            show_logs
            ;;
        "status")
            show_status
            ;;
        "clean")
            print_warning "这将删除所有容器、镜像和数据，是否继续？[y/N]"
            read -r confirm
            if [[ $confirm =~ ^[Yy]$ ]]; then
                if command -v docker-compose &> /dev/null; then
                    docker-compose down -v --rmi all
                else
                    docker compose down -v --rmi all
                fi
                docker system prune -f
                print_success "清理完成"
            fi
            ;;
        "help"|"-h"|"--help")
            echo "用法: $0 [命令]"
            echo ""
            echo "命令:"
            echo "  deploy    完整部署（默认）"
            echo "  start     启动服务"
            echo "  stop      停止服务"
            echo "  restart   重启服务"
            echo "  logs      查看日志"
            echo "  status    查看状态"
            echo "  clean     清理所有数据"
            echo "  help      显示帮助"
            ;;
        *)
            print_error "未知命令: $1"
            print_info "使用 '$0 help' 查看可用命令"
            exit 1
            ;;
    esac
}

# 错误处理
trap 'print_error "部署过程中发生错误，请检查日志"; exit 1' ERR

# 执行主函数
main "$@" 