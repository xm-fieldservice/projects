# 🐳 个人智能问答系统v3.0 - Docker部署完整说明

## 📋 部署前准备检查

### 1. 系统要求
- **Docker版本**: >= 20.10.0
- **Docker Compose版本**: >= 1.29.0  
- **内存要求**: 至少4GB可用内存
- **磁盘空间**: 至少5GB可用空间
- **端口要求**: 3000、8000、3306、6379端口未被占用

### 2. 检查Docker环境
```bash
# 检查Docker版本
docker --version
docker-compose --version

# 检查Docker服务状态
docker info

# 检查端口占用情况
netstat -tlnp | grep -E "(3000|8000|3306|6379)"
# Windows系统使用：
netstat -an | findstr "3000 8000 3306 6379"
```

## 🌐 网络问题排查与解决

### 问题1: Docker网络连接失败

**症状**：容器无法互相访问，API请求失败
**原因**：Docker网络配置问题或防火墙阻挡

**解决方案**：

#### 方案A: 重建Docker网络
```bash
# 1. 停止所有容器
docker-compose down

# 2. 清理网络
docker network prune -f

# 3. 检查并删除冲突网络
docker network ls
docker network rm qa-system-v3_qa-network

# 4. 重新启动
docker-compose up -d
```

#### 方案B: 使用host网络模式
如果桥接网络有问题，修改 `docker-compose.yml`：

```yaml
version: '3.8'

services:
  qa-frontend:
    # ... 其他配置
    network_mode: "host"
    ports:
      - "3000:80"
    
  qa-backend:
    # ... 其他配置  
    network_mode: "host"
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=mysql://qa_user:qa_password@localhost:3306/qa_db
```

### 问题2: 容器间服务发现失败

**症状**：前端无法连接后端，后端无法连接数据库
**原因**：服务名解析问题

**解决方案**：

#### 方案A: 使用固定IP配置
修改 `docker-compose.yml` 添加固定IP：

```yaml
networks:
  qa-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16

services:
  qa-frontend:
    networks:
      qa-network:
        ipv4_address: 172.20.0.10
    
  qa-backend:
    networks:
      qa-network:
        ipv4_address: 172.20.0.20
    environment:
      - DATABASE_URL=mysql://qa_user:qa_password@172.20.0.30:3306/qa_db
    
  mysql:
    networks:
      qa-network:
        ipv4_address: 172.20.0.30
```

#### 方案B: 添加别名配置
```yaml
services:
  qa-backend:
    networks:
      qa-network:
        aliases:
          - backend
          - api
    
  mysql:
    networks:
      qa-network:
        aliases:
          - database
          - db
```

### 问题3: 防火墙阻挡容器通信

**Linux系统解决方案**：
```bash
# 1. 检查防火墙状态
sudo ufw status
sudo iptables -L

# 2. 允许Docker网络
sudo ufw allow from 172.17.0.0/16
sudo ufw allow from 172.20.0.0/16

# 3. 重启Docker服务
sudo systemctl restart docker
```

**Windows系统解决方案**：
```powershell
# 1. 关闭Windows防火墙（临时测试）
netsh advfirewall set allprofiles state off

# 2. 或者添加防火墙规则
netsh advfirewall firewall add rule name="Docker Ports" dir=in action=allow protocol=TCP localport=3000,8000,3306,6379
```

## 🚀 标准部署流程

### 步骤1: 环境准备
```bash
# 1. 创建部署目录
mkdir -p /opt/qa-system-v3
cd /opt/qa-system-v3

# 2. 解压部署包
unzip qa-system-v3-deploy.zip
cd qa-system-v3

# 3. 设置权限
chmod +x deploy.sh
chmod 755 logs uploads
```

### 步骤2: 网络预检查
```bash
# 1. 创建测试网络
docker network create test-network

# 2. 运行测试容器
docker run -d --name test-nginx --network test-network nginx:alpine
docker run -d --name test-mysql --network test-network mysql:8.0

# 3. 测试连通性
docker exec test-nginx ping test-mysql

# 4. 清理测试
docker rm -f test-nginx test-mysql
docker network rm test-network
```

### 步骤3: 分步部署（推荐）
```bash
# 1. 首先启动数据库
docker-compose up -d mysql

# 2. 等待数据库就绪
docker-compose logs -f mysql
# 看到 "ready for connections" 后继续

# 3. 启动后端
docker-compose up -d qa-backend

# 4. 检查后端健康
curl http://localhost:8000/health

# 5. 启动前端和Redis
docker-compose up -d qa-frontend redis
```

### 步骤4: 验证部署
```bash
# 1. 检查所有容器状态
docker-compose ps

# 2. 检查网络连接
docker exec qa-frontend ping qa-backend
docker exec qa-backend ping mysql

# 3. 测试API接口
curl http://localhost:8000/api/health
curl http://localhost:3000/health

# 4. 检查日志
docker-compose logs qa-frontend
docker-compose logs qa-backend
```

## 🔧 网络故障诊断脚本

创建诊断脚本 `network-diagnose.sh`：

```bash
#!/bin/bash

echo "=== Docker网络诊断开始 ==="

# 1. 检查Docker版本
echo "1. Docker版本检查"
docker --version
docker-compose --version

# 2. 检查网络状态
echo "2. Docker网络状态"
docker network ls
docker network inspect qa-system-v3_qa-network 2>/dev/null || echo "自定义网络不存在"

# 3. 检查容器状态
echo "3. 容器状态检查" 
docker-compose ps

# 4. 检查端口占用
echo "4. 端口占用检查"
netstat -tlnp | grep -E "(3000|8000|3306|6379)" || echo "端口未占用"

# 5. 测试容器间连通性
echo "5. 容器连通性测试"
docker exec qa-frontend ping -c 2 qa-backend 2>/dev/null && echo "前端->后端: 通" || echo "前端->后端: 不通"
docker exec qa-backend ping -c 2 mysql 2>/dev/null && echo "后端->数据库: 通" || echo "后端->数据库: 不通"

# 6. 测试API接口
echo "6. API接口测试"
curl -s http://localhost:8000/health && echo "后端API: 正常" || echo "后端API: 异常"
curl -s http://localhost:3000/health && echo "前端服务: 正常" || echo "前端服务: 异常"

echo "=== 诊断完成 ==="
```

## 🐛 常见问题解决

### 问题1: 端口冲突
```bash
# 查找占用进程
lsof -i :3000
lsof -i :8000

# 修改端口映射
# 在docker-compose.yml中修改：
ports:
  - "3001:80"    # 前端改为3001
  - "8001:8000"  # 后端改为8001
```

### 问题2: 数据库连接失败
```bash
# 1. 检查数据库容器日志
docker-compose logs mysql

# 2. 手动测试数据库连接
docker exec -it qa-mysql mysql -u qa_user -p qa_db

# 3. 重置数据库
docker-compose down
docker volume rm qa-system-v3_mysql_data
docker-compose up -d mysql
```

### 问题3: 前端无法访问后端API
```bash
# 1. 检查nginx配置
docker exec qa-frontend cat /etc/nginx/nginx.conf

# 2. 测试API代理
docker exec qa-frontend curl http://qa-backend:8000/health

# 3. 检查CORS配置
# 在backend环境变量中添加正确的前端地址
```

## 📊 网络配置优化建议

### 1. 生产环境网络配置
```yaml
networks:
  qa-network:
    driver: bridge
    driver_opts:
      com.docker.network.bridge.name: qa-bridge
      com.docker.network.bridge.enable_ip_masquerade: "true"
      com.docker.network.bridge.enable_icc: "true"
    ipam:
      config:
        - subnet: 172.20.0.0/16
          gateway: 172.20.0.1
```

### 2. 健康检查增强
```yaml
services:
  qa-backend:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

### 3. 日志配置优化
```yaml
services:
  qa-frontend:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

## 🔐 安全网络配置

### 1. 内部网络隔离
```yaml
networks:
  frontend-network:
    driver: bridge
  backend-network:
    driver: bridge
  
services:
  qa-frontend:
    networks:
      - frontend-network
      
  qa-backend:
    networks:
      - frontend-network  
      - backend-network
      
  mysql:
    networks:
      - backend-network
```

### 2. 网络策略配置
```yaml
services:
  qa-backend:
    networks:
      backend-network:
        aliases:
          - api-server
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE
```

## 🎯 一键部署脚本（网络优化版）

创建 `deploy-network-optimized.sh`：

```bash
#!/bin/bash

set -e

echo "🐳 开始网络优化部署..."

# 1. 环境检查
echo "检查Docker环境..."
docker --version >/dev/null 2>&1 || { echo "❌ Docker未安装"; exit 1; }
docker-compose --version >/dev/null 2>&1 || { echo "❌ Docker Compose未安装"; exit 1; }

# 2. 清理旧环境
echo "清理旧环境..."
docker-compose down 2>/dev/null || true
docker network prune -f
docker system prune -f

# 3. 创建自定义网络
echo "创建自定义网络..."
docker network create --driver bridge --subnet=172.20.0.0/16 qa-network 2>/dev/null || true

# 4. 分步启动服务
echo "启动数据库服务..."
docker-compose up -d mysql

echo "等待数据库就绪..."
timeout 60 bash -c 'until docker exec qa-mysql mysqladmin ping -h localhost --silent; do sleep 2; done'

echo "启动后端服务..."
docker-compose up -d qa-backend

echo "等待后端就绪..."
timeout 30 bash -c 'until curl -s http://localhost:8000/health >/dev/null; do sleep 2; done'

echo "启动前端和缓存服务..."
docker-compose up -d qa-frontend redis

# 5. 验证部署
echo "验证部署结果..."
sleep 10

if curl -s http://localhost:3000/health >/dev/null && curl -s http://localhost:8000/health >/dev/null; then
    echo "✅ 部署成功！"
    echo "📍 访问地址："
    echo "   前端: http://localhost:3000"
    echo "   后端API: http://localhost:8000"
    echo "   管理界面: http://localhost:3000/admin"
else
    echo "❌ 部署验证失败，请检查日志"
    docker-compose logs
    exit 1
fi
```

## 📞 技术支持

如果在部署过程中遇到网络问题，请按以下步骤收集信息：

1. **运行诊断脚本**：`bash network-diagnose.sh`
2. **收集日志**：`docker-compose logs > deployment.log`
3. **检查网络配置**：`docker network inspect qa-system-v3_qa-network`
4. **测试基础连通性**：`ping` 和 `telnet` 测试

通过这个详细的部署说明，您应该能够成功在任何服务器上部署个人智能问答系统，并解决可能遇到的网络问题。 