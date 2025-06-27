# MD格式着色功能使用说明

## 🎨 功能概述

MD格式着色功能是基于节点的MD内容自动为脑图节点应用颜色的智能系统。该功能通过解析节点的MD格式内容，识别其中的状态、优先级、标签等信息，自动为节点应用相应的颜色，提供直观的视觉反馈。

## 🎯 核心特性

### 1. 智能状态识别
- **已完成状态** `✅` - 自动识别包含完成标记的节点
- **进行中状态** `🔄` - 识别正在进行的任务节点
- **待处理状态** `📋` - 识别等待开始的任务节点

### 2. 优先级着色
- **高优先级** `🔴` - 紧急重要任务的红色标识
- **中优先级** `🟡` - 普通任务的黄色标识  
- **低优先级** `🟢` - 可延后任务的绿色标识

### 3. 特殊标签识别
- **完成标签** `#完成` - 包含完成标签的节点自动变灰
- **注入标记** `[已注入]` - 已注入内容的节点标识
- **标签节点** - 特殊标签节点的独特颜色

### 4. 实时更新
- 内容变更时自动重新着色
- 状态切换时立即更新颜色
- 与MD适配器实时同步

## 🎨 颜色方案

| 状态/类型 | 背景色 | 文字色 | 适用条件 |
|-----------|--------|--------|----------|
| **已完成** | `#f5f5f5` (浅灰) | `#6c757d` (深灰) | 包含 `✅`、`#完成`、`[已注入]` |
| **进行中** | `#fff3cd` (浅黄) | `#856404` (深黄) | 包含 `🔄` 状态 |
| **待处理** | `#d1ecf1` (浅蓝) | `#0c5460` (深蓝) | 包含 `📋` 状态 |
| **高优先级** | `#f8d7da` (浅红) | `#721c24` (深红) | 包含 `🔴` 优先级 |
| **中优先级** | `#fff3cd` (浅黄) | `#856404` (深黄) | 包含 `🟡` 优先级 |
| **低优先级** | `#d4edda` (浅绿) | `#155724` (深绿) | 包含 `🟢` 优先级 |
| **标签节点** | `#e2e3e5` (灰色) | `#383d41` (深灰) | 特殊标签节点 |
| **普通节点** | `#ffffff` (白色) | `#333333` (深色) | 无特殊标记 |

## 🔧 使用方法

### 1. 自动着色 
```javascript
// 为所有节点应用基于MD内容的颜色
MDNodeColoringService.colorAllNodesByMDContent();
```

### 2. 单个节点着色
```javascript
// 为特定节点应用颜色
MDNodeColoringService.colorNodeByMDContent('nodeId');
```

### 3. 内容变更监听
```javascript
// 内容变更时自动重新着色
MDNodeColoringService.onNodeContentChanged('nodeId', newContent);
```

### 4. 状态切换
```javascript
// 切换节点完成状态
MDNodeColoringService.toggleNodeCompletion('nodeId');
```

### 5. 获取状态节点
```javascript
// 获取所有已完成的节点
const completedNodes = MDNodeColoringService.getNodesByStatus('completed');

// 获取所有进行中的节点
const inProgressNodes = MDNodeColoringService.getNodesByStatus('inProgress');

// 获取所有待处理的节点
const pendingNodes = MDNodeColoringService.getNodesByStatus('pending');
```

## 📝 MD内容格式示例

### 已完成任务
```markdown
# 完成的任务

**状态:** 已完成 ✅
**完成时间:** 2024-12-17 10:30:00 🏁
**项目标签:** #完成 #重要

任务已成功完成，所有验收标准都已满足。
```

### 进行中任务
```markdown
# 正在进行的任务

**状态:** 进行中 🔄
**优先级:** 中等 🟡
**预计完成:** 本周五

当前正在开发中，进度良好。

**当前步骤:**
- [x] 需求分析
- [x] 设计方案
- [ ] 编码实现
```

### 高优先级任务
```markdown
# 紧急任务

**优先级:** 高 🔴
**紧急程度:** 立即处理
**负责人:** 开发团队

这是一个高优先级任务，需要立即处理。

**关键要求:**
- 必须在24小时内完成
- 涉及系统安全问题
- 需要多部门协作
```

## 🎯 集成方式

### 1. 在脑图初始化时集成
```javascript
// 在 mindmap_service.js 中
import MDNodeColoringService from './md_node_coloring_service.js';

function initMindmaps() {
    // ... 初始化脑图代码 ...
    
    // 延迟应用着色，确保数据已加载
    setTimeout(() => {
        MDNodeColoringService.colorAllNodesByMDContent();
    }, 1000);
}
```

### 2. 在内容更新时集成
```javascript
// 在 node_service.js 中
export function handleNodeContentChange(nodeId, newContent) {
    // ... 内容更新逻辑 ...
    
    // 内容变更后重新着色
    setTimeout(() => {
        MDNodeColoringService.onNodeContentChanged(nodeId, newContent);
    }, 200);
}
```

## 🎨 颜色识别逻辑

### 优先级顺序
1. **完成状态** - 最高优先级，包含任何完成标记的节点都显示为灰色
2. **状态标记** - 其次识别 `🔄`、`📋` 等状态符号
3. **优先级标记** - 最后识别 `🔴`、`🟡`、`🟢` 等优先级符号
4. **默认颜色** - 无任何标记时使用默认白色

### 识别条件
```javascript
// 完成状态识别
function isCompletedNode(parsedData) {
    // 状态符号检查
    if (parsedData.relationships.status?.status?.[0]?.symbol === '✅') {
        return true;
    }
    
    // 标签检查
    if (parsedData.relationships.tags?.some(tag => 
        tag.includes('完成') || tag.includes('已完成'))) {
        return true;
    }
    
    // 内容检查
    if (parsedData.content.includes('**完成时间:**') || 
        parsedData.content.includes('[已注入]')) {
        return true;
    }
    
    return false;
}
```

## 🔧 测试和调试

### 1. 使用测试页面
- 打开 `test-md-coloring-simple.html`
- 点击"🚀 开始演示"初始化测试环境
- 点击"🎨 应用着色"查看着色效果
- 点击"📊 显示统计"查看着色统计

### 2. 控制台调试
```javascript
// 查看颜色配置
console.log(MDNodeColoringService.NodeColors);

// 测试单个节点的颜色判断
const color = MDNodeColoringService.determineNodeColor(mdContent, nodeData);

// 获取特定状态的节点
const completedNodes = MDNodeColoringService.getNodesByStatus('completed');
```

### 3. 实时监控
```javascript
// 监听着色过程
window.addEventListener('console', function(event) {
    if (event.detail.includes('🎨 [着色服务]')) {
        console.log('着色事件:', event.detail);
    }
});
```

## 📋 最佳实践

### 1. MD内容规范
- 使用标准的状态符号：`✅` `🔄` `📋`
- 使用标准的优先级符号：`🔴` `🟡` `🟢`
- 保持MD格式的一致性
- 使用语义化的标签名称

### 2. 性能优化
- 避免频繁的全量着色操作
- 使用节点内容变更监听进行增量更新
- 合理设置着色延迟时间
- 批量处理多个节点的着色

### 3. 用户体验
- 提供清晰的颜色图例说明
- 确保颜色对比度足够
- 支持颜色盲友好的设计
- 提供着色开关选项

## 🚀 扩展功能

### 1. 自定义颜色方案
```javascript
// 扩展颜色配置
const customColors = {
    urgent: {
        background: '#dc3545',
        foreground: '#ffffff',
        border: '#c82333'
    }
};

// 合并到现有配置
Object.assign(MDNodeColoringService.NodeColors, customColors);
```

### 2. 新增识别规则
```javascript
// 在 determineNodeColor 函数中添加新的识别逻辑
if (parsedData.content.includes('**紧急:**')) {
    return NodeColors.urgent;
}
```

### 3. 着色事件监听
```javascript
// 添加着色完成事件
function onColoringComplete(nodeId, colorConfig) {
    console.log(`节点 ${nodeId} 着色完成:`, colorConfig);
    // 触发自定义事件
    window.dispatchEvent(new CustomEvent('nodeColored', {
        detail: { nodeId, colorConfig }
    }));
}
```

## 🔍 故障排除

### 常见问题

1. **着色不生效**
   - 检查 `window.nodeDatabase` 是否存在
   - 确认节点MD内容格式正确
   - 验证 `window.mindmaps` 实例可用

2. **颜色显示错误**
   - 检查MD内容中的状态符号
   - 确认颜色优先级逻辑
   - 验证jsMind的颜色设置API

3. **性能问题**
   - 减少全量着色频率
   - 使用增量更新方式
   - 优化MD内容解析逻辑

### 调试方法
```javascript
// 启用详细日志
localStorage.setItem('mdColoringDebug', 'true');

// 查看节点颜色判断过程
MDNodeColoringService.determineNodeColor(content, nodeData);

// 检查着色统计
const result = MDNodeColoringService.colorAllNodesByMDContent();
console.log('着色结果:', result);
```

## 📚 相关文档

- [MD格式适配器使用说明](./MD适配器使用说明.md)
- [NodeMind开发指南](./NodeMind使用指南.md)
- [数据结构统一方案](./数据结构统一方案使用说明.md)
- [关系符号系统](./nodemind-relationship-symbols.md)

---

**注意:** 该功能需要配合MD适配器服务使用，确保已正确集成 `md_adapter_service.js` 和相关依赖。 