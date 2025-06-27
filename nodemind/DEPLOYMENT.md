# NodeMind 思维导图应用部署指南

## 项目概述

NodeMind 是一个基于 jsMind 的现代化思维导图应用，采用模块化 ES6 架构，支持多工作区管理、节点标签系统、拖拽功能和 Markdown 编辑器。

## 核心功能

### 🧠 思维导图功能
- **三个独立工作区**：
  - 🏷️ 标签管理：用于管理节点标签和分类
  - 📋 临时工作区B：用于临时思维导图创建
  - 🚀 项目管理：用于项目规划和管理
- **完整的根节点和子节点显示**
- **节点拖拽重组功能**
- **多主题切换支持**
- **节点选择和编辑**

### 🎨 用户界面
- **响应式布局**：适配不同屏幕尺寸
- **标签页切换**：在不同工作区间无缝切换
- **详情面板**：显示节点详细信息
- **Markdown 编辑器**：支持文档编辑和预览

### 🔧 技术特性
- **模块化架构**：ES6 模块系统
- **事件驱动**：发布-订阅模式
- **状态管理**：集中式状态管理
- **本地存储**：数据持久化

## 项目结构

```
nodemind/
├── src/                          # 源代码目录
│   ├── config.js                 # 配置文件和思维导图数据
│   ├── app.js                    # 应用主入口
│   ├── services/                 # 服务层
│   │   ├── state.js              # 状态管理
│   │   ├── mindmap_service.js    # 思维导图服务
│   │   ├── node_service.js       # 节点操作服务
│   │   ├── event_bus.js          # 事件总线
│   │   ├── storage_service.js    # 存储服务
│   │   ├── project_service.js    # 项目管理服务
│   │   └── tag_service.js        # 标签管理服务
│   ├── controllers/              # 控制器层
│   │   ├── ui_controller.js      # UI控制器
│   │   └── context_menu_controller.js # 右键菜单控制器
│   ├── ui/components/            # UI组件
│   │   ├── node_details_ui.js    # 节点详情UI
│   │   ├── md_browser_ui.js      # Markdown浏览器UI
│   │   └── project_info_ui.js    # 项目信息UI
│   └── utils/                    # 工具函数
│       └── utils.js              # 通用工具
├── node_modules/                 # 依赖包
├── index.html                    # 主页面
├── package.json                  # 项目配置
└── README.md                     # 项目说明
```

## 部署步骤

### 1. 环境准备

确保系统已安装：
- Node.js (版本 14 或更高)
- npm (通常随 Node.js 一起安装)

### 2. 安装依赖

```bash
# 进入项目目录
cd nodemind

# 安装项目依赖
npm install
```

### 3. 开发环境运行

```bash
# 启动开发服务器
npm run dev
```

应用将在 `http://127.0.0.1:8080` 启动。

### 4. 生产环境部署

#### 方法一：使用 http-server

```bash
# 安装 http-server（如果未安装）
npm install -g http-server

# 启动生产服务器
npm start
```

#### 方法二：使用 Nginx

1. 将项目文件复制到 Nginx 服务器目录
2. 配置 Nginx 虚拟主机：

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/nodemind;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

#### 方法三：使用 Apache

创建 `.htaccess` 文件：

```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.html [QSA,L]

# 启用 Gzip 压缩
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>
```

## 配置说明

### 思维导图数据配置

在 `src/config.js` 中可以修改：

- **mindmapData**: 三个工作区的初始数据
- **baseOptions**: jsMind 基础配置选项
- **themes**: 可用主题列表

### 自定义主题

在 `src/config.js` 的 `themes` 数组中添加新主题：

```javascript
export const themes = [
    { name: 'custom', label: '自定义主题' },
    // ... 其他主题
];
```

## 功能使用指南

### 工作区切换

点击顶部标签页按钮切换不同工作区：
- 🏷️ 标签管理
- 📋 临时工作区B  
- 🚀 项目管理

### 节点操作

- **选择节点**：点击任意节点
- **添加节点**：选中父节点后点击"➕ 添加节点"
- **删除节点**：选中节点后点击"❌ 删除节点"
- **拖拽节点**：直接拖拽节点到新位置

### 节点详情编辑

1. 点击选择节点
2. 在右侧详情面板中编辑：
   - 基本信息
   - 详细描述
   - 标签管理

### Markdown 编辑器

在右侧面板的 MD 文本浏览器中：
- 编辑 Markdown 内容
- 实时预览渲染效果
- 保存和加载文件

## 故障排除

### 根节点不显示

如果思维导图区域空白，检查：
1. 浏览器控制台是否有错误
2. 容器是否有正确的尺寸
3. jsMind 库是否正确加载

### 标签页切换失败

检查：
1. 事件监听器是否正确绑定
2. 容器 ID 是否匹配
3. CSS 样式是否正确应用

### 拖拽功能不工作

确认：
1. jsMind 拖拽插件已加载
2. 浏览器支持拖拽 API
3. 没有 CSS 样式冲突

## 性能优化

### 1. 资源压缩

```bash
# 压缩 JavaScript 和 CSS
npm install -g uglify-js clean-css-cli

# 压缩 JS
uglifyjs src/**/*.js -o dist/app.min.js

# 压缩 CSS
cleancss -o dist/style.min.css node_modules/jsmind/style/jsmind.css
```

### 2. 启用 Gzip

在服务器配置中启用 Gzip 压缩以减少传输大小。

### 3. CDN 加速

将静态资源部署到 CDN 以提高加载速度。

## 浏览器兼容性

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 许可证

MIT License

## 技术支持

如遇问题，请检查：
1. 浏览器控制台错误信息
2. 网络请求状态
3. 依赖包版本兼容性

---

**部署完成后，访问应用即可看到完整的三工作区思维导图界面，每个区域都有正确的根节点和子节点显示。** 