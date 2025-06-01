# 📝 NoteSaver 工具包使用文档

## 🎯 设计理念

NoteSaver 是一个**不可视的核心代码工具包**，可以被任意外部应用集成调用。它提供标准化的笔记保存接口，让任何网页、应用都能快速集成笔记保存功能。

## 🏗️ 架构设计

```
┌─────────────────────────────────────┐
│          任意外部应用                │
│  ┌─────────┐ ┌─────────┐ ┌────────┐  │
│  │ 输入框  │ │ 按钮   │ │ 快捷键 │  │
│  └─────────┘ └─────────┘ └────────┘  │
└─────────────┬───────────────────────┘
              │ 调用API
              ▼
┌─────────────────────────────────────┐
│      NoteSaver 工具包核心             │
│  ┌─────────────────────────────────┐ │
│  │  • 路径选择                      │ │
│  │  • 内容保存                      │ │
│  │  • 图片处理                      │ │
│  │  • 格式定义                      │ │
│  │  • 时间戳                        │ │
│  └─────────────────────────────────┘ │
└─────────────┬───────────────────────┘
              │ 后端API
              ▼
┌─────────────────────────────────────┐
│         后端服务 + 文件系统           │
└─────────────────────────────────────┘
```

## 🚀 快速开始

### 1. 引入工具包

```html
<!-- 在任意HTML页面中引入 -->
<script src="path/to/note_saver_toolkit/js/note-saver.js"></script>
```

### 2. 基础使用

```javascript
// 创建实例
const noteSaver = createNoteSaver({
    apiBase: 'http://localhost:5000/api'
});

// 选择保存路径
await noteSaver.selectFilePath();

// 保存笔记
await noteSaver.saveNote('我的笔记内容');
```

## 📚 API 文档

### 核心接口

#### 1. 路径选择接口
```javascript
/**
 * 打开本地文件选择器，选择保存路径
 * @param {Function} callback - 选择完成后的回调函数
 * @returns {Promise<string>} 选择的文件路径
 */
await noteSaver.selectFilePath((filePath) => {
    console.log('选择的路径:', filePath);
});
```

#### 2. 内容保存接口
```javascript
/**
 * 保存笔记内容
 * @param {string} content - 笔记内容
 * @param {Object} options - 保存选项
 * @returns {Promise<Object>} 保存结果
 */
await noteSaver.saveNote('笔记内容', {
    appName: '我的应用',      // 应用名称
    format: 'markdown',      // 保存格式
    timestamp: true,         // 是否添加时间戳
    images: []              // 图片数组
});
```

#### 3. 格式定义接口
```javascript
/**
 * 设置保存格式
 * @param {string} format - 格式类型
 * @param {Object} customFormat - 自定义格式选项
 */
noteSaver.setFormat('markdown', {
    header: '## ',
    timestamp: true
});
```

#### 4. 图片处理接口
```javascript
/**
 * 添加图片到待保存列表
 * @param {string|File|Blob} imageData - 图片数据
 * @returns {Promise<string>} Base64图片数据
 */
const imageData = await noteSaver.addImage(file);
```

#### 5. 剪贴板监听接口
```javascript
/**
 * 监听指定元素的粘贴事件
 * @param {HTMLElement} element - 要监听的DOM元素
 * @param {Function} callback - 粘贴成功回调
 */
noteSaver.listenPaste(inputElement, (imageData, count) => {
    console.log(`粘贴了第${count}张图片`);
});
```

### 全局便捷API

```javascript
// 快速保存（自动选择路径）
await quickSaveNote('内容');

// 快速路径选择
await quickSelectPath();

// 创建实例
const noteSaver = createNoteSaver(options);
```

## 🎮 使用场景

### 场景1：博客编辑器集成

```javascript
// 在博客编辑器中集成
const blogEditor = document.getElementById('blog-editor');
const saveBtn = document.getElementById('save-btn');

// 创建NoteSaver实例
const noteSaver = createNoteSaver();

// 监听粘贴事件
noteSaver.listenPaste(blogEditor, (imageData) => {
    // 显示图片预览
    showImagePreview(imageData);
});

// 保存按钮
saveBtn.addEventListener('click', async () => {
    const content = blogEditor.value;
    await noteSaver.saveNote(content, {
        appName: '博客编辑器',
        format: 'markdown'
    });
});
```

### 场景2：笔记应用集成

```javascript
// 在笔记应用中集成
class NoteApp {
    constructor() {
        this.noteSaver = createNoteSaver();
        this.initShortcuts();
    }

    initShortcuts() {
        // Ctrl+S 保存
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                this.saveCurrentNote();
            }
        });
    }

    async saveCurrentNote() {
        const content = this.getCurrentContent();
        try {
            await this.noteSaver.saveNote(content, {
                appName: '笔记应用',
                timestamp: true
            });
            this.showStatus('保存成功');
        } catch (error) {
            this.showStatus('保存失败: ' + error.message);
        }
    }
}
```

### 场景3：聊天应用记录

```javascript
// 在聊天应用中记录对话
class ChatRecorder {
    constructor() {
        this.noteSaver = createNoteSaver();
    }

    async recordConversation(messages) {
        const content = messages.map(msg => 
            `**${msg.sender}** (${msg.time}): ${msg.content}`
        ).join('\n\n');

        await this.noteSaver.saveNote(content, {
            appName: '聊天记录器',
            format: 'markdown'
        });
    }
}
```

## 🔧 配置选项

```javascript
const noteSaver = createNoteSaver({
    // API服务器地址
    apiBase: 'http://localhost:5000/api',
    
    // 默认保存格式
    defaultFormat: 'markdown',
    
    // 是否自动添加时间戳
    autoTimestamp: true,
    
    // 其他配置...
});
```

## 📱 演示页面

我们提供了完整的演示页面，展示所有功能：

```bash
# 启动后端服务
python run_simple_demo.py

# 访问演示页面
http://localhost:8080/frontend/demo.html
```

演示页面包含：
- ✅ 工具包状态显示
- ✅ 路径选择功能
- ✅ 内容输入和图片粘贴
- ✅ 保存动作演示
- ✅ 格式定义演示
- ✅ 全局API演示

## 🚨 注意事项

### 浏览器安全限制
- 出于安全考虑，浏览器无法获取完整的本地文件路径
- 文件选择器只能返回文件名，不能返回完整路径
- 实际保存路径由后端服务管理

### 跨域问题
- 确保后端服务支持CORS
- 或将前端页面与后端服务部署在同域下

### 依赖要求
- 需要后端API服务运行在指定端口
- 需要现代浏览器支持ES6+

## 🔄 集成流程

### 1. 外部应用准备
```javascript
// 1. 引入工具包
<script src="note-saver.js"></script>

// 2. 创建实例
const noteSaver = createNoteSaver();

// 3. 绑定事件
element.addEventListener('paste', () => {
    // 调用工具包API
});
```

### 2. 核心接口调用
```javascript
// 路径选择
const path = await noteSaver.selectFilePath();

// 内容保存
const result = await noteSaver.saveNote(content);

// 图片处理
await noteSaver.addImage(imageFile);
```

### 3. 结果处理
```javascript
try {
    const result = await noteSaver.saveNote(content);
    showSuccess(result.message);
} catch (error) {
    showError(error.message);
}
```

## 🎨 自定义扩展

### 自定义保存格式
```javascript
noteSaver.setFormat('custom', {
    header: (title, timestamp) => `# ${title}\n> ${timestamp}\n\n`,
    content: (text) => text,
    footer: () => '\n---\n*Generated by MyApp*'
});
```

### 自定义图片处理
```javascript
class CustomNoteSaver extends NoteSaver {
    async processImage(imageData) {
        // 自定义图片处理逻辑
        const compressed = await this.compressImage(imageData);
        return compressed;
    }
}
```

## 📊 性能优化

- 🚀 图片自动压缩
- 📦 按需加载模块
- 💾 本地缓存配置
- 🔄 异步API调用

## 🤝 技术支持

- 📖 完整文档：[README.md](README.md)
- 🎮 演示页面：[demo.html](frontend/demo.html)
- 🔧 API接口：[note-saver.js](note_saver_toolkit/js/note-saver.js)
- 🐛 问题反馈：检查浏览器控制台错误信息

---

**🎉 享受模块化、可集成的笔记保存体验！** 