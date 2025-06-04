# 🐳 个人智能问答系统v3.0 - Docker部署完整指南

## 📋 部署包内容清单

### 🔧 核心配置文件
- `docker-compose.yml` - 服务编排配置
- `Dockerfile.frontend` - 前端容器配置
- `Dockerfile.backend` - 后端容器配置
- `nginx.conf` - Nginx反向代理配置
- `init.sql` - 数据库初始化脚本

### 🚀 部署脚本
- `deploy.sh` - Linux/macOS标准部署脚本
- `deploy.bat` - Windows标准部署脚本
- `deploy-network-optimized.sh` - Linux网络优化部署脚本

### 🔍 诊断工具
- `network-diagnose.sh` - Linux网络诊断脚本
- `network-diagnose.bat` - Windows网络诊断脚本

### 📚 文档
- `README.md` - 详细使用说明
- `部署清单.md` - 快速部署清单
- `Docker部署完整说明_网络问题排查版.md` - 网络问题排查指南

## 🚀 快速部署流程

### Windows系统部署

#### 方法1: 标准部署
```cmd
# 1. 解压部署包
unzip qa-system-v3-deploy.zip
cd qa-system-v3

# 2. 运行部署脚本
deploy.bat

# 3. 如遇网络问题，运行诊断
network-diagnose.bat
```

#### 方法2: 网络优化部署（推荐）
```cmd
# 1. 进入部署目录
cd qa-system-v3

# 2. 运行网络优化部署
deploy-network-optimized.sh

# 如果Git Bash不可用，使用WSL或PowerShell Core
```

### Linux/macOS系统部署

#### 方法1: 标准部署
```bash
# 1. 解压部署包
unzip qa-system-v3-deploy.zip
cd qa-system-v3

# 2. 设置权限
chmod +x deploy.sh network-diagnose.sh

# 3. 运行部署
./deploy.sh

# 4. 如遇问题，运行诊断
./network-diagnose.sh
```

#### 方法2: 网络优化部署（推荐）
```bash
# 1. 进入部署目录
cd qa-system-v3

# 2. 设置权限
chmod +x deploy-network-optimized.sh

# 3. 运行网络优化部署
./deploy-network-optimized.sh
```

## 🌐 网络问题解决方案

### 常见网络问题及解决方案

#### 问题1: 容器无法互相访问
**现象**: API请求失败，前端无法连接后端

**解决方案**:
```bash
# 1. 重建网络
docker-compose down
docker network prune -f
docker-compose up -d

# 2. 使用固定IP（修改docker-compose.yml）
networks:
  qa-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16

services:
  qa-backend:
    networks:
      qa-network:
        ipv4_address: 172.20.0.20
```

#### 问题2: 端口冲突
**现象**: 端口已被占用错误

**解决方案**:
```bash
# 1. 查找占用进程
netstat -tlnp | grep 3000
# Windows: netstat -ano | findstr 3000

# 2. 修改端口映射（docker-compose.yml）
ports:
  - "3001:80"    # 前端改为3001
  - "8001:8000"  # 后端改为8001
```

#### 问题3: 防火墙阻挡
**Linux解决方案**:
```bash
# 允许Docker网络
sudo ufw allow from 172.17.0.0/16
sudo ufw allow from 172.20.0.0/16

# 重启Docker
sudo systemctl restart docker
```

**Windows解决方案**:
```cmd
# 临时关闭防火墙（仅用于测试）
netsh advfirewall set allprofiles state off

# 或添加防火墙规则
netsh advfirewall firewall add rule name="Docker Ports" dir=in action=allow protocol=TCP localport=3000,8000,3306,6379
```

#### 问题4: DNS解析失败
**解决方案**:
```bash
# 1. 使用IP代替服务名
# 在环境变量中使用IP而非服务名

# 2. 添加额外的主机名
services:
  qa-backend:
    networks:
      qa-network:
        aliases:
          - backend
          - api-server
```

### 网络配置最佳实践

#### 1. 自定义网络配置
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

#### 2. 健康检查增强
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

#### 3. 日志配置优化
```yaml
services:
  qa-frontend:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

## 🔧 故障排查步骤

### 1. 基础环境检查
```bash
# 检查Docker版本
docker --version
docker-compose --version

# 检查Docker服务
docker info

# 检查端口占用
netstat -tlnp | grep -E "(3000|8000|3306|6379)"
```

### 2. 容器状态检查
```bash
# 查看容器状态
docker-compose ps

# 查看容器日志
docker-compose logs qa-frontend
docker-compose logs qa-backend
docker-compose logs mysql
```

### 3. 网络连通性测试
```bash
# 测试容器间连通性
docker exec qa-frontend ping qa-backend
docker exec qa-backend ping qa-mysql

# 测试API访问
curl http://localhost:8000/health
curl http://localhost:3000/health
```

### 4. 使用诊断脚本
```bash
# Linux/macOS
./network-diagnose.sh

# Windows
network-diagnose.bat
```

## 📊 系统监控

### 实时监控命令
```bash
# 监控容器资源使用
docker stats

# 实时查看日志
docker-compose logs -f

# 监控网络连接
docker network ls
docker network inspect qa-system-v3_qa-network
```

### 性能优化
```bash
# 清理不用的资源
docker system prune -f

# 清理网络
docker network prune -f

# 重启所有服务
docker-compose restart
```

## 🎯 成功部署验证清单

### ✅ 部署成功标志
- [ ] 所有容器状态为 "Up"
- [ ] 前端可访问: http://localhost:3000 ✓
- [ ] 后端API可访问: http://localhost:8000 ✓
- [ ] API文档可访问: http://localhost:8000/docs ✓
- [ ] 数据库连接正常
- [ ] 容器间网络通信正常

### 🔍 功能验证
- [ ] 用户注册/登录功能正常
- [ ] 问答功能可以使用
- [ ] 笔记保存功能正常
- [ ] 管理界面可以访问
- [ ] 数据持久化正常

### 📋 访问地址确认
- **前端应用**: http://localhost:3000
- **管理界面**: http://localhost:3000/admin
- **问答界面**: http://localhost:3000/qa
- **认证界面**: http://localhost:3000/auth
- **后端API**: http://localhost:8000
- **API文档**: http://localhost:8000/docs

### 👤 默认账户验证
- **管理员**: admin / admin123
- **普通用户**: user / user123
- **演示用户**: demo / demo123

## 🚨 紧急故障处理

### 完全重置部署
```bash
# 1. 停止所有服务
docker-compose down

# 2. 清理所有资源
docker system prune -a --volumes

# 3. 删除项目网络
docker network rm qa-system-v3_qa-network

# 4. 重新部署
./deploy-network-optimized.sh
```

### 数据库重置
```bash
# 1. 停止服务
docker-compose down

# 2. 删除数据库卷
docker volume rm qa-system-v3_mysql_data

# 3. 重新启动数据库
docker-compose up -d mysql
```

### 网络重置
```bash
# 1. 停止所有容器
docker-compose down

# 2. 清理网络
docker network prune -f

# 3. 重新创建网络
docker network create --driver bridge --subnet=172.20.0.0/16 qa-network

# 4. 重新启动服务
docker-compose up -d
```

## 💡 部署建议

### 生产环境部署建议
1. **安全配置**: 修改默认密码和密钥
2. **网络安全**: 配置防火墙规则
3. **数据备份**: 定期备份数据库
4. **日志管理**: 配置日志轮转
5. **监控告警**: 设置服务监控

### 开发环境优化
1. **热重载**: 使用开发模式启动
2. **调试日志**: 启用详细日志
3. **快速重启**: 使用 `docker-compose restart`

## 📞 技术支持

如果按照以上步骤仍无法解决问题，请：

1. **运行完整诊断**: `./network-diagnose.sh` 或 `network-diagnose.bat`
2. **收集日志**: `docker-compose logs > deployment.log`
3. **检查网络**: `docker network inspect qa-system-v3_qa-network`
4. **提供系统信息**: 操作系统版本、Docker版本、错误信息

通过这个完整的部署指南，您应该能够在任何支持Docker的系统上成功部署个人智能问答系统v3.0！🎉 