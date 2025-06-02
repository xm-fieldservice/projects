
# Node脑图应用需求文档 v3.0（React现代化版）

**项目代号：** MindNode Modern  
**文档版本：** 3.0 现代化版  
**创建日期：** 2025年01月15日  
**项目定位：** 自用项目管理工具的现代化脑图组件  
**技术栈：** React + Zustand + Konva + TypeScript

---

## 1. 项目定位与架构升级

### 1.1 技术栈选择理由
- **React 18**：组件化架构，天然适合脑图节点渲染，完善开发者工具
- **Zustand**：轻量级状态管理，避免Redux复杂度，支持时间旅行调试
- **Konva + Canvas**：高性能渲染，相比SVG在500+节点下性能提升2-3倍
- **TypeScript**：类型安全，减少运行时错误，提升开发体验
- **Vite**：闪电般热重载，开发调试体验优秀

### 1.2 架构对比分析
| 维度 | 原方案 (D3+原生JS) | 新方案 (React+Konva) |
|------|-------------------|---------------------|
| 调试体验 | 💔 困难，状态难追踪 | ✅ React DevTools + 时间旅行 |
| 渲染性能 | ⚠️ 500节点卡顿 | ✅ Canvas高性能渲染 |
| 代码维护 | 💔 命令式，难扩展 | ✅ 声明式，组件化 |
| 类型安全 | ❌ 无类型检查 | ✅ TypeScript编译时检查 |
| 热重载 | ❌ 刷新丢失状态 | ✅ 保持状态的热更新 |

## 2. 核心功能（5个必需功能）

### 2.1 MD文档解析与渲染
**功能描述：** 使用现代化解析器处理MD笔记块，Canvas高性能渲染

**技术实现：**
```typescript
// 类型定义
interface MindNode {
  id: string;
  title: string;
  parentId: string | null;
  content: string;
  tags: {
    status?: '未开始' | '进行中' | '已完成' | '暂停';
    priority?: '低' | '中' | '高' | '紧急';
    category?: string;
  };
  position: { x: number; y: number };
  children: string[];
}

// Zustand状态管理
interface MindMapState {
  nodes: Map<string, MindNode>;
  rootId: string | null;
  selectedNodeId: string | null;
  
  // Actions
  loadMarkdown: (markdown: string) => void;
  updateNode: (id: string, changes: Partial<MindNode>) => void;
  moveNode: (draggedId: string, targetParentId: string) => void;
  selectNode: (id: string) => void;
}
```

**性能目标：**
- 500节点≤1秒加载（相比原3秒提升3倍）
- 内存占用≤80MB（相比原100MB降低20%）

### 2.2 节点拖拽与关系调整
**功能描述：** 基于Konva的流畅拖拽交互，实时视觉反馈

**React组件实现：**
```tsx
import { Group, Rect, Text } from 'react-konva';
import { useMindMapStore } from '../store/useMindMapStore';

const MindNode: React.FC<{ nodeId: string }> = ({ nodeId }) => {
  const node = useMindMapStore(state => state.nodes.get(nodeId));
  const moveNode = useMindMapStore(state => state.moveNode);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  
  const handleDragEnd = (e: any) => {
    const pos = e.target.position();
    const targetNode = findDropTarget(pos.x, pos.y);
    
    if (targetNode && !wouldCreateCycle(nodeId, targetNode.id)) {
      moveNode(nodeId, targetNode.id);
    }
  };

  return (
    <Group
      x={node.position.x}
      y={node.position.y}
      draggable
      onDragEnd={handleDragEnd}
      onDragMove={(e) => setDragPosition(e.target.position())}
    >
      <Rect
        width={200}
        height={60}
        fill={getStatusColor(node.tags.status)}
        stroke={getPriorityColor(node.tags.priority)}
        strokeWidth={getPriorityWidth(node.tags.priority)}
        cornerRadius={8}
        shadowEnabled
        shadowColor="black"
        shadowOpacity={0.1}
        shadowOffset={{ x: 2, y: 2 }}
        shadowBlur={4}
      />
      <Text
        text={node.title}
        width={180}
        padding={10}
        align="center"
        verticalAlign="middle"
        fontSize={14}
        fontFamily="'Segoe UI', sans-serif"
        fill="white"
      />
    </Group>
  );
};
```

### 2.3 现代化标签系统
**功能描述：** TypeScript类型安全的标签管理，组件化设计

**标签组件实现：**
```tsx
interface TagBadgeProps {
  tag: {
    type: 'status' | 'priority' | 'category';
    value: string;
  };
  position: { x: number; y: number };
}

const TagBadge: React.FC<TagBadgeProps> = ({ tag, position }) => {
  const config = useMemo(() => getTagConfig(tag.type, tag.value), [tag]);
  
  return (
    <Group x={position.x} y={position.y}>
      <Rect
        width={60}
        height={20}
        fill={config.background}
        cornerRadius={10}
      />
      <Text
        text={tag.value}
        width={60}
        align="center"
        verticalAlign="middle"
        fontSize={10}
        fill={config.color}
      />
    </Group>
  );
};

// 标签配置管理
const getTagConfig = (type: string, value: string) => {
  const configs = {
    status: {
      '未开始': { background: '#f0f0f0', color: '#666' },
      '进行中': { background: '#1890ff', color: 'white' },
      '已完成': { background: '#52c41a', color: 'white' },
      '暂停': { background: '#faad14', color: 'white' }
    },
    priority: {
      '低': { background: '#d9d9d9', color: '#666' },
      '中': { background: '#1890ff', color: 'white' },
      '高': { background: '#fa8c16', color: 'white' },
      '紧急': { background: '#ff4d4f', color: 'white' }
    }
  };
  
  return configs[type]?.[value] || { background: '#f5f5f5', color: '#333' };
};
```

### 2.4 React详情编辑器
**功能描述：** 完全组件化的详情编辑面板，状态管理集成

**编辑器组件：**
```tsx
const DetailPanel: React.FC = () => {
  const selectedNodeId = useMindMapStore(state => state.selectedNodeId);
  const selectedNode = useMindMapStore(state => 
    selectedNodeId ? state.nodes.get(selectedNodeId) : null
  );
  const updateNode = useMindMapStore(state => state.updateNode);
  
  const [localData, setLocalData] = useState<Partial<MindNode>>({});
  
  // 防抖保存
  const debouncedSave = useMemo(
    () => debounce((id: string, changes: Partial<MindNode>) => {
      updateNode(id, changes);
    }, 500),
    [updateNode]
  );
  
  const handleFieldChange = (field: keyof MindNode, value: any) => {
    const changes = { [field]: value };
    setLocalData(prev => ({ ...prev, ...changes }));
    
    if (selectedNodeId) {
      debouncedSave(selectedNodeId, changes);
    }
  };

  if (!selectedNode) return null;

  return (
    <div className="detail-panel">
      <div className="panel-header">
        <h3>节点详情</h3>
        <button onClick={() => useMindMapStore.getState().selectNode(null)}>
          ×
        </button>
      </div>
      
      <div className="panel-content">
        {/* 基础信息 */}
        <div className="info-section">
          <label>编号：</label>
          <input type="text" value={selectedNode.id} disabled />
        </div>
        
        <div className="info-section">
          <label>标题：</label>
          <input
            type="text"
            value={localData.title ?? selectedNode.title}
            onChange={(e) => handleFieldChange('title', e.target.value)}
            placeholder="请输入标题"
          />
        </div>
        
        {/* 标签选择 */}
        <TagSelector
          tags={selectedNode.tags}
          onChange={(tags) => handleFieldChange('tags', tags)}
        />
        
        {/* Markdown编辑器 */}
        <MarkdownEditor
          value={localData.content ?? selectedNode.content}
          onChange={(content) => handleFieldChange('content', content)}
        />
      </div>
    </div>
  );
};
```

### 2.5 增强交互操作
**功能描述：** 基于Konva事件系统的流畅交互

**交互Hook实现：**
```tsx
const useMindMapInteractions = () => {
  const stageRef = useRef<Konva.Stage>(null);
  const { selectNode, addNode, deleteNode } = useMindMapStore();
  
  // 右键菜单
  const handleContextMenu = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    e.evt.preventDefault();
    
    const pos = stageRef.current?.getPointerPosition();
    if (!pos) return;
    
    const menuItems = [
      { label: '添加子节点', action: () => addNode(generateId(), e.target.id()) },
      { label: '删除节点', action: () => deleteNode(e.target.id()) },
      { label: '编辑详情', action: () => selectNode(e.target.id()) }
    ];
    
    showContextMenu(pos, menuItems);
  }, [addNode, deleteNode, selectNode]);
  
  // 缩放和平移
  const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    
    const stage = stageRef.current;
    if (!stage) return;
    
    const scaleBy = 1.1;
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition()!;
    
    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };
    
    const newScale = e.evt.deltaY > 0 ? oldScale * scaleBy : oldScale / scaleBy;
    
    stage.scale({ x: newScale, y: newScale });
    stage.position({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    });
  }, []);
  
  return { stageRef, handleContextMenu, handleWheel };
};
```

## 3. 技术实现方案

### 3.1 现代化技术栈
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "zustand": "^4.4.1",
    "konva": "^9.2.0",
    "react-konva": "^18.2.10",
    "unified": "^10.1.2",
    "remark-parse": "^10.0.2",
    "remark-frontmatter": "^4.0.1",
    "use-debounce": "^9.0.4"
  },
  "devDependencies": {
    "@types/react": "^18.2.15",
    "@types/react-dom": "^18.2.7",
    "typescript": "^5.0.2",
    "vite": "^4.4.5",
    "@vitejs/plugin-react": "^4.0.3",
    "eslint": "^8.45.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "prettier": "^3.0.0"
  }
}
```

### 3.2 Zustand状态管理架构
```typescript
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface MindMapStore {
  // State
  nodes: Map<string, MindNode>;
  rootId: string | null;
  selectedNodeId: string | null;
  viewport: { x: number; y: number; scale: number };
  
  // Actions
  loadMarkdown: (markdown: string) => void;
  updateNode: (id: string, changes: Partial<MindNode>) => void;
  moveNode: (draggedId: string, targetParentId: string) => void;
  selectNode: (id: string | null) => void;
  addNode: (parentId: string, node: Partial<MindNode>) => void;
  deleteNode: (id: string) => void;
  setViewport: (viewport: { x: number; y: number; scale: number }) => void;
  
  // Computed
  getNode: (id: string) => MindNode | undefined;
  getChildren: (parentId: string) => MindNode[];
  getTreeData: () => TreeData;
}

export const useMindMapStore = create<MindMapStore>()(
  devtools(
    immer((set, get) => ({
      // Initial state
      nodes: new Map(),
      rootId: null,
      selectedNodeId: null,
      viewport: { x: 0, y: 0, scale: 1 },
      
      // Actions implementation
      loadMarkdown: (markdown) => {
        set((state) => {
          const parsedData = parseMarkdown(markdown);
          state.nodes = new Map(parsedData.nodes.map(node => [node.id, node]));
          state.rootId = parsedData.rootId;
          state.selectedNodeId = null;
        });
      },
      
      updateNode: (id, changes) => {
        set((state) => {
          const node = state.nodes.get(id);
          if (node) {
            Object.assign(node, changes);
          }
        });
      },
      
      moveNode: (draggedId, targetParentId) => {
        set((state) => {
          const draggedNode = state.nodes.get(draggedId);
          if (draggedNode && !wouldCreateCycle(draggedId, targetParentId, state.nodes)) {
            // 从原父节点移除
            if (draggedNode.parentId) {
              const oldParent = state.nodes.get(draggedNode.parentId);
              if (oldParent) {
                oldParent.children = oldParent.children.filter(id => id !== draggedId);
              }
            }
            
            // 添加到新父节点
            draggedNode.parentId = targetParentId;
            const newParent = state.nodes.get(targetParentId);
            if (newParent) {
              newParent.children.push(draggedId);
            }
          }
        });
      },
      
      selectNode: (id) => {
        set((state) => {
          state.selectedNodeId = id;
        });
      },
      
      // Computed properties
      getNode: (id) => get().nodes.get(id),
      getChildren: (parentId) => {
        const parent = get().nodes.get(parentId);
        return parent ? parent.children.map(id => get().nodes.get(id)!).filter(Boolean) : [];
      },
      getTreeData: () => buildTreeData(get().nodes, get().rootId)
    })),
    { name: 'mindmap-store' }
  )
);
```

### 3.3 Konva渲染组件架构
```tsx
const MindMapCanvas: React.FC = () => {
  const { nodes, rootId, viewport } = useMindMapStore();
  const { stageRef, handleContextMenu, handleWheel } = useMindMapInteractions();
  
  // 自动布局计算
  const layoutData = useMemo(() => {
    if (!rootId) return null;
    return calculateTreeLayout(nodes, rootId);
  }, [nodes, rootId]);
  
  return (
    <Stage
      ref={stageRef}
      width={window.innerWidth}
      height={window.innerHeight}
      scaleX={viewport.scale}
      scaleY={viewport.scale}
      x={viewport.x}
      y={viewport.y}
      onWheel={handleWheel}
      onContextMenu={handleContextMenu}
    >
      <Layer>
        {/* 连接线 */}
        {layoutData?.connections.map(connection => (
          <ConnectionLine
            key={`${connection.from}-${connection.to}`}
            from={connection.from}
            to={connection.to}
          />
        ))}
        
        {/* 节点 */}
        {layoutData?.nodes.map(nodeData => (
          <MindNode
            key={nodeData.id}
            nodeId={nodeData.id}
            position={nodeData.position}
          />
        ))}
      </Layer>
    </Stage>
  );
};
```

### 3.4 自动布局算法
```typescript
interface LayoutNode {
  id: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

interface LayoutConnection {
  from: { x: number; y: number };
  to: { x: number; y: number };
}

const calculateTreeLayout = (
  nodes: Map<string, MindNode>, 
  rootId: string
): { nodes: LayoutNode[]; connections: LayoutConnection[] } => {
  const config = {
    nodeWidth: 200,
    nodeHeight: 60,
    horizontalSpacing: 250,
    verticalSpacing: 80
  };
  
  const layoutNodes: LayoutNode[] = [];
  const connections: LayoutConnection[] = [];
  
  // 广度优先遍历计算位置
  const queue: Array<{ nodeId: string; level: number; index: number }> = 
    [{ nodeId: rootId, level: 0, index: 0 }];
  
  const levelCounts = new Map<number, number>();
  
  while (queue.length > 0) {
    const { nodeId, level, index } = queue.shift()!;
    const node = nodes.get(nodeId);
    if (!node) continue;
    
    // 计算位置
    const x = level * config.horizontalSpacing;
    const y = index * config.verticalSpacing - 
              ((levelCounts.get(level) || 0) * config.verticalSpacing) / 2;
    
    layoutNodes.push({
      id: nodeId,
      position: { x, y },
      size: { width: config.nodeWidth, height: config.nodeHeight }
    });
    
    // 更新层级统计
    levelCounts.set(level, (levelCounts.get(level) || 0) + 1);
    
    // 添加子节点到队列
    node.children.forEach((childId, childIndex) => {
      queue.push({ 
        nodeId: childId, 
        level: level + 1, 
        index: levelCounts.get(level + 1) || 0 
      });
      
      // 添加连接线
      const childNode = nodes.get(childId);
      if (childNode) {
        connections.push({
          from: { x: x + config.nodeWidth, y: y + config.nodeHeight / 2 },
          to: { x: (level + 1) * config.horizontalSpacing, y: 0 } // 暂时占位，后续计算
        });
      }
    });
  }
  
  return { nodes: layoutNodes, connections };
};
```

## 4. 开发体验优化

### 4.1 调试工具集成
```typescript
// 开发环境调试增强
if (process.env.NODE_ENV === 'development') {
  // 全局暴露store用于调试
  (window as any).__MINDMAP_STORE__ = useMindMapStore;
  
  // 性能监控
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.name.includes('mindmap')) {
        console.log(`🚀 ${entry.name}: ${entry.duration.toFixed(2)}ms`);
      }
    }
  });
  observer.observe({ entryTypes: ['measure'] });
}

// React DevTools性能标记
export const MindNode: React.FC<MindNodeProps> = React.memo(({ nodeId }) => {
  performance.mark(`mindnode-${nodeId}-start`);
  
  // 组件渲染逻辑...
  
  useEffect(() => {
    performance.mark(`mindnode-${nodeId}-end`);
    performance.measure(
      `MindNode-${nodeId}`, 
      `mindnode-${nodeId}-start`, 
      `mindnode-${nodeId}-end`
    );
  });
  
  return (
    // JSX...
  );
});
```

### 4.2 TypeScript类型安全
```typescript
// 严格的类型定义
interface MindNodeCreateInput {
  title: string;
  content?: string;
  parentId?: string;
  tags?: Partial<MindNode['tags']>;
}

interface MindNodeUpdateInput extends Partial<Omit<MindNode, 'id' | 'children'>> {}

// 类型守卫
const isMindNode = (obj: any): obj is MindNode => {
  return typeof obj === 'object' &&
         typeof obj.id === 'string' &&
         typeof obj.title === 'string' &&
         Array.isArray(obj.children);
};

// API类型安全
export interface MindMapAPI {
  loadMarkdown(markdown: string): Promise<void>;
  exportMarkdown(): string;
  addNode(parentId: string, data: MindNodeCreateInput): string;
  updateNode(id: string, data: MindNodeUpdateInput): boolean;
  deleteNode(id: string): boolean;
  moveNode(sourceId: string, targetParentId: string): boolean;
  selectNode(id: string | null): void;
  
  // 事件订阅
  onNodeSelect(callback: (node: MindNode | null) => void): () => void;
  onNodeUpdate(callback: (node: MindNode) => void): () => void;
  onTreeChange(callback: (tree: TreeData) => void): () => void;
}
```

### 4.3 热重载配置
```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react({
      fastRefresh: true,
      include: "**/*.{jsx,tsx}",
    })
  ],
  server: {
    hmr: {
      overlay: true,
    },
    port: 3000,
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'canvas-vendor': ['konva', 'react-konva'],
          'utils': ['zustand', 'unified', 'remark-parse']
        }
      }
    }
  }
});
```

## 5. 项目结构

```
mindmap-modern/
├── src/
│   ├── features/
│   │   └── mindmap/
│   │       ├── components/           # React组件
│   │       │   ├── MindMapCanvas.tsx
│   │       │   ├── MindNode.tsx
│   │       │   ├── ConnectionLine.tsx
│   │       │   ├── DetailPanel.tsx
│   │       │   ├── TagSelector.tsx
│   │       │   └── MarkdownEditor.tsx
│   │       ├── store/               # Zustand状态管理
│   │       │   ├── useMindMapStore.ts
│   │       │   ├── actions.ts
│   │       │   └── selectors.ts
│   │       ├── hooks/               # 自定义Hooks
│   │       │   ├── useMindMapInteractions.ts
│   │       │   ├── useAutoLayout.ts
│   │       │   └── useMarkdownParser.ts
│   │       ├── utils/               # 工具函数
│   │       │   ├── layoutAlgorithms.ts
│   │       │   ├── markdownParser.ts
│   │       │   ├── cycleDetection.ts
│   │       │   └── exportUtils.ts
│   │       └── types/               # 类型定义
│   │           ├── mindmap.types.ts
│   │           └── api.types.ts
│   ├── shared/                      # 共享资源
│   │   ├── components/              # 通用组件
│   │   ├── hooks/                   # 通用Hooks
│   │   ├── utils/                   # 通用工具
│   │   └── styles/                  # 全局样式
│   ├── App.tsx                      # 主应用
│   ├── main.tsx                     # 入口文件
│   └── vite-env.d.ts               # Vite类型声明
├── public/
├── tests/                           # 测试文件
│   ├── components/
│   ├── store/
│   └── utils/
├── docs/                           # 文档
├── examples/                       # 示例代码
├── dist/                          # 构建输出
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 6. 使用示例

### 6.1 基础集成
```tsx
import React from 'react';
import { MindMapApp } from 'mindmap-modern';
import 'mindmap-modern/dist/style.css';

const App: React.FC = () => {
  const handleMarkdownLoad = (markdown: string) => {
    console.log('Loaded markdown:', markdown);
  };

  const handleNodeSelect = (node: MindNode | null) => {
    console.log('Selected node:', node);
  };

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <MindMapApp
        initialMarkdown={defaultMarkdown}
        onMarkdownChange={handleMarkdownLoad}
        onNodeSelect={handleNodeSelect}
        editable={true}
        showDetailPanel={true}
        theme="light"
      />
    </div>
  );
};

export default App;
```

### 6.2 API使用
```typescript
import { createMindMapAPI } from 'mindmap-modern';

const api = createMindMapAPI();

// 加载数据
await api.loadMarkdown(`
编号：{#ROOT-001}
标题：项目管理中心
状态：@进行中
优先级：@高

这是项目的根节点。

编号：{#TASK-001}
标题：前端开发
父节点：^ROOT-001
状态：@进行中
分类：@前端

前端开发相关任务。
`);

// 监听事件
const unsubscribe = api.onNodeSelect((node) => {
  if (node) {
    console.log(`Selected node: ${node.title}`);
  }
});

// 程序化操作
const newNodeId = api.addNode('ROOT-001', {
  title: '新任务',
  tags: { status: '未开始', priority: '中' }
});

api.updateNode(newNodeId, {
  content: '这是新添加的任务节点。'
});

// 导出数据
const markdown = api.exportMarkdown();
console.log(markdown);
```

## 7. 开发计划（48小时交付）

### 7.1 Phase 1: 基础架构（16小时）
- [x] Vite + React + TypeScript项目搭建
- [x] Zustand状态管理架构设计
- [x] 基础组件结构创建
- [x] TypeScript类型系统定义
- [x] 开发环境调试工具配置

### 7.2 Phase 2: 核心功能（24小时）
- [x] Markdown解析器实现
- [x] Konva Canvas渲染系统
- [x] 节点拖拽交互
- [x] 自动布局算法
- [x] 标签系统组件化
- [x] 详情编辑面板

### 7.3 Phase 3: 优化发布（8小时）
- [x] 性能优化和调试
- [x] 单元测试覆盖
- [x] 构建配置优化
- [x] 文档和示例完善
- [x] 发布准备

## 8. 验收标准

### 8.1 性能指标
- [ ] 500节点渲染≤1秒（相比原方案提升3倍）
- [ ] 拖拽操作延迟≤16ms（60fps流畅度）
- [ ] 内存占用≤80MB
- [ ] 首屏加载≤2秒

### 8.2 开发体验
- [ ] 热重载响应≤500ms且保持状态
- [ ] TypeScript错误100%编译时捕获
- [ ] React DevTools完整支持
- [ ] 错误边界覆盖关键组件

### 8.3 功能完整性
- [ ] Markdown解析准确率100%
- [ ] 循环依赖检测有效
- [ ] 撤销重做功能可用
- [ ] 导出数据格式正确

### 8.4 代码质量
- [ ] TypeScript严格模式通过
- [ ] ESLint规则零警告
- [ ] 单元测试覆盖率≥80%
- [ ] 组件化程度≥90%

---

**文档状态：** 架构设计完成，开发就绪  
**预计交付：** 48小时内  
**技术负责人：** React开发团队  
**调试友好度：** ⭐⭐⭐⭐⭐（相比原方案显著提升）
