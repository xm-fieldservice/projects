# 个人智能问答系统 v3.0 - 完整解耦版

## 🎯 项目简介

个人智能问答系统 v3.0 是一个基于分块解耦架构的智能问答和笔记管理系统。采用经典技术栈，零框架依赖，具有高度的模块化和可维护性。

### ✨ 核心特性

- 🤖 **智能问答**：多AI智能体支持（通用、编程、写作助手）
- 📝 **笔记管理**：自动保存问答为笔记，支持标签分类
- 🔧 **分块解耦**：4大功能块独立开发，职责清晰
- 🐳 **容器化部署**：Docker一键部署，支持横向扩展
- 🎨 **现代界面**：响应式设计，优秀的用户体验
- 🛡️ **安全可靠**：完整的用户认证和权限管理
- 📊 **系统监控**：实时性能监控和管理界面

### 🏗️ 架构设计

```
┌─────────────────────────────────────────┐
│           前端 (Nginx + HTML/CSS/JS)    │
├─────────────────────────────────────────┤
│  AuthBlock │ QANoteBlock │ UIBlock      │
│  用户认证   │  问答笔记    │ 界面协调     │
└─────────────────────────────────────────┘
│                   ↕ API                 │
┌─────────────────────────────────────────┐
│          后端 (FastAPI + Python)        │
├─────────────────────────────────────────┤
│     认证服务 │ 内容服务 │ 管理服务      │
└─────────────────────────────────────────┘
│                   ↕ SQL                 │
┌─────────────────────────────────────────┐
│           数据库 (MySQL 8.0)            │
│     用户表 │ 内容表 │ 标签表 │ 日志表   │
└─────────────────────────────────────────┘
```

## 🚀 快速部署

### 📋 系统要求

- **操作系统**: Linux/macOS/Windows
- **Docker**: >= 20.10
- **Docker Compose**: >= 2.0
- **内存**: >= 2GB
- **磁盘**: >= 5GB

### 💻 一键部署

#### Linux/macOS 系统:

```bash
# 1. 克隆或下载项目
git clone <repository-url> qa-system-v3
cd qa-system-v3

# 2. 设置执行权限
chmod +x deploy.sh

# 3. 执行部署
./deploy.sh

# 或者使用特定命令
./deploy.sh deploy    # 完整部署
./deploy.sh start     # 启动服务
./deploy.sh stop      # 停止服务
./deploy.sh logs      # 查看日志
./deploy.sh status    # 查看状态
```

#### Windows 系统:

```cmd
# 1. 下载项目到本地
# 2. 打开命令提示符或PowerShell
cd qa-system-v3

# 3. 执行部署
deploy.bat

# 或者使用特定命令
deploy.bat deploy    # 完整部署
deploy.bat start     # 启动服务
deploy.bat stop      # 停止服务
deploy.bat logs      # 查看日志
deploy.bat status    # 查看状态
```

### 🔧 手动部署

如果自动脚本遇到问题，可以手动执行以下步骤：

```bash
# 1. 检查Docker环境
docker --version
docker-compose --version

# 2. 创建环境配置
cp .env.example .env
# 编辑 .env 文件，修改密码和配置

# 3. 构建镜像
docker-compose build

# 4. 启动服务
docker-compose up -d

# 5. 检查状态
docker-compose ps
```

## 🌐 访问系统

部署成功后，您可以通过以下地址访问系统：

- **前端应用**: http://localhost:3000
- **管理界面**: http://localhost:3000/admin
- **API文档**: http://localhost:8000/docs
- **API端点**: http://localhost:8000/api/v1

### 👤 默认账户

| 用户名 | 密码 | 角色 | 说明 |
|-------|------|------|------|
| admin | admin123 | 管理员 | 系统管理员，拥有所有权限 |
| user | user123 | 用户 | 普通用户，可以使用问答和笔记功能 |
| demo | demo123 | 演示 | 演示账户，功能受限 |

⚠️ **安全提醒**: 部署到生产环境前，请务必修改默认密码！

## 📁 项目结构

```
qa-system-v3/
├── auth-block/                 # 用户认证功能块
│   ├── auth.html              # 认证界面
│   ├── auth.css               # 认证样式
│   └── auth.js                # 认证逻辑
├── qa-note-block/             # 问答笔记功能块
│   ├── qa-note.html           # 问答笔记界面
│   ├── qa-note.css            # 样式文件
│   ├── qa-note.js             # 核心逻辑
│   └── qa-note-saver.js       # 智能存储策略
├── ui-block/                  # 界面协调功能块
│   ├── index.html             # 主界面
│   ├── main.css               # 主样式
│   ├── main.js                # 界面控制逻辑
│   └── message.css            # 消息系统样式
├── deploy-block/              # 部署管理功能块
│   ├── admin.html             # 管理界面
│   ├── admin.css              # 管理界面样式
│   └── admin.js               # 管理界面逻辑
├── shared/                    # 共享模块
│   ├── api.js                 # API客户端
│   ├── notebook.js            # 笔记本管理器
│   └── utils.js               # 工具函数
├── backend/                   # 后端服务
│   ├── app/                   # 应用代码
│   ├── main.py                # 主应用文件
│   └── requirements.txt       # Python依赖
├── docker-compose.yml         # Docker编排配置
├── Dockerfile.frontend        # 前端Docker配置
├── Dockerfile.backend         # 后端Docker配置
├── nginx.conf                 # Nginx配置
├── init.sql                   # 数据库初始化
├── deploy.sh                  # Linux/macOS部署脚本
├── deploy.bat                 # Windows部署脚本
└── README.md                  # 项目说明文档
```

## 🔧 配置说明

### 环境变量配置 (.env)

```bash
# 数据库配置
MYSQL_DATABASE=qa_db
MYSQL_USER=qa_user
MYSQL_PASSWORD=your_secure_password
MYSQL_ROOT_PASSWORD=your_root_password

# JWT安全配置
JWT_SECRET_KEY=your_super_secret_jwt_key

# API配置
API_BASE_URL=http://localhost:8000
CORS_ORIGINS=http://localhost:3000,https://yourdomain.com

# 调试配置
DEBUG=false
LOG_LEVEL=INFO
```

### 端口配置

| 服务 | 默认端口 | 说明 |
|------|----------|------|
| 前端 | 3000 | Nginx Web服务器 |
| 后端 | 8000 | FastAPI应用服务器 |
| 数据库 | 3306 | MySQL数据库 |
| Redis | 6379 | 缓存服务（可选） |

## 📊 功能详解

### 🔐 用户认证系统

- **多角色支持**: 管理员、普通用户、演示用户
- **JWT令牌**: 安全的无状态认证
- **会话管理**: 自动登录状态维护
- **权限控制**: 基于角色的访问控制

### 🤖 智能问答功能

- **多AI智能体**: 
  - 通用助手：处理日常问题
  - 编程助手：专业代码支持
  - 写作助手：文本创作优化
- **自动保存**: 问答结果自动保存为笔记
- **智能存储**: 支持本地/服务器/混合存储模式

### 📝 笔记管理系统

- **统一界面**: 问答和笔记模式无缝切换
- **标签分类**: 灵活的标签系统
- **全文搜索**: 快速内容检索
- **Markdown导出**: 支持多格式导出

### ⚙️ 系统管理功能

- **实时监控**: CPU、内存、磁盘、网络状态
- **服务管理**: 容器状态控制和日志查看
- **用户管理**: 用户信息和权限管理
- **系统配置**: 参数配置和系统设置

## 🛠️ 开发指南

### 本地开发环境

```bash
# 1. 启动数据库和Redis
docker-compose up -d mysql redis

# 2. 设置Python环境
cd backend
python -m venv venv
source venv/bin/activate  # Linux/macOS
# 或 venv\Scripts\activate  # Windows

# 3. 安装依赖
pip install -r requirements.txt

# 4. 启动后端
python main.py

# 5. 启动前端（使用简单HTTP服务器）
cd ..
python -m http.server 3000
```

### 代码结构说明

#### 前端结构
- **分块设计**: 每个功能块独立开发和部署
- **接口标准化**: 统一的API调用规范
- **消息系统**: 完整的用户反馈机制

#### 后端结构
- **FastAPI框架**: 高性能异步API框架
- **分层架构**: 控制器、服务、数据访问层分离
- **依赖注入**: 灵活的组件管理

### API接口文档

访问 http://localhost:8000/docs 查看完整的API文档。

主要接口：

- `POST /api/v1/auth/login` - 用户登录
- `POST /api/v1/content` - 创建内容（问答/笔记）
- `GET /api/v1/content` - 获取内容列表
- `GET /api/v1/admin/metrics` - 系统监控指标

## 🔍 故障排除

### 常见问题

#### 1. 端口被占用
```bash
# 检查端口占用
netstat -tulpn | grep :3000
# 或者修改 docker-compose.yml 中的端口映射
```

#### 2. 数据库连接失败
```bash
# 检查数据库容器状态
docker-compose logs mysql

# 重新启动数据库
docker-compose restart mysql
```

#### 3. 前端无法访问后端
```bash
# 检查CORS配置
# 编辑 .env 文件中的 CORS_ORIGINS

# 检查网络连接
docker-compose exec qa-frontend ping qa-backend
```

#### 4. 构建失败
```bash
# 清理Docker缓存
docker system prune -f

# 重新构建
docker-compose build --no-cache
```

### 日志查看

```bash
# 查看所有服务日志
docker-compose logs

# 查看特定服务日志
docker-compose logs qa-frontend
docker-compose logs qa-backend
docker-compose logs mysql

# 实时跟踪日志
docker-compose logs -f
```

### 性能优化

1. **数据库优化**:
   - 调整MySQL配置参数
   - 创建适当的索引
   - 定期清理日志表

2. **前端优化**:
   - 启用Gzip压缩
   - 配置静态文件缓存
   - 使用CDN加速

3. **后端优化**:
   - 调整Worker进程数
   - 配置Redis缓存
   - 优化数据库查询

## 🔄 更新和维护

### 系统更新

```bash
# 1. 备份数据
docker-compose exec mysql mysqldump -u root -p qa_db > backup.sql

# 2. 拉取新版本代码
git pull origin main

# 3. 重新构建和部署
./deploy.sh restart
```

### 数据备份

```bash
# 数据库备份
docker-compose exec mysql mysqldump -u root -p qa_db > qa_db_backup_$(date +%Y%m%d_%H%M%S).sql

# 上传文件备份
tar -czf uploads_backup_$(date +%Y%m%d_%H%M%S).tar.gz uploads/
```

### 监控和告警

建议配置以下监控项：

- 系统资源使用率（CPU、内存、磁盘）
- 应用响应时间
- 数据库连接状态
- 错误日志监控

## 📞 技术支持

### 联系方式

- **项目仓库**: [GitHub链接]
- **问题报告**: [Issues页面]
- **讨论交流**: [Discussions页面]

### 贡献指南

欢迎提交Issue和Pull Request！请遵循以下步骤：

1. Fork项目仓库
2. 创建功能分支
3. 提交代码更改
4. 创建Pull Request

## 📄 许可证

本项目采用 MIT 许可证，详见 [LICENSE](LICENSE) 文件。

---

**个人智能问答系统 v3.0** - 让AI助力您的知识管理 🚀 