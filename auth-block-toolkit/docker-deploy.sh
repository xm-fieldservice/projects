#!/bin/bash

# AuthBlock Docker 部署脚本
# 使用方法: ./docker-deploy.sh [start|stop|restart|logs|status]

set -e

PROJECT_NAME="authblock"
COMPOSE_FILE="docker-compose.yml"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查Docker是否安装
check_docker() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker 未安装，请先安装 Docker"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose 未安装，请先安装 Docker Compose"
        exit 1
    fi
}

# 检查环境文件
check_env() {
    if [ ! -f .env ]; then
        log_warning ".env 文件不存在，使用示例配置创建"
        cp env.example .env
        log_info "请编辑 .env 文件配置您的环境变量"
    fi
}

# 启动服务
start_services() {
    log_info "正在启动 AuthBlock 服务..."
    
    check_env
    
    # 构建并启动服务
    docker-compose -p $PROJECT_NAME up -d --build
    
    # 等待服务启动
    log_info "等待服务启动..."
    sleep 10
    
    # 检查服务状态
    if docker-compose -p $PROJECT_NAME ps | grep -q "Up"; then
        log_success "AuthBlock 服务启动成功！"
        log_info "访问地址："
        echo "  - API服务: http://localhost:3000"
        echo "  - 健康检查: http://localhost:3000/health"
        echo "  - 演示页面: http://localhost:3000/demo"
        
        if docker-compose -p $PROJECT_NAME ps nginx &> /dev/null; then
            echo "  - Nginx代理: http://localhost"
        fi
    else
        log_error "服务启动失败，请检查日志"
        show_logs
        exit 1
    fi
}

# 停止服务
stop_services() {
    log_info "正在停止 AuthBlock 服务..."
    docker-compose -p $PROJECT_NAME down
    log_success "服务已停止"
}

# 重启服务
restart_services() {
    log_info "正在重启 AuthBlock 服务..."
    stop_services
    sleep 2
    start_services
}

# 显示日志
show_logs() {
    echo ""
    log_info "显示服务日志（按 Ctrl+C 退出）："
    docker-compose -p $PROJECT_NAME logs -f
}

# 显示服务状态
show_status() {
    log_info "AuthBlock 服务状态："
    docker-compose -p $PROJECT_NAME ps
    
    echo ""
    log_info "资源使用情况："
    docker stats --no-stream $(docker-compose -p $PROJECT_NAME ps -q) 2>/dev/null || true
}

# 清理资源
cleanup() {
    log_warning "这将删除所有 AuthBlock 相关的Docker资源（包括数据卷）"
    read -p "确认继续？(y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "正在清理资源..."
        docker-compose -p $PROJECT_NAME down -v --rmi all
        docker system prune -f
        log_success "清理完成"
    else
        log_info "取消清理"
    fi
}

# 更新服务
update_services() {
    log_info "正在更新 AuthBlock 服务..."
    
    # 拉取最新代码（如果是git仓库）
    if [ -d .git ]; then
        git pull
    fi
    
    # 重新构建并启动
    docker-compose -p $PROJECT_NAME down
    docker-compose -p $PROJECT_NAME build --no-cache
    docker-compose -p $PROJECT_NAME up -d
    
    log_success "更新完成"
}

# 备份数据
backup_data() {
    log_info "正在备份数据..."
    
    BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    
    # 备份数据卷
    docker run --rm -v authblock_authblock_data:/data -v $(pwd)/$BACKUP_DIR:/backup alpine tar czf /backup/authblock_data.tar.gz -C /data .
    
    # 备份配置文件
    cp .env "$BACKUP_DIR/"
    cp docker-compose.yml "$BACKUP_DIR/"
    
    log_success "备份完成: $BACKUP_DIR"
}

# 显示帮助
show_help() {
    echo "AuthBlock Docker 部署脚本"
    echo ""
    echo "使用方法: $0 [命令]"
    echo ""
    echo "命令:"
    echo "  start     启动服务"
    echo "  stop      停止服务"
    echo "  restart   重启服务"
    echo "  logs      显示日志"
    echo "  status    显示状态"
    echo "  update    更新服务"
    echo "  backup    备份数据"
    echo "  cleanup   清理资源"
    echo "  help      显示帮助"
    echo ""
    echo "示例:"
    echo "  $0 start    # 启动AuthBlock服务"
    echo "  $0 logs     # 查看服务日志"
    echo "  $0 status   # 查看服务状态"
}

# 主函数
main() {
    check_docker
    
    case "${1:-help}" in
        start)
            start_services
            ;;
        stop)
            stop_services
            ;;
        restart)
            restart_services
            ;;
        logs)
            show_logs
            ;;
        status)
            show_status
            ;;
        update)
            update_services
            ;;
        backup)
            backup_data
            ;;
        cleanup)
            cleanup
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            log_error "未知命令: $1"
            show_help
            exit 1
            ;;
    esac
}

# 运行主函数
main "$@" 