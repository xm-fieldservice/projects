# 笔记保存工具包 (Note Saver Toolkit)

一个通用的笔记保存解决方案，可以轻松集成到任何项目中。支持文本和图片的本地保存，采用Markdown格式，具有完善的配置管理功能。

## 🌟 特性

- **🔧 模块化设计**: 核心引擎与UI分离，易于集成
- **📝 多格式支持**: 文本、图片、Markdown格式
- **⚙️ 配置管理**: 完善的配置系统，支持持久化
- **🖼️ 图片处理**: 自动压缩、格式转换、缩略图生成
- **🌐 多平台适配**: 支持Web、桌面应用、命令行等
- **🔐 安全可靠**: 路径安全检查，防止路径穿越攻击
- **📱 响应式设计**: 适配各种屏幕尺寸

## 📦 项目结构

```
note_saver_toolkit/
├── core/                    # 核心引擎
│   ├── __init__.py         # 模块导入
│   ├── note_engine.py      # 核心笔记保存引擎
│   ├── config_manager.py   # 配置管理器
│   ├── image_handler.py    # 图片处理器
│   └── file_manager.py     # 文件管理器
├── backend/                # 后端API服务
│   └── app.py             # Flask API服务
├── frontend/              # 前端测试页面
│   └── index.html         # Web测试界面
├── requirements.txt       # 依赖文件
└── README.md             # 项目说明
```

## 🚀 快速开始

### 1. 安装依赖

```bash
pip install -r requirements.txt
```

### 2. 启动后端服务

```bash
cd backend
python app.py
```

服务将在 `http://localhost:5000` 启动

### 3. 打开前端页面

在浏览器中打开 `frontend/index.html` 或访问在线服务地址。

### 4. 开始使用

- 输入笔记内容
- 可选择添加图片
- 点击保存按钮或使用快捷键 `Ctrl+Enter`
- 笔记将保存为Markdown格式到指定文件

## 💻 API 文档

### 保存笔记

```http
POST /api/save_note
Content-Type: application/json

{
    "content": "笔记内容",
    "app_name": "应用名称",
    "images": ["data:image/png;base64,iVBOR..."]
}
```

### 获取最近笔记

```http
GET /api/get_recent_notes?count=10
```

### 设置日志文件

```http
POST /api/set_log_file
Content-Type: application/json

{
    "log_file_path": "notes/my_notes.md"
}
```

### 获取配置

```http
GET /api/get_config
```

## 🔧 集成指南

### 在Python项目中使用

```python
from note_saver_toolkit.core import NoteSaveEngine

# 初始化引擎
engine = NoteSaveEngine()

# 保存笔记
result = engine.save_note(
    content="这是一条测试笔记",
    app_name="我的应用",
    images=["data:image/png;base64,iVBOR..."]
)

print(result)
```

### 在Web项目中使用

```javascript
// 保存笔记
async function saveNote(content, appName, images = []) {
    const response = await fetch('/api/save_note', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            content: content,
            app_name: appName,
            images: images
        })
    });
    
    const result = await response.json();
    return result;
}
```

## ⌨️ 快捷键

- `Ctrl+Enter`: 保存笔记
- `Ctrl+L`: 清空内容
- `Ctrl+V`: 粘贴图片（从剪贴板）

## 📁 文件格式

笔记保存为Markdown格式，结构如下：

```markdown
# 2025-01-31 15:30:45 (应用名称)

这是笔记内容

![图片1](images/20250131153045_0.png)

---

# 2025-01-31 15:35:20 (应用名称)

另一条笔记...
```

## ⚙️ 配置选项

```json
{
    "log_file": "logs/notes.md",
    "image_dir": "logs/images",
    "auto_timestamp": true,
    "date_format": "%Y-%m-%d %H:%M:%S",
    "markdown_format": true,
    "auto_backup": false,
    "max_image_size": 1024,
    "compress_images": true,
    "language": "zh-CN"
}
```

## 🔐 安全特性

- 路径安全检查，防止路径穿越攻击
- 文件大小限制，防止资源耗尽
- 输入验证和错误处理
- 自动备份功能

## 🤝 扩展开发

### 创建自定义适配器

```python
from note_saver_toolkit.core import NoteSaveEngine

class CustomAdapter:
    def __init__(self):
        self.engine = NoteSaveEngine()
    
    def save_note(self, content, **kwargs):
        # 自定义保存逻辑
        return self.engine.save_note(content, **kwargs)
```

## 📄 许可证

MIT License - 可自由使用和修改

## 💡 贡献

欢迎提交Issue和Pull Request！

---

**开发者**: AI Generated  
**版本**: 1.0.0  
**更新日期**: 2025-01-31 