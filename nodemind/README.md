# jsMind 思维导图演示

这是一个基于 **jsMind** 开源框架的思维导图演示项目。jsMind 是一个纯 JavaScript 的思维导图库，基于 HTML5 Canvas 和 SVG 技术构建。

## 📋 项目特点

- **纯前端实现**：无需后端支持，完全基于 JavaScript
- **高性能渲染**：基于 HTML5 Canvas 和 SVG 技术
- **丰富交互**：支持拖拽、缩放、编辑等操作
- **多种主题**：内置15种精美主题
- **开源免费**：BSD 协议，可商用
- **易于集成**：可以轻松集成到任何项目中

## 🚀 快速开始

### 方法一：直接运行 HTML 文件

1. 下载项目文件
2. 直接在浏览器中打开 `jsmind-demo.html` 文件

### 方法二：通过 npm 安装并运行

```bash
# 安装依赖
npm install

# 启动本地服务器
npm start
```

### 方法三：CDN 方式引入

```html
<!DOCTYPE html>
<html>
<head>
    <link type="text/css" rel="stylesheet" href="https://cdn.jsdelivr.net/npm/jsmind@0.8.7/style/jsmind.css" />
    <script type="text/javascript" src="https://cdn.jsdelivr.net/npm/jsmind@0.8.7/es6/jsmind.js"></script>
</head>
<body>
    <div id="jsmind_container"></div>
    
    <script>
        var mind = {
            meta: { name: "思维导图", version: "0.2" },
            format: "node_tree",
            data: {
                id: "root",
                topic: "中心主题",
                children: [
                    { id: "sub1", topic: "分支1", direction: "right" },
                    { id: "sub2", topic: "分支2", direction: "left" }
                ]
            }
        };
        
        var options = {
            container: 'jsmind_container',
            theme: 'orange',
            editable: true
        };
        
        var jm = new jsMind(options);
        jm.show(mind);
    </script>
</body>
</html>
```

## 🎮 功能演示

### 基本操作

- **单击节点**：选中节点
- **双击节点**：编辑节点内容
- **拖拽**：移动整个思维导图
- **滚轮**：缩放思维导图

### 按钮功能

- **添加节点**：为选中节点添加子节点
- **编辑节点**：修改选中节点的内容
- **删除节点**：删除选中的节点
- **展开全部**：展开所有折叠的节点
- **收起全部**：收起所有子节点
- **切换主题**：循环切换15种内置主题
- **导出数据**：查看思维导图的JSON数据

### 快捷键

- **Insert**：添加子节点
- **Enter**：添加兄弟节点
- **F2**：编辑节点
- **Delete**：删除节点
- **空格**：展开/收起节点
- **方向键**：选择相邻节点

## 🎨 主题系统

jsMind 内置了15种精美主题：

- `primary` - 蓝色主题（默认）
- `warning` - 橙色主题
- `danger` - 红色主题
- `success` - 绿色主题
- `info` - 青色主题
- `greensea` - 海绿色主题
- `nephritis` - 翡翠绿主题
- `belizehole` - 深蓝色主题
- `wisteria` - 紫色主题
- `asphalt` - 深灰色主题
- `orange` - 橙红色主题
- `pumpkin` - 南瓜色主题
- `pomegranate` - 石榴红主题
- `clouds` - 浅灰色主题
- `asbestos` - 中灰色主题

## 📊 数据格式

jsMind 支持三种数据格式：

### 1. node_tree 格式（推荐）

```javascript
{
    meta: {
        name: "思维导图名称",
        author: "作者",
        version: "版本号"
    },
    format: "node_tree",
    data: {
        id: "root",
        topic: "根节点",
        children: [
            {
                id: "child1",
                topic: "子节点1",
                direction: "right",
                children: [...]
            }
        ]
    }
}
```

### 2. node_array 格式

```javascript
{
    meta: {...},
    format: "node_array",
    data: [
        { id: "root", topic: "根节点", isroot: true },
        { id: "child1", topic: "子节点1", parentid: "root" }
    ]
}
```

### 3. freemind 格式

支持导入 FreeMind 的 XML 格式文件。

## ⚙️ 配置选项

```javascript
var options = {
    container: 'jsmind_container',    // 容器ID
    editable: true,                   // 是否可编辑
    theme: 'orange',                  // 主题名称
    view: {
        engine: 'canvas',             // 渲染引擎：canvas 或 svg
        hmargin: 100,                 // 水平边距
        vmargin: 50,                  // 垂直边距
        line_width: 2,                // 连线宽度
        line_color: '#558'            // 连线颜色
    },
    layout: {
        hspace: 30,                   // 节点水平间距
        vspace: 20,                   // 节点垂直间距
        pspace: 13                    // 节点与连线间距
    },
    shortcut: {
        enable: true,                 // 启用快捷键
        mapping: {...}                // 快捷键映射
    }
};
```

## 🔧 API 方法

### 获取节点

```javascript
jm.get_root()                    // 获取根节点
jm.get_node(nodeid)             // 根据ID获取节点
jm.get_selected_node()          // 获取选中的节点
jm.find_node_before(node)       // 查找前一个节点
jm.find_node_after(node)        // 查找后一个节点
```

### 操作节点

```javascript
jm.select_node(node)            // 选中节点
jm.expand_node(node)            // 展开节点
jm.collapse_node(node)          // 收起节点
jm.expand_all()                 // 展开全部
jm.move_node(node, beforeid)    // 移动节点
```

### 编辑节点

```javascript
jm.add_node(parent, nodeid, topic)       // 添加节点
jm.insert_node_before(node, id, topic)   // 前插节点
jm.insert_node_after(node, id, topic)    // 后插节点
jm.remove_node(node)                     // 删除节点
jm.update_node(nodeid, topic)            // 更新节点
```

### 获取数据

```javascript
jm.get_meta()                   // 获取元数据
jm.get_data(format)             // 获取指定格式数据
```

### 设置样式

```javascript
jm.set_theme(theme)                          // 设置主题
jm.set_node_color(nodeid, bgcolor, fgcolor)  // 设置颜色
jm.set_node_font_style(nodeid, size, weight) // 设置字体
```

## 🌐 浏览器兼容性

- Chrome (推荐)
- Firefox
- Safari
- Edge
- IE9+ (需要使用旧版本)

## 📱 移动端支持

jsMind 支持移动端触摸操作：

- **触摸拖拽**：移动思维导图
- **双指缩放**：缩放思维导图
- **点击选择**：选中节点
- **双击编辑**：编辑节点内容

## 🔗 相关链接

- [jsMind 官方网站](https://hizzgdev.github.io/jsmind/)
- [GitHub 仓库](https://github.com/hizzgdev/jsmind)
- [NPM 包](https://www.npmjs.com/package/jsmind)
- [在线演示](https://jsmind.online)

## 📄 许可证

jsMind 使用 BSD 协议开源，可以免费用于商业项目。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来改进这个项目！

---

**享受使用 jsMind 创建思维导图的乐趣吧！** 🎉 