#!/bin/bash

# 自动化部署脚本
# 智能问答系统 v3.0 - 生产环境部署

set -e  # 遇到错误立即退出

# ===============================
# 配置变量
# ===============================

# 项目配置
PROJECT_NAME="qa-system-v3"
PROJECT_DIR="/opt/${PROJECT_NAME}"
BACKEND_DIR="${PROJECT_DIR}/backend"
COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE="env.production.template"

# 部署配置
DEPLOY_USER="deploy"
BACKUP_DIR="/opt/backups"
LOG_DIR="/var/log/${PROJECT_NAME}"
LOG_FILE="${LOG_DIR}/deploy.log"

# 服务配置
SERVICES=("app" "db" "redis" "nginx")
REQUIRED_PORTS=(80 443 5432 6379 8000)

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ===============================
# 函数定义
# ===============================

# 带颜色的日志输出
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a "$LOG_FILE"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}" | tee -a "$LOG_FILE"
}

warn() {
    echo -e "${YELLOW}[WARN] $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}" | tee -a "$LOG_FILE"
}

# 显示使用帮助
show_help() {
    cat << EOF
智能问答系统 v3.0 部署脚本

用法: $0 [选项] <命令>

命令:
  init        初始化部署环境
  deploy      执行完整部署
  update      更新应用（不重建数据库）
  rollback    回滚到上一个版本
  status      检查服务状态
  logs        查看服务日志
  backup      执行数据库备份
  cleanup     清理旧的镜像和容器
  ssl         配置SSL证书

选项:
  -h, --help        显示此帮助信息
  -e, --env FILE    指定环境文件 (默认: ${ENV_FILE})
  -f, --force       强制执行（跳过确认）
  -v, --verbose     详细输出
  --dry-run         演练模式（不执行实际操作）

示例:
  $0 init                    # 初始化部署环境
  $0 deploy                  # 执行完整部署
  $0 update --force          # 强制更新应用
  $0 logs app                # 查看app服务日志
  $0 backup                  # 执行数据库备份

EOF
}

# 检查系统要求
check_system_requirements() {
    log "检查系统要求..."
    
    # 检查操作系统
    if [[ ! -f /etc/os-release ]]; then
        error "不支持的操作系统"
        return 1
    fi
    
    # 检查内存（至少4GB）
    local mem_gb=$(free -g | awk '/^Mem:/{print $2}')
    if [[ $mem_gb -lt 4 ]]; then
        warn "系统内存不足4GB，可能影响性能"
    fi
    
    # 检查磁盘空间（至少10GB）
    local disk_gb=$(df / | awk 'NR==2 {print int($4/1024/1024)}')
    if [[ $disk_gb -lt 10 ]]; then
        error "磁盘空间不足10GB"
        return 1
    fi
    
    info "系统要求检查通过"
}

# 检查依赖软件
check_dependencies() {
    log "检查依赖软件..."
    
    local missing_deps=()
    
    # 检查 Docker
    if ! command -v docker &> /dev/null; then
        missing_deps+=("docker")
    fi
    
    # 检查 Docker Compose
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        missing_deps+=("docker-compose")
    fi
    
    # 检查 Git
    if ! command -v git &> /dev/null; then
        missing_deps+=("git")
    fi
    
    # 检查 curl
    if ! command -v curl &> /dev/null; then
        missing_deps+=("curl")
    fi
    
    if [[ ${#missing_deps[@]} -gt 0 ]]; then
        error "缺少依赖软件: ${missing_deps[*]}"
        info "请先安装缺少的软件包"
        return 1
    fi
    
    info "依赖软件检查通过"
}

# 检查端口占用
check_port_availability() {
    log "检查端口占用..."
    
    local occupied_ports=()
    
    for port in "${REQUIRED_PORTS[@]}"; do
        if netstat -tuln | grep -q ":$port "; then
            occupied_ports+=("$port")
        fi
    done
    
    if [[ ${#occupied_ports[@]} -gt 0 ]]; then
        warn "以下端口已被占用: ${occupied_ports[*]}"
        warn "请确保这些端口可用于本应用"
    fi
    
    info "端口检查完成"
}

# 创建部署用户
create_deploy_user() {
    if [[ $EUID -ne 0 ]]; then
        warn "需要root权限创建部署用户"
        return 0
    fi
    
    log "创建部署用户..."
    
    if ! id "$DEPLOY_USER" &>/dev/null; then
        useradd -m -s /bin/bash "$DEPLOY_USER"
        usermod -aG docker "$DEPLOY_USER"
        info "已创建部署用户: $DEPLOY_USER"
    else
        info "部署用户已存在: $DEPLOY_USER"
    fi
}

# 创建目录结构
create_directories() {
    log "创建目录结构..."
    
    local dirs=(
        "$PROJECT_DIR"
        "$BACKEND_DIR"
        "$BACKUP_DIR"
        "$LOG_DIR"
        "${BACKEND_DIR}/data/uploads"
        "${BACKEND_DIR}/data/logs"
        "${BACKEND_DIR}/data/postgres"
        "${BACKEND_DIR}/data/redis"
        "${BACKEND_DIR}/data/backups"
        "${BACKEND_DIR}/ssl"
        "${BACKEND_DIR}/static"
    )
    
    for dir in "${dirs[@]}"; do
        mkdir -p "$dir"
        chown -R "$DEPLOY_USER:$DEPLOY_USER" "$dir" 2>/dev/null || true
    done
    
    info "目录结构创建完成"
}

# 配置环境文件
setup_environment_file() {
    log "配置环境文件..."
    
    local env_source="${BACKEND_DIR}/${ENV_FILE}"
    local env_target="${BACKEND_DIR}/.env"
    
    if [[ ! -f "$env_source" ]]; then
        error "环境文件模板不存在: $env_source"
        return 1
    fi
    
    if [[ ! -f "$env_target" ]]; then
        cp "$env_source" "$env_target"
        warn "已创建环境文件: $env_target"
        warn "请编辑此文件并配置生产环境参数！"
        
        # 生成随机密钥
        local secret_key=$(openssl rand -hex 32)
        sed -i "s/your-production-secret-key-must-be-changed-use-openssl-rand-hex-32/$secret_key/" "$env_target"
        
        info "已生成安全密钥"
    else
        info "环境文件已存在: $env_target"
    fi
}

# 配置SSL证书
setup_ssl_certificates() {
    log "配置SSL证书..."
    
    local ssl_dir="${BACKEND_DIR}/ssl"
    local cert_file="${ssl_dir}/qa-system.crt"
    local key_file="${ssl_dir}/qa-system.key"
    
    if [[ ! -f "$cert_file" ]] || [[ ! -f "$key_file" ]]; then
        warn "SSL证书不存在，创建自签名证书用于测试"
        
        # 生成自签名证书
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout "$key_file" \
            -out "$cert_file" \
            -subj "/C=CN/ST=State/L=City/O=Organization/CN=qa-system.local"
        
        chmod 600 "$key_file"
        chmod 644 "$cert_file"
        
        warn "已创建自签名SSL证书，生产环境请使用正式证书"
    else
        info "SSL证书已存在"
    fi
}

# 构建Docker镜像
build_images() {
    log "构建Docker镜像..."
    
    cd "$BACKEND_DIR"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        info "[DRY-RUN] 将执行: docker-compose -f $COMPOSE_FILE build"
        return 0
    fi
    
    if docker-compose -f "$COMPOSE_FILE" build --no-cache; then
        info "Docker镜像构建成功"
    else
        error "Docker镜像构建失败"
        return 1
    fi
}

# 启动服务
start_services() {
    log "启动服务..."
    
    cd "$BACKEND_DIR"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        info "[DRY-RUN] 将执行: docker-compose -f $COMPOSE_FILE up -d"
        return 0
    fi
    
    # 启动数据库和Redis
    docker-compose -f "$COMPOSE_FILE" up -d db redis
    sleep 10
    
    # 等待数据库启动
    log "等待数据库启动..."
    local retries=30
    while [[ $retries -gt 0 ]]; do
        if docker-compose -f "$COMPOSE_FILE" exec -T db pg_isready -U postgres &>/dev/null; then
            break
        fi
        sleep 2
        ((retries--))
    done
    
    if [[ $retries -eq 0 ]]; then
        error "数据库启动超时"
        return 1
    fi
    
    # 启动应用
    docker-compose -f "$COMPOSE_FILE" up -d app
    sleep 5
    
    # 启动Nginx
    docker-compose -f "$COMPOSE_FILE" up -d nginx
    
    info "服务启动完成"
}

# 健康检查
health_check() {
    log "执行健康检查..."
    
    local checks=(
        "http://localhost/health"
        "http://localhost/api/v1/docs"
    )
    
    for url in "${checks[@]}"; do
        if curl -sf "$url" >/dev/null; then
            info "健康检查通过: $url"
        else
            warn "健康检查失败: $url"
        fi
    done
}

# 显示服务状态
show_status() {
    log "服务状态:"
    
    cd "$BACKEND_DIR"
    docker-compose -f "$COMPOSE_FILE" ps
    
    echo
    log "服务日志 (最近10行):"
    docker-compose -f "$COMPOSE_FILE" logs --tail=10
}

# 备份当前部署
backup_current_deployment() {
    if [[ -d "$BACKEND_DIR" ]]; then
        local backup_name="backup_$(date +%Y%m%d_%H%M%S)"
        local backup_path="${BACKUP_DIR}/${backup_name}"
        
        log "备份当前部署到: $backup_path"
        
        mkdir -p "$backup_path"
        cp -r "$BACKEND_DIR" "$backup_path/"
        
        info "备份完成"
    fi
}

# 初始化部署环境
init_deployment() {
    log "开始初始化部署环境..."
    
    check_system_requirements
    check_dependencies
    check_port_availability
    create_deploy_user
    create_directories
    setup_environment_file
    setup_ssl_certificates
    
    log "部署环境初始化完成"
    warn "请编辑 ${BACKEND_DIR}/.env 文件配置生产环境参数"
}

# 执行完整部署
full_deploy() {
    log "开始完整部署..."
    
    backup_current_deployment
    build_images
    start_services
    sleep 10
    health_check
    show_status
    
    log "部署完成！"
    info "访问地址: https://localhost"
    info "API文档: https://localhost/api/v1/docs"
}

# 更新应用
update_application() {
    log "开始更新应用..."
    
    cd "$BACKEND_DIR"
    
    # 停止应用服务
    docker-compose -f "$COMPOSE_FILE" stop app nginx
    
    # 重新构建
    build_images
    
    # 启动服务
    docker-compose -f "$COMPOSE_FILE" up -d app nginx
    
    sleep 10
    health_check
    
    log "应用更新完成"
}

# 清理资源
cleanup_resources() {
    log "清理资源..."
    
    # 清理停止的容器
    docker container prune -f
    
    # 清理未使用的镜像
    docker image prune -f
    
    # 清理未使用的网络
    docker network prune -f
    
    # 清理未使用的卷
    docker volume prune -f
    
    info "资源清理完成"
}

# 主函数
main() {
    # 解析命令行参数
    local command=""
    local force=false
    local verbose=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -e|--env)
                ENV_FILE="$2"
                shift 2
                ;;
            -f|--force)
                force=true
                shift
                ;;
            -v|--verbose)
                verbose=true
                set -x
                shift
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            init|deploy|update|rollback|status|logs|backup|cleanup|ssl)
                command="$1"
                shift
                ;;
            *)
                error "未知参数: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    # 检查命令
    if [[ -z "$command" ]]; then
        error "请指定命令"
        show_help
        exit 1
    fi
    
    # 创建日志目录
    mkdir -p "$LOG_DIR"
    
    # 记录开始时间
    log "=========================================="
    log "开始执行: $command"
    log "执行时间: $(date)"
    log "执行用户: $(whoami)"
    log "=========================================="
    
    # 执行命令
    case $command in
        init)
            init_deployment
            ;;
        deploy)
            if [[ "$force" == true ]] || confirm "确认执行完整部署？"; then
                full_deploy
            fi
            ;;
        update)
            if [[ "$force" == true ]] || confirm "确认更新应用？"; then
                update_application
            fi
            ;;
        status)
            show_status
            ;;
        cleanup)
            if [[ "$force" == true ]] || confirm "确认清理资源？"; then
                cleanup_resources
            fi
            ;;
        *)
            error "未实现的命令: $command"
            exit 1
            ;;
    esac
    
    log "命令执行完成: $command"
}

# 确认函数
confirm() {
    if [[ "$force" == true ]]; then
        return 0
    fi
    
    local message="$1"
    echo -n "$message [y/N]: "
    read -r response
    case $response in
        [yY]|[yY][eE][sS])
            return 0
            ;;
        *)
            return 1
            ;;
    esac
}

# 脚本入口
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi 