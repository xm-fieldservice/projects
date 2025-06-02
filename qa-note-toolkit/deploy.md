# QA Note Toolkit 部署指南

## 🚀 快速部署

### 1. 演示页面已就绪

工具包演示页面已经创建完成！您现在可以通过以下地址访问：

```
http://localhost:8084/qa-note-toolkit/demo/index.html
```

### 2. 演示功能

演示页面包含以下功能：

#### 🎯 左侧配置面板
- **系统状态监控**：实时显示工具包状态
- **智能体配置**：选择和配置不同的智能体
- **界面配置**：主题、响应式设计等UI选项
- **功能配置**：文件上传、图片捕获等功能开关
- **操作按钮**：初始化、测试、切换模式、销毁等
- **事件日志**：实时显示系统事件和操作日志

#### 🎨 右侧主要区域
- **工具包容器**：实际的问答笔记系统界面
- **动态加载**：点击"初始化工具包"后加载完整功能

### 3. 使用步骤

1. **打开演示页面**
   ```
   http://localhost:8084/qa-note-toolkit/demo/index.html
   ```

2. **配置参数**
   - 选择智能体类型（通用助手、RAG知识助手等）
   - 设置API地址（默认: http://localhost:8001）
   - 选择UI主题和功能选项

3. **初始化工具包**
   - 点击"🚀 初始化工具包"按钮
   - 等待加载完成（会显示加载动画）
   - 观察事件日志中的初始化过程

4. **测试功能**
   - 点击"❓ 测试问答"进行问答测试
   - 点击"📝 测试笔记"进行笔记测试
   - 点击"🔄 切换模式"在问答和笔记模式间切换

5. **体验完整功能**
   - 在右侧区域使用完整的问答笔记系统
   - 所有原有功能都可正常使用
   - 左侧面板实时显示状态变化

## 📦 独立部署

### 1. 静态文件部署

```bash
# 复制工具包到Web服务器
cp -r qa-note-toolkit /var/www/html/

# 访问地址
http://your-domain.com/qa-note-toolkit/demo/
```

### 2. CDN部署

```html
<!-- 在您的网页中引入 -->
<link rel="stylesheet" href="path/to/qa-note-toolkit.min.css">
<script src="path/to/qa-note-toolkit.min.js"></script>

<!-- 使用工具包 -->
<div id="my-qa-system"></div>
<script>
const qaNote = new QANoteToolkit({
    container: '#my-qa-system',
    agents: { default: 'general' }
});
qaNote.init();
</script>
```

### 3. NPM包部署

```bash
# 打包工具包
npm run build

# 发布到NPM
npm publish

# 安装使用
npm install qa-note-toolkit
```

## 🔧 自定义配置

### 基础配置
```javascript
const config = {
    container: '#qa-note-container',
    agents: {
        default: 'general',
        apiUrl: 'http://localhost:8001'
    },
    ui: {
        theme: 'modern',
        responsive: true,
        animations: true
    },
    features: {
        fileUpload: true,
        imageCapture: true,
        voiceInput: false
    }
};
```

### 高级配置
```javascript
const advancedConfig = {
    storage: {
        mode: 'hybrid',
        autoSave: true,
        saveInterval: 30000
    },
    ui: {
        showDebugInfo: true,
        language: 'zh-CN'
    }
};
```

## 🎯 集成示例

### React组件
```jsx
import { useEffect, useRef } from 'react';
import QANoteToolkit from 'qa-note-toolkit';

function MyQAComponent() {
    const containerRef = useRef();
    
    useEffect(() => {
        const qaNote = new QANoteToolkit({
            container: containerRef.current
        });
        qaNote.init();
        
        return () => qaNote.destroy();
    }, []);
    
    return <div ref={containerRef} />;
}
```

### Vue组件
```vue
<template>
    <div ref="qaContainer"></div>
</template>

<script>
import QANoteToolkit from 'qa-note-toolkit';

export default {
    mounted() {
        this.qaNote = new QANoteToolkit({
            container: this.$refs.qaContainer
        });
        this.qaNote.init();
    },
    beforeDestroy() {
        if (this.qaNote) {
            this.qaNote.destroy();
        }
    }
};
</script>
```

## 📋 API参考

### 主要方法
- `init()` - 初始化工具包
- `askQuestion(data)` - 发送问题
- `saveNote(data)` - 保存笔记
- `switchAgent(id)` - 切换智能体
- `switchMode(mode)` - 切换模式
- `destroy()` - 销毁工具包

### 事件监听
- `initialized` - 初始化完成
- `questionAnswered` - 问答完成
- `noteSaved` - 笔记保存
- `agentSwitched` - 智能体切换
- `error` - 错误发生

## 🛠️ 故障排除

### 常见问题

1. **初始化失败**
   - 检查容器元素是否存在
   - 确认所有依赖文件已正确加载
   - 查看浏览器控制台错误信息

2. **智能体连接失败**
   - 确认API地址正确
   - 检查网络连接
   - 验证智能体服务是否运行

3. **文件加载错误**
   - 确认文件路径正确
   - 检查CORS设置
   - 验证文件权限

### 调试模式

启用调试模式查看详细信息：
```javascript
const qaNote = new QANoteToolkit({
    ui: { showDebugInfo: true }
});
```

## 📞 技术支持

- 📧 邮箱: support@qa-note-toolkit.com
- 🐛 问题反馈: GitHub Issues
- 📚 文档: [完整文档链接]

---

**恭喜！** 您的智能笔记问答工具包已经成功封装并可以独立部署了！🎉 