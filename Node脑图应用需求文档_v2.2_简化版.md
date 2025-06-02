# Node脑图应用需求文档 v2.2（简化版）

**项目代号：** MindNode Simple  
**文档版本：** 2.2 简化版  
**创建日期：** 2025年01月15日  
**项目定位：** 自用项目管理工具的脑图组件  

---

## 1. 项目定位与范围

### 1.1 明确定位
- **自用工具**：为现有项目管理应用增加脑图功能
- **集成组件**：嵌入到已有Web应用中
- **数据来源**：MD文档格式，简化笔记块结构
- **使用规模**：节点数量≤500，满足个人项目管理需求

### 1.2 设计原则
- **够用就好**：功能简单实用，避免过度设计
- **快速上线**：24小时内可集成使用
- **技术债容忍**：优先可用性，后续按需优化

## 2. 核心功能（5个必需功能）

### 2.1 MD文档解析与渲染
**功能描述：** 解析简化的MD笔记块格式，渲染为脑图

**MD格式规范：**
```markdown
编号：{#TASK-001}
标题：项目根节点
父节点：^TASK-000
状态：@进行中
优先级：@高

节点的详细描述内容...
支持基础Markdown格式
```

**技术实现：**
- 使用marked.js解析MD内容
- 正则表达式提取元数据（编号、标题、父节点、标签）
- D3.js层次布局渲染
- 性能目标：500节点≤3秒加载

### 2.2 节点拖拽与关系调整
**功能描述：** 拖拽节点改变父子关系，自动更新MD文档

**交互设计：**
- 鼠标拖拽节点到目标位置
- 实时预览放置效果（高亮目标区域）
- 简化循环检测：仅防止拖拽到自己的子孙节点
- 操作完成后全量更新MD文档

**核心算法：**
```javascript
// 简化版循环检测（仅检查父子链）
function wouldCreateCycle(dragNodeId, dropTargetId) {
  let parentId = getParentId(dropTargetId);
  while (parentId) {
    if (parentId === dragNodeId) return true;
    parentId = getParentId(parentId);
  }
  return false;
}
```

### 2.3 简化标签系统
**功能描述：** 支持基础标签分类，用于节点状态和优先级管理

**标签类型：**
- **状态标签**：@未开始、@进行中、@已完成、@暂停
- **优先级标签**：@低、@中、@高、@紧急
- **分类标签**：@前端、@后端、@设计、@测试

**视觉效果：**
```css
/* 状态标签样式 */
.tag-未开始 { background: #f0f0f0; color: #666; }
.tag-进行中 { background: #1890ff; color: white; }
.tag-已完成 { background: #52c41a; color: white; }
.tag-暂停 { background: #faad14; color: white; }

/* 优先级标签样式 */
.tag-紧急 { border: 2px solid #ff4d4f; }
.tag-高 { border: 2px solid #fa8c16; }
```

**功能实现：**
- 从MD文档解析标签（@标签名）
- 根据标签自动设置节点样式
- 标签编辑器：简单的下拉选择 + 自定义输入

### 2.4 简化详情编辑器
**功能描述：** 点击节点显示详情面板，支持内容编辑

**UI布局：**
```
┌─────────────────┬─────────────────┐
│                 │   详情编辑器     │
│                 │ ┌─────────────┐ │
│    脑图区域      │ │ 标题编辑框   │ │
│                 │ └─────────────┘ │
│                 │ ┌─────────────┐ │
│                 │ │ 标签选择器   │ │
│                 │ └─────────────┘ │
│                 │ ┌─────────────┐ │
│                 │ │ 内容编辑区   │ │
│                 │ └─────────────┘ │
└─────────────────┴─────────────────┘
```

**功能清单：**
- 节点基础信息显示（编号、标题、父节点）
- 标题实时编辑（自动保存）
- 标签选择器（预设 + 自定义）
- Markdown内容编辑器（基础工具栏）
- 保存/取消按钮

### 2.5 基础交互操作
**功能描述：** 必需的脑图交互功能

**交互列表：**
- 点击选择节点（高亮显示）
- 双击编辑节点标题（内联编辑）
- 鼠标滚轮缩放
- 拖拽画布平移
- 右键菜单：删除节点、添加子节点
- 适应视图（Fit to View）

## 3. 技术实现方案

### 3.1 技术栈（极简选择）
| 技术 | 版本 | 用途 | 理由 |
|------|------|------|------|
| 原生JavaScript | ES6+ | 组件逻辑 | 无框架依赖，集成简单 |
| D3.js | v7.x | 脑图渲染 | 成熟的可视化库 |
| marked.js | v4.x | MD解析 | 轻量级MD解析器 |
| 原生CSS | CSS3 | 样式系统 | 无依赖，性能好 |

### 3.2 组件架构（单文件设计）
```javascript
class SimpleMindMap {
  constructor(container, options = {}) {
    this.container = container;
    this.maxNodes = 500;
    this.data = null;
    this.selectedNode = null;
    
    // 核心模块
    this.parser = new SimpleParser();
    this.renderer = new SimpleRenderer(container);
    this.detailPanel = new SimpleDetailPanel();
    this.tagManager = new SimpleTagManager();
    
    this.init();
  }
  
  // 核心API（仅5个方法）
  loadMarkdown(markdown) { /* 加载MD文档 */ }
  exportMarkdown() { /* 导出MD文档 */ }
  selectNode(nodeId) { /* 选择节点 */ }
  updateNode(nodeId, changes) { /* 更新节点 */ }
  destroy() { /* 销毁组件 */ }
}
```

### 3.3 数据模型（简化版）
```javascript
// 节点数据结构
interface SimpleNode {
  id: string;           // 编号：{#TASK-001}
  title: string;        // 标题
  parent?: string;      // 父节点：^PARENT-ID
  content?: string;     // Markdown内容
  tags: {
    status?: string;    // 状态标签
    priority?: string;  // 优先级标签
    category?: string;  // 分类标签
  };
  position: { x: number; y: number }; // 渲染位置
}

// 脑图树结构
interface SimpleTree {
  nodes: Map<string, SimpleNode>;
  rootId: string;
  hierarchy: Map<string, string[]>; // 父->子映射
}
```

### 3.4 MD文档格式解析
```javascript
class SimpleParser {
  parseMarkdown(markdown) {
    // 1. 按编号分割笔记块
    const blocks = markdown.split(/(?=^编号：\{#)/gm);
    
    // 2. 解析每个块
    const nodes = blocks.map(block => {
      const id = this.extractId(block);
      const title = this.extractTitle(block);
      const parent = this.extractParent(block);
      const tags = this.extractTags(block);
      const content = this.extractContent(block);
      
      return { id, title, parent, tags, content };
    }).filter(node => node.id);
    
    // 3. 构建树结构
    return this.buildTree(nodes);
  }
  
  extractTags(block) {
    const status = block.match(/状态：@(.+)/)?.[1];
    const priority = block.match(/优先级：@(.+)/)?.[1];
    const category = block.match(/分类：@(.+)/)?.[1];
    
    return { status, priority, category };
  }
}
```

## 4. 不做的功能（明确边界）

### 4.1 性能优化功能
- ❌ 虚拟化渲染（500节点以内直接渲染）
- ❌ 增量数据同步（全量更新MD文档）
- ❌ Canvas/WebGL渲染（D3 SVG足够）
- ❌ 懒加载机制（一次性加载所有节点）

### 4.2 复杂功能特性
- ❌ 多种关系类型（仅支持父子关系）
- ❌ 复杂标签系统（仅3类基础标签）
- ❌ 高级布局算法（仅层次布局）
- ❌ 协作功能（单用户使用）
- ❌ 版本历史（宿主应用负责）

### 4.3 集成复杂度
- ❌ 多框架适配器（仅提供原生JS）
- ❌ 主题系统（固定亮色主题）
- ❌ 插件机制（功能内置）
- ❌ 国际化支持（仅中文）

## 5. 实现计划（24小时上线）

### 5.1 开发优先级
**Phase 1（8小时）- 核心功能**
- [x] MD解析器实现
- [x] D3.js基础渲染
- [x] 节点选择交互
- [x] 拖拽移动功能

**Phase 2（8小时）- 标签和编辑**
- [x] 简化标签系统
- [x] 详情编辑器UI
- [x] 内容编辑功能
- [x] 数据保存逻辑

**Phase 3（8小时）- 集成测试**
- [x] 组件打包
- [x] 宿主应用集成
- [x] 功能测试
- [x] 性能验证

### 5.2 文件结构
```
mindmap-simple/
├── src/
│   ├── SimpleMindMap.js       # 主组件（<300行）
│   ├── SimpleParser.js        # MD解析器（<100行）
│   ├── SimpleRenderer.js      # D3渲染器（<200行）
│   ├── SimpleDetailPanel.js   # 详情编辑器（<150行）
│   └── SimpleTagManager.js    # 标签管理（<50行）
├── dist/
│   ├── mindmap-simple.js      # 打包文件
│   └── mindmap-simple.css     # 样式文件
├── examples/
│   ├── basic.html            # 基础示例
│   └── integration.html      # 集成示例
└── README.md                 # 使用说明
```

### 5.3 使用示例
```html
<!DOCTYPE html>
<html>
<head>
    <title>简化版脑图组件</title>
    <script src="https://unpkg.com/d3@7"></script>
    <script src="https://unpkg.com/marked@4"></script>
    <script src="./dist/mindmap-simple.js"></script>
    <link rel="stylesheet" href="./dist/mindmap-simple.css">
</head>
<body>
    <div id="mindmap-container" style="width: 100%; height: 600px;"></div>
    
    <script>
        const mindmap = new SimpleMindMap(
            document.getElementById('mindmap-container'),
            {
                editable: true,
                showDetailPanel: true
            }
        );
        
        const markdown = `
编号：{#TASK-001}
标题：项目开发
状态：@进行中
优先级：@高

项目的总体规划和安排。

编号：{#TASK-002}
标题：前端开发
父节点：^TASK-001
状态：@未开始
分类：@前端

负责前端界面的开发工作。
        `;
        
        mindmap.loadMarkdown(markdown);
    </script>
</body>
</html>
```

## 6. 验收标准

### 6.1 功能验收
- [ ] 500节点MD文档≤3秒加载完成
- [ ] 拖拽操作流畅，无卡顿
- [ ] 标签样式正确显示
- [ ] 详情编辑器正常工作
- [ ] 循环依赖检测有效

### 6.2 集成验收
- [ ] 单文件引入即可使用
- [ ] 不与宿主应用CSS冲突
- [ ] 内存占用≤100MB（500节点）
- [ ] 兼容Chrome/Firefox/Safari

### 6.3 代码质量
- [ ] 总代码量≤1000行
- [ ] 无外部框架依赖（除D3/marked）
- [ ] JSDoc文档完整
- [ ] 错误处理覆盖关键路径

---

**文档状态：** 开发就绪  
**预计完成：** 24小时内  
**责任人：** 开发团队 