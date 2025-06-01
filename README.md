# 📝 本地笔记保存工具

## 🎯 功能概述

这是一个可集成到任何页面的**纯前端本地笔记保存工具**，实现将第三方应用的内容直接保存到本地笔记文件中，支持**更新保存**（追加内容，不删除原内容）。

## ✨ 核心特性

- ✅ **更新保存**：内容追加到现有笔记，保留历史记录
- ✅ **纯前端**：无需后端服务，直接操作本地文件
- ✅ **支持图片**：可以粘贴图片到笔记中
- ✅ **自动时间戳**：每次保存都会添加时间和应用标识
- ✅ **浏览器兼容**：现代浏览器直接保存，旧浏览器下载保存
- ✅ **零依赖**：纯JavaScript实现，无需第三方库

## 🚀 快速开始

### 1. 文件结构
```
your-project/
├── local-note-saver.js  # 工具包文件
├── demo.html           # 演示页面
└── README.md          # 说明文档
```

### 2. 基本使用

```html
<!DOCTYPE html>
<html>
<head>
    <title>您的应用</title>
</head>
<body>
    <!-- 您的页面内容 -->
    <button id="select-btn">选择笔记文件</button>
    <textarea id="content-input" placeholder="输入内容..."></textarea>
    <button id="save-btn">保存到笔记</button>
    
    <!-- 状态显示（可选） -->
    <div id="note-saver-status"></div>

    <!-- 引入工具包 -->
    <script src="local-note-saver.js"></script>
    <script>
        // 初始化工具
        const noteSaver = new LocalNoteSaver({
            appName: '您的应用名称'
        });

        // 绑定页面元素
        noteSaver.bindSelectButton('#select-btn');
        noteSaver.bindInput('#content-input');
        noteSaver.bindSaveButton('#save-btn');
    </script>
</body>
</html>
```

## 📋 三个核心参数

### 参数1：路径和文件选择器
```javascript
noteSaver.bindSelectButton('#your-select-button');
```
- 绑定一个按钮，点击时弹出文件选择对话框
- 用户可以选择要保存到的本地笔记文件
- 支持 `.md` 和 `.txt` 格式

### 参数2：文字或图片录入
```javascript
noteSaver.bindInput('#your-input-element');
```
- 绑定文本输入框或文本区域
- 支持文字输入
- 支持图片粘贴（Ctrl+V）

### 参数3：保存或发送
```javascript
noteSaver.bindSaveButton('#your-save-button');
```
- 绑定保存按钮
- 点击时将内容追加保存到选择的文件
- 自动添加时间戳和应用标识

## 🔧 配置选项

```javascript
const noteSaver = new LocalNoteSaver({
    appName: '您的应用名称',           // 应用名称，显示在笔记中
    timestampFormat: 'zh-CN',        // 时间戳格式
    debugMode: true                  // 是否启用调试模式
});
```

## 💾 保存格式

保存到笔记文件的内容格式：

```markdown
## 2025-01-31 20:30:15 - 您的应用名称

用户输入的内容...

### 图片
![图片1](data:image/png;base64,...)

---
```

## 🌐 浏览器支持

### 完全支持（推荐）
- Chrome 86+
- Edge 86+
- Opera 72+

**功能**：直接保存到用户选择的本地文件，支持更新保存

### 降级支持
- Firefox
- Safari
- 较旧版本浏览器

**功能**：通过下载方式保存文件，用户需要手动管理

## 📖 使用示例

### 演示页面
打开 `demo.html` 查看完整的集成演示。

### 集成到聊天应用
```javascript
// 初始化
const chatNoteSaver = new LocalNoteSaver({
    appName: '聊天记录保存'
});

// 绑定聊天界面元素
chatNoteSaver.bindSelectButton('#chat-save-location');
chatNoteSaver.bindInput('#chat-message-input');
chatNoteSaver.bindSaveButton('#chat-save-message');
```

### 集成到笔记应用
```javascript
// 初始化
const noteApp = new LocalNoteSaver({
    appName: '笔记应用',
    debugMode: false
});

// 绑定笔记界面元素
noteApp.bindSelectButton('.note-file-selector');
noteApp.bindInput('.note-editor');
noteApp.bindSaveButton('.note-save-btn');
```

## 🛠️ API 参考

### 主要方法

#### `bindSelectButton(selector)`
绑定文件选择按钮
- `selector`: CSS选择器或DOM元素

#### `bindInput(selector)`
绑定内容输入框
- `selector`: CSS选择器或DOM元素

#### `bindSaveButton(selector)`
绑定保存按钮
- `selector`: CSS选择器或DOM元素

#### `getStatus()`
获取当前工具状态
```javascript
const status = noteSaver.getStatus();
console.log(status);
// {
//   hasFile: true,
//   fileName: "我的笔记.md",
//   imageCount: 2,
//   hasInput: true,
//   apiSupported: true
// }
```

### 事件处理

工具包会自动处理：
- 文件选择对话框
- 图片粘贴事件
- 权限请求
- 错误处理

## ⚠️ 注意事项

1. **文件权限**：首次使用时，浏览器会请求文件系统访问权限
2. **安全限制**：只能访问用户明确选择的文件
3. **文件格式**：推荐使用 `.md` 格式获得最佳效果
4. **图片大小**：建议图片不要过大，以免影响性能

## 🔍 故障排除

### 问题：无法保存到文件
**解决**：
1. 确保使用支持的浏览器（Chrome 86+）
2. 检查是否允许了文件系统访问权限
3. 尝试选择不同的文件位置

### 问题：图片粘贴无效
**解决**：
1. 确保输入框已获得焦点
2. 使用 Ctrl+V 粘贴图片
3. 检查图片格式是否受支持

### 问题：状态不显示
**解决**：
1. 确保页面有状态显示元素
2. 检查元素ID或类名是否正确

## 📞 技术支持

如遇问题，请检查：
1. 浏览器控制台错误信息
2. 工具状态信息（调用 `getStatus()`）
3. 浏览器版本兼容性

---

**🎉 现在您可以将任何页面的内容轻松保存到本地笔记文件中！** 