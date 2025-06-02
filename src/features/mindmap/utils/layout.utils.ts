import type {
  MindNode,
  TreeData,
  LayoutData,
  LayoutNode,
  LayoutConnection,
  MindMapConfig
} from '../types/mindmap.types';

// 层次布局算法
export class HierarchicalLayout {
  private config: MindMapConfig;
  
  constructor(config: MindMapConfig) {
    this.config = config;
  }
  
  // 计算布局
  calculateLayout(tree: TreeData): LayoutData {
    if (!tree.rootId || tree.nodes.length === 0) {
      return { nodes: [], connections: [] };
    }
    
    const startTime = performance.now();
    
    // 构建节点映射
    const nodeMap = new Map<string, MindNode>();
    tree.nodes.forEach(node => nodeMap.set(node.id, node));
    
    // 构建层次结构
    const hierarchy = this.buildHierarchy(tree.rootId, nodeMap);
    
    // 计算每层的节点数量和位置
    const layoutNodes = this.calculateNodePositions(hierarchy);
    
    // 计算连接线
    const connections = this.calculateConnections(layoutNodes, nodeMap);
    
    const endTime = performance.now();
    console.log(`布局计算耗时: ${endTime - startTime}ms`);
    
    return {
      nodes: layoutNodes,
      connections
    };
  }
  
  // 构建层次结构
  private buildHierarchy(rootId: string, nodeMap: Map<string, MindNode>): HierarchyNode {
    const root = nodeMap.get(rootId);
    if (!root) throw new Error(`Root node ${rootId} not found`);
    
    const buildNode = (nodeId: string, level: number = 0): HierarchyNode => {
      const node = nodeMap.get(nodeId);
      if (!node) throw new Error(`Node ${nodeId} not found`);
      
      const children = node.children.map(childId => buildNode(childId, level + 1));
      
      return {
        id: nodeId,
        level,
        children,
        width: this.config.nodeWidth,
        height: this.config.nodeHeight,
        x: 0,
        y: 0,
        subtreeWidth: 0
      };
    };
    
    return buildNode(rootId);
  }
  
  // 计算节点位置
  private calculateNodePositions(hierarchy: HierarchyNode): LayoutNode[] {
    const layoutNodes: LayoutNode[] = [];
    
    // 第一遍：计算每个节点的子树宽度
    this.calculateSubtreeWidths(hierarchy);
    
    // 第二遍：计算实际位置
    this.positionNodes(hierarchy, 0, 0, layoutNodes);
    
    return layoutNodes;
  }
  
  // 计算子树宽度
  private calculateSubtreeWidths(node: HierarchyNode): number {
    if (node.children.length === 0) {
      node.subtreeWidth = node.width;
      return node.width;
    }
    
    let totalChildWidth = 0;
    node.children.forEach(child => {
      totalChildWidth += this.calculateSubtreeWidths(child);
    });
    
    // 添加子节点间的间距
    const spacing = (node.children.length - 1) * this.config.horizontalSpacing;
    node.subtreeWidth = Math.max(node.width, totalChildWidth + spacing);
    
    return node.subtreeWidth;
  }
  
  // 定位节点
  private positionNodes(
    node: HierarchyNode,
    x: number,
    y: number,
    layoutNodes: LayoutNode[]
  ): void {
    // 设置当前节点位置
    node.x = x;
    node.y = y;
    
    layoutNodes.push({
      id: node.id,
      position: { x: node.x, y: node.y },
      size: { width: node.width, height: node.height }
    });
    
    // 定位子节点
    if (node.children.length > 0) {
      const childY = y + this.config.verticalSpacing;
      let currentX = x - (node.subtreeWidth - node.width) / 2;
      
      node.children.forEach(child => {
        const childCenterX = currentX + child.subtreeWidth / 2;
        this.positionNodes(child, childCenterX - child.width / 2, childY, layoutNodes);
        currentX += child.subtreeWidth + this.config.horizontalSpacing;
      });
    }
  }
  
  // 计算连接线
  private calculateConnections(
    layoutNodes: LayoutNode[],
    nodeMap: Map<string, MindNode>
  ): LayoutConnection[] {
    const connections: LayoutConnection[] = [];
    const nodePositions = new Map<string, { x: number; y: number }>();
    
    // 建立位置映射
    layoutNodes.forEach(layoutNode => {
      nodePositions.set(layoutNode.id, {
        x: layoutNode.position.x + layoutNode.size.width / 2,
        y: layoutNode.position.y + layoutNode.size.height / 2
      });
    });
    
    // 为每个节点创建到其子节点的连接
    nodeMap.forEach(node => {
      const parentPos = nodePositions.get(node.id);
      if (!parentPos) return;
      
      node.children.forEach(childId => {
        const childPos = nodePositions.get(childId);
        if (!childPos) return;
        
        connections.push({
          from: {
            x: parentPos.x,
            y: parentPos.y + this.config.nodeHeight / 2
          },
          to: {
            x: childPos.x,
            y: childPos.y - this.config.nodeHeight / 2
          },
          fromNodeId: node.id,
          toNodeId: childId
        });
      });
    });
    
    return connections;
  }
}

// 层次节点接口
interface HierarchyNode {
  id: string;
  level: number;
  children: HierarchyNode[];
  width: number;
  height: number;
  x: number;
  y: number;
  subtreeWidth: number;
}

// 径向布局算法（可选）
export class RadialLayout {
  private config: MindMapConfig;
  
  constructor(config: MindMapConfig) {
    this.config = config;
  }
  
  calculateLayout(tree: TreeData): LayoutData {
    if (!tree.rootId || tree.nodes.length === 0) {
      return { nodes: [], connections: [] };
    }
    
    const nodeMap = new Map<string, MindNode>();
    tree.nodes.forEach(node => nodeMap.set(node.id, node));
    
    const layoutNodes: LayoutNode[] = [];
    const connections: LayoutConnection[] = [];
    
    // 根节点放在中心
    const rootNode = nodeMap.get(tree.rootId)!;
    const centerX = 0;
    const centerY = 0;
    
    layoutNodes.push({
      id: tree.rootId,
      position: { x: centerX, y: centerY },
      size: { width: this.config.nodeWidth, height: this.config.nodeHeight }
    });
    
    // 计算子节点的径向位置
    this.calculateRadialPositions(
      tree.rootId,
      nodeMap,
      layoutNodes,
      connections,
      centerX,
      centerY,
      150, // 初始半径
      0,   // 起始角度
      Math.PI * 2 // 角度范围
    );
    
    return { nodes: layoutNodes, connections };
  }
  
  private calculateRadialPositions(
    nodeId: string,
    nodeMap: Map<string, MindNode>,
    layoutNodes: LayoutNode[],
    connections: LayoutConnection[],
    centerX: number,
    centerY: number,
    radius: number,
    startAngle: number,
    angleRange: number
  ): void {
    const node = nodeMap.get(nodeId);
    if (!node || node.children.length === 0) return;
    
    const angleStep = angleRange / node.children.length;
    
    node.children.forEach((childId, index) => {
      const angle = startAngle + index * angleStep + angleStep / 2;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      
      layoutNodes.push({
        id: childId,
        position: { x, y },
        size: { width: this.config.nodeWidth, height: this.config.nodeHeight }
      });
      
      // 添加连接线
      connections.push({
        from: { x: centerX, y: centerY },
        to: { x, y },
        fromNodeId: nodeId,
        toNodeId: childId
      });
      
      // 递归处理子节点
      this.calculateRadialPositions(
        childId,
        nodeMap,
        layoutNodes,
        connections,
        x,
        y,
        radius * 0.8, // 递减半径
        angle - angleStep / 4,
        angleStep / 2
      );
    });
  }
}

// 布局工厂
export class LayoutFactory {
  static createLayout(type: 'hierarchical' | 'radial', config: MindMapConfig) {
    switch (type) {
      case 'hierarchical':
        return new HierarchicalLayout(config);
      case 'radial':
        return new RadialLayout(config);
      default:
        return new HierarchicalLayout(config);
    }
  }
}

// 布局优化工具
export const layoutUtils = {
  // 计算视口边界
  calculateBounds(layoutNodes: LayoutNode[]): {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
    width: number;
    height: number;
  } {
    if (layoutNodes.length === 0) {
      return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
    }
    
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    
    layoutNodes.forEach(node => {
      const { x, y } = node.position;
      const { width, height } = node.size;
      
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + width);
      maxY = Math.max(maxY, y + height);
    });
    
    return {
      minX,
      minY,
      maxX,
      maxY,
      width: maxX - minX,
      height: maxY - minY
    };
  },
  
  // 居中视口
  centerViewport(
    layoutNodes: LayoutNode[],
    viewportWidth: number,
    viewportHeight: number
  ): { x: number; y: number; scale: number } {
    const bounds = this.calculateBounds(layoutNodes);
    
    if (bounds.width === 0 || bounds.height === 0) {
      return { x: 0, y: 0, scale: 1 };
    }
    
    // 计算缩放比例
    const scaleX = (viewportWidth * 0.8) / bounds.width;
    const scaleY = (viewportHeight * 0.8) / bounds.height;
    const scale = Math.min(scaleX, scaleY, 1); // 不放大
    
    // 计算居中偏移
    const centerX = bounds.minX + bounds.width / 2;
    const centerY = bounds.minY + bounds.height / 2;
    
    const x = viewportWidth / 2 - centerX * scale;
    const y = viewportHeight / 2 - centerY * scale;
    
    return { x, y, scale };
  }
}; 