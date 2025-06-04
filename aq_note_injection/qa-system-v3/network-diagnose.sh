#!/bin/bash

echo "======================================="
echo "🔍 Docker网络诊断工具 v1.0"
echo "======================================="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
    fi
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# 1. 系统基础检查
echo -e "\n${BLUE}1. 系统基础环境检查${NC}"
echo "-----------------------------------"

# 检查操作系统
print_info "操作系统: $(uname -s) $(uname -r)"

# 检查Docker版本
docker --version >/dev/null 2>&1
print_status $? "Docker 版本: $(docker --version 2>/dev/null || echo '未安装')"

# 检查Docker Compose版本  
docker-compose --version >/dev/null 2>&1
print_status $? "Docker Compose 版本: $(docker-compose --version 2>/dev/null || echo '未安装')"

# 检查Docker服务状态
docker info >/dev/null 2>&1
print_status $? "Docker 服务状态"

# 2. 端口占用检查
echo -e "\n${BLUE}2. 端口占用检查${NC}"
echo "-----------------------------------"

check_port() {
    local port=$1
    local service=$2
    
    if command -v netstat >/dev/null 2>&1; then
        if netstat -tlnp 2>/dev/null | grep -q ":$port "; then
            print_warning "$service 端口 $port 已被占用"
            netstat -tlnp 2>/dev/null | grep ":$port " | head -1
        else
            print_status 0 "$service 端口 $port 可用"
        fi
    elif command -v ss >/dev/null 2>&1; then
        if ss -tlnp 2>/dev/null | grep -q ":$port "; then
            print_warning "$service 端口 $port 已被占用"
            ss -tlnp 2>/dev/null | grep ":$port " | head -1
        else
            print_status 0 "$service 端口 $port 可用"
        fi
    else
        print_warning "无法检查端口占用（netstat/ss 命令不可用）"
    fi
}

check_port 3000 "前端服务"
check_port 8000 "后端API"
check_port 3306 "MySQL数据库"
check_port 6379 "Redis缓存"

# 3. Docker网络状态
echo -e "\n${BLUE}3. Docker网络状态${NC}"
echo "-----------------------------------"

# 列出所有网络
print_info "当前Docker网络列表:"
docker network ls 2>/dev/null || print_warning "无法获取网络列表"

# 检查项目网络
PROJECT_NETWORK="qa-system-v3_qa-network"
if docker network ls | grep -q "$PROJECT_NETWORK"; then
    print_status 0 "项目网络 $PROJECT_NETWORK 存在"
    
    # 显示网络详情
    print_info "网络详细信息:"
    docker network inspect "$PROJECT_NETWORK" 2>/dev/null | grep -E '"Subnet"|"Gateway"|"IPAddress"' | head -5
else
    print_warning "项目网络 $PROJECT_NETWORK 不存在"
fi

# 4. 容器状态检查
echo -e "\n${BLUE}4. 容器状态检查${NC}"
echo "-----------------------------------"

if [ -f "docker-compose.yml" ]; then
    print_info "容器运行状态:"
    docker-compose ps 2>/dev/null || print_warning "无法获取容器状态"
    
    # 检查各个容器的运行状态
    containers=("qa-frontend" "qa-backend" "qa-mysql" "qa-redis")
    for container in "${containers[@]}"; do
        if docker ps | grep -q "$container"; then
            print_status 0 "容器 $container 正在运行"
        else
            print_warning "容器 $container 未运行"
        fi
    done
else
    print_warning "未找到 docker-compose.yml 文件"
fi

# 5. 容器间连通性测试
echo -e "\n${BLUE}5. 容器间连通性测试${NC}"
echo "-----------------------------------"

test_connectivity() {
    local from_container=$1
    local to_container=$2
    local description=$3
    
    if docker ps | grep -q "$from_container" && docker ps | grep -q "$to_container"; then
        if docker exec "$from_container" ping -c 2 "$to_container" >/dev/null 2>&1; then
            print_status 0 "$description"
        else
            print_status 1 "$description"
        fi
    else
        print_warning "$description (容器未运行)"
    fi
}

test_connectivity "qa-frontend" "qa-backend" "前端 -> 后端连通性"
test_connectivity "qa-backend" "qa-mysql" "后端 -> 数据库连通性"
test_connectivity "qa-backend" "qa-redis" "后端 -> Redis连通性"

# 6. 服务健康检查
echo -e "\n${BLUE}6. 服务健康检查${NC}"
echo "-----------------------------------"

# 检查后端API健康状态
if curl -s -f http://localhost:8000/health >/dev/null 2>&1; then
    print_status 0 "后端API健康检查"
    print_info "后端响应: $(curl -s http://localhost:8000/health 2>/dev/null || echo '无响应')"
else
    print_status 1 "后端API健康检查"
fi

# 检查前端服务
if curl -s -f http://localhost:3000/health >/dev/null 2>&1; then
    print_status 0 "前端服务健康检查"
else
    print_status 1 "前端服务健康检查"
fi

# 检查数据库连接
if docker exec qa-mysql mysqladmin ping -h localhost --silent 2>/dev/null; then
    print_status 0 "MySQL数据库连接"
else
    print_status 1 "MySQL数据库连接"
fi

# 7. 防火墙检查
echo -e "\n${BLUE}7. 防火墙状态检查${NC}"
echo "-----------------------------------"

# 检查UFW状态（Ubuntu/Debian）
if command -v ufw >/dev/null 2>&1; then
    ufw_status=$(sudo ufw status 2>/dev/null | head -1)
    print_info "UFW状态: $ufw_status"
fi

# 检查iptables规则
if command -v iptables >/dev/null 2>&1; then
    docker_rules=$(sudo iptables -L | grep -i docker | wc -l)
    print_info "Docker相关iptables规则数量: $docker_rules"
fi

# 8. 磁盘空间检查
echo -e "\n${BLUE}8. 系统资源检查${NC}"
echo "-----------------------------------"

# 检查磁盘空间
df -h . | tail -1 | while read line; do
    print_info "当前目录磁盘使用: $line"
done

# 检查Docker空间使用
if command -v docker >/dev/null 2>&1; then
    print_info "Docker磁盘使用情况:"
    docker system df 2>/dev/null || print_warning "无法获取Docker磁盘使用情况"
fi

# 检查内存使用
if command -v free >/dev/null 2>&1; then
    memory_info=$(free -h | grep Mem: | awk '{print "总计:"$2" 已用:"$3" 可用:"$7}')
    print_info "内存使用情况: $memory_info"
fi

# 9. 日志检查
echo -e "\n${BLUE}9. 容器日志检查${NC}"
echo "-----------------------------------"

if [ -f "docker-compose.yml" ]; then
    print_info "最近的错误日志:"
    
    # 检查各容器的错误日志
    containers=("qa-frontend" "qa-backend" "qa-mysql")
    for container in "${containers[@]}"; do
        if docker ps | grep -q "$container"; then
            error_count=$(docker logs "$container" 2>&1 | grep -i error | wc -l)
            if [ "$error_count" -gt 0 ]; then
                print_warning "$container 有 $error_count 条错误日志"
                echo "最新错误:"
                docker logs "$container" 2>&1 | grep -i error | tail -3
            else
                print_status 0 "$container 无错误日志"
            fi
        fi
    done
fi

# 10. 修复建议
echo -e "\n${BLUE}10. 修复建议${NC}"
echo "-----------------------------------"

print_info "如果发现问题，可以尝试以下修复方案:"
echo ""
echo "🔧 常用修复命令:"
echo "   重启所有服务: docker-compose restart"
echo "   重建网络: docker-compose down && docker network prune -f && docker-compose up -d"
echo "   清理系统: docker system prune -f"
echo "   查看日志: docker-compose logs [服务名]"
echo ""
echo "🌐 网络问题修复:"
echo "   重建Docker网络: docker network rm qa-system-v3_qa-network && docker-compose up -d"
echo "   检查防火墙: sudo ufw status && sudo ufw allow from 172.17.0.0/16"
echo "   使用host网络: 在docker-compose.yml中添加 network_mode: host"
echo ""
echo "📊 性能优化:"
echo "   释放内存: docker system prune -a --volumes"
echo "   重启Docker: sudo systemctl restart docker"

echo ""
echo "======================================="
echo "🎯 诊断完成! 检查上述结果并按建议进行修复"
echo "=======================================" 