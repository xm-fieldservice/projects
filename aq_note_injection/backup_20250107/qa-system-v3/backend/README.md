# 智能问答系统 v3.0 - Backend API

> 基于AI的智能问答和笔记管理系统后端服务

## 🚀 项目简介

智能问答系统 v3.0 后端是一个基于 FastAPI 构建的现代化 RESTful API 服务，提供：

- 🤖 多智能体AI问答系统
- 📝 智能笔记管理
- 🔐 完整的用户认证和授权
- 📊 数据统计和分析
- 🔄 多轮对话支持
- 📤 数据导出功能

## 🏗️ 技术架构

### 核心技术栈
- **框架**: FastAPI 0.104+
- **数据库**: PostgreSQL + SQLAlchemy
- **缓存**: Redis
- **认证**: JWT + OAuth2
- **AI集成**: OpenAI GPT / Anthropic Claude
- **部署**: Docker + Gunicorn

### 项目结构
```
backend/
├── app/                    # 应用主目录
│   ├── api/               # API路由
│   │   ├── auth.py       # 认证API
│   │   ├── notes.py      # 笔记API
│   │   └── qa.py         # 问答API
│   ├── core/             # 核心模块
│   │   ├── config.py     # 配置管理
│   │   └── database.py   # 数据库配置
│   ├── models/           # 数据模型
│   │   ├── user.py       # 用户模型
│   │   ├── note.py       # 笔记模型
│   │   └── qa_session.py # 问答模型
│   ├── services/         # 业务逻辑
│   │   ├── auth_service.py  # 认证服务
│   │   ├── note_service.py  # 笔记服务
│   │   └── qa_service.py    # 问答服务
│   └── main.py           # 应用入口
├── requirements.txt       # 依赖包
├── run.py                # 启动脚本
├── Dockerfile            # Docker配置
├── docker-compose.yml    # Docker Compose
└── README.md            # 说明文档
```

## 🛠️ 快速开始

### 环境要求
- Python 3.11+
- PostgreSQL 12+
- Redis 6+
- (可选) Docker & Docker Compose

### 本地开发

#### 1. 克隆项目
```bash
git clone <repository-url>
cd qa-system-v3/backend
```

#### 2. 安装依赖
```bash
# 使用启动脚本（推荐）
python run.py install

# 或手动安装
pip install -r requirements.txt
```

#### 3. 配置环境变量
```bash
# 复制环境配置文件
cp .env.example .env

# 编辑配置（必须修改以下项）
vim .env
```

关键配置项：
```env
# 数据库配置
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=your-password
DB_NAME=qa_system_v3

# 安全密钥（生产环境必须更改）
SECRET_KEY=your-super-secret-key

# AI服务密钥
OPENAI_API_KEY=your-openai-key
CLAUDE_API_KEY=your-claude-key
```

#### 4. 初始化数据库
```bash
# 检查数据库连接
python run.py check

# 初始化数据库表
python run.py init
```

#### 5. 启动开发服务器
```bash
python run.py dev
```

服务将在 http://localhost:8000 启动

### Docker 部署

#### 快速部署
```bash
# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f app
```

#### 生产环境部署
```bash
# 修改 docker-compose.yml 中的环境变量
# 特别注意修改密码和密钥

# 启动生产环境
docker-compose -f docker-compose.prod.yml up -d
```

## 📖 API 文档

### 访问地址
- **Swagger UI**: http://localhost:8000/api/v1/docs
- **ReDoc**: http://localhost:8000/api/v1/redoc
- **OpenAPI JSON**: http://localhost:8000/api/v1/openapi.json

### 主要接口

#### 认证模块 (`/api/v1/auth`)
- `POST /register` - 用户注册
- `POST /login` - 用户登录
- `POST /refresh` - 刷新令牌
- `GET /me` - 获取用户信息
- `POST /logout` - 用户登出

#### 笔记模块 (`/api/v1/notes`)
- `GET /` - 获取笔记列表
- `POST /` - 创建笔记
- `GET /{id}` - 获取笔记详情
- `PUT /{id}` - 更新笔记
- `DELETE /{id}` - 删除笔记
- `GET /search/advanced` - 高级搜索

#### 问答模块 (`/api/v1/qa`)
- `POST /ask` - 提交问答
- `POST /conversation` - 继续对话
- `GET /sessions` - 获取会话列表
- `GET /sessions/{id}` - 获取会话详情
- `POST /sessions/{id}/to-note` - 转换为笔记

## 🔧 开发指南

### 启动脚本使用
```bash
python run.py <command>

Commands:
  install  - 安装依赖包
  init     - 初始化数据库
  check    - 检查数据库连接
  dev      - 启动开发服务器
  prod     - 启动生产服务器
  test     - 运行测试
  info     - 显示系统信息
```

### 数据库管理
```python
# 获取数据库管理器
from app.core.database import db_manager

# 检查连接
db_manager.check_connection()

# 获取数据库信息
db_manager.get_database_info()

# 获取表信息
db_manager.get_table_info()
```

### 添加新的API端点

1. 在 `app/api/` 目录下创建新的路由文件
2. 定义 Pydantic 模型进行数据验证
3. 实现业务逻辑在 `app/services/` 目录
4. 在 `app/main.py` 中注册路由

示例：
```python
# app/api/example.py
from fastapi import APIRouter
from ..services.example_service import ExampleService

router = APIRouter(prefix="/example", tags=["示例"])

@router.get("/")
async def get_examples():
    service = ExampleService()
    return await service.get_all()
```

### 数据模型开发
```python
# app/models/example.py
from sqlalchemy import Column, Integer, String
from ..core.database import Base

class Example(Base):
    __tablename__ = "examples"
    
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
```

## 🧪 测试

### 运行测试
```bash
# 运行所有测试
python run.py test

# 运行特定测试
pytest tests/test_auth.py -v

# 测试覆盖率
pytest --cov=app tests/
```

### 测试结构
```
tests/
├── test_auth.py      # 认证测试
├── test_notes.py     # 笔记测试
├── test_qa.py        # 问答测试
└── conftest.py       # 测试配置
```

## 📊 监控和日志

### 健康检查
- **端点**: `GET /health`
- **响应**: 应用和数据库健康状态

### 日志配置
```python
# 配置日志级别
LOG_LEVEL=INFO

# 配置日志文件
LOG_FILE=logs/app.log
```

### 性能监控
- 请求处理时间记录在响应头 `X-Process-Time`
- 慢查询自动记录（>1秒）
- 数据库连接池监控

## 🔒 安全配置

### 生产环境清单
- [ ] 更改默认 `SECRET_KEY`
- [ ] 配置强密码策略
- [ ] 启用 HTTPS
- [ ] 配置 CORS 策略
- [ ] 设置速率限制
- [ ] 更新数据库密码
- [ ] 配置防火墙规则

### 环境变量安全
```bash
# 生产环境必须设置
SECRET_KEY=<strong-random-key>
DB_PASSWORD=<strong-password>
OPENAI_API_KEY=<your-api-key>
```

## 🚀 部署指南

### Docker 部署
```bash
# 构建镜像
docker build -t qa-system-backend .

# 运行容器
docker run -d -p 8000:8000 qa-system-backend
```

### 生产环境
```bash
# 使用 Gunicorn
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker

# 或使用启动脚本
python run.py prod
```

### 负载均衡
建议使用 Nginx 作为反向代理：

```nginx
upstream backend {
    server 127.0.0.1:8000;
    server 127.0.0.1:8001;
}

server {
    listen 80;
    location / {
        proxy_pass http://backend;
    }
}
```

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📝 更新日志

### v3.0.0 (2024-01-15)
- ✨ 全新的 FastAPI 架构
- 🤖 多智能体AI问答系统
- 📝 智能笔记管理
- 🔐 JWT 认证系统
- 🐳 Docker 部署支持

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🆘 支持

如有问题或建议，请：
- 创建 [Issue](../../issues)
- 发送邮件至：support@example.com
- 查看 [FAQ](docs/FAQ.md)

---

**开发团队** | 智能问答系统 v3.0 🚀 