# 集成智能问答笔记系统 v3.0

## 📋 系统简介

这是一个完全集成的智能问答笔记系统，将AuthBlock用户认证和QA Note Block问答功能合并为一个统一的应用程序。系统提供：

- **🔐 用户认证登录** - 基于JWT的安全认证系统
- **🤖 智能问答功能** - 多AI智能体支持的问答服务  
- **📝 笔记管理** - 自动保存和管理问答记录
- **📁 本地文件操作** - 支持本地文件读写和导出
- **👥 人员协作** - 人员选择和私信功能
- **🌐 网络状态监控** - 实时网络状态显示

## 🏗️ 系统架构

```
integrated-qa-system/
├── app.js                    # 主应用服务器
├── package.json              # 项目配置和依赖
├── config/                   # 配置文件
│   └── server.json          # 服务器配置
├── lib/                      # 认证核心库
│   ├── auth-block.js        # 用户认证核心
│   ├── logger.js            # 日志组件
│   └── storage.js           # 存储组件
├── routes/                   # API路由
│   └── api.js               # 认证和系统API
├── qa-system/               # 问答系统前端
│   ├── qa-note.html         # 主界面
│   ├── qa-note.js           # 核心逻辑
│   ├── qa-note.css          # 样式文件
│   ├── local-note-saver.js  # 本地笔记保存
│   └── qa-note-saver.js     # 智能笔记保存
├── shared/                   # 共享组件
│   ├── api.js               # API工具
│   ├── notebook.js          # 笔记本管理
│   └── utils.js             # 通用工具
├── data/                     # 数据存储
├── logs/                     # 日志文件
└── docs/                     # 文档目录
```

## 🚀 快速开始

### 1. 环境要求

- **Node.js** >= 16.0.0
- **npm** >= 8.0.0
- **浏览器** 支持ES6+（Chrome 60+, Firefox 55+, Safari 11+）

### 2. 安装部署

```bash
# 1. 进入项目目录
cd integrated-qa-system

# 2. 安装依赖
npm install

# 3. 启动系统
npm start

# 或者开发模式启动
npm run dev
```

### 3. 访问系统

启动成功后，在浏览器访问：

- **🌍 主系统：** http://localhost:3000
- **🔐 登录页面：** http://localhost:3000/auth  
- **🤖 问答系统：** http://localhost:3000/qa-system/qa-note.html
- **📊 健康检查：** http://localhost:3000/health

## 👤 用户账户

系统预置三个测试账户：

| 用户名 | 密码 | 角色 | 权限说明 |
|-------|------|------|----------|
| **admin** | admin123 | 管理员 | 完整系统管理权限 |
| **demo** | demo123 | 演示用户 | 标准问答笔记功能 |
| **test** | test123 | 测试用户 | 基础问答功能 |

## 🔧 系统配置

### 主配置文件：`config/server.json`

```json
{
  "nodeEnv": "production",
  "port": 3000,
  "host": "0.0.0.0",
  "cors": {
    "origin": "*"
  },
  "auth": {
    "jwtSecret": "your-secret-key",
    "sessionTimeout": 7200000,
    "storageType": "file",
    "dataPath": "./data"
  }
}
```

### 环境变量支持

```bash
# 基础配置
export NODE_ENV=production
export PORT=3000
export HOST=0.0.0.0

# 认证配置  
export JWT_SECRET=your-super-secret-key
export SESSION_TIMEOUT=7200000

# 数据存储
export DATA_PATH=./data
export STORAGE_TYPE=file
```

## 🌟 功能特性

### 🔐 认证系统

- **JWT令牌认证** - 安全的会话管理
- **多源令牌支持** - Cookie + LocalStorage
- **自动认证检查** - 页面访问时自动验证
- **优雅登出** - 完整的登出流程

### 🤖 问答系统

- **多智能体支持** - 通用/编程/写作助手
- **实时问答** - 流式响应显示
- **附件上传** - 支持文档附件
- **图片粘贴** - 直接粘贴图片到对话

### 📝 笔记功能

- **自动保存** - 问答结果自动转换为笔记
- **多存储模式** - 本地/服务器/混合存储
- **标签管理** - 自动标签分类
- **导出功能** - Markdown格式导出

### 👥 协作功能

- **人员选择** - 分组人员管理
- **私信功能** - 指定人员发送消息
- **在线状态** - 实时显示人员状态

### 🌐 网络监控

- **实时状态** - 网络连接状态监控
- **自动重连** - 网络恢复时自动同步
- **离线提示** - 网络中断时友好提示

## 📱 使用说明

### 1. 用户登录

1. 访问 http://localhost:3000 自动跳转到登录页面
2. 输入用户名和密码，或点击测试账户快速登录
3. 登录成功后自动跳转到问答系统主界面

### 2. 智能问答

1. **选择智能体：** 在顶部选择合适的AI助手
2. **输入问题：** 在输入框中详细描述您的问题
3. **添加附件：** 可选择上传相关文档
4. **发送问题：** 点击"🚀 发送问题"按钮
5. **查看回答：** AI回答将实时显示在结果区域

### 3. 笔记管理

- **自动保存：** 每次问答完成后自动保存为笔记
- **手动保存：** 点击"💾 保存为笔记"手动保存特定回答
- **存储模式：** 可在设置中选择不同的存储策略
- **导出功能：** 支持导出为Markdown文件

### 4. 人员协作

1. **打开人员栏：** 点击右上角"👥"按钮
2. **选择人员：** 勾选需要协作的人员
3. **应用选择：** 点击"应用到输入框"
4. **发送私信：** 输入内容后发送给选定人员

### 5. 系统设置

- **存储模式：** 混合模式/仅服务器/仅本地/本地文件直接读写
- **网络监控：** 自动监控网络状态变化
- **本地文件：** 支持直接读写本地Markdown文件

## 🔧 开发说明

### 项目结构

- **前端：** 原生JavaScript + CSS3
- **后端：** Node.js + Express
- **认证：** JWT + bcryptjs
- **存储：** 文件系统 + LocalStorage
- **日志：** Winston日志系统

### API接口

#### 认证接口

```bash
POST /api/auth/login      # 用户登录
POST /api/auth/logout     # 用户登出  
GET  /api/auth/user       # 获取当前用户信息
POST /api/auth/refresh    # 刷新令牌
```

#### 系统接口

```bash
GET  /health              # 健康检查
GET  /auth                # 登录页面
GET  /qa-system/*         # 问答系统静态资源
```

### 认证流程

1. **用户登录** → 验证用户名密码 → 生成JWT令牌
2. **令牌存储** → Cookie + LocalStorage双重存储
3. **请求认证** → 中间件自动验证JWT令牌
4. **会话管理** → 自动延期和清理过期会话

### 数据存储

- **用户数据：** `data/users.json`
- **会话数据：** `data/sessions.json`
- **系统日志：** `logs/authblock-*.log`
- **问答记录：** localStorage + 可选服务器同步

## 🚨 故障排除

### 常见问题

1. **登录失败**
   ```
   检查用户名密码是否正确
   确认服务器正常运行在3000端口
   清除浏览器缓存和Cookie
   ```

2. **页面无法访问**
   ```
   确认服务器已启动：npm start
   检查端口占用：netstat -an | findstr :3000
   查看服务器日志：logs/authblock-*.log
   ```

3. **认证问题**
   ```
   清除认证令牌：清空localStorage和Cookie
   重新登录获取新令牌
   检查JWT密钥配置
   ```

4. **问答功能异常**
   ```
   检查网络连接状态
   确认存储模式设置正确
   查看浏览器控制台错误信息
   ```

### 日志查看

```bash
# 查看最新日志
tail -f logs/authblock-*.log

# 查看错误日志
grep "ERROR" logs/authblock-*.log

# 查看认证日志
grep "auth" logs/authblock-*.log
```

### 性能优化

- **缓存策略：** 启用浏览器缓存减少资源加载
- **压缩资源：** 生产环境启用gzip压缩
- **日志轮转：** 自动清理过期日志文件
- **会话清理：** 定期清理过期会话数据

## 🔒 安全配置

### 生产环境配置

1. **修改默认密钥**
   ```json
   {
     "auth": {
       "jwtSecret": "your-strong-secret-key-here"
     }
   }
   ```

2. **修改默认密码**
   ```json
   {
     "auth": {
       "defaultAdmin": {
         "password": "your-secure-admin-password"
       }
     }
   }
   ```

3. **配置CORS**
   ```json
   {
     "cors": {
       "origin": "https://yourdomain.com"
     }
   }
   ```

4. **启用HTTPS**
   - 使用反向代理（Nginx/Apache）
   - 配置SSL证书
   - 强制HTTPS重定向

## 📈 监控维护

### 系统监控

- **健康检查：** `/health` 端点监控系统状态
- **日志监控：** Winston日志记录所有重要事件
- **性能监控：** 请求响应时间统计
- **错误追踪：** 详细的错误堆栈信息

### 数据备份

```bash
# 备份用户数据
cp -r data/ backup/data-$(date +%Y%m%d)/

# 备份日志
cp -r logs/ backup/logs-$(date +%Y%m%d)/

# 备份配置
cp -r config/ backup/config-$(date +%Y%m%d)/
```

## 📞 技术支持

如果遇到问题，请：

1. **查看文档：** 详细阅读本README和相关文档
2. **检查日志：** 查看系统日志了解具体错误
3. **测试环境：** 在干净环境中重现问题
4. **收集信息：** 准备详细的错误信息和复现步骤

## 📝 更新日志

### v3.0.0 (当前版本)
- ✅ 完整集成AuthBlock认证和QA Note Block问答功能
- ✅ 统一的用户认证和会话管理
- ✅ 完整的前后端分离架构
- ✅ 多存储模式和网络状态监控
- ✅ 人员协作和私信功能
- ✅ 本地文件操作和导出功能

---

**系统版本：** v3.0.0  
**最后更新：** 2025年6月4日  
**维护团队：** QA System Team 