import React, { useState, useEffect } from 'react';
import { MindMapCanvas } from './features/mindmap/components/MindMapCanvas';
import { NodeDetailPanel } from './features/mindmap/components/NodeDetailPanel';
import { useMindMapStore } from './features/mindmap/store/mindmap.store';
import { MarkdownParser, MarkdownExporter, sampleDataGenerator } from './features/mindmap/utils/markdown.utils';
import type { MindNode } from './features/mindmap/types/mindmap.types';
import './App.css';

const App: React.FC = () => {
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [markdownInput, setMarkdownInput] = useState('');
  const [selectedNode, setSelectedNode] = useState<MindNode | null>(null);
  
  const { tree, actions } = useMindMapStore();
  const parser = new MarkdownParser();
  const exporter = new MarkdownExporter();

  // 监听窗口大小变化
  useEffect(() => {
    const updateCanvasSize = () => {
      const container = document.querySelector('.canvas-container');
      if (container) {
        const rect = container.getBoundingClientRect();
        setCanvasSize({
          width: rect.width,
          height: rect.height
        });
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  // 加载示例数据
  const loadSampleData = (type: 'project' | 'learning') => {
    const sampleData = type === 'project' 
      ? sampleDataGenerator.generateProjectSample()
      : sampleDataGenerator.generateLearningSample();
    
    actions.loadTree(sampleData);
    
    // 更新Markdown输入框
    const markdown = exporter.exportToMarkdown(sampleData);
    setMarkdownInput(markdown);
  };

  // 从Markdown加载数据
  const loadFromMarkdown = () => {
    if (!markdownInput.trim()) return;
    
    const treeData = parser.parseMarkdown(markdownInput);
    actions.loadTree(treeData);
  };

  // 导出为Markdown
  const exportToMarkdown = () => {
    const markdown = exporter.exportToMarkdown(tree, {
      format: 'markdown',
      includeMetadata: true,
      includePosition: false
    });
    setMarkdownInput(markdown);
  };

  // 清空数据
  const clearData = () => {
    if (confirm('确定要清空所有数据吗？')) {
      actions.clearTree();
      setMarkdownInput('');
      setSelectedNode(null);
    }
  };

  // 处理节点选择
  const handleNodeSelect = (node: MindNode | null) => {
    setSelectedNode(node);
  };

  // 处理节点双击
  const handleNodeDoubleClick = (node: MindNode) => {
    console.log('双击节点:', node.title);
  };

  return (
    <div className="app">
      {/* 顶部工具栏 */}
      <header className="app-header">
        <div className="header-left">
          <h1>MindMap Modern</h1>
          <span className="version">v3.0</span>
        </div>
        
        <div className="header-center">
          <div className="toolbar">
            <button 
              className="btn btn-primary"
              onClick={() => loadSampleData('project')}
              title="加载项目管理示例"
            >
              📋 项目示例
            </button>
            <button 
              className="btn btn-primary"
              onClick={() => loadSampleData('learning')}
              title="加载学习计划示例"
            >
              📚 学习示例
            </button>
            <button 
              className="btn btn-success"
              onClick={loadFromMarkdown}
              title="从Markdown加载数据"
            >
              📥 加载MD
            </button>
            <button 
              className="btn btn-info"
              onClick={exportToMarkdown}
              title="导出为Markdown"
            >
              📤 导出MD
            </button>
            <button 
              className="btn btn-warning"
              onClick={clearData}
              title="清空所有数据"
            >
              🗑️ 清空
            </button>
          </div>
        </div>
        
        <div className="header-right">
          <div className="stats">
            <span>节点: {tree.nodes.length}</span>
            {selectedNode && <span>已选择: {selectedNode.title}</span>}
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="app-main">
        {/* 左侧Markdown编辑器 */}
        <aside className="sidebar-left">
          <div className="markdown-editor">
            <div className="editor-header">
              <h3>Markdown编辑器</h3>
              <div className="editor-actions">
                <button 
                  className="btn btn-sm btn-primary"
                  onClick={loadFromMarkdown}
                  title="应用更改"
                >
                  应用
                </button>
              </div>
            </div>
            <textarea
              className="markdown-input"
              value={markdownInput}
              onChange={(e) => setMarkdownInput(e.target.value)}
              placeholder="在此输入Markdown格式的脑图数据..."
            />
          </div>
        </aside>

        {/* 中间脑图画布 */}
        <section className="main-content">
          <div className="canvas-container">
            {tree.nodes.length > 0 ? (
              <MindMapCanvas
                width={canvasSize.width}
                height={canvasSize.height}
                onNodeSelect={handleNodeSelect}
                onNodeDoubleClick={handleNodeDoubleClick}
              />
            ) : (
              <div className="empty-canvas">
                <div className="empty-state">
                  <h3>欢迎使用 MindMap Modern</h3>
                  <p>选择一个示例开始，或在左侧编辑器中输入Markdown数据</p>
                  <div className="quick-actions">
                    <button 
                      className="btn btn-primary btn-lg"
                      onClick={() => loadSampleData('project')}
                    >
                      📋 项目管理示例
                    </button>
                    <button 
                      className="btn btn-primary btn-lg"
                      onClick={() => loadSampleData('learning')}
                    >
                      📚 学习计划示例
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 右侧详情面板 */}
        <aside className="sidebar-right">
          <NodeDetailPanel />
        </aside>
      </main>

      {/* 底部状态栏 */}
      <footer className="app-footer">
        <div className="footer-left">
          <span>React + TypeScript + Konva + Zustand</span>
        </div>
        <div className="footer-center">
          {tree.rootId && (
            <span>根节点: {tree.nodes.find(n => n.id === tree.rootId)?.title}</span>
          )}
        </div>
        <div className="footer-right">
          <span>现代化脑图应用</span>
        </div>
      </footer>
    </div>
  );
};

export default App; 