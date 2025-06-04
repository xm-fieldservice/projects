# 💾 Local Note Saver Toolkit v1.0

本地文件保存工具包 - 支持多种本地文件操作方式，完全离线运行。

## 🎯 功能特性

### ✨ 核心能力
- **本地文件保存** - 支持直接保存到本地文件系统
- **追加保存模式** - 可追加内容到现有文件
- **图片粘贴支持** - 自动处理图片数据
- **离线运行** - 无需服务器，完全客户端运行
- **跨平台兼容** - 支持Windows、Mac、Linux

### 📦 三版本支持

#### 1. JavaScript高级版 (推荐)
- **文件**: `local-note-saver.js`
- **特色**: 支持File System API，功能最强大
- **适用**: 现代浏览器的Web应用
- **支持**: Chrome 86+, Edge 86+, Opera 72+

#### 2. 浏览器原生版
- **文件**: `notebook-manager.js`  
- **特色**: 兼容性最好，使用localStorage + 自动下载
- **适用**: 需要最大兼容性的应用
- **支持**: 所有现代浏览器

#### 3. Python桌面版
- **文件**: `note-saver-python.py`
- **特色**: PyQt5实现，支持图片保存、配置管理
- **适用**: 桌面应用集成
- **支持**: Python 3.6+ + PyQt5

## 🚀 快速开始

### 基础使用

```html
<!DOCTYPE html>
<html>
<head>
    <title>本地笔记保存测试</title>
</head>
<body>
    <div id="note-content">
        <input type="text" id="title" placeholder="笔记标题">
        <textarea id="content" placeholder="笔记内容"></textarea>
        <button onclick="saveNote()">保存笔记</button>
    </div>
    
    <script src="local-note-saver.js"></script>
    <script>
        async function saveNote() {
            const title = document.getElementById('title').value;
            const content = document.getElementById('content').value;
            
            const saver = new LocalNoteSaver();
            await saver.saveNote({
                title: title,
                content: content,
                timestamp: new Date().toISOString()
            });
        }
    </script>
</body>
</html>
```

### 高级配置

```javascript
const saver = new LocalNoteSaver({
    // 保存模式
    mode: 'append',  // 'new' | 'append' | 'auto'
    
    // 文件配置
    fileName: 'my-notes.md',
    encoding: 'utf-8',
    
    // 图片支持
    includeImages: true,
    imageFormat: 'base64',
    
    // 自动保存
    autoSave: true,
    saveInterval: 30000,
    
    // 回调函数
    onSave: (result) => console.log('保存成功', result),
    onError: (error) => console.error('保存失败', error)
});
```

## 📋 API文档

### LocalNoteSaver类

#### 构造函数
```javascript
new LocalNoteSaver(options)
```

#### 主要方法

##### saveNote(noteData)
保存笔记到本地文件
```javascript
await saver.saveNote({
    title: '笔记标题',
    content: '笔记内容',
    tags: ['标签1', '标签2'],
    timestamp: new Date().toISOString()
});
```

##### saveToFile(content, fileName)
直接保存内容到指定文件
```javascript
await saver.saveToFile('文件内容', 'my-file.txt');
```

##### appendToFile(content, fileName)
追加内容到现有文件
```javascript
await saver.appendToFile('追加的内容', 'existing-file.txt');
```

##### saveImage(imageData, fileName)
保存图片数据
```javascript
await saver.saveImage(base64ImageData, 'image.png');
```

## 🎨 演示示例

### 完整功能演示
打开 `examples/web-demo.html` 查看三个版本的并排对比演示。

### 功能特色
- ✅ 实时保存预览
- ✅ 图片粘贴测试
- ✅ 多格式导出
- ✅ 批量操作演示

## 📊 兼容性说明

| 功能 | Chrome | Firefox | Safari | Edge | IE |
|------|--------|---------|--------|------|-----|
| 基础保存 | ✅ | ✅ | ✅ | ✅ | ❌ |
| File System API | ✅ | ❌ | ❌ | ✅ | ❌ |
| 图片支持 | ✅ | ✅ | ✅ | ✅ | ❌ |
| 自动下载 | ✅ | ✅ | ✅ | ✅ | ❌ |

## 🔧 故障排除

### 常见问题

#### 1. File System API不支持
**解决方案**: 工具包会自动降级到下载模式
```javascript
// 检测支持情况
if ('showSaveFilePicker' in window) {
    console.log('支持File System API');
} else {
    console.log('使用下载模式');
}
```

#### 2. 文件保存失败
**排查步骤**:
1. 检查浏览器控制台错误
2. 确认文件名不包含特殊字符
3. 检查浏览器安全设置
4. 尝试使用不同的保存模式

#### 3. 图片无法保存
**解决方案**:
1. 确认图片格式支持 (PNG, JPG, GIF)
2. 检查图片大小限制
3. 验证base64编码格式

## 📦 部署指南

### 最小部署
只需要一个核心文件:
```bash
# 选择适合的版本
cp local-note-saver.js your-project/
# 或
cp notebook-manager.js your-project/
```

### 完整部署
```bash
# 复制整个工具包
cp -r local-note-saver-toolkit/ your-project/libs/
```

## 🤝 集成示例

### React集成
```jsx
import LocalNoteSaver from './local-note-saver.js';

function NoteApp() {
    const [saver] = useState(new LocalNoteSaver());
    
    const handleSave = async (noteData) => {
        await saver.saveNote(noteData);
    };
    
    return <NoteEditor onSave={handleSave} />;
}
```

### Vue集成
```vue
<template>
    <div>
        <note-editor @save="handleSave" />
    </div>
</template>

<script>
import LocalNoteSaver from './local-note-saver.js';

export default {
    data() {
        return {
            saver: new LocalNoteSaver()
        };
    },
    methods: {
        async handleSave(noteData) {
            await this.saver.saveNote(noteData);
        }
    }
};
</script>
```

## 📄 许可证

MIT License - 可自由用于商业和非商业项目

## 🆘 技术支持

- 📋 查看 `工具包清单.md` 了解完整功能列表
- 🌐 运行 `examples/web-demo.html` 进行功能测试
- 💡 查看源码注释获取详细实现说明

---

**🎯 核心优势**: 零依赖、零配置、即插即用的本地文件保存解决方案！ 