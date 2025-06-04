# AuthBlock 服务器部署包

AuthBlock 权限系统的传统服务器部署方案，支持 Linux、Windows、macOS 平台。

## 🚀 快速开始

### 1. 系统要求

- **Node.js**: v16.0.0 或更高版本
- **npm**: v8.0.0 或更高版本
- **内存**: 最少 512MB，推荐 1GB
- **磁盘**: 最少 100MB 可用空间
- **端口**: 默认 3000（可配置）

### 2. 一键安装

#### Windows
```cmd
# 下载并解压部署包
# 双击运行
install.bat
```

#### Linux/macOS  
```bash
# 下载并解压部署包
chmod +x install.sh
./install.sh

# 或使用Node.js脚本
node scripts/install.js
```

### 3. 手动安装

```bash
# 1. 安装依赖
npm install --production

# 2. 创建目录
mkdir -p data logs backups

# 3. 配置服务器
cp config/server.json.example config/server.json
# 编辑配置文件

# 4. 启动服务
npm start
```

## 📋 服务管理

### 基本命令

```bash
# 启动服务
npm start                    # 前台运行
npm run dev                  # 开发模式（自动重启）

# 进程管理
pm2 start ecosystem.config.js   # PM2启动
pm2 stop authblock-server       # PM2停止
pm2 restart authblock-server    # PM2重启
pm2 logs authblock-server       # 查看日志

# 系统服务（Linux）
sudo systemctl start authblock    # 启动
sudo systemctl stop authblock     # 停止
sudo systemctl status authblock   # 状态
sudo systemctl enable authblock   # 开机启动
```

### 管理脚本

```bash
# 服务状态
npm run status               # 查看运行状态
node scripts/status.js       # 详细状态信息

# 服务停止
npm run stop                 # 停止服务
node scripts/stop.js         # 强制停止

# 数据备份
npm run backup               # 备份用户数据
node scripts/backup.js       # 手动备份

# 连接测试
npm run test                 # 测试连接
node scripts/test-connection.js  # 详细测试
```

## ⚙️ 配置说明

### 主配置文件: `config/server.json`

```json
{
  "nodeEnv": "production",        // 运行环境
  "port": 3000,                   // 服务端口
  "host": "0.0.0.0",             // 监听地址
  
  "cors": {
    "origin": "*"                 // CORS来源
  },
  
  "auth": {
    "jwtSecret": "your-secret",   // JWT密钥（必须修改）
    "sessionTimeout": 7200000,    // 会话超时（毫秒）
    "storageType": "file",        // 存储类型
    "dataPath": "./data",         // 数据目录
    
    "defaultAdmin": {
      "username": "admin",        // 管理员用户名
      "password": "admin123",     // 管理员密码（必须修改）
      "name": "系统管理员",
      "email": "admin@authblock.local"
    }
  },
  
  "logging": {
    "level": "info",              // 日志级别
    "file": "./logs/authblock.log" // 日志文件
  }
}
```

### 环境变量支持

```bash
# 设置环境变量
export NODE_ENV=production
export PORT=3000
export JWT_SECRET=your-super-secret-key
export ADMIN_PASSWORD=your-secure-password

# Windows
set NODE_ENV=production
set PORT=3000
```

## 🏗️ 目录结构

```
authblock-server/
├── app.js                    # 主应用文件
├── package.json              # 项目配置
├── ecosystem.config.js       # PM2配置
├── install.bat              # Windows安装脚本
├── install.sh               # Linux/Mac安装脚本
├── 
├── config/                   # 配置文件
│   ├── server.json          # 服务器配置
│   └── server.json.example  # 配置模板
├── 
├── lib/                      # 核心库
│   ├── auth-block.js        # 认证核心
│   ├── logger.js            # 日志组件
│   └── storage.js           # 存储组件
├── 
├── routes/                   # API路由
│   ├── api.js               # 主路由
│   ├── auth.js              # 认证路由
│   └── user.js              # 用户路由
├── 
├── scripts/                  # 管理脚本
│   ├── install.js           # 安装脚本
│   ├── setup.js             # 初始化脚本
│   ├── create-service.js    # 服务创建
│   ├── status.js            # 状态检查
│   ├── stop.js              # 停止服务
│   ├── backup.js            # 数据备份
│   └── test-connection.js   # 连接测试
├── 
├── demo/                     # 演示页面
│   ├── index.html           # 主页面
│   ├── login.html           # 登录页面
│   └── admin.html           # 管理页面
├── 
├── data/                     # 数据目录
│   ├── users.json           # 用户数据
│   └── sessions.json        # 会话数据
├── 
├── logs/                     # 日志目录
│   ├── authblock.log        # 应用日志
│   ├── error.log            # 错误日志
│   └── access.log           # 访问日志
└── 
└── backups/                  # 备份目录
    └── 20241202_143052/     # 按时间戳分组
```

## 🔧 高级配置

### 1. 反向代理（Nginx）

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 2. SSL/HTTPS 配置

```bash
# 生成自签名证书（测试用）
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/authblock.key \
  -out ssl/authblock.crt

# 在Nginx中配置SSL
listen 443 ssl;
ssl_certificate /path/to/authblock.crt;
ssl_certificate_key /path/to/authblock.key;
```

### 3. 数据库集成

```json
// config/server.json
{
  "auth": {
    "storageType": "database",
    "database": {
      "type": "mysql",
      "host": "localhost",
      "port": 3306,
      "database": "authblock",
      "username": "authblock_user",
      "password": "your_password"
    }
  }
}
```

### 4. 集群部署

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'authblock-server',
    script: 'app.js',
    instances: 'max',        // 使用所有CPU核心
    exec_mode: 'cluster',    // 集群模式
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
```

## 🛡️ 安全配置

### 1. 生产环境安全

```json
{
  "auth": {
    "jwtSecret": "your-super-long-random-secret-key-here",
    "sessionTimeout": 3600000,
    "bcryptRounds": 12,
    "defaultAdmin": {
      "password": "your-very-secure-password"
    }
  },
  "cors": {
    "origin": ["https://yourdomain.com"]
  },
  "rateLimit": {
    "windowMs": 900000,
    "max": 50
  }
}
```

### 2. 防火墙配置

```bash
# Ubuntu/Debian
sudo ufw allow 3000/tcp
sudo ufw enable

# CentOS/RHEL
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload

# Windows
netsh advfirewall firewall add rule name="AuthBlock" dir=in action=allow protocol=TCP localport=3000
```

### 3. 用户权限

```bash
# 创建专用用户（Linux）
sudo useradd -r -s /bin/false authblock
sudo chown -R authblock:authblock /opt/authblock-server

# 限制文件权限
chmod 600 config/server.json
chmod 700 data/ logs/
```

## 📊 监控和日志

### 1. 日志查看

```bash
# 实时日志
tail -f logs/authblock.log

# 错误日志
grep "ERROR" logs/authblock.log

# 访问统计
grep "GET\|POST" logs/authblock.log | wc -l
```

### 2. 性能监控

```bash
# PM2监控
pm2 monit

# 系统资源
htop
iostat -x 1
```

### 3. 健康检查

```bash
# HTTP检查
curl http://localhost:3000/health

# 服务检查
node scripts/status.js

# 连接测试
node scripts/test-connection.js
```

## 🔄 维护和更新

### 1. 数据备份

```bash
# 自动备份（每日）
node scripts/backup.js

# 手动备份
cp -r data/ backups/manual_$(date +%Y%m%d_%H%M%S)/

# 恢复数据
cp -r backups/20241202_143052/data/ ./
```

### 2. 日志轮转

```bash
# 使用logrotate（Linux）
sudo vi /etc/logrotate.d/authblock

/opt/authblock-server/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 authblock authblock
}
```

### 3. 版本更新

```bash
# 停止服务
npm run stop

# 备份数据
npm run backup

# 更新代码
git pull
npm install --production

# 重启服务
npm start
```

## 🔍 故障排除

### 常见问题

#### 1. 服务启动失败
```bash
# 检查端口占用
netstat -tlnp | grep 3000
lsof -i :3000

# 检查权限
ls -la config/server.json
```

#### 2. 内存不足
```bash
# 检查内存使用
free -h
ps aux | grep node

# 限制内存使用
node --max-old-space-size=512 app.js
```

#### 3. 数据丢失
```bash
# 检查数据目录
ls -la data/

# 恢复备份
cp -r backups/latest/data/ ./
```

#### 4. 网络连接问题
```bash
# 检查防火墙
sudo ufw status
sudo iptables -L

# 检查网络绑定
netstat -tlnp | grep :3000
```

## 📞 技术支持

如果遇到问题：

1. 查看日志文件：`logs/authblock.log`
2. 运行诊断脚本：`node scripts/status.js`
3. 检查配置文件：`config/server.json`
4. 查看进程状态：`pm2 list` 或 `ps aux | grep node`

联系支持：
- 📧 邮箱：support@qa-system.com
- 📖 文档：https://authblock.qa-system.com
- 🐛 问题报告：https://github.com/qa-system/authblock-server/issues

---

> **注意**: 生产环境部署前请务必修改默认密码和JWT密钥！ 