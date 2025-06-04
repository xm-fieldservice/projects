#!/bin/bash
# 智能问答系统 v3.0 一键部署脚本
# 支持 Linux/macOS 环境

set -e  # 遇到错误立即退出

# 颜色定义
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

# 项目信息
PROJECT_NAME="qa-system-v3"
VERSION="v3.0.0"
COMPOSE_FILE="deploy-block/docker-compose.yml"

# 显示欢迎信息
show_banner() {
    echo -e "${GREEN}"
    echo "=================================================="
    echo "   🚀 智能问答系统 v3.0 部署工具"
    echo "   版本: ${VERSION}"
    echo "   架构: 完整解耦版"
    echo "=================================================="
    echo -e "${NC}"
}

# 检查系统要求
check_requirements() {
    log_info "检查系统要求..."
    
    # 检查 Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker 未安装。请先安装 Docker: https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    # 检查 Docker Compose
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose 未安装。请先安装 Docker Compose"
        exit 1
    fi
    
    # 检查 Docker 服务状态
    if ! docker info &> /dev/null; then
        log_error "Docker 服务未运行。请启动 Docker 服务"
        exit 1
    fi
    
    log_success "系统要求检查通过"
}

# 创建必要的目录
create_directories() {
    log_info "创建必要的目录..."
    
    mkdir -p deploy-block/data/{mysql,redis,uploads}
    mkdir -p deploy-block/logs/{nginx,backend}
    mkdir -p deploy-block/mysql/{init,conf}
    mkdir -p deploy-block/redis
    mkdir -p deploy-block/nginx/ssl
    
    log_success "目录创建完成"
}

# 生成环境配置文件
generate_env() {
    log_info "生成环境配置文件..."
    
    if [ ! -f .env ]; then
        cat > .env << EOF
# 智能问答系统 v3.0 环境配置

# 数据库配置
MYSQL_ROOT_PASSWORD=$(openssl rand -base64 32)
MYSQL_PASSWORD=qa_password_$(openssl rand -base64 8)

# JWT密钥
JWT_SECRET_KEY=$(openssl rand -base64 64)

# 环境设置
NODE_ENV=production
DEBUG=false
LOG_LEVEL=INFO

# 端口配置
FRONTEND_PORT=3000
BACKEND_PORT=8000
MYSQL_PORT=3306
REDIS_PORT=6379

# 生成时间
GENERATED_AT=$(date)
EOF
        log_success "环境配置文件已生成: .env"
    else
        log_info "环境配置文件已存在，跳过生成"
    fi
}

# 生成数据库初始化脚本
generate_db_init() {
    log_info "生成数据库初始化脚本..."
    
    cat > deploy-block/mysql/init/01-init.sql << 'EOF'
-- 智能问答系统 v3.0 数据库初始化脚本

-- 创建用户表
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100),
    email VARCHAR(100),
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'user', 'demo') DEFAULT 'user',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建内容表
CREATE TABLE IF NOT EXISTS contents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    content_type ENUM('qa', 'note') DEFAULT 'note',
    tags JSON,
    agent_id VARCHAR(50),
    ai_response TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_type (user_id, content_type),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建系统日志表
CREATE TABLE IF NOT EXISTS system_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    level ENUM('info', 'warning', 'error') NOT NULL,
    message TEXT NOT NULL,
    source VARCHAR(50),
    details JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_level_time (level, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 插入默认管理员用户 (密码: admin123)
INSERT IGNORE INTO users (username, display_name, email, password_hash, role) 
VALUES ('admin', '系统管理员', 'admin@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj1fLpUo8kKS', 'admin');

-- 插入演示用户 (密码: demo123)
INSERT IGNORE INTO users (username, display_name, email, password_hash, role) 
VALUES ('demo', '演示用户', 'demo@example.com', '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'demo');

-- 插入测试内容
INSERT IGNORE INTO contents (user_id, title, content, content_type, tags) 
VALUES (1, '欢迎使用智能问答系统', '这是一个测试笔记，用于验证系统功能。', 'note', '["测试", "欢迎"]');

EOF
    
    log_success "数据库初始化脚本已生成"
}

# 生成 Redis 配置
generate_redis_config() {
    log_info "生成 Redis 配置..."
    
    cat > deploy-block/redis/redis.conf << 'EOF'
# Redis 配置文件
bind 0.0.0.0
port 6379
timeout 300
keepalive 60
maxmemory 256mb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
EOF
    
    log_success "Redis 配置已生成"
}

# 构建和启动服务
deploy_services() {
    log_info "开始部署服务..."
    
    # 停止现有服务
    log_info "停止现有服务..."
    docker-compose -f $COMPOSE_FILE down --remove-orphans || true
    
    # 构建镜像
    log_info "构建 Docker 镜像..."
    docker-compose -f $COMPOSE_FILE build --no-cache
    
    # 启动服务
    log_info "启动服务..."
    docker-compose -f $COMPOSE_FILE up -d
    
    log_success "服务部署完成"
}

# 等待服务启动
wait_for_services() {
    log_info "等待服务启动..."
    
    # 等待数据库
    log_info "等待数据库启动..."
    for i in {1..30}; do
        if docker-compose -f $COMPOSE_FILE exec -T mysql mysqladmin ping -h localhost --silent; then
            log_success "数据库已启动"
            break
        fi
        if [ $i -eq 30 ]; then
            log_error "数据库启动超时"
            exit 1
        fi
        sleep 2
    done
    
    # 等待后端服务
    log_info "等待后端服务启动..."
    for i in {1..30}; do
        if curl -f http://localhost:8000/api/v1/health &> /dev/null; then
            log_success "后端服务已启动"
            break
        fi
        if [ $i -eq 30 ]; then
            log_error "后端服务启动超时"
            exit 1
        fi
        sleep 2
    done
    
    # 等待前端服务
    log_info "等待前端服务启动..."
    for i in {1..30}; do
        if curl -f http://localhost:3000/health &> /dev/null; then
            log_success "前端服务已启动"
            break
        fi
        if [ $i -eq 30 ]; then
            log_error "前端服务启动超时"
            exit 1
        fi
        sleep 2
    done
}

# 检查服务状态
check_services() {
    log_info "检查服务状态..."
    
    echo ""
    echo "=== 服务状态 ==="
    docker-compose -f $COMPOSE_FILE ps
    
    echo ""
    echo "=== 健康检查 ==="
    
    # 前端健康检查
    if curl -f http://localhost:3000/health &> /dev/null; then
        log_success "前端服务: ✅ 正常"
    else
        log_error "前端服务: ❌ 异常"
    fi
    
    # 后端健康检查
    if curl -f http://localhost:8000/api/v1/health &> /dev/null; then
        log_success "后端服务: ✅ 正常"
    else
        log_error "后端服务: ❌ 异常"
    fi
    
    # 数据库健康检查
    if docker-compose -f $COMPOSE_FILE exec -T mysql mysqladmin ping -h localhost --silent; then
        log_success "数据库服务: ✅ 正常"
    else
        log_error "数据库服务: ❌ 异常"
    fi
}

# 显示访问信息
show_access_info() {
    echo ""
    echo -e "${GREEN}=================================================="
    echo "   🎉 部署完成！"
    echo "=================================================="
    echo -e "${NC}"
    echo "📱 前端访问地址:"
    echo "   主页: http://localhost:3000"
    echo "   管理界面: http://localhost:3000/admin.html"
    echo ""
    echo "🔌 后端API地址:"
    echo "   API文档: http://localhost:8000/docs"
    echo "   健康检查: http://localhost:8000/api/v1/health"
    echo ""
    echo "🗄️ 数据库连接:"
    echo "   地址: localhost:3306"
    echo "   数据库: qa_db"
    echo "   用户: qa_user"
    echo ""
    echo "👤 默认用户:"
    echo "   管理员: admin / admin123"
    echo "   演示用户: demo / demo123"
    echo ""
    echo "📋 常用命令:"
    echo "   查看日志: docker-compose -f $COMPOSE_FILE logs -f"
    echo "   停止服务: docker-compose -f $COMPOSE_FILE down"
    echo "   重启服务: docker-compose -f $COMPOSE_FILE restart"
    echo ""
}

# 主函数
main() {
    show_banner
    
    # 检查参数
    case "${1:-}" in
        "stop")
            log_info "停止服务..."
            docker-compose -f $COMPOSE_FILE down
            log_success "服务已停止"
            exit 0
            ;;
        "restart")
            log_info "重启服务..."
            docker-compose -f $COMPOSE_FILE restart
            log_success "服务已重启"
            exit 0
            ;;
        "logs")
            docker-compose -f $COMPOSE_FILE logs -f
            exit 0
            ;;
        "status")
            check_services
            exit 0
            ;;
        "clean")
            log_warning "清理所有数据..."
            read -p "确定要清理所有数据吗？(y/N): " confirm
            if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
                docker-compose -f $COMPOSE_FILE down -v --remove-orphans
                docker system prune -f
                rm -rf deploy-block/data deploy-block/logs
                log_success "清理完成"
            fi
            exit 0
            ;;
        "help"|"-h"|"--help")
            echo "用法: $0 [命令]"
            echo ""
            echo "命令:"
            echo "  (无参数)  - 完整部署"
            echo "  stop      - 停止服务"
            echo "  restart   - 重启服务"
            echo "  logs      - 查看日志"
            echo "  status    - 检查状态"
            echo "  clean     - 清理数据"
            echo "  help      - 显示帮助"
            exit 0
            ;;
    esac
    
    # 执行部署流程
    check_requirements
    create_directories
    generate_env
    generate_db_init
    generate_redis_config
    deploy_services
    wait_for_services
    check_services
    show_access_info
}

# 执行主函数
main "$@" 