// 脑图应用核心类型定义
export interface MindNode {
  id: string;
  title: string;
  content: string;
  parentId: string | null;
  position: { x: number; y: number };
  tags: {
    status?: '未开始' | '进行中' | '已完成' | '暂停';
    priority?: '低' | '中' | '高' | '紧急';
    category?: string;
  };
  children: string[];
  metadata?: {
    createdAt: string;
    updatedAt: string;
    author?: string;
  };
}

export interface TreeData {
  nodes: MindNode[];
  rootId: string | null;
}

export interface LayoutNode {
  id: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

export interface LayoutConnection {
  from: { x: number; y: number };
  to: { x: number; y: number };
  fromNodeId: string;
  toNodeId: string;
}

export interface LayoutData {
  nodes: LayoutNode[];
  connections: LayoutConnection[];
}

export interface Viewport {
  x: number;
  y: number;
  scale: number;
}

export interface TagConfig {
  background: string;
  color: string;
  borderColor?: string;
}

export interface TagConfigs {
  status: Record<string, TagConfig>;
  priority: Record<string, TagConfig>;
  category: Record<string, TagConfig>;
}

export interface MindMapConfig {
  nodeWidth: number;
  nodeHeight: number;
  horizontalSpacing: number;
  verticalSpacing: number;
  margin: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

export interface MindMapOptions {
  maxNodes?: number;
  editable?: boolean;
  showDetailPanel?: boolean;
  theme?: 'light' | 'dark';
  config?: Partial<MindMapConfig>;
}

// 节点创建输入类型
export interface MindNodeCreateInput {
  title: string;
  content?: string;
  parentId?: string;
  tags?: Partial<MindNode['tags']>;
}

// 节点更新输入类型
export interface MindNodeUpdateInput extends Partial<Omit<MindNode, 'id' | 'children'>> {}

// 拖拽状态
export interface DragState {
  isDragging: boolean;
  draggedNodeId: string | null;
  dragStartPosition: { x: number; y: number } | null;
  dragCurrentPosition: { x: number; y: number } | null;
}

// 选择状态
export interface SelectionState {
  selectedNodeId: string | null;
  hoveredNodeId: string | null;
}

// 编辑状态
export interface EditState {
  isEditing: boolean;
  editingNodeId: string | null;
  editingField: string | null;
}

// 事件类型
export interface NodeSelectEvent {
  node: MindNode | null;
  position?: { x: number; y: number };
}

export interface NodeUpdateEvent {
  node: MindNode;
  changes: Partial<MindNode>;
}

export interface TreeChangeEvent {
  tree: TreeData;
  action: 'add' | 'update' | 'delete' | 'move';
  nodeId: string;
}

// 错误类型
export interface MindMapError {
  code: string;
  message: string;
  details?: any;
}

// 导出类型
export interface ExportOptions {
  format: 'markdown' | 'json' | 'png' | 'svg';
  includeMetadata?: boolean;
  includePosition?: boolean;
}

// 导入类型
export interface ImportResult {
  success: boolean;
  data?: TreeData;
  error?: MindMapError;
  warnings?: string[];
}

// 性能监控类型
export interface PerformanceMetrics {
  renderTime: number;
  layoutTime: number;
  totalNodes: number;
  visibleNodes: number;
  memoryUsage?: number;
}

// 主题类型
export interface Theme {
  name: string;
  colors: {
    background: string;
    node: {
      default: string;
      selected: string;
      hover: string;
      text: string;
    };
    connection: {
      default: string;
      selected: string;
    };
    panel: {
      background: string;
      border: string;
      text: string;
    };
  };
  typography: {
    fontFamily: string;
    fontSize: {
      node: number;
      tag: number;
      panel: number;
    };
  };
}

// 类型守卫
export const isMindNode = (obj: any): obj is MindNode => {
  return typeof obj === 'object' &&
         typeof obj.id === 'string' &&
         typeof obj.title === 'string' &&
         Array.isArray(obj.children);
};

export const isTreeData = (obj: any): obj is TreeData => {
  return typeof obj === 'object' &&
         Array.isArray(obj.nodes) &&
         obj.nodes.every(isMindNode) &&
         (obj.rootId === null || typeof obj.rootId === 'string');
}; 