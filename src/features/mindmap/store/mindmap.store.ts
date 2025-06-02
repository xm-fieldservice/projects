import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type {
  MindNode,
  TreeData,
  MindNodeCreateInput,
  MindNodeUpdateInput,
  DragState,
  SelectionState,
  EditState,
  Viewport,
  MindMapConfig,
  PerformanceMetrics
} from '../types/mindmap.types';

interface MindMapState {
  // 数据状态
  tree: TreeData;
  
  // UI状态
  viewport: Viewport;
  dragState: DragState;
  selectionState: SelectionState;
  editState: EditState;
  
  // 配置
  config: MindMapConfig;
  
  // 性能监控
  metrics: PerformanceMetrics;
  
  // 操作方法
  actions: {
    // 节点操作
    addNode: (input: MindNodeCreateInput) => string;
    updateNode: (id: string, updates: MindNodeUpdateInput) => void;
    deleteNode: (id: string) => void;
    moveNode: (nodeId: string, newParentId: string | null) => void;
    
    // 选择操作
    selectNode: (id: string | null) => void;
    setHoveredNode: (id: string | null) => void;
    
    // 编辑操作
    startEditing: (nodeId: string, field?: string) => void;
    stopEditing: () => void;
    
    // 拖拽操作
    startDrag: (nodeId: string, position: { x: number; y: number }) => void;
    updateDrag: (position: { x: number; y: number }) => void;
    endDrag: (targetNodeId?: string) => void;
    
    // 视口操作
    setViewport: (viewport: Partial<Viewport>) => void;
    resetViewport: () => void;
    
    // 数据操作
    loadTree: (tree: TreeData) => void;
    clearTree: () => void;
    
    // 配置操作
    updateConfig: (config: Partial<MindMapConfig>) => void;
    
    // 性能监控
    updateMetrics: (metrics: Partial<PerformanceMetrics>) => void;
  };
}

const defaultConfig: MindMapConfig = {
  nodeWidth: 200,
  nodeHeight: 80,
  horizontalSpacing: 250,
  verticalSpacing: 120,
  margin: {
    top: 50,
    right: 50,
    bottom: 50,
    left: 50
  }
};

const defaultViewport: Viewport = {
  x: 0,
  y: 0,
  scale: 1
};

const defaultDragState: DragState = {
  isDragging: false,
  draggedNodeId: null,
  dragStartPosition: null,
  dragCurrentPosition: null
};

const defaultSelectionState: SelectionState = {
  selectedNodeId: null,
  hoveredNodeId: null
};

const defaultEditState: EditState = {
  isEditing: false,
  editingNodeId: null,
  editingField: null
};

const defaultMetrics: PerformanceMetrics = {
  renderTime: 0,
  layoutTime: 0,
  totalNodes: 0,
  visibleNodes: 0
};

export const useMindMapStore = create<MindMapState>()(
  devtools(
    (set, get) => ({
      // 初始状态
      tree: { nodes: [], rootId: null },
      viewport: defaultViewport,
      dragState: defaultDragState,
      selectionState: defaultSelectionState,
      editState: defaultEditState,
      config: defaultConfig,
      metrics: defaultMetrics,
      
      actions: {
        // 添加节点
        addNode: (input: MindNodeCreateInput) => {
          const id = uuidv4();
          const now = new Date().toISOString();
          
          const newNode: MindNode = {
            id,
            title: input.title,
            content: input.content || '',
            parentId: input.parentId || null,
            position: { x: 0, y: 0 }, // 布局算法会重新计算
            tags: input.tags || {},
            children: [],
            metadata: {
              createdAt: now,
              updatedAt: now
            }
          };
          
          set((state) => {
            const newNodes = [...state.tree.nodes, newNode];
            
            // 更新父节点的children数组
            if (input.parentId) {
              const parentIndex = newNodes.findIndex(n => n.id === input.parentId);
              if (parentIndex !== -1) {
                newNodes[parentIndex] = {
                  ...newNodes[parentIndex],
                  children: [...newNodes[parentIndex].children, id]
                };
              }
            }
            
            return {
              tree: {
                nodes: newNodes,
                rootId: state.tree.rootId || (input.parentId ? state.tree.rootId : id)
              }
            };
          });
          
          return id;
        },
        
        // 更新节点
        updateNode: (id: string, updates: MindNodeUpdateInput) => {
          set((state) => {
            const nodeIndex = state.tree.nodes.findIndex(n => n.id === id);
            if (nodeIndex === -1) return state;
            
            const updatedNode = {
              ...state.tree.nodes[nodeIndex],
              ...updates,
              metadata: {
                ...state.tree.nodes[nodeIndex].metadata,
                updatedAt: new Date().toISOString()
              }
            };
            
            const newNodes = [...state.tree.nodes];
            newNodes[nodeIndex] = updatedNode;
            
            return {
              tree: {
                ...state.tree,
                nodes: newNodes
              }
            };
          });
        },
        
        // 删除节点
        deleteNode: (id: string) => {
          set((state) => {
            const nodeToDelete = state.tree.nodes.find(n => n.id === id);
            if (!nodeToDelete) return state;
            
            // 递归删除所有子节点
            const nodesToDelete = new Set([id]);
            const findChildren = (nodeId: string) => {
              const node = state.tree.nodes.find(n => n.id === nodeId);
              if (node) {
                node.children.forEach(childId => {
                  nodesToDelete.add(childId);
                  findChildren(childId);
                });
              }
            };
            findChildren(id);
            
            // 从父节点的children中移除
            const newNodes = state.tree.nodes
              .filter(n => !nodesToDelete.has(n.id))
              .map(node => {
                if (node.children.includes(id)) {
                  return {
                    ...node,
                    children: node.children.filter(childId => childId !== id)
                  };
                }
                return node;
              });
            
            return {
              tree: {
                nodes: newNodes,
                rootId: state.tree.rootId === id ? null : state.tree.rootId
              },
              selectionState: {
                ...state.selectionState,
                selectedNodeId: state.selectionState.selectedNodeId === id ? null : state.selectionState.selectedNodeId
              }
            };
          });
        },
        
        // 移动节点
        moveNode: (nodeId: string, newParentId: string | null) => {
          set((state) => {
            const node = state.tree.nodes.find(n => n.id === nodeId);
            if (!node || node.parentId === newParentId) return state;
            
            // 检查循环依赖
            if (newParentId) {
              let current = state.tree.nodes.find(n => n.id === newParentId);
              while (current) {
                if (current.id === nodeId) return state; // 循环依赖
                current = current.parentId ? state.tree.nodes.find(n => n.id === current!.parentId) : null;
              }
            }
            
            const newNodes = state.tree.nodes.map(n => {
              // 从旧父节点移除
              if (n.id === node.parentId) {
                return {
                  ...n,
                  children: n.children.filter(childId => childId !== nodeId)
                };
              }
              // 添加到新父节点
              if (n.id === newParentId) {
                return {
                  ...n,
                  children: [...n.children, nodeId]
                };
              }
              // 更新节点的parentId
              if (n.id === nodeId) {
                return {
                  ...n,
                  parentId: newParentId
                };
              }
              return n;
            });
            
            return {
              tree: {
                ...state.tree,
                nodes: newNodes
              }
            };
          });
        },
        
        // 选择节点
        selectNode: (id: string | null) => {
          set((state) => ({
            selectionState: {
              ...state.selectionState,
              selectedNodeId: id
            }
          }));
        },
        
        // 设置悬停节点
        setHoveredNode: (id: string | null) => {
          set((state) => ({
            selectionState: {
              ...state.selectionState,
              hoveredNodeId: id
            }
          }));
        },
        
        // 开始编辑
        startEditing: (nodeId: string, field: string = 'title') => {
          set((state) => ({
            editState: {
              isEditing: true,
              editingNodeId: nodeId,
              editingField: field
            }
          }));
        },
        
        // 停止编辑
        stopEditing: () => {
          set((state) => ({
            editState: defaultEditState
          }));
        },
        
        // 开始拖拽
        startDrag: (nodeId: string, position: { x: number; y: number }) => {
          set((state) => ({
            dragState: {
              isDragging: true,
              draggedNodeId: nodeId,
              dragStartPosition: position,
              dragCurrentPosition: position
            }
          }));
        },
        
        // 更新拖拽位置
        updateDrag: (position: { x: number; y: number }) => {
          set((state) => ({
            dragState: {
              ...state.dragState,
              dragCurrentPosition: position
            }
          }));
        },
        
        // 结束拖拽
        endDrag: (targetNodeId?: string) => {
          const state = get();
          if (state.dragState.draggedNodeId && targetNodeId && targetNodeId !== state.dragState.draggedNodeId) {
            // 执行移动操作
            state.actions.moveNode(state.dragState.draggedNodeId, targetNodeId);
          }
          
          set((state) => ({
            dragState: defaultDragState
          }));
        },
        
        // 设置视口
        setViewport: (viewport: Partial<Viewport>) => {
          set((state) => ({
            viewport: {
              ...state.viewport,
              ...viewport
            }
          }));
        },
        
        // 重置视口
        resetViewport: () => {
          set((state) => ({
            viewport: defaultViewport
          }));
        },
        
        // 加载树数据
        loadTree: (tree: TreeData) => {
          set((state) => ({
            tree,
            selectionState: defaultSelectionState,
            editState: defaultEditState,
            dragState: defaultDragState
          }));
        },
        
        // 清空树
        clearTree: () => {
          set((state) => ({
            tree: { nodes: [], rootId: null },
            selectionState: defaultSelectionState,
            editState: defaultEditState,
            dragState: defaultDragState
          }));
        },
        
        // 更新配置
        updateConfig: (config: Partial<MindMapConfig>) => {
          set((state) => ({
            config: {
              ...state.config,
              ...config
            }
          }));
        },
        
        // 更新性能指标
        updateMetrics: (metrics: Partial<PerformanceMetrics>) => {
          set((state) => ({
            metrics: {
              ...state.metrics,
              ...metrics
            }
          }));
        }
      }
    }),
    {
      name: 'mindmap-store',
      partialize: (state) => ({
        tree: state.tree,
        config: state.config
      })
    }
  )
); 