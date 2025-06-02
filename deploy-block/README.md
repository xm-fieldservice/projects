# DeployBlock - 部署管理块

智能问答系统 v3.0 完整解耦版的部署管理模块，提供容器化部署、服务监控、系统管理等功能。

## 📋 功能特性

### 🚀 核心功能
- **容器化部署**: 基于 Docker Compose 的多服务编排
- **服务监控**: 实时监控前端、后端、数据库服务状态
- **系统指标**: CPU、内存、磁盘、网络使用率监控
- **管理界面**: 可视化的系统管理控制台
- **用户管理**: 用户列表、角色管理、权限控制
- **日志管理**: 系统日志查看、过滤、下载

### 🔧 技术特性
- **跨平台**: 支持 Linux、macOS、Windows
- **健康检查**: 自动服务健康监测
- **数据持久化**: MySQL 数据、日志文件持久化存储
- **安全配置**: JWT 认证、Nginx 安全头、权限校验
- **环境配置**: 开发/生产环境配置支持

## 📁 文件结构

```
deploy-block/
├── admin.html              # 管理界面HTML
├── admin.css               # 管理界面样式
├── admin.js                # 管理界面交互控制器
├── deploy.js               # 部署管理接口实现
├── docker-compose.yml      # Docker容器编排配置
├── Dockerfile.frontend     # 前端容器配置
├── Dockerfile.backend      # 后端容器配置
├── nginx.conf              # Nginx反向代理配置
├── deploy.sh               # Linux/macOS部署脚本
├── deploy.bat              # Windows部署脚本
└── README.md               # 本文档
```

## 🛠️ 快速开始

### 1. 系统要求

**必须安装:**
- Docker (20.10+)
- Docker Compose (2.0+)

**可选工具:**
- curl (用于健康检查)
- git (用于代码管理)

### 2. 部署步骤

#### Linux/macOS

```bash
# 1. 进入项目目录
cd qa-system-v3

# 2. 执行部署脚本
chmod +x deploy-block/deploy.sh
./deploy-block/deploy.sh

# 3. 等待部署完成
# 服务启动后自动显示访问地址
```

#### Windows

```cmd
# 1. 进入项目目录
cd qa-system-v3

# 2. 执行部署脚本
deploy-block\deploy.bat

# 3. 等待部署完成
# 服务启动后自动显示访问地址
```

### 3. 访问系统

部署完成后，可通过以下地址访问：

- **前端主页**: http://localhost:3000
- **管理界面**: http://localhost:3000/admin.html
- **API文档**: http://localhost:8000/docs
- **健康检查**: http://localhost:8000/api/v1/health

### 4. 默认用户

| 用户名 | 密码 | 角色 | 说明 |
|--------|------|------|------|
| admin | admin123 | 管理员 | 系统管理员，拥有所有权限 |
| demo | demo123 | 演示 | 演示用户，仅查看权限 |

## 🎛️ 管理命令

### 常用操作

```bash
# 停止服务
./deploy-block/deploy.sh stop

# 重启服务
./deploy-block/deploy.sh restart

# 查看日志
./deploy-block/deploy.sh logs

# 检查状态
./deploy-block/deploy.sh status

# 清理数据
./deploy-block/deploy.sh clean

# 显示帮助
./deploy-block/deploy.sh help
```

### Docker Compose 操作

```bash
# 查看服务状态
docker-compose -f deploy-block/docker-compose.yml ps

# 查看实时日志
docker-compose -f deploy-block/docker-compose.yml logs -f

# 重启单个服务
docker-compose -f deploy-block/docker-compose.yml restart qa-frontend

# 进入容器
docker-compose -f deploy-block/docker-compose.yml exec qa-backend bash
```

## ⚙️ 配置说明

### 环境变量 (.env)

```bash
# 数据库配置
MYSQL_ROOT_PASSWORD=your-secure-root-password
MYSQL_PASSWORD=your-secure-password

# JWT密钥 (生产环境务必修改)
JWT_SECRET_KEY=your-secret-key-here-change-in-production

# 环境设置
NODE_ENV=production
DEBUG=false
LOG_LEVEL=INFO

# 端口配置
FRONTEND_PORT=3000
BACKEND_PORT=8000
MYSQL_PORT=3306
REDIS_PORT=6379
```

### 服务配置

#### 前端服务 (qa-frontend)
- **端口**: 3000
- **技术栈**: Nginx + HTML/CSS/JavaScript
- **功能**: 静态文件服务、API代理

#### 后端服务 (qa-backend)
- **端口**: 8000
- **技术栈**: FastAPI + Python
- **功能**: API接口、业务逻辑处理

#### 数据库服务 (mysql)
- **端口**: 3306
- **版本**: MySQL 8.0
- **存储**: 持久化卷挂载

#### 缓存服务 (redis)
- **端口**: 6379
- **版本**: Redis 7
- **功能**: 会话缓存、数据缓存

## 📊 管理界面功能

### 系统监控
- **CPU使用率**: 实时显示CPU占用百分比
- **内存使用**: 显示内存使用情况和总量
- **磁盘空间**: 监控磁盘使用率
- **网络流量**: 显示网络输入输出流量

### 服务管理
- **服务状态**: 查看各服务运行状态
- **服务重启**: 一键重启指定服务
- **日志查看**: 查看服务运行日志
- **健康检查**: 检查服务健康状态

### 用户管理
- **用户列表**: 显示所有用户信息
- **用户编辑**: 修改用户信息和权限
- **角色管理**: 管理用户角色 (admin/user/demo)
- **状态控制**: 启用/禁用用户账户

### 系统日志
- **日志查看**: 查看系统运行日志
- **级别过滤**: 按日志级别过滤 (info/warning/error)
- **日志清理**: 清空系统日志
- **日志下载**: 导出日志文件

## 🔒 安全配置

### 网络安全
- Nginx 安全头配置
- CORS 跨域限制
- 防止敏感文件访问

### 认证授权
- JWT Token 认证
- 基于角色的权限控制
- 管理员权限验证

### 数据安全
- MySQL 数据持久化
- 密码哈希存储
- 敏感信息环境变量配置

## 🐛 故障排除

### 常见问题

**1. Docker 服务无法启动**
```bash
# 检查 Docker 状态
docker info

# 启动 Docker 服务 (Linux)
sudo systemctl start docker

# 启动 Docker Desktop (Windows/macOS)
```

**2. 端口冲突**
```bash
# 检查端口占用
netstat -tulpn | grep :3000

# 修改端口配置 (.env 文件)
FRONTEND_PORT=3001
```

**3. 数据库连接失败**
```bash
# 检查 MySQL 容器状态
docker-compose -f deploy-block/docker-compose.yml ps mysql

# 查看数据库日志
docker-compose -f deploy-block/docker-compose.yml logs mysql
```

**4. 前端页面无法加载**
```bash
# 检查 Nginx 配置
docker-compose -f deploy-block/docker-compose.yml exec qa-frontend nginx -t

# 重启前端服务
docker-compose -f deploy-block/docker-compose.yml restart qa-frontend
```

### 日志查看

```bash
# 查看所有服务日志
docker-compose -f deploy-block/docker-compose.yml logs

# 查看特定服务日志
docker-compose -f deploy-block/docker-compose.yml logs qa-backend

# 实时跟踪日志
docker-compose -f deploy-block/docker-compose.yml logs -f --tail=100
```

## 📈 性能优化

### 资源限制
```yaml
# 在 docker-compose.yml 中配置
deploy:
  resources:
    limits:
      memory: 512M
      cpus: '0.5'
    reservations:
      memory: 256M
      cpus: '0.25'
```

### 缓存优化
- Redis 缓存配置
- Nginx 静态文件缓存
- 浏览器缓存策略

### 数据库优化
- MySQL 配置调优
- 索引优化
- 连接池配置

## 🔄 更新部署

### 更新代码
```bash
# 1. 拉取最新代码
git pull origin main

# 2. 重新构建镜像
docker-compose -f deploy-block/docker-compose.yml build --no-cache

# 3. 重启服务
docker-compose -f deploy-block/docker-compose.yml up -d
```

### 数据备份
```bash
# 备份数据库
docker-compose -f deploy-block/docker-compose.yml exec mysql \
  mysqldump -u qa_user -p qa_db > backup.sql

# 备份上传文件
cp -r deploy-block/data/uploads backup/
```

## 📞 技术支持

如遇到问题，请按以下步骤排查：

1. **查看日志**: 使用 `docker-compose logs` 查看详细错误信息
2. **检查配置**: 确认 `.env` 文件和 Docker 配置正确
3. **重启服务**: 尝试重启相关服务解决临时问题
4. **清理重建**: 使用 `clean` 命令清理后重新部署

---

## 📝 更新日志

### v3.0.0 (2024-06-02)
- ✨ 首次发布完整解耦版部署模块
- 🚀 支持 Docker 容器化部署
- 🎛️ 完整的管理界面实现
- 🔒 安全配置和权限控制
- 📊 实时系统监控功能
- 🔧 跨平台部署脚本支持 