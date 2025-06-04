# QANoteBlock v3.0 - 问答笔记统一功能块

> 智能问答系统 v3.0 完整解耦版核心业务模块

## 🎯 功能概述

QANoteBlock 是智能问答系统的核心业务模块，提供问答交互和笔记管理的统一功能，支持在线/离线双模式运行。

### 🌟 核心特性

#### 双模式设计
- **问答模式**: AI智能问答，支持多种助手类型
- **笔记模式**: 笔记编辑管理，支持标签分类
- **无缝切换**: 模式间数据可无缝转换

#### 智能存储
- **自动保存**: 问答内容自动保存为记录
- **灵活存储**: 支持本地/云端存储策略
- **数据持久**: 页面刷新数据不丢失

#### 网络适应
- **在线模式**: 调用后端API获取AI回答
- **离线模式**: 自动降级使用模拟回答
- **网络监控**: 实时显示网络状态

#### 用户体验
- **现代UI**: 梯度背景+毛玻璃效果
- **响应式**: 完美适配移动端
- **快捷键**: 支持Ctrl+Enter提交
- **状态提示**: 实时反馈操作结果

## 📁 文件结构

```
qa-note-block/
├── qa-note-block.js       # 核心JavaScript模块 (42KB)
├── qa-note-block.css      # 样式文件 (18KB)
├── qa-note-demo.html      # 独立演示页面 (20KB)
└── README.md              # 说明文档
```

## 🚀 快速开始

### 1. 基础集成

```html
<!DOCTYPE html>
<html>
<head>
    <link rel="stylesheet" href="qa-note-block.css">
</head>
<body>
    <!-- 依赖模块 -->
    <script src="../ui-block/main.js"></script>
    <script src="../auth-block/auth.js"></script>
    <script src="../shared/notebook.js"></script>
    
    <!-- QANoteBlock 模块 -->
    <script src="qa-note-block.js"></script>
</body>
</html>
```

### 2. 自动初始化

QANoteBlock 会自动初始化并创建UI界面：

```javascript
// 自动创建容器和界面
// 检查依赖模块
// 初始化存储管理器
// 设置网络监控
// 绑定事件处理
```

### 3. 手动初始化

```javascript
// 手动控制初始化
await QANoteBlock.init();

// 切换模式
QANoteBlock.switchMode('qa');    // 问答模式
QANoteBlock.switchMode('note');  // 笔记模式
```

## 🎮 使用指南

### 问答模式操作

1. **选择助手类型**
   - 通用助手：日常问答
   - 编程助手：代码相关
   - 写作助手：文字创作
   - 分析助手：数据分析

2. **输入问题**
   - 标题（可选）：简短描述
   - 内容（必填）：详细问题

3. **提交问答**
   - 点击"提问"按钮
   - 或使用 `Ctrl+Enter` 快捷键

4. **处理回答**
   - 复制答案到剪贴板
   - 保存为笔记记录

### 笔记模式操作

1. **创建笔记**
   - 标题（必填）：笔记名称
   - 内容（必填）：笔记正文
   - 标签（可选）：分类标签

2. **保存笔记**
   - 点击"保存笔记"按钮
   - 或使用 `Ctrl+S` 快捷键

3. **笔记管理**
   - 自动加载最近笔记
   - 支持搜索和过滤

## 🔧 API 接口

### 核心方法

#### `QANoteBlock.init()`
```javascript
// 初始化模块
const result = await QANoteBlock.init();
// 返回: { success: boolean, error?: string }
```

#### `QANoteBlock.switchMode(mode)`
```javascript
// 切换工作模式
QANoteBlock.switchMode('qa');    // 问答模式
QANoteBlock.switchMode('note');  // 笔记模式
```

#### `QANoteBlock.askQuestion(questionData)`
```javascript
// 发送问题到AI
const result = await QANoteBlock.askQuestion({
    title: "问题标题",
    content: "问题内容", 
    agent: "general"
});
```

#### `QANoteBlock.saveNote(noteData)`
```javascript
// 保存笔记
const result = await QANoteBlock.saveNote({
    title: "笔记标题",
    content: "笔记内容",
    tags: ["标签1", "标签2"]
});
```

### 事件监听

```javascript
// 监听模式切换
document.addEventListener('qa-mode-changed', (event) => {
    console.log('模式切换到:', event.detail.mode);
});

// 监听问答完成
document.addEventListener('qa-completed', (event) => {
    console.log('问答完成:', event.detail.response);
});

// 监听笔记保存
document.addEventListener('note-saved', (event) => {
    console.log('笔记已保存:', event.detail.note);
});
```

## 🔌 依赖模块

### 必需依赖

- **AuthBlock**: 用户认证管理
- **UIBlock**: 用户界面组件
- **NotebookManager**: 存储管理器

### 可选依赖

- **APIClient**: 后端API客户端（在线模式）

### 降级策略

当依赖模块缺失时，QANoteBlock 会自动降级：

```javascript
// AuthBlock 缺失 -> 使用匿名模式
// UIBlock 缺失 -> 使用 alert/console 显示消息
// NotebookManager 缺失 -> 使用 localStorage 存储
// APIClient 缺失 -> 使用离线模拟回答
```

## 🎨 界面定制

### CSS 变量

```css
:root {
    --qa-primary-color: #667eea;
    --qa-secondary-color: #764ba2;
    --qa-background-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    --qa-border-radius: 12px;
    --qa-animation-duration: 0.3s;
}
```

### 主题切换

```javascript
// 暗色主题
document.body.classList.add('dark-theme');

// 自定义主题
document.documentElement.style.setProperty('--qa-primary-color', '#ff6b6b');
```

## 📱 响应式设计

### 断点设置

- **Desktop**: `> 768px` - 完整功能
- **Tablet**: `768px - 480px` - 优化布局
- **Mobile**: `< 480px` - 简化界面

### 移动端优化

- 触摸友好的按钮尺寸
- 自适应文字大小
- 优化输入体验
- 减少动画效果

## 🔒 安全特性

### 输入验证

```javascript
// 内容长度限制
const MAX_QUESTION_LENGTH = 2000;
const MAX_TITLE_LENGTH = 100;

// XSS 防护
function sanitizeInput(input) {
    return input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
}
```

### 数据加密

```javascript
// 敏感数据本地存储加密
const encryptedData = CryptoJS.AES.encrypt(JSON.stringify(data), secretKey);
localStorage.setItem('qa-data', encryptedData.toString());
```

## 🚀 性能优化

### 懒加载

```javascript
// 动态创建UI元素
QANoteBlock.ensureUIContainer();

// 按需加载历史记录
QANoteBlock.loadRecentNotes();
```

### 缓存策略

```javascript
// 回答结果缓存
const cacheKey = `qa-${questionHash}`;
const cachedResult = sessionStorage.getItem(cacheKey);
```

### 防抖处理

```javascript
// 搜索输入防抖
const searchDebounced = debounce(QANoteBlock.searchNotes, 300);
```

## 🧪 测试

### 单元测试

```javascript
// 测试模式切换
test('模式切换功能', () => {
    QANoteBlock.switchMode('note');
    expect(QANoteBlock.currentMode).toBe('note');
});

// 测试数据验证
test('问题数据验证', () => {
    const valid = QANoteBlock.validateQuestionData({
        content: '测试问题'
    });
    expect(valid).toBe(true);
});
```

### 演示环境

访问 `qa-note-demo.html` 体验完整功能：

- 模拟用户登录
- AI问答交互
- 笔记编辑保存
- 模式切换演示

## 🐛 故障排除

### 常见问题

**Q: 无法显示UI界面**
```javascript
// 检查容器是否存在
const container = document.getElementById('qa-note-container');
if (!container) {
    console.error('找不到容器元素');
}
```

**Q: 网络状态显示错误**
```javascript
// 手动更新网络状态
QANoteBlock.updateNetworkStatus();
```

**Q: 依赖模块加载失败**
```javascript
// 检查依赖状态
QANoteBlock.checkDependencies();
```

### 调试模式

```javascript
// 启用调试日志
QANoteBlock.debugMode = true;

// 查看内部状态
console.log(QANoteBlock.currentMode);
console.log(QANoteBlock.networkStatus);
console.log(QANoteBlock.lastResponse);
```

## 📊 性能指标

- **初始化时间**: < 100ms
- **模式切换**: < 50ms  
- **UI响应**: < 16ms
- **内存占用**: < 5MB
- **包大小**: 42KB (JS) + 18KB (CSS)

## 🔄 版本历史

### v3.0.0 (当前版本)
- ✨ 完整解耦架构重构
- 🚀 新增双模式设计
- 💾 智能存储策略
- 📱 响应式界面优化
- 🔌 模块化依赖管理

### 升级迁移

从 v2.x 升级到 v3.0：

```javascript
// v2.x
window.QANote.init();

// v3.0
await QANoteBlock.init();
```

## 📄 许可证

MIT License - 可自由使用和修改

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

**智能问答系统 v3.0 完整解耦版**  
QANoteBlock - 让问答和笔记管理更智能、更便捷！ 