# 智能笔记-问答工具包 v3.0

一个功能完整、开箱即用的智能问答和笔记管理系统，支持多种智能体接入和本地文件保存。

## 🚀 核心特性

### 📝 双模式设计
- **问答模式**：智能AI问答，支持多种智能体
- **笔记模式**：快速笔记记录和管理
- **一键切换**：无缝模式切换体验

### 🤖 智能体支持
- **通用助手**：日常问答和对话
- **RAG知识助手**：知识检索增强回答
- **专业助手**：代码、写作等专业领域
- **团队协作**：多智能体协同工作

### 💾 存储方案
- **本地文件保存**：支持多种格式导出
- **云端同步**：API接口数据同步
- **自动保存**：防止数据丢失
- **历史管理**：完整的操作历史

### 🎨 用户体验
- **响应式设计**：完美适配PC和移动端
- **现代化UI**：简洁美观的界面设计
- **快捷操作**：键盘快捷键支持
- **个性化配置**：主题和设置自定义

## 📦 工具包结构

```
qa-note-toolkit/
├── src/                    # 源代码
│   ├── core/              # 核心模块
│   │   ├── qa-engine.js   # 问答引擎
│   │   ├── note-manager.js # 笔记管理器
│   │   └── storage.js     # 存储管理
│   ├── components/        # UI组件
│   │   ├── qa-interface.js # 问答界面
│   │   ├── note-editor.js  # 笔记编辑器
│   │   └── file-manager.js # 文件管理器
│   ├── agents/            # 智能体连接
│   │   ├── agent-connector.js # 智能体连接器
│   │   └── agent-configs.js   # 智能体配置
│   └── utils/             # 工具函数
│       ├── formatters.js  # 格式化工具
│       └── validators.js  # 验证工具
├── dist/                  # 构建产物
├── demo/                  # 演示示例
├── docs/                  # 文档
└── examples/              # 使用示例
```

## 🛠️ 快速开始

### 1. 直接使用（无需构建）

```html
<!DOCTYPE html>
<html>
<head>
    <title>我的问答系统</title>
    <link rel="stylesheet" href="dist/qa-note-toolkit.min.css">
</head>
<body>
    <div id="qa-note-container"></div>
    
    <script src="dist/qa-note-toolkit.min.js"></script>
    <script>
        // 初始化工具包
        const qaNote = new QANoteToolkit({
            container: '#qa-note-container',
            agents: {
                default: 'general',
                apiUrl: 'http://localhost:8001'
            },
            storage: {
                mode: 'local',
                autoSave: true
            }
        });
        
        qaNote.init();
    </script>
</body>
</html>
```

### 2. NPM模块使用

```bash
npm install qa-note-toolkit
```

```javascript
import QANoteToolkit from 'qa-note-toolkit';

const qaNote = new QANoteToolkit({
    // 配置选项
});

qaNote.init();
```

### 3. CDN使用

```html
<!-- CSS -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/qa-note-toolkit@3.0.0/dist/qa-note-toolkit.min.css">

<!-- JavaScript -->
<script src="https://cdn.jsdelivr.net/npm/qa-note-toolkit@3.0.0/dist/qa-note-toolkit.min.js"></script>
```

## ⚙️ 配置选项

```javascript
const config = {
    // 容器设置
    container: '#qa-note-container',
    
    // 智能体配置
    agents: {
        default: 'general',          // 默认智能体
        apiUrl: 'http://localhost:8001',  // API基础URL
        timeout: 30000,              // 请求超时时间
        retryAttempts: 3             // 重试次数
    },
    
    // 存储配置
    storage: {
        mode: 'local',               // 存储模式: local | api | hybrid
        autoSave: true,              // 自动保存
        saveInterval: 30000,         // 自动保存间隔
        maxHistory: 1000             // 最大历史记录数
    },
    
    // UI配置
    ui: {
        theme: 'modern',             // 主题: modern | classic | dark
        language: 'zh-CN',           // 界面语言
        responsive: true,            // 响应式设计
        animations: true             // 动画效果
    },
    
    // 功能配置
    features: {
        fileUpload: true,            // 文件上传
        imageCapture: true,          // 图片捕获
        voiceInput: false,           // 语音输入
        exportFormats: ['md', 'txt', 'json']  // 支持的导出格式
    }
};
```

## 🔌 API接口

### 初始化
```javascript
const qaNote = new QANoteToolkit(config);
await qaNote.init();
```

### 问答操作
```javascript
// 发送问题
const response = await qaNote.askQuestion({
    content: '你好，世界！',
    agent: 'general'
});

// 切换智能体
qaNote.switchAgent('rag_single');

// 获取当前智能体
const currentAgent = qaNote.getCurrentAgent();
```

### 笔记操作
```javascript
// 保存笔记
await qaNote.saveNote({
    title: '我的笔记',
    content: '笔记内容...',
    tags: ['工作', '学习']
});

// 获取笔记列表
const notes = await qaNote.getNotes();

// 导出笔记
await qaNote.exportNote(noteId, 'markdown');
```

### 事件监听
```javascript
// 监听问答完成
qaNote.on('questionAnswered', (data) => {
    console.log('回答:', data.response);
});

// 监听笔记保存
qaNote.on('noteSaved', (data) => {
    console.log('笔记已保存:', data.noteId);
});

// 监听智能体切换
qaNote.on('agentSwitched', (data) => {
    console.log('切换到:', data.agentName);
});
```

## 🌐 部署方案

### 1. 静态部署
```bash
# 下载工具包
wget https://github.com/your-repo/qa-note-toolkit/releases/download/v3.0.0/qa-note-toolkit-v3.0.0.zip

# 解压
unzip qa-note-toolkit-v3.0.0.zip

# 部署到Web服务器
cp -r qa-note-toolkit/* /var/www/html/
```

### 2. Docker部署
```dockerfile
FROM nginx:alpine
COPY dist/ /usr/share/nginx/html/
EXPOSE 80
```

```bash
docker build -t qa-note-toolkit .
docker run -d -p 80:80 qa-note-toolkit
```

### 3. 嵌入式部署
```html
<!-- 最小化嵌入 -->
<iframe src="https://your-domain.com/qa-note-toolkit/" 
        width="100%" height="600px" frameborder="0">
</iframe>
```

## 📋 使用示例

### 基础问答系统
```javascript
const basicQA = new QANoteToolkit({
    container: '#qa-container',
    agents: { default: 'general' },
    ui: { theme: 'modern' }
});
```

### 知识管理系统
```javascript
const knowledgeSystem = new QANoteToolkit({
    container: '#knowledge-container',
    agents: { default: 'rag_single' },
    storage: { mode: 'api' },
    features: { fileUpload: true }
});
```

### 团队协作平台
```javascript
const teamPlatform = new QANoteToolkit({
    container: '#team-container',
    agents: { default: 'rag_team' },
    ui: { theme: 'dark' },
    features: { voiceInput: true }
});
```

## 🤝 集成指南

### 与现有系统集成
```javascript
// 1. 作为组件嵌入
import QANoteToolkit from 'qa-note-toolkit';

class MyApp extends Component {
    componentDidMount() {
        this.qaNote = new QANoteToolkit({
            container: this.containerRef.current
        });
        this.qaNote.init();
    }
}

// 2. 作为插件使用
window.addEventListener('load', () => {
    if (typeof QANoteToolkit !== 'undefined') {
        const qaNote = new QANoteToolkit({
            container: '#my-qa-system'
        });
        qaNote.init();
    }
});
```

### 自定义智能体
```javascript
// 注册自定义智能体
qaNote.registerAgent('my_custom_agent', {
    name: '我的智能体',
    endpoint: '/api/my-agent',
    capabilities: ['问答', '分析']
});
```

## 📚 更多资源

- [完整API文档](docs/api.md)
- [自定义主题指南](docs/themes.md)
- [智能体开发指南](docs/agents.md)
- [故障排除指南](docs/troubleshooting.md)

## 📄 许可证

MIT License - 可自由用于商业和非商业项目

## 🆘 支持

- 📧 邮箱: support@qa-note-toolkit.com
- 💬 讨论区: https://github.com/your-repo/qa-note-toolkit/discussions
- 🐛 问题反馈: https://github.com/your-repo/qa-note-toolkit/issues

---

*智能笔记-问答工具包 - 让智能对话变得简单！* 