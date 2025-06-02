import React, { useState, useEffect } from 'react';
import { useMindMapStore } from '../store/mindmap.store';
import type { MindNode } from '../types/mindmap.types';

interface NodeDetailPanelProps {
  className?: string;
}

export const NodeDetailPanel: React.FC<NodeDetailPanelProps> = ({ className = '' }) => {
  const { tree, selectionState, actions } = useMindMapStore();
  const [editingNode, setEditingNode] = useState<MindNode | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    status: '' as MindNode['tags']['status'],
    priority: '' as MindNode['tags']['priority'],
    category: ''
  });

  // 获取选中的节点
  const selectedNode = selectionState.selectedNodeId 
    ? tree.nodes.find(n => n.id === selectionState.selectedNodeId) 
    : null;

  // 当选中节点变化时更新表单数据
  useEffect(() => {
    if (selectedNode) {
      setEditingNode(selectedNode);
      setFormData({
        title: selectedNode.title,
        content: selectedNode.content,
        status: selectedNode.tags.status || '',
        priority: selectedNode.tags.priority || '',
        category: selectedNode.tags.category || ''
      });
    } else {
      setEditingNode(null);
      setFormData({
        title: '',
        content: '',
        status: '',
        priority: '',
        category: ''
      });
    }
  }, [selectedNode]);

  // 处理表单字段变化
  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // 保存节点更改
  const handleSave = () => {
    if (!editingNode) return;

    const updates = {
      title: formData.title,
      content: formData.content,
      tags: {
        status: formData.status || undefined,
        priority: formData.priority || undefined,
        category: formData.category || undefined
      }
    };

    actions.updateNode(editingNode.id, updates);
  };

  // 添加子节点
  const handleAddChild = () => {
    if (!editingNode) return;

    const childId = actions.addNode({
      title: '新节点',
      parentId: editingNode.id
    });

    // 选中新创建的节点
    actions.selectNode(childId);
  };

  // 删除节点
  const handleDelete = () => {
    if (!editingNode) return;
    
    if (confirm(`确定要删除节点"${editingNode.title}"及其所有子节点吗？`)) {
      actions.deleteNode(editingNode.id);
      actions.selectNode(null);
    }
  };

  // 如果没有选中节点，显示提示
  if (!selectedNode) {
    return (
      <div className={`node-detail-panel ${className}`}>
        <div className="panel-header">
          <h3>节点详情</h3>
        </div>
        <div className="panel-content">
          <div className="empty-state">
            <p>请选择一个节点查看详情</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`node-detail-panel ${className}`}>
      <div className="panel-header">
        <h3>节点详情</h3>
        <div className="header-actions">
          <button 
            className="btn btn-primary btn-sm"
            onClick={handleSave}
            title="保存更改"
          >
            保存
          </button>
          <button 
            className="btn btn-success btn-sm"
            onClick={handleAddChild}
            title="添加子节点"
          >
            + 子节点
          </button>
          <button 
            className="btn btn-danger btn-sm"
            onClick={handleDelete}
            title="删除节点"
          >
            删除
          </button>
        </div>
      </div>

      <div className="panel-content">
        {/* 基本信息 */}
        <div className="form-section">
          <h4>基本信息</h4>
          
          <div className="form-group">
            <label htmlFor="node-title">标题</label>
            <input
              id="node-title"
              type="text"
              className="form-control"
              value={formData.title}
              onChange={(e) => handleFieldChange('title', e.target.value)}
              placeholder="输入节点标题"
            />
          </div>

          <div className="form-group">
            <label htmlFor="node-content">内容</label>
            <textarea
              id="node-content"
              className="form-control"
              rows={4}
              value={formData.content}
              onChange={(e) => handleFieldChange('content', e.target.value)}
              placeholder="输入节点详细内容"
            />
          </div>
        </div>

        {/* 标签设置 */}
        <div className="form-section">
          <h4>标签设置</h4>
          
          <div className="form-group">
            <label htmlFor="node-status">状态</label>
            <select
              id="node-status"
              className="form-control"
              value={formData.status}
              onChange={(e) => handleFieldChange('status', e.target.value)}
            >
              <option value="">请选择状态</option>
              <option value="未开始">未开始</option>
              <option value="进行中">进行中</option>
              <option value="已完成">已完成</option>
              <option value="暂停">暂停</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="node-priority">优先级</label>
            <select
              id="node-priority"
              className="form-control"
              value={formData.priority}
              onChange={(e) => handleFieldChange('priority', e.target.value)}
            >
              <option value="">请选择优先级</option>
              <option value="低">低</option>
              <option value="中">中</option>
              <option value="高">高</option>
              <option value="紧急">紧急</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="node-category">分类</label>
            <input
              id="node-category"
              type="text"
              className="form-control"
              value={formData.category}
              onChange={(e) => handleFieldChange('category', e.target.value)}
              placeholder="输入分类标签"
            />
          </div>
        </div>

        {/* 节点信息 */}
        <div className="form-section">
          <h4>节点信息</h4>
          
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">节点ID:</span>
              <span className="info-value">{selectedNode.id}</span>
            </div>
            
            <div className="info-item">
              <span className="info-label">子节点数:</span>
              <span className="info-value">{selectedNode.children.length}</span>
            </div>
            
            {selectedNode.metadata && (
              <>
                <div className="info-item">
                  <span className="info-label">创建时间:</span>
                  <span className="info-value">
                    {new Date(selectedNode.metadata.createdAt).toLocaleString()}
                  </span>
                </div>
                
                <div className="info-item">
                  <span className="info-label">更新时间:</span>
                  <span className="info-value">
                    {new Date(selectedNode.metadata.updatedAt).toLocaleString()}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* 子节点列表 */}
        {selectedNode.children.length > 0 && (
          <div className="form-section">
            <h4>子节点</h4>
            <div className="children-list">
              {selectedNode.children.map(childId => {
                const childNode = tree.nodes.find(n => n.id === childId);
                if (!childNode) return null;
                
                return (
                  <div 
                    key={childId} 
                    className="child-item"
                    onClick={() => actions.selectNode(childId)}
                  >
                    <span className="child-title">{childNode.title}</span>
                    {childNode.tags.status && (
                      <span className={`status-badge status-${childNode.tags.status}`}>
                        {childNode.tags.status}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 