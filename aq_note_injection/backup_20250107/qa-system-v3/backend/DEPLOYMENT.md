# 智能问答系统 v3.0 生产环境部署指南

> 完整的生产级部署文档，包含自动化脚本和详细配置说明

## 📋 目录

- [系统要求](#系统要求)
- [快速部署](#快速部署)
- [详细部署步骤](#详细部署步骤)
- [配置说明](#配置说明)
- [监控和维护](#监控和维护)
- [故障排除](#故障排除)
- [性能优化](#性能优化)
- [安全加固](#安全加固)

## 🖥️ 系统要求

### 最低要求
- **操作系统**: Ubuntu 20.04+ / CentOS 8+ / RHEL 8+
- **CPU**: 2核心
- **内存**: 4GB RAM
- **存储**: 20GB 可用空间
- **网络**: 稳定的互联网连接

### 推荐配置
- **操作系统**: Ubuntu 22.04 LTS
- **CPU**: 4核心以上
- **内存**: 8GB RAM 以上
- **存储**: 50GB SSD
- **网络**: 100Mbps+ 带宽

### 必需软件
- Docker 24.0+
- Docker Compose 2.0+
- Git 2.30+
- OpenSSL 1.1.1+
- curl/wget

## 🚀 快速部署

### 一键部署脚本

```bash
# 1. 下载项目
git clone https://github.com/your-org/qa-system-v3.git
cd qa-system-v3/backend

# 2. 执行一键部署
sudo ./scripts/deploy.sh init
sudo ./scripts/deploy.sh deploy

# 3. 访问系统
https://your-domain.com
```

### Docker Compose 快速启动

```bash
# 开发环境
docker-compose up -d

# 生产环境
docker-compose -f docker-compose.prod.yml up -d
```

## 📝 详细部署步骤

### 第一步：环境准备

#### 1.1 安装Docker

```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# CentOS/RHEL
sudo yum install -y yum-utils
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo yum install -y docker-ce docker-ce-cli containerd.io
sudo systemctl start docker
sudo systemctl enable docker
```

#### 1.2 安装Docker Compose

```bash
# 安装最新版本
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 验证安装
docker-compose --version
```

#### 1.3 系统优化

```bash
# 优化内核参数
cat >> /etc/sysctl.conf << EOF
vm.max_map_count=262144
net.core.somaxconn=65535
net.ipv4.tcp_max_syn_backlog=65535
fs.file-max=655360
EOF

sysctl -p

# 优化文件限制
cat >> /etc/security/limits.conf << EOF
* soft nofile 655360
* hard nofile 655360
EOF
```

### 第二步：项目部署

#### 2.1 获取代码

```bash
# 创建项目目录
sudo mkdir -p /opt/qa-system-v3
cd /opt/qa-system-v3

# 克隆代码（替换为实际仓库地址）
git clone https://github.com/your-org/qa-system-v3.git .

# 设置权限
sudo chown -R $USER:$USER /opt/qa-system-v3
```

#### 2.2 环境配置

```bash
cd backend

# 复制环境配置文件
cp env.production.template .env

# 编辑环境配置（重要！）
nano .env
```

**必须修改的配置项：**

```bash
# 安全密钥（使用 openssl rand -hex 32 生成）
SECRET_KEY=your-generated-secret-key

# 数据库密码
DB_PASSWORD=your-strong-database-password

# AI服务密钥
OPENAI_API_KEY=your-openai-api-key

# 域名配置
CORS_ORIGINS=https://your-domain.com

# 邮件配置（可选）
MAIL_USERNAME=your-email@example.com
MAIL_PASSWORD=your-app-password
```

#### 2.3 SSL证书配置

```bash
# 方法1: 使用Let's Encrypt（推荐）
sudo apt install certbot
sudo certbot certonly --standalone -d your-domain.com

# 复制证书到项目目录
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ssl/qa-system.crt
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ssl/qa-system.key

# 方法2: 使用自签名证书（测试环境）
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/qa-system.key \
  -out ssl/qa-system.crt \
  -subj "/C=CN/ST=State/L=City/O=Organization/CN=your-domain.com"
```

#### 2.4 创建数据目录

```bash
# 创建必要的数据目录
mkdir -p data/{uploads,logs,postgres,redis,backups}

# 设置权限
chmod 755 data/uploads
chmod 755 data/logs
chmod 700 data/postgres
chmod 700 data/redis
chmod 700 data/backups
```

### 第三步：数据库初始化

#### 3.1 启动数据库服务

```bash
# 只启动数据库和Redis
docker-compose -f docker-compose.prod.yml up -d db redis

# 等待数据库启动（约30秒）
sleep 30

# 检查数据库状态
docker-compose -f docker-compose.prod.yml exec db pg_isready -U postgres
```

#### 3.2 初始化数据库

```bash
# 执行初始化脚本
docker-compose -f docker-compose.prod.yml exec -T db psql -U postgres < scripts/init-db.sql

# 或者手动执行
docker-compose -f docker-compose.prod.yml exec db psql -U postgres -f /docker-entrypoint-initdb.d/init-db.sql
```

### 第四步：应用部署

#### 4.1 构建和启动应用

```bash
# 构建所有服务
docker-compose -f docker-compose.prod.yml build

# 启动所有服务
docker-compose -f docker-compose.prod.yml up -d

# 查看服务状态
docker-compose -f docker-compose.prod.yml ps
```

#### 4.2 健康检查

```bash
# 检查应用健康状态
curl -f http://localhost/health

# 检查API文档
curl -f http://localhost/api/v1/docs

# 查看日志
docker-compose -f docker-compose.prod.yml logs app
```

## ⚙️ 配置说明

### 环境变量配置

| 变量名 | 说明 | 默认值 | 必需 |
|--------|------|--------|------|
| `SECRET_KEY` | JWT密钥 | - | ✅ |
| `DB_PASSWORD` | 数据库密码 | - | ✅ |
| `OPENAI_API_KEY` | OpenAI API密钥 | - | ✅ |
| `REDIS_PASSWORD` | Redis密码 | - | 推荐 |
| `CORS_ORIGINS` | CORS域名 | `localhost` | ✅ |

### Nginx配置

主要配置文件：`nginx.conf`

```nginx
# 修改域名
server_name your-domain.com www.your-domain.com;

# SSL证书路径
ssl_certificate /etc/nginx/ssl/qa-system.crt;
ssl_certificate_key /etc/nginx/ssl/qa-system.key;

# 上游服务器
upstream backend_servers {
    server app:8000;
    # 添加更多实例
    # server app2:8000;
}
```

### 数据库配置

PostgreSQL优化配置：`scripts/postgresql.conf`

```ini
# 连接配置
max_connections = 200
shared_buffers = 1GB
effective_cache_size = 3GB

# 性能配置
work_mem = 16MB
maintenance_work_mem = 256MB
checkpoint_completion_target = 0.9

# 日志配置
log_min_duration_statement = 1000
log_statement = 'ddl'
```

## 📊 监控和维护

### Prometheus监控

启动监控服务：

```bash
# 启动监控
docker-compose -f docker-compose.prod.yml --profile monitoring up -d

# 访问监控界面
# Prometheus: http://localhost:9090
# Grafana: http://localhost:3000 (admin/admin123)
```

### 日志管理

```bash
# 查看应用日志
docker-compose logs -f app

# 查看特定时间段日志
docker-compose logs --since="2024-01-01T00:00:00" app

# 日志轮转配置
cat > /etc/logrotate.d/qa-system << EOF
/opt/qa-system-v3/backend/data/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 644 deploy deploy
}
EOF
```

### 备份策略

```bash
# 自动备份
# 编辑 crontab
crontab -e

# 添加备份任务
0 2 * * * /opt/qa-system-v3/backend/scripts/backup.sh

# 手动备份
./scripts/backup.sh

# 恢复备份
docker-compose exec -T db psql -U postgres < backup_file.sql
```

## 🔧 故障排除

### 常见问题

#### 1. 服务启动失败

```bash
# 检查容器状态
docker-compose ps

# 查看详细日志
docker-compose logs container_name

# 检查端口占用
netstat -tulpn | grep :8000
```

#### 2. 数据库连接失败

```bash
# 检查数据库容器
docker-compose exec db pg_isready -U postgres

# 检查网络连接
docker-compose exec app ping db

# 重置数据库
docker-compose down db
docker volume rm backend_postgres_data
docker-compose up -d db
```

#### 3. SSL证书问题

```bash
# 检查证书有效性
openssl x509 -in ssl/qa-system.crt -text -noout

# 更新Let's Encrypt证书
certbot renew --dry-run

# 重新生成自签名证书
./scripts/deploy.sh ssl
```

#### 4. 内存不足

```bash
# 检查内存使用
free -h
docker stats

# 优化Docker内存限制
# 在docker-compose.yml中添加
deploy:
  resources:
    limits:
      memory: 1G
```

### 性能调优

#### 数据库优化

```sql
-- 查看慢查询
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- 查看索引使用情况
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

#### 应用优化

```bash
# 增加worker数量
# 在.env文件中设置
WORKERS=4

# 启用缓存
CACHE_ENABLED=true
CACHE_TTL=3600

# 调整数据库连接池
DB_POOL_SIZE=20
DB_MAX_OVERFLOW=30
```

## 🔒 安全加固

### 系统安全

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 配置防火墙
sudo ufw enable
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# 禁用不必要的服务
sudo systemctl disable bluetooth
sudo systemctl disable avahi-daemon
```

### 应用安全

```bash
# 设置强密码策略
PASSWORD_MIN_LENGTH=12
PASSWORD_REQUIRE_SPECIAL=true
PASSWORD_REQUIRE_NUMBERS=true

# 启用限流
RATE_LIMIT_ENABLED=true
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=60

# 配置CORS
CORS_ORIGINS=https://your-domain.com
CORS_ALLOW_CREDENTIALS=true
```

### 数据库安全

```sql
-- 创建只读用户
CREATE USER readonly_user WITH PASSWORD 'readonly_password';
GRANT CONNECT ON DATABASE qa_system_v3 TO readonly_user;
GRANT USAGE ON SCHEMA public TO readonly_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly_user;

-- 限制连接数
ALTER USER postgres CONNECTION LIMIT 10;
ALTER USER qa_app_user CONNECTION LIMIT 50;
```

## 📈 扩展部署

### 负载均衡

```yaml
# docker-compose.prod.yml
# 添加多个应用实例
app2:
  build: .
  container_name: qa-system-app-2
  environment:
    - ENVIRONMENT=production
  # ... 其他配置

app3:
  build: .
  container_name: qa-system-app-3
  environment:
    - ENVIRONMENT=production
  # ... 其他配置
```

### 数据库集群

```bash
# 配置主从复制
# 主数据库配置
echo "wal_level = replica" >> postgresql.conf
echo "max_wal_senders = 3" >> postgresql.conf

# 从数据库配置
echo "hot_standby = on" >> postgresql.conf
```

### Redis集群

```yaml
redis-sentinel:
  image: redis:7-alpine
  command: redis-sentinel /etc/redis/sentinel.conf
  volumes:
    - ./redis/sentinel.conf:/etc/redis/sentinel.conf
```

## 📞 支持与维护

### 联系方式
- 技术支持：support@qa-system.com
- 文档更新：docs@qa-system.com
- 问题反馈：https://github.com/your-org/qa-system-v3/issues

### 维护计划
- 每周：检查日志和监控
- 每月：更新依赖和安全补丁
- 每季度：性能优化和容量规划
- 每年：系统架构评估

---

**部署成功后，请访问：**
- 🌐 **主页**: https://your-domain.com
- 📖 **API文档**: https://your-domain.com/api/v1/docs
- 📊 **监控面板**: https://your-domain.com:3000 (Grafana)
- ❤️ **健康检查**: https://your-domain.com/health

**祝您部署顺利！** 🎉 