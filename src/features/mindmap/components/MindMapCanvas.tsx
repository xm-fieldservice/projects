import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Stage, Layer, Group, Rect, Text, Line } from 'react-konva';
import { useMindMapStore } from '../store/mindmap.store';
import { HierarchicalLayout, layoutUtils } from '../utils/layout.utils';
import type { MindNode, LayoutData, LayoutNode } from '../types/mindmap.types';

interface MindMapCanvasProps {
  width: number;
  height: number;
  onNodeSelect?: (node: MindNode | null) => void;
  onNodeDoubleClick?: (node: MindNode) => void;
}

// 节点组件
const NodeComponent: React.FC<{
  node: MindNode;
  layoutNode: LayoutNode;
  isSelected: boolean;
  isHovered: boolean;
  onSelect: () => void;
  onHover: (hover: boolean) => void;
  onDoubleClick: () => void;
  onDragStart: (position: { x: number; y: number }) => void;
  onDragMove: (position: { x: number; y: number }) => void;
  onDragEnd: () => void;
}> = ({
  node,
  layoutNode,
  isSelected,
  isHovered,
  onSelect,
  onHover,
  onDoubleClick,
  onDragStart,
  onDragMove,
  onDragEnd
}) => {
  const getNodeColor = () => {
    if (node.tags.status === '已完成') return '#4CAF50';
    if (node.tags.status === '进行中') return '#2196F3';
    if (node.tags.status === '暂停') return '#FF9800';
    return '#9E9E9E'; // 未开始
  };

  const getBorderColor = () => {
    if (isSelected) return '#1976D2';
    if (isHovered) return '#42A5F5';
    return getNodeColor();
  };

  const getPriorityColor = () => {
    switch (node.tags.priority) {
      case '紧急': return '#F44336';
      case '高': return '#FF9800';
      case '中': return '#FFC107';
      case '低': return '#4CAF50';
      default: return '#9E9E9E';
    }
  };

  return (
    <Group
      x={layoutNode.position.x}
      y={layoutNode.position.y}
      draggable
      onClick={onSelect}
      onDblClick={onDoubleClick}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      onDragStart={(e) => {
        onDragStart({ x: e.target.x(), y: e.target.y() });
      }}
      onDragMove={(e) => {
        onDragMove({ x: e.target.x(), y: e.target.y() });
      }}
      onDragEnd={onDragEnd}
    >
      {/* 主节点矩形 */}
      <Rect
        width={layoutNode.size.width}
        height={layoutNode.size.height}
        fill={getNodeColor()}
        stroke={getBorderColor()}
        strokeWidth={isSelected ? 3 : isHovered ? 2 : 1}
        cornerRadius={8}
        shadowColor="rgba(0,0,0,0.3)"
        shadowBlur={isSelected ? 10 : isHovered ? 5 : 2}
        shadowOffset={{ x: 2, y: 2 }}
      />
      
      {/* 优先级指示器 */}
      {node.tags.priority && (
        <Rect
          x={layoutNode.size.width - 20}
          y={5}
          width={15}
          height={15}
          fill={getPriorityColor()}
          cornerRadius={3}
        />
      )}
      
      {/* 节点标题 */}
      <Text
        x={10}
        y={15}
        width={layoutNode.size.width - 20}
        height={30}
        text={node.title}
        fontSize={14}
        fontFamily="Arial, sans-serif"
        fill="white"
        fontStyle="bold"
        align="left"
        verticalAlign="middle"
        ellipsis={true}
      />
      
      {/* 分类标签 */}
      {node.tags.category && (
        <Text
          x={10}
          y={layoutNode.size.height - 25}
          width={layoutNode.size.width - 20}
          text={`#${node.tags.category}`}
          fontSize={10}
          fontFamily="Arial, sans-serif"
          fill="rgba(255,255,255,0.8)"
          align="left"
        />
      )}
      
      {/* 子节点数量指示器 */}
      {node.children.length > 0 && (
        <Group>
          <Rect
            x={layoutNode.size.width - 30}
            y={layoutNode.size.height - 20}
            width={20}
            height={15}
            fill="rgba(255,255,255,0.2)"
            cornerRadius={8}
          />
          <Text
            x={layoutNode.size.width - 30}
            y={layoutNode.size.height - 20}
            width={20}
            height={15}
            text={node.children.length.toString()}
            fontSize={10}
            fontFamily="Arial, sans-serif"
            fill="white"
            align="center"
            verticalAlign="middle"
          />
        </Group>
      )}
    </Group>
  );
};

// 连接线组件
const ConnectionComponent: React.FC<{
  connection: LayoutData['connections'][0];
}> = ({ connection }) => {
  const points = [
    connection.from.x,
    connection.from.y,
    connection.to.x,
    connection.to.y
  ];

  return (
    <Line
      points={points}
      stroke="#666"
      strokeWidth={2}
      lineCap="round"
      shadowColor="rgba(0,0,0,0.2)"
      shadowBlur={3}
      shadowOffset={{ x: 1, y: 1 }}
    />
  );
};

export const MindMapCanvas: React.FC<MindMapCanvasProps> = ({
  width,
  height,
  onNodeSelect,
  onNodeDoubleClick
}) => {
  const stageRef = useRef<any>(null);
  const [layoutData, setLayoutData] = useState<LayoutData>({ nodes: [], connections: [] });
  
  const {
    tree,
    config,
    viewport,
    selectionState,
    dragState,
    actions
  } = useMindMapStore();

  // 计算布局
  const calculateLayout = useCallback(() => {
    if (tree.nodes.length === 0) {
      setLayoutData({ nodes: [], connections: [] });
      return;
    }

    const startTime = performance.now();
    const layout = new HierarchicalLayout(config);
    const newLayoutData = layout.calculateLayout(tree);
    const endTime = performance.now();

    setLayoutData(newLayoutData);
    
    // 更新性能指标
    actions.updateMetrics({
      layoutTime: endTime - startTime,
      totalNodes: tree.nodes.length,
      visibleNodes: newLayoutData.nodes.length
    });
  }, [tree, config, actions]);

  // 当树数据或配置变化时重新计算布局
  useEffect(() => {
    calculateLayout();
  }, [calculateLayout]);

  // 自动居中视口
  const centerViewport = useCallback(() => {
    if (layoutData.nodes.length === 0) return;
    
    const centerViewportData = layoutUtils.centerViewport(layoutData.nodes, width, height);
    actions.setViewport(centerViewportData);
  }, [layoutData.nodes, width, height, actions]);

  // 初始化时居中视口
  useEffect(() => {
    if (layoutData.nodes.length > 0) {
      centerViewport();
    }
  }, [layoutData.nodes.length > 0]); // 只在首次有数据时执行

  // 处理节点选择
  const handleNodeSelect = useCallback((node: MindNode) => {
    actions.selectNode(node.id);
    onNodeSelect?.(node);
  }, [actions, onNodeSelect]);

  // 处理节点双击
  const handleNodeDoubleClick = useCallback((node: MindNode) => {
    actions.startEditing(node.id, 'title');
    onNodeDoubleClick?.(node);
  }, [actions, onNodeDoubleClick]);

  // 处理节点悬停
  const handleNodeHover = useCallback((nodeId: string, hover: boolean) => {
    actions.setHoveredNode(hover ? nodeId : null);
  }, [actions]);

  // 处理拖拽开始
  const handleDragStart = useCallback((nodeId: string, position: { x: number; y: number }) => {
    actions.startDrag(nodeId, position);
  }, [actions]);

  // 处理拖拽移动
  const handleDragMove = useCallback((position: { x: number; y: number }) => {
    actions.updateDrag(position);
  }, [actions]);

  // 处理拖拽结束
  const handleDragEnd = useCallback(() => {
    actions.endDrag();
  }, [actions]);

  // 处理画布点击（取消选择）
  const handleStageClick = useCallback((e: any) => {
    // 如果点击的是空白区域，取消选择
    if (e.target === e.target.getStage()) {
      actions.selectNode(null);
      onNodeSelect?.(null);
    }
  }, [actions, onNodeSelect]);

  // 处理滚轮缩放
  const handleWheel = useCallback((e: any) => {
    e.evt.preventDefault();
    
    const scaleBy = 1.1;
    const stage = e.target.getStage();
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    
    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };
    
    const newScale = e.evt.deltaY > 0 ? oldScale * scaleBy : oldScale / scaleBy;
    const clampedScale = Math.max(0.1, Math.min(3, newScale));
    
    const newPos = {
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
    };
    
    actions.setViewport({
      x: newPos.x,
      y: newPos.y,
      scale: clampedScale
    });
  }, [actions]);

  // 创建节点映射
  const nodeMap = new Map<string, MindNode>();
  tree.nodes.forEach(node => nodeMap.set(node.id, node));

  return (
    <Stage
      ref={stageRef}
      width={width}
      height={height}
      x={viewport.x}
      y={viewport.y}
      scaleX={viewport.scale}
      scaleY={viewport.scale}
      onClick={handleStageClick}
      onWheel={handleWheel}
      draggable
      onDragEnd={(e) => {
        actions.setViewport({
          x: e.target.x(),
          y: e.target.y()
        });
      }}
    >
      <Layer>
        {/* 渲染连接线 */}
        {layoutData.connections.map((connection, index) => (
          <ConnectionComponent
            key={`connection-${index}`}
            connection={connection}
          />
        ))}
        
        {/* 渲染节点 */}
        {layoutData.nodes.map((layoutNode) => {
          const node = nodeMap.get(layoutNode.id);
          if (!node) return null;
          
          return (
            <NodeComponent
              key={node.id}
              node={node}
              layoutNode={layoutNode}
              isSelected={selectionState.selectedNodeId === node.id}
              isHovered={selectionState.hoveredNodeId === node.id}
              onSelect={() => handleNodeSelect(node)}
              onHover={(hover) => handleNodeHover(node.id, hover)}
              onDoubleClick={() => handleNodeDoubleClick(node)}
              onDragStart={(pos) => handleDragStart(node.id, pos)}
              onDragMove={handleDragMove}
              onDragEnd={handleDragEnd}
            />
          );
        })}
      </Layer>
    </Stage>
  );
}; 