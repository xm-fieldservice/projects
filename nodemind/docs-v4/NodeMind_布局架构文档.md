# NodeMind 布局架构文档

## 📋 文档概述

本文档详细描述NodeMind思维导图应用的完整布局架构，包括HTML结构、CSS样式系统、组件层级关系和响应式设计规范。

**文档版本**: v1.0  
**创建时间**: 2025-01-27  
**适用版本**: NodeMind 当前版本（单文件架构）

---

## 🏗️ 整体布局架构

### 主容器结构
```
.container (主容器)
├── .header (页面头部) 
├── .toolbar (工具栏)
├── .main-layout (主布局区域)
│   ├── .mindmap-container (脑图容器)
│   └── .details-panel (详情面板)
└── .status (状态栏)
```

### 布局特点
- **单页面应用架构**: 所有功能集成在一个HTML页面中
- **弹性布局设计**: 使用Flexbox实现响应式布局
- **双面板结构**: 左侧脑图展示区 + 右侧详情面板
- **多标签页管理**: 支持多个脑图工作区切换
- **四组件集成**: 节点详情面板采用四组件布局设计

---

## 📐 详细布局结构

### 1. 页面容器层 (.container)
```css
.container {
    max-width: 95vw;
    margin: 0 auto;
    background: white;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.15);
    overflow: hidden;
    height: calc(100vh - 40px);
    display: flex;
    flex-direction: column;
}
```

**功能**: 
- 页面主容器，定义整体尺寸和样式
- 使用视口高度减去边距计算容器高度
- 圆角设计和阴影效果提升视觉体验

### 2. 头部区域 (.header)
```css
.header {
    background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
    color: white;
    padding: 5px;
    text-align: center;
    min-height: 20px;
}
```

**布局元素**:
- 项目标题 (h1)
- 副标题 (.subtitle)
- 功能亮点 (.feature-highlight)

**设计特点**:
- 渐变背景色
- 白色文字
- 居中对齐
- 最小高度保证

### 3. 工具栏区域 (.toolbar)
```css
.toolbar {
    background: #f8f9fa;
    padding: 20px;
    border-bottom: 2px solid #dee2e6;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
}
```

**子组件**:
- **左侧按钮组** (.toolbar-left): 主要功能按钮
- **右侧控制组** (.toolbar-right): 面板控制按钮

**按钮样式**:
```css
.btn {
    background: #007bff;
    color: white;
    border: none;
    padding: 6px 12px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    font-weight: 500;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 4px;
}
```

### 4. 主布局区域 (.main-layout)
```css
.main-layout {
    display: flex;
    flex: 1;
    gap: 20px;
    margin: 20px;
    transition: all 0.3s ease;
    min-height: 0;
    overflow: hidden;
}
```

**布局模式**:
- **正常模式**: 脑图容器 + 详情面板并排显示
- **隐藏面板模式**: 仅显示脑图容器，详情面板隐藏

#### 4.1 脑图容器 (.mindmap-container)
```css
.mindmap-container {
    flex: 1;
    background: #f8f9fa;
    border-radius: 8px;
    border: 1px solid #dee2e6;
    box-shadow: 0 2px 12px rgba(0,0,0,0.1);
    overflow: hidden;
    display: flex;
    flex-direction: column;
}
```

**子结构**:
```
.mindmap-container
└── .mindmap-tab-container
    ├── .mindmap-tab-header (标签页头部)
    │   ├── .mindmap-tab-button[data-tab="workspace"] (标签管理)
    │   ├── .mindmap-tab-button[data-tab="knowledge"] (临时工作区B)
    │   └── .mindmap-tab-button[data-tab="project"] (项目管理)
    └── .mindmap-tab-content (标签页内容)
        ├── #mindmap-tab-workspace
        ├── #mindmap-tab-knowledge
        └── #mindmap-tab-project
            └── .jsmind-tab-canvas
```

**标签页按钮样式**:
```css
.mindmap-tab-button {
    flex: 1;
    padding: 12px 15px;
    background: none;
    border: none;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    color: #6c757d;
    transition: all 0.3s ease;
    position: relative;
    border-right: 1px solid #dee2e6;
}

.mindmap-tab-button.active {
    background: white;
    color: #007bff;
    font-weight: 600;
}

.mindmap-tab-button.active::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: #007bff;
}
```

#### 4.2 详情面板 (.details-panel)
```css
.details-panel {
    width: clamp(var(--min-panel-width), var(--panel-width), var(--max-panel-width));
    background: rgba(255,255,255,0.95);
    border-radius: 8px;
    border: 1px solid #e3f2fd;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    overflow: hidden;
    flex-shrink: 0;
    height: 100%;
    display: flex;
    flex-direction: row;
    gap: 0;
}
```

**CSS变量定义**:
```css
:root {
    --header-footer-height: 160px;
    --panel-width: 50vw;
    --min-panel-width: 600px;
    --max-panel-width: 800px;
    --tab-component-width: 25vw;
    --tab-min-width: 280px;
    --tab-max-width: 380px;
}
```

**子结构**:
```
.details-panel
└── .tab-container
    ├── .tab-header (主标签页头部)
    │   ├── .tab-button[data-tab="injection"] (节点信息)
    │   └── .tab-button[data-tab="project"] (项目信息)
    └── .tab-content (主标签页内容)
        ├── #tab-injection (节点信息页面)
        └── #tab-project (项目信息页面)
```

### 5. 四组件布局系统 (节点信息页面)

#### 5.1 整体结构
```
#tab-injection
└── #injection-info-content
    └── .detail-workspace
        ├── .title-area (标题区域)
        └── .main-content-area (主内容区域)
            └── .left-panel (左侧面板)
                ├── .content-section (组件A: 内容编辑器)
                └── .tags-section (组件B: 三标签页组件)
```

#### 5.2 标题区域 (.title-area)
```css
.title-area {
    /* 动态调整的标题区域 */
}

.title-content {
    /* 标题内容容器 */
}

.node-title {
    /* 节点标题样式 */
}
```

#### 5.3 内容编辑器组件 (.content-section)
```css
.content-section {
    /* 节点内容编辑器主容器 */
}

.content-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    padding: 8px 0;
}

.controls-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    padding: 8px 0;
    border-bottom: 1px solid #e9ecef;
    margin-bottom: 12px;
}
```

**子组件**:
- **控制栏** (.controls-row)
  - 切换组 (.toggle-group): 问答模式、调试模式
  - 按钮组 (.button-group): 测试、全屏、提交按钮
- **内容编辑器** (.content-editor): 文本编辑区域
- **元信息** (.meta-info): 创建/修改时间显示

#### 5.4 三标签页组件 (.tags-section)
```css
.tags-section {
    background: #ffffff;
    border: 1px solid #dee2e6;
    border-radius: 8px;
    padding: 16px;
}
```

**子结构**:
```
.tags-section
├── .inner-tab-header (内部标签页头部)
│   ├── .inner-tab-button[data-tab="tags"] (标签组件)
│   ├── .inner-tab-button[data-tab="sessions"] (会话列表)
│   └── .inner-tab-button[data-tab="templates"] (模板列表)
└── .inner-tab-content-container (内容容器)
    ├── #inner-tab-tags (标签组件页面)
    ├── #inner-tab-sessions (会话列表页面)
    └── #inner-tab-templates (模板列表页面)
```

**内部标签页按钮样式**:
```css
.inner-tab-button {
    padding: 8px 16px;
    background: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 4px 4px 0 0;
    cursor: pointer;
    font-size: 14px;
    color: #6c757d;
    transition: all 0.2s ease;
    position: relative;
}

.inner-tab-button:hover {
    background: #f8f9fa;
    color: #495057;
}

.inner-tab-button.active {
    background: #fff;
    color: #007bff;
    font-weight: 600;
}

.inner-tab-button.active::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: #007bff;
}
```

### 6. 项目信息页面 (#tab-project)

**主要组件**:
- **基本信息面板** (.basic-info-panel): 项目基础信息显示
- **校准功能区**: 应用校准和状态显示
- **命令注入测试框**: 模板选择和命令注入功能

```css
.basic-info-panel {
    padding: 20px;
}

.command-injection-section {
    margin-top: 20px;
    padding: 15px;
    background: #f8f9fa;
    border-radius: 8px;
    border: 1px solid #e9ecef;
}
```

### 7. 状态栏 (.status)
```css
.status {
    background: linear-gradient(135deg, #343a40 0%, #495057 100%);
    color: white;
    padding: 12px 20px;
    font-size: 13px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
}
```

---

## 🎨 CSS架构体系

### 1. 颜色系统
```css
/* 主色调 */
--primary-color: #007bff;
--primary-hover: #0056b3;

/* 背景色 */
--bg-primary: #f8f9fa;
--bg-secondary: #ffffff;
--bg-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

/* 边框色 */
--border-light: #dee2e6;
--border-medium: #ced4da;

/* 文字色 */
--text-primary: #495057;
--text-secondary: #6c757d;
--text-muted: #adb5bd;
```

### 2. 间距系统
```css
/* 内边距 */
padding: 4px, 6px, 8px, 10px, 12px, 15px, 16px, 20px, 25px;

/* 外边距 */
margin: 0, 4px, 6px, 8px, 10px, 12px, 15px, 16px, 20px;

/* 间隙 */
gap: 4px, 5px, 6px, 8px, 10px, 12px, 15px, 16px, 20px;
```

### 3. 字体系统
```css
/* 字体族 */
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;

/* 字体大小 */
font-size: 11px, 12px, 13px, 14px, 15px, 16px, 18px, 20px, 24px, 28px;

/* 字体重量 */
font-weight: 400 (normal), 500 (medium), 600 (semi-bold), bold;
```

### 4. 圆角系统
```css
border-radius: 3px, 4px, 6px, 8px, 12px, 16px, 20px, 50% (圆形);
```

### 5. 阴影系统
```css
/* 轻微阴影 */
box-shadow: 0 1px 3px rgba(0,0,0,0.05);

/* 标准阴影 */
box-shadow: 0 2px 8px rgba(0,0,0,0.1);
box-shadow: 0 2px 10px rgba(0,0,0,0.1);
box-shadow: 0 2px 12px rgba(0,0,0,0.1);

/* 强阴影 */
box-shadow: 0 8px 32px rgba(0,0,0,0.15);
box-shadow: 0 10px 40px rgba(0,0,0,0.3);

/* 彩色阴影 */
box-shadow: 0 4px 12px rgba(0,123,255,0.3);
```

---

## 📱 响应式设计

### 断点系统
```css
/* 移动端适配 */
@media (max-width: 768px) {
    .toolbar {
        padding: 15px;
        gap: 8px;
    }
    
    .main-layout {
        flex-direction: column;
        height: auto;
        gap: 15px;
        margin: 15px;
    }
    
    .details-panel {
        width: 100%;
        order: 2;
        height: auto;
        max-height: 50vh;
        flex-direction: column;
    }
    
    .mindmap-container {
        order: 1;
        height: calc(50vh - 60px);
        min-height: 300px;
    }
}
```

### 移动端适配特点
1. **布局方向改变**: 水平布局变为垂直布局
2. **面板顺序调整**: 详情面板移至脑图下方
3. **高度限制**: 设置最大高度和最小高度
4. **按钮尺寸调整**: 增大按钮尺寸便于触摸操作

---

## 🔧 交互状态设计

### 1. 悬停效果
```css
/* 按钮悬停 */
.btn:hover {
    background: #0056b3;
    transform: translateY(-1px);
}

/* 标签页悬停 */
.tab-button:hover {
    background: #e9ecef;
    color: #495057;
}

/* 节点项悬停 */
.session-item:hover {
    border-color: #007bff;
    box-shadow: 0 2px 8px rgba(0,123,255,0.1);
    transform: translateY(-1px);
}
```

### 2. 激活状态
```css
/* 激活的标签页 */
.tab-button.active {
    background: white;
    color: #007bff;
    font-weight: 600;
}

.tab-button.active::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: #007bff;
}
```

### 3. 焦点状态
```css
/* 输入框焦点 */
.form-input:focus,
.form-textarea:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 2px rgba(0,123,255,0.25);
}
```

### 4. 禁用状态
```css
/* 禁用按钮 */
.btn:disabled {
    background: #6c757d;
    cursor: not-allowed;
}

/* 禁用输入框 */
.form-input:disabled {
    background: #e9ecef;
    color: #6c757d;
}
```

---

## 🎯 特殊组件样式

### 1. 标签系统
```css
/* 标签基础样式 */
.tag {
    padding: 4px 8px;
    background: #e9ecef;
    border: 1px solid #ddd;
    border-radius: 12px;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s;
    user-select: none;
}

/* 标签颜色变体 */
.tag-yellow {
    background: #fff3dc;
    color: #d48806;
}

.tag-green {
    background: #e6f7e6;
    color: #389e0d;
}

.tag-blue {
    background: #e6f4ff;
    color: #1677ff;
}

/* 选中状态 */
.tag-yellow.selected {
    background: #ffa940;
    color: #ffffff;
}
```

### 2. 节点样式重写
```css
/* jsMind节点样式统一 */
jmnode,
jmnodes jmnode,
jmnodes.theme-* jmnode {
    background-color: #f5f5f5 !important;
    color: #333 !important;
}

jmnode:hover,
jmnodes jmnode:hover {
    background-color: #e8e8e8 !important;
    color: #333 !important;
}

jmnode.selected,
jmnodes jmnode.selected {
    background-color: #d0d0d0 !important;
    color: #333 !important;
}
```

### 3. 模态框系统
```css
.template-manager-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 99999;
    display: flex;
    align-items: center;
    justify-content: center;
}

.modal-backdrop {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.5);
    backdrop-filter: blur(2px);
}

.modal-content-wrapper {
    position: relative;
    width: 90%;
    max-width: 1200px;
    height: 80%;
    background: white;
    border-radius: 12px;
    box-shadow: 0 10px 40px rgba(0,0,0,0.3);
    display: flex;
    flex-direction: column;
    overflow: hidden;
}
```

---

## 📊 布局性能优化

### 1. CSS优化策略
- **内联样式**: 减少HTTP请求，提升首屏加载速度
- **CSS压缩**: 移除空格和注释，减小文件大小
- **选择器优化**: 避免深层嵌套，提升渲染性能

### 2. 布局优化
- **Flexbox使用**: 现代布局方案，性能优异
- **硬件加速**: 使用transform触发GPU加速
- **避免重排**: 使用transform代替位置属性变化

### 3. 响应式优化
- **媒体查询**: 针对不同设备优化布局
- **弹性单位**: 使用rem、em、vw、vh等相对单位
- **图片适配**: 根据设备像素密度提供不同分辨率图片

---

## 🔍 布局调试指南

### 1. 开发者工具使用
- **元素检查**: 查看元素的盒模型和计算样式
- **布局调试**: 使用Grid/Flexbox调试工具
- **响应式测试**: 模拟不同设备屏幕尺寸

### 2. 常见布局问题
- **溢出处理**: 设置overflow属性防止内容溢出
- **高度塌陷**: 使用clearfix或flex解决浮动问题
- **z-index层叠**: 合理设置层叠顺序避免遮挡

### 3. 性能监控
- **重绘重排**: 监控Layout和Paint事件
- **FPS监控**: 确保动画流畅度
- **内存使用**: 避免CSS导致的内存泄漏

---

## 📝 维护说明

### 1. 样式更新规范
- **命名规范**: 使用BEM命名法保持一致性
- **注释规范**: 为复杂样式添加说明注释
- **版本控制**: 记录重要样式变更

### 2. 兼容性考虑
- **浏览器前缀**: 为新CSS特性添加厂商前缀
- **降级方案**: 为不支持的特性提供fallback
- **测试覆盖**: 在主流浏览器中测试布局效果

### 3. 扩展指南
- **组件化**: 将可复用样式抽取为组件
- **主题化**: 支持多主题切换
- **国际化**: 考虑不同语言的布局需求

---

## 📚 参考资源

### 技术文档
- [Flexbox布局指南](https://css-tricks.com/snippets/css/a-guide-to-flexbox/)
- [CSS Grid布局指南](https://css-tricks.com/snippets/css/complete-guide-grid/)
- [响应式设计最佳实践](https://web.dev/responsive-web-design-basics/)

### 设计规范
- [Material Design](https://material.io/design)
- [Bootstrap设计系统](https://getbootstrap.com/docs/5.0/getting-started/introduction/)
- [Ant Design](https://ant.design/docs/spec/introduce-cn)

---

**文档结束**

> 本文档详细描述了NodeMind应用的完整布局架构，为开发维护和功能扩展提供参考。如有疑问或需要更新，请联系开发团队。 