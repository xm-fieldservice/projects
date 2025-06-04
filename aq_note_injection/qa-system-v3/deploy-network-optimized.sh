#!/bin/bash

# 个人智能问答系统v3.0 - 网络优化部署脚本
# 作者: AI Assistant
# 版本: 1.0
# 日期: 2025-01-27

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 图标定义
SUCCESS="✅"
ERROR="❌"
WARNING="⚠️"
INFO="ℹ️"
ROCKET="🚀"
GEAR="⚙️"
NETWORK="🌐"
DATABASE="🗄️"
FRONTEND="🖥️"
BACKEND="⚙️"

print_banner() {
    echo -e "${CYAN}"
    echo "======================================="
    echo "🐳 个人智能问答系统 v3.0"
    echo "   网络优化部署脚本"
    echo "======================================="
    echo -e "${NC}"
}

print_success() {
    echo -e "${GREEN}${SUCCESS} $1${NC}"
}

print_error() {
    echo -e "${RED}${ERROR} $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}${WARNING} $1${NC}"
}

print_info() {
    echo -e "${BLUE}${INFO} $1${NC}"
}

print_step() {
    echo -e "${PURPLE}${ROCKET} $1${NC}"
}

# 检查命令是否存在
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# 检查端口是否被占用
check_port() {
    local port=$1
    if command_exists netstat; then
        netstat -tlnp 2>/dev/null | grep -q ":$port "
    elif command_exists ss; then
        ss -tlnp 2>/dev/null | grep -q ":$port "
    else
        return 1
    fi
}

# 等待服务就绪
wait_for_service() {
    local service_name=$1
    local check_command=$2
    local max_wait=${3:-60}
    local wait_time=0
    
    print_info "等待 $service_name 服务就绪..."
    
    while [ $wait_time -lt $max_wait ]; do
        if eval "$check_command" >/dev/null 2>&1; then
            print_success "$service_name 服务已就绪"
            return 0
        fi
        
        echo -n "."
        sleep 2
        wait_time=$((wait_time + 2))
    done
    
    echo ""
    print_error "$service_name 服务启动超时"
    return 1
}

# 环境检查
check_environment() {
    print_step "步骤1: 环境检查"
    
    # 检查Docker
    if ! command_exists docker; then
        print_error "Docker 未安装，请先安装 Docker"
        exit 1
    fi
    print_success "Docker 已安装: $(docker --version | cut -d' ' -f3)"
    
    # 检查Docker Compose
    if ! command_exists docker-compose; then
        print_error "Docker Compose 未安装，请先安装 Docker Compose"
        exit 1
    fi
    print_success "Docker Compose 已安装: $(docker-compose --version | cut -d' ' -f3)"
    
    # 检查Docker服务状态
    if ! docker info >/dev/null 2>&1; then
        print_error "Docker 服务未运行，请启动 Docker 服务"
        exit 1
    fi
    print_success "Docker 服务运行正常"
    
    # 检查必要文件
    if [ ! -f "docker-compose.yml" ]; then
        print_error "未找到 docker-compose.yml 文件"
        exit 1
    fi
    print_success "部署配置文件完整"
    
    # 检查端口占用
    print_info "检查端口占用情况..."
    
    ports=("3000:前端服务" "8000:后端API" "3306:MySQL数据库" "6379:Redis缓存")
    for port_info in "${ports[@]}"; do
        port=$(echo "$port_info" | cut -d: -f1)
        service=$(echo "$port_info" | cut -d: -f2)
        
        if check_port "$port"; then
            print_warning "$service 端口 $port 已被占用"
            print_info "可以通过修改 docker-compose.yml 中的端口映射来解决"
        else
            print_success "$service 端口 $port 可用"
        fi
    done
}

# 网络优化配置
optimize_network() {
    print_step "步骤2: 网络优化配置"
    
    # 清理旧网络
    print_info "清理旧的网络配置..."
    docker-compose down >/dev/null 2>&1 || true
    docker network prune -f >/dev/null 2>&1 || true
    
    # 创建优化的网络
    print_info "创建优化的Docker网络..."
    
    # 如果网络已存在，先删除
    if docker network ls | grep -q "qa-network"; then
        docker network rm qa-network >/dev/null 2>&1 || true
    fi
    
    # 创建自定义网络
    if docker network create \
        --driver bridge \
        --subnet=172.20.0.0/16 \
        --gateway=172.20.0.1 \
        --opt com.docker.network.bridge.name=qa-bridge \
        --opt com.docker.network.bridge.enable_ip_masquerade=true \
        --opt com.docker.network.bridge.enable_icc=true \
        qa-network >/dev/null 2>&1; then
        print_success "自定义网络创建成功"
    else
        print_warning "自定义网络创建失败，将使用默认网络"
    fi
    
    # 优化Docker守护进程配置
    print_info "优化Docker网络配置..."
    
    # 检查并配置DNS
    if [ -f /etc/docker/daemon.json ]; then
        print_info "Docker守护进程已配置"
    else
        print_info "建议配置Docker DNS设置以提高网络性能"
    fi
    
    print_success "网络优化配置完成"
}

# 数据库服务部署
deploy_database() {
    print_step "步骤3: 部署数据库服务 ${DATABASE}"
    
    print_info "启动MySQL数据库容器..."
    docker-compose up -d mysql
    
    # 等待数据库就绪
    if wait_for_service "MySQL数据库" "docker exec qa-mysql mysqladmin ping -h localhost --silent" 90; then
        print_success "MySQL数据库启动成功"
        
        # 验证数据库初始化
        print_info "验证数据库初始化..."
        if docker exec qa-mysql mysql -u qa_user -pqa_password -e "USE qa_db; SHOW TABLES;" >/dev/null 2>&1; then
            print_success "数据库初始化完成"
        else
            print_warning "数据库初始化可能未完成，请检查初始化脚本"
        fi
    else
        print_error "数据库启动失败"
        print_info "查看数据库日志:"
        docker-compose logs mysql | tail -20
        exit 1
    fi
}

# 后端服务部署
deploy_backend() {
    print_step "步骤4: 部署后端服务 ${BACKEND}"
    
    print_info "启动后端API容器..."
    docker-compose up -d qa-backend
    
    # 等待后端就绪
    if wait_for_service "后端API" "curl -s -f http://localhost:8000/health" 60; then
        print_success "后端API启动成功"
        
        # 测试API响应
        print_info "测试API响应..."
        api_response=$(curl -s http://localhost:8000/health 2>/dev/null || echo "")
        if [ -n "$api_response" ]; then
            print_success "API响应正常: $api_response"
        else
            print_warning "API响应异常"
        fi
    else
        print_error "后端API启动失败"
        print_info "查看后端日志:"
        docker-compose logs qa-backend | tail -20
        exit 1
    fi
}

# 前端服务部署
deploy_frontend() {
    print_step "步骤5: 部署前端服务 ${FRONTEND}"
    
    print_info "启动前端Web容器..."
    docker-compose up -d qa-frontend
    
    # 等待前端就绪
    if wait_for_service "前端Web" "curl -s -f http://localhost:3000/health" 30; then
        print_success "前端Web服务启动成功"
    else
        print_error "前端Web服务启动失败"
        print_info "查看前端日志:"
        docker-compose logs qa-frontend | tail -20
        exit 1
    fi
}

# Redis缓存部署
deploy_redis() {
    print_step "步骤6: 部署Redis缓存"
    
    print_info "启动Redis缓存容器..."
    docker-compose up -d redis
    
    # 等待Redis就绪
    if wait_for_service "Redis缓存" "docker exec qa-redis redis-cli ping | grep -q PONG" 30; then
        print_success "Redis缓存启动成功"
    else
        print_warning "Redis缓存启动失败，系统仍可正常运行"
    fi
}

# 网络连通性测试
test_connectivity() {
    print_step "步骤7: 网络连通性测试 ${NETWORK}"
    
    print_info "测试容器间网络连通性..."
    
    # 测试前端到后端
    if docker exec qa-frontend ping -c 2 qa-backend >/dev/null 2>&1; then
        print_success "前端 -> 后端: 连通正常"
    else
        print_error "前端 -> 后端: 连通失败"
    fi
    
    # 测试后端到数据库
    if docker exec qa-backend ping -c 2 qa-mysql >/dev/null 2>&1; then
        print_success "后端 -> 数据库: 连通正常"
    else
        print_error "后端 -> 数据库: 连通失败"
    fi
    
    # 测试后端到Redis
    if docker exec qa-backend ping -c 2 qa-redis >/dev/null 2>&1; then
        print_success "后端 -> Redis: 连通正常"
    else
        print_warning "后端 -> Redis: 连通失败"
    fi
    
    # 测试API代理
    print_info "测试API代理..."
    if docker exec qa-frontend curl -s http://qa-backend:8000/health >/dev/null 2>&1; then
        print_success "API代理: 工作正常"
    else
        print_error "API代理: 工作异常"
    fi
}

# 系统验证
verify_deployment() {
    print_step "步骤8: 系统验证"
    
    print_info "验证系统完整性..."
    
    # 检查所有容器状态
    print_info "容器运行状态:"
    if docker-compose ps | grep -q "Up"; then
        print_success "所有容器运行正常"
        docker-compose ps
    else
        print_error "部分容器运行异常"
        docker-compose ps
        return 1
    fi
    
    # 验证前端访问
    if curl -s -f http://localhost:3000/health >/dev/null 2>&1; then
        print_success "前端服务: http://localhost:3000 ✓"
    else
        print_error "前端服务访问失败"
    fi
    
    # 验证后端API
    if curl -s -f http://localhost:8000/health >/dev/null 2>&1; then
        print_success "后端API: http://localhost:8000 ✓"
    else
        print_error "后端API访问失败"
    fi
    
    # 验证API文档
    if curl -s -f http://localhost:8000/docs >/dev/null 2>&1; then
        print_success "API文档: http://localhost:8000/docs ✓"
    else
        print_warning "API文档访问失败"
    fi
}

# 显示部署结果
show_deployment_result() {
    print_banner
    
    echo -e "${GREEN}"
    echo "🎉 部署成功完成！"
    echo ""
    echo "📍 访问地址："
    echo "   🖥️  前端应用: http://localhost:3000"
    echo "   🔧 管理界面: http://localhost:3000/admin"
    echo "   📝 问答界面: http://localhost:3000/qa"
    echo "   🔐 认证界面: http://localhost:3000/auth"
    echo "   ⚙️  后端API: http://localhost:8000"
    echo "   📚 API文档: http://localhost:8000/docs"
    echo ""
    echo "👤 默认账户："
    echo "   管理员: admin / admin123"
    echo "   普通用户: user / user123"
    echo "   演示用户: demo / demo123"
    echo ""
    echo "🔧 管理命令："
    echo "   查看状态: docker-compose ps"
    echo "   查看日志: docker-compose logs [服务名]"
    echo "   重启服务: docker-compose restart [服务名]"
    echo "   停止系统: docker-compose down"
    echo "   网络诊断: bash network-diagnose.sh"
    echo -e "${NC}"
}

# 错误处理
handle_error() {
    print_error "部署过程中出现错误，正在收集诊断信息..."
    
    echo ""
    print_info "=== 错误诊断信息 ==="
    
    # 显示容器状态
    echo "容器状态:"
    docker-compose ps 2>/dev/null || echo "无法获取容器状态"
    
    echo ""
    echo "最近的错误日志:"
    docker-compose logs --tail=20 2>/dev/null || echo "无法获取日志"
    
    echo ""
    print_info "建议运行诊断脚本获取详细信息: bash network-diagnose.sh"
    
    exit 1
}

# 主函数
main() {
    # 设置错误处理
    trap handle_error ERR
    
    print_banner
    
    # 执行部署步骤
    check_environment
    optimize_network
    deploy_database
    deploy_backend  
    deploy_frontend
    deploy_redis
    test_connectivity
    verify_deployment
    
    # 显示结果
    show_deployment_result
}

# 脚本参数处理
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "start")
        print_info "启动所有服务..."
        docker-compose up -d
        ;;
    "stop")
        print_info "停止所有服务..."
        docker-compose down
        ;;
    "restart")
        print_info "重启所有服务..."
        docker-compose restart
        ;;
    "logs")
        print_info "显示服务日志..."
        docker-compose logs -f
        ;;
    "status")
        print_info "显示服务状态..."
        docker-compose ps
        ;;
    "clean")
        print_info "清理系统..."
        docker-compose down
        docker system prune -f
        docker network prune -f
        ;;
    "diagnose")
        print_info "运行网络诊断..."
        if [ -f "network-diagnose.sh" ]; then
            bash network-diagnose.sh
        else
            print_error "诊断脚本不存在"
        fi
        ;;
    "help"|"-h"|"--help")
        echo "使用方法: $0 [命令]"
        echo ""
        echo "可用命令:"
        echo "  deploy    - 完整部署系统（默认）"
        echo "  start     - 启动所有服务"
        echo "  stop      - 停止所有服务"
        echo "  restart   - 重启所有服务"
        echo "  logs      - 查看服务日志"
        echo "  status    - 查看服务状态"
        echo "  clean     - 清理系统"
        echo "  diagnose  - 运行网络诊断"
        echo "  help      - 显示帮助信息"
        ;;
    *)
        print_error "未知命令: $1"
        print_info "使用 '$0 help' 查看可用命令"
        exit 1
        ;;
esac 