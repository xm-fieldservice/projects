/**
 * @file project_info_ui.js
 * @description 项目信息UI组件，负责显示和编辑项目的基本信息
 * 
 * 职责:
 * - 显示和更新项目信息
 * - 处理项目信息相关的UI交互
 */

import state from '../../services/state.js';
import { showMessage } from '../../utils/utils.js';
import projectService from '../../services/project_service.js';

/**
 * 渲染项目信息面板
 * @param {string} containerId - 容器ID
 */
export function renderProjectInfo(containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error('[ProjectInfoUI] 找不到容器:', containerId);
        return;
    }

    const projectInfo = state.state.projectInfo;
    
    container.innerHTML = `
        <div class="project-info-panel">
            <!-- 项目基本信息 -->
            <div class="info-section">
                <h3>📋 项目基本信息</h3>
                <div class="form-row">
                    <label for="project-name-input">项目名称:</label>
                    <input type="text" id="project-name-input" 
                           value="${projectInfo.name || ''}" 
                           placeholder="请输入项目名称"
                           class="form-input">
                </div>
                <div class="form-row">
                    <label for="project-author-input">项目负责人:</label>
                    <input type="text" id="project-author-input" 
                           value="${projectInfo.author || ''}" 
                           placeholder="请输入负责人姓名"
                           class="form-input">
                </div>
                <div class="form-row">
                    <label for="project-version-input">项目版本:</label>
                    <input type="text" id="project-version-input" 
                           value="${projectInfo.version || '1.0.0'}" 
                           placeholder="例如: 1.0.0"
                           class="form-input">
                </div>
                <div class="form-row">
                    <label for="project-description-input">项目描述:</label>
                    <textarea id="project-description-input" 
                              placeholder="请输入项目描述" 
                              class="form-textarea" 
                              rows="3">${projectInfo.description || ''}</textarea>
                </div>
                <div class="form-actions">
                    <button onclick="NodeMind.projectInfo.saveProjectInfo()" class="btn btn-primary">
                        💾 保存项目信息
                    </button>
                    <button onclick="NodeMind.projectInfo.resetProjectInfo()" class="btn btn-secondary">
                        🔄 重置
                    </button>
                </div>
            </div>

            <!-- 项目文档管理 -->
            <div class="info-section">
                <h3>📄 项目文档管理</h3>
                <div class="document-status">
                    <div class="status-row">
                        <span class="status-label">文档文件名:</span>
                        <span class="status-value">${projectInfo.documentFileName || '未设置'}</span>
                    </div>
                    <div class="status-row">
                        <span class="status-label">最后更新:</span>
                        <span class="status-value">${projectInfo.modified || '未更新'}</span>
                    </div>
                    <div class="status-row">
                        <span class="status-label">节点总数:</span>
                        <span class="status-value">${Object.keys(state.state.nodeDatabase || {}).length}个</span>
                    </div>
                </div>
                <div class="document-actions">
                    <button onclick="NodeMind.projectInfo.generateProjectDocument()" class="btn btn-primary">
                        📖 生成项目文档
                    </button>
                    <button onclick="NodeMind.projectInfo.previewProjectDocument()" class="btn btn-info">
                        👁️ 预览文档内容
                    </button>
                    <button onclick="NodeMind.projectInfo.downloadProjectDocument()" class="btn btn-success">
                        📥 下载项目文档
                    </button>
                </div>
                <div class="document-info">
                    <p><small>💡 项目文档会自动包含所有节点的MD格式内容，包括标签、状态、优先级等信息。</small></p>
                    <p><small>🔄 每次节点更新时，项目文档会自动重新生成。</small></p>
                </div>
            </div>

            <!-- 项目统计 -->
            <div class="info-section">
                <h3>📊 项目统计</h3>
                <div id="project-statistics">
                    <!-- 统计内容将通过JavaScript动态生成 -->
                </div>
            </div>
        </div>
    `;

    // 绑定事件
    bindProjectInfoEvents();
    
    // 生成统计信息
    generateProjectStatistics();
}

/**
 * 绑定项目信息相关事件
 */
function bindProjectInfoEvents() {
    // 输入框失焦自动保存
    const inputs = ['project-name-input', 'project-author-input', 'project-version-input', 'project-description-input'];
    inputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            input.addEventListener('blur', () => {
                autoSaveProjectInfo();
            });
        }
    });
}

/**
 * 自动保存项目信息
 */
function autoSaveProjectInfo() {
    const nameInput = document.getElementById('project-name-input');
    const authorInput = document.getElementById('project-author-input');
    const versionInput = document.getElementById('project-version-input');
    const descriptionInput = document.getElementById('project-description-input');

    if (!nameInput || !authorInput || !versionInput || !descriptionInput) return;

    const projectInfo = {
        name: nameInput.value.trim(),
        author: authorInput.value.trim(),
        version: versionInput.value.trim(),
        description: descriptionInput.value.trim(),
        modified: new Date().toLocaleString('zh-CN')
    };

    // 更新项目信息
    projectService.updateProjectInfo(projectInfo);
    
    console.log('📋 [项目信息UI] 项目信息已自动保存');
}

/**
 * 保存项目信息
 */
export function saveProjectInfo() {
    autoSaveProjectInfo();
    showMessage('✅ 项目信息已保存', 2000, 'success');
    
    // 重新渲染以显示最新状态
    setTimeout(() => {
        renderProjectInfo('project-info-content');
    }, 100);
}

/**
 * 重置项目信息
 */
export function resetProjectInfo() {
    const nameInput = document.getElementById('project-name-input');
    const authorInput = document.getElementById('project-author-input');
    const versionInput = document.getElementById('project-version-input');
    const descriptionInput = document.getElementById('project-description-input');

    if (nameInput) nameInput.value = state.state.projectInfo.name || '';
    if (authorInput) authorInput.value = state.state.projectInfo.author || '';
    if (versionInput) versionInput.value = state.state.projectInfo.version || '1.0.0';
    if (descriptionInput) descriptionInput.value = state.state.projectInfo.description || '';

    showMessage('🔄 项目信息已重置', 2000, 'info');
}

/**
 * 生成项目文档
 */
export function generateProjectDocument() {
    try {
        const content = projectService.generateProjectDocument();
        if (content) {
            showMessage('📖 项目文档已生成并下载', 3000, 'success');
            
            // 重新渲染以显示最新状态
            setTimeout(() => {
                renderProjectInfo('project-info-content');
            }, 100);
        } else {
            showMessage('⚠️ 请先设置项目名称', 3000, 'warning');
        }
    } catch (error) {
        console.error('❌ [项目信息UI] 生成项目文档失败:', error);
        showMessage('❌ 生成项目文档失败: ' + error.message, 3000, 'error');
    }
}

/**
 * 预览项目文档内容
 */
export function previewProjectDocument() {
    try {
        const content = projectService.generateProjectDocument();
        if (!content) {
            showMessage('⚠️ 请先设置项目名称', 3000, 'warning');
            return;
        }

        // 创建预览窗口
        const previewWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes');
        
        if (previewWindow) {
            previewWindow.document.write(`
                <!DOCTYPE html>
                <html lang="zh-CN">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>项目文档预览 - ${state.state.projectInfo.name}</title>
                    <style>
                        body { font-family: 'Microsoft YaHei', Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
                        h1, h2, h3 { color: #333; }
                        h1 { border-bottom: 2px solid #007acc; }
                        h2 { border-bottom: 1px solid #ddd; }
                        code { background: #f5f5f5; padding: 2px 4px; border-radius: 3px; }
                        pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
                        blockquote { border-left: 4px solid #007acc; margin: 0; padding: 0 20px; background: #f9f9f9; }
                        table { border-collapse: collapse; width: 100%; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background-color: #f2f2f2; }
                        .status-icon { font-size: 1.2em; }
                        hr { border: none; border-top: 1px solid #ddd; margin: 20px 0; }
                    </style>
                </head>
                <body>
                    <div id="preview-content"></div>
                    <script>
                        // 简单的 Markdown 转 HTML 渲染
                        function convertMarkdownToHtml(markdown) {
                            let html = markdown;
                            
                            // 标题
                            html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
                            html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
                            html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
                            
                            // 粗体
                            html = html.replace(/\\*\\*(.*?)\\*\\*/g, '<strong>$1</strong>');
                            
                            // 斜体
                            html = html.replace(/\\*(.*?)\\*/g, '<em>$1</em>');
                            
                            // 分隔线
                            html = html.replace(/^---$/gim, '<hr>');
                            
                            // 引用
                            html = html.replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>');
                            
                            // 列表项
                            html = html.replace(/^[\\*\\-] (.*$)/gim, '<li>$1</li>');
                            html = html.replace(/(<li>.*<\\/li>)/s, '<ul>$1</ul>');
                            
                            // 链接
                            html = html.replace(/\\[([^\\]]+)\\]\\(([^\\)]+)\\)/g, '<a href="$2">$1</a>');
                            
                            // 换行
                            html = html.replace(/\\n/g, '<br>');
                            
                            return html;
                        }
                        
                        const content = \`${content.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`;
                        document.getElementById('preview-content').innerHTML = convertMarkdownToHtml(content);
                    </script>
                </body>
                </html>
            `);
            previewWindow.document.close();
        } else {
            // 如果无法打开新窗口，显示在弹窗中
            alert('项目文档内容：\n\n' + content.substring(0, 1000) + '\n\n...(内容过长，已截断)');
        }
    } catch (error) {
        console.error('❌ [项目信息UI] 预览项目文档失败:', error);
        showMessage('❌ 预览项目文档失败: ' + error.message, 3000, 'error');
    }
}

/**
 * 下载项目文档
 */
export function downloadProjectDocument() {
    try {
        const content = projectService.generateProjectDocument();
        if (!content) {
            showMessage('⚠️ 请先设置项目名称', 3000, 'warning');
            return;
        }

        // 创建下载链接
        const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = state.state.projectInfo.documentFileName || 'project.md';
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showMessage('📥 项目文档下载完成', 3000, 'success');
    } catch (error) {
        console.error('❌ [项目信息UI] 下载项目文档失败:', error);
        showMessage('❌ 下载项目文档失败: ' + error.message, 3000, 'error');
    }
}

/**
 * 生成项目统计信息
 */
function generateProjectStatistics() {
    const statisticsContainer = document.getElementById('project-statistics');
    if (!statisticsContainer) return;

    const nodeDatabase = state.state.nodeDatabase || {};
    const nodeEntries = Object.entries(nodeDatabase);
    
    if (nodeEntries.length === 0) {
        statisticsContainer.innerHTML = '<p><em>暂无节点数据</em></p>';
        return;
    }

    // 统计各种信息
    const statusStats = {};
    const priorityStats = {};
    const tagStats = {};
    let totalTags = 0;

    nodeEntries.forEach(([nodeId, nodeData]) => {
        // 状态统计
        const status = nodeData.status || '未设置';
        statusStats[status] = (statusStats[status] || 0) + 1;
        
        // 优先级统计
        const priority = nodeData.priority || '未设置';
        priorityStats[priority] = (priorityStats[priority] || 0) + 1;
        
        // 标签统计
        if (nodeData.tags) {
            Object.values(nodeData.tags).flat().forEach(tag => {
                if (tag) {
                    tagStats[tag] = (tagStats[tag] || 0) + 1;
                    totalTags++;
                }
            });
        }
    });

    let statisticsHTML = `
        <div class="statistics-grid">
            <div class="stat-card">
                <h4>📊 节点状态分布</h4>
                <ul class="stat-list">
    `;

    Object.entries(statusStats).forEach(([status, count]) => {
        const percentage = ((count / nodeEntries.length) * 100).toFixed(1);
        statisticsHTML += `<li>${status}: ${count}个 (${percentage}%)</li>`;
    });

    statisticsHTML += `
                </ul>
            </div>
            <div class="stat-card">
                <h4>🔥 优先级分布</h4>
                <ul class="stat-list">
    `;

    Object.entries(priorityStats).forEach(([priority, count]) => {
        const percentage = ((count / nodeEntries.length) * 100).toFixed(1);
        statisticsHTML += `<li>${priority}: ${count}个 (${percentage}%)</li>`;
    });

    statisticsHTML += `
                </ul>
            </div>
            <div class="stat-card">
                <h4>🏷️ 热门标签 (Top 5)</h4>
                <ul class="stat-list">
    `;

    Object.entries(tagStats)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .forEach(([tag, count]) => {
            const percentage = ((count / totalTags) * 100).toFixed(1);
            statisticsHTML += `<li>#${tag}: ${count}次 (${percentage}%)</li>`;
        });

    statisticsHTML += `
                </ul>
            </div>
        </div>
        <div class="summary-stats">
            <p><strong>📈 项目概览:</strong> 共 ${nodeEntries.length} 个节点，${totalTags} 个标签，${Object.keys(statusStats).length} 种状态</p>
        </div>
    `;

    statisticsContainer.innerHTML = statisticsHTML;
}

// 暴露函数到全局对象
window.NodeMind = window.NodeMind || {};
window.NodeMind.projectInfo = {
    saveProjectInfo,
    resetProjectInfo,
    generateProjectDocument,
    previewProjectDocument,
    downloadProjectDocument
}; 