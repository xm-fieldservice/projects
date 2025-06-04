# AuthBlock Docker 部署指南

AuthBlock 权限系统的 Docker 容器化部署方案，支持一键部署和管理。

## 🚀 快速开始

### 1. 环境要求

- Docker 20.10+
- Docker Compose 2.0+
- Linux/macOS/Windows WSL2

### 2. 部署步骤

```bash
# 1. 克隆项目
git clone <your-repo-url>
cd auth-block-toolkit

# 2. 配置环境变量
cp env.example .env
# 编辑 .env 文件，设置您的配置

# 3. 启动服务
chmod +x docker-deploy.sh
./docker-deploy.sh start
```

### 3. 访问服务

- **API服务**: http://localhost:3000
- **健康检查**: http://localhost:3000/health
- **演示页面**: http://localhost:3000/demo
- **Nginx代理**: http://localhost (如果启用)

## 📋 服务管理

### 基本命令

```bash
# 启动服务
./docker-deploy.sh start

# 停止服务
./docker-deploy.sh stop

# 重启服务
./docker-deploy.sh restart

# 查看日志
./docker-deploy.sh logs

# 查看状态
./docker-deploy.sh status

# 更新服务
./docker-deploy.sh update

# 备份数据
./docker-deploy.sh backup

# 清理所有资源
./docker-deploy.sh cleanup
```

### Docker Compose 命令

```bash
# 构建并启动
docker-compose up -d --build

# 查看日志
docker-compose logs -f authblock

# 进入容器
docker-compose exec authblock sh

# 停止服务
docker-compose down

# 完全清理（包括数据卷）
docker-compose down -v
```

## ⚙️ 配置说明

### 环境变量

| 变量名 | 说明 | 默认值 | 必需 |
|--------|------|--------|------|
| `NODE_ENV` | 运行环境 | `production` | 否 |
| `PORT` | 服务端口 | `3000` | 否 |
| `JWT_SECRET` | JWT密钥 | - | **是** |
| `CORS_ORIGIN` | CORS来源 | `*` | 否 |
| `SESSION_TIMEOUT` | 会话超时(ms) | `7200000` | 否 |
| `ADMIN_USERNAME` | 管理员用户名 | `admin` | 否 |
| `ADMIN_PASSWORD` | 管理员密码 | - | **是** |
| `STORAGE_TYPE` | 存储类型 | `file` | 否 |
| `REDIS_HOST` | Redis主机 | `redis` | 否 |
| `LOG_LEVEL` | 日志级别 | `info` | 否 |

### 存储配置

#### 文件存储（默认）
```bash
STORAGE_TYPE=file
DATA_PATH=/app/data
```

#### Redis存储
```bash
STORAGE_TYPE=redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
```

## 🏗️ 架构组件

### 核心服务

- **authblock**: 认证服务主容器
- **redis**: Redis缓存（可选）
- **nginx**: 反向代理（可选）

### 数据持久化

- `authblock_data`: 用户和会话数据
- `redis_data`: Redis持久化数据

### 网络

- `authblock-network`: 内部网络，确保服务间通信安全

## 🔧 高级配置

### SSL/HTTPS 配置

1. 将SSL证书放在 `nginx/ssl/` 目录
2. 修改 `nginx/nginx.conf` 配置
3. 设置环境变量：
```bash
NGINX_SSL_PORT=443
```

### 自定义 Nginx 配置

```bash
# 编辑 nginx 配置
vim nginx/nginx.conf

# 重启 nginx 服务
docker-compose restart nginx
```

### 数据库集成

添加 PostgreSQL 或 MySQL：

```yaml
# 在 docker-compose.yml 中添加
postgres:
  image: postgres:15-alpine
  environment:
    POSTGRES_DB: authblock
    POSTGRES_USER: authblock
    POSTGRES_PASSWORD: your-password
  volumes:
    - postgres_data:/var/lib/postgresql/data
```

### 监控和日志

#### 启用文件日志
```bash
LOG_FILE_ENABLED=true
LOG_FILE_PATH=/app/logs/authblock.log
```

#### 集成监控系统
- Prometheus + Grafana
- ELK Stack
- 自定义监控端点

## 🛡️ 安全建议

### 生产环境配置

1. **更改默认密码**
```bash
ADMIN_PASSWORD=your-very-secure-password
JWT_SECRET=a-very-long-random-secret-key
```

2. **启用HTTPS**
```bash
CORS_ORIGIN=https://yourdomain.com
```

3. **限制网络访问**
```bash
# 只绑定到内网
PORT=127.0.0.1:3000
```

4. **定期备份**
```bash
# 设置定时备份
crontab -e
0 2 * * * /path/to/docker-deploy.sh backup
```

### 防火墙配置

```bash
# Ubuntu/Debian
ufw allow 3000/tcp
ufw allow 80/tcp
ufw allow 443/tcp

# CentOS/RHEL
firewall-cmd --permanent --add-port=3000/tcp
firewall-cmd --reload
```

## 🔍 故障排除

### 常见问题

#### 1. 服务启动失败
```bash
# 查看详细日志
./docker-deploy.sh logs

# 检查配置文件
cat .env
```

#### 2. 端口被占用
```bash
# 查看端口使用
sudo netstat -tlnp | grep 3000

# 修改端口
echo "PORT=3001" >> .env
```

#### 3. 权限问题
```bash
# 修复文件权限
sudo chown -R 1001:1001 ./data
sudo chmod -R 755 ./data
```

#### 4. 内存不足
```bash
# 查看容器资源使用
docker stats

# 限制内存使用（在 docker-compose.yml 中）
mem_limit: 512m
```

### 日志分析

```bash
# 实时查看所有日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs authblock

# 查看错误日志
docker-compose logs authblock | grep ERROR
```

## 📈 性能优化

### 内存优化
```bash
# 设置 Node.js 内存限制
NODE_OPTIONS=--max_old_space_size=512
```

### 缓存配置
```bash
# 启用 Redis 缓存
STORAGE_TYPE=redis
REDIS_HOST=redis
```

### 负载均衡
```bash
# 运行多个实例
docker-compose up -d --scale authblock=3
```

## 🔄 更新和维护

### 更新服务
```bash
# 拉取最新代码
git pull

# 更新并重启服务
./docker-deploy.sh update
```

### 定期维护
```bash
# 清理无用的 Docker 资源
docker system prune -f

# 更新基础镜像
docker-compose pull
docker-compose up -d --force-recreate
```

## 📞 支持

如果遇到问题：

1. 查看 [故障排除](#-故障排除) 部分
2. 检查 [GitHub Issues](https://github.com/qa-system/auth-block-toolkit/issues)
3. 联系技术支持：support@qa-system.com

---

> **提示**: 这个部署方案支持开发、测试和生产环境。请根据实际需求调整配置。 