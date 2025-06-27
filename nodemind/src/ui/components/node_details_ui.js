import state from '../../services/state.js';
import { showMessage, getNodePath } from '../../utils/utils.js';
import { getCurrentJsMind } from '../../services/mindmap_service.js';
import storageService from '../../services/storage_service.js';
import tagService from '../../services/tag_service.js';
import projectService from '../../services/project_service.js';

/**
 * @file node_details_ui.js
 * @description 节点详情UI组件，负责显示和编辑节点的详细信息
 */

/**
 * 显示节点详细信息 - 迁移自index.html的完整实现
 */
export function showNodeDetails(node) {
    if (!node) {
        console.log('❌ [NodeDetailsUI] showNodeDetails: 节点为空');
        return;
    }
    
    console.log(`📝 [NodeDetailsUI] 显示节点详情: ${node.topic} (${node.id})`);
    
    // 🔧 关键修复：在重新生成HTML之前，保存当前编辑器的内容
    const currentEditor = document.querySelector('[id^="node-content-"]');
    if (currentEditor) {
        const currentNodeId = currentEditor.id.replace('node-content-', '');
        const currentContent = currentEditor.value;
        
        console.log(`💾 [NodeDetailsUI] 保存当前编辑器内容: ${currentNodeId} -> "${currentContent}"`);
        
        // 确保当前节点数据存在
        if (!window.nodeDatabase[currentNodeId]) {
            window.nodeDatabase[currentNodeId] = {
                id: currentNodeId,
                title: '未命名节点',
                content: '',
                author: window.projectInfo.author || 'NodeMind',
                created: new Date().toISOString(),
                modified: new Date().toISOString()
            };
        }
        
        // 保存当前内容到数据库
        window.nodeDatabase[currentNodeId].content = currentContent;
        window.nodeDatabase[currentNodeId].modified = new Date().toISOString();
        
        console.log(`✅ [NodeDetailsUI] 已保存当前节点内容到数据库`);
    }
    
    // 获取纯净的标题（移除内容图标）
    const cleanTitle = node.topic.replace(' 📄', '');
    
    // 获取或创建节点数据
    if (!window.nodeDatabase[node.id]) {
        window.nodeDatabase[node.id] = {
            id: node.id,
            title: cleanTitle,
            content: '',
            author: window.projectInfo.author || 'NodeMind',
            created: new Date().toISOString(),
            modified: new Date().toISOString()
        };
        console.log(`📂 [NodeDetailsUI] 创建新节点数据: ${node.id}`);
    } else {
        // 确保标题同步
        window.nodeDatabase[node.id].title = cleanTitle;
        console.log(`🔄 [NodeDetailsUI] 更新节点数据: ${node.id}`);
    }
    
    const nodeData = window.nodeDatabase[node.id];
    
    // 重要：先确保其他标签页的内容不被污染
    clearOtherTabContents();
    
    // 更新详细描述标签页内容（确保只更新正确的标签页）
    const detailInfoContent = document.getElementById('detail-info-content');
    if (!detailInfoContent) {
        console.log('❌ [NodeDetailsUI] 找不到detail-info-content元素');
        return;
    }
    
    console.log('✅ [NodeDetailsUI] 开始更新详情面板内容...');
    
    // 确保节点数据有标签结构
    if (!nodeData.tags) {
        nodeData.tags = { categories: [], technical: [], status: [] };
    }
    
    // 初始化全局组件容器（只在第一次创建）
    initializeGlobalComponents();
    
    // 更新节点相关的内容（每次节点切换都更新）
    updateNodeSpecificContent(node, nodeData);
    
    // 初始化标签管理功能（临时调用全局函数）
    if (typeof window.initializeTagManagement === 'function') {
        window.initializeTagManagement(node.id);
    }
    
    // 初始化分割线拖拽功能（临时调用全局函数）
    if (typeof window.initializeDetailSplitter === 'function') {
        window.initializeDetailSplitter(node.id);
    }
    
    // 初始化右侧面板分割线拖拽功能（临时调用全局函数）
    if (typeof window.initializeSidePanelSplitter === 'function') {
        window.initializeSidePanelSplitter(node.id);
    }
    
    // 更新项目信息页面的节点作者信息（临时调用全局函数）
    if (typeof window.updateProjectInfoNodeAuthor === 'function') {
        window.updateProjectInfoNodeAuthor(nodeData.author || '');
    }
    
    console.log('✅ [NodeDetailsUI] 详情面板内容已更新');
    
    // 自动切换到详细描述标签页
    switchToDetailTab();
    
    // 绑定输入事件监听器（临时调用全局函数）
    if (typeof window.bindDetailInputEvents === 'function') {
        window.bindDetailInputEvents(node.id);
    }
    
    // 初始化会话列表（临时调用全局函数）
    if (typeof window.renderSessionList === 'function') {
        window.renderSessionList(node.id);
    }
    
    // 初始化完整内容显示（临时调用全局函数）
    if (typeof window.updateNodeFullContent === 'function') {
        window.updateNodeFullContent(node.id);
    }
    
    // 🔧 关键修复：恢复模板选择状态（更新全局模板容器）
    if (typeof window.templateSelectionService === 'object' && window.templateSelectionService.initialized) {
        console.log('🔄 [NodeDetailsUI] 恢复模板选择状态（面板模式）');
        
        // 延迟执行，确保DOM已更新
        setTimeout(() => {
            window.templateSelectionService.updateNodePanelDisplay();
            console.log('✅ [NodeDetailsUI] 模板选择状态已恢复到面板');
        }, 10);
    } else {
        console.log('⚠️ [NodeDetailsUI] templateSelectionService 不可用或未初始化');
    }
}

/**
 * 初始化全局组件（只在第一次创建，不随节点切换重新创建）
 */
function initializeGlobalComponents() {
    const detailInfoContent = document.getElementById('detail-info-content');
    if (!detailInfoContent) return;
    
    // 检查是否已经初始化过全局组件
    if (detailInfoContent.querySelector('.detail-workspace')) {
        console.log('📋 [NodeDetailsUI] 全局组件已存在，跳过创建');
        return;
    }
    
    console.log('🏗️ [NodeDetailsUI] 初始化全局组件容器');
    
    // 创建完整的布局结构（包含全局组件）
    detailInfoContent.innerHTML = `
        <div class="detail-workspace">
            <!-- 左侧主工作区 -->
            <div class="detail-main-area">
                <!-- 标题区域（动态更新） -->
                <div class="title-section" id="title-section">
                    <!-- 内容将由 updateNodeSpecificContent 更新 -->
                </div>
                
                <!-- 节点元信息（动态更新） -->
                <div class="node-meta-section" id="node-meta-section">
                    <!-- 内容将由 updateNodeSpecificContent 更新 -->
                </div>
                
                <!-- 内容编辑区域（动态更新） -->
                <div class="content-editor-section" id="content-editor-section">
                    <!-- 内容将由 updateNodeSpecificContent 更新 -->
                </div>
                
                <!-- 标签管理区域（全局组件，不变） -->
                <div class="tags-section" id="global-tags-section">
                    <div class="tags-header">
                        <span class="tags-label">标签组件（按分类显示）</span>
                        <div class="tag-groups-container" id="global-tag-groups-container">
                            <!-- 全局标签组件，不随节点切换重新创建 -->
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- 分割线 -->
            <div class="detail-splitter" id="global-detail-splitter"></div>
            
            <!-- 右侧辅助面板 -->
            <div class="detail-side-panel">
                <!-- 会话列表（动态更新） -->
                <div class="session-list-section" id="session-list-section">
                    <!-- 内容将由 updateNodeSpecificContent 更新 -->
                </div>
                
                <!-- 右侧面板内部分割线 -->
                <div class="side-panel-splitter" id="global-side-panel-splitter"></div>
                
                <!-- 提示词模板（全局组件，不变） -->
                <div class="template-section" id="global-template-section">
                    <div class="section-header">
                        <h4>提示词模板</h4>
                        <button class="template-manager-btn" onclick="openTemplateManager()" title="打开模板管理器">⚙️</button>
                    </div>
                    
                    <!-- 选中的模板列表（全局状态，不随节点切换清空） -->
                    <div class="selected-templates-list" id="global-selected-templates-list">
                        <div class="empty-template-state">
                            <div class="empty-icon">📝</div>
                            <div class="empty-text">暂无选中模板</div>
                            <div class="empty-hint">在模板管理器中选择模板后将在此显示</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    console.log('✅ [NodeDetailsUI] 全局组件容器已创建');
}

/**
 * 更新节点特定的内容（每次节点切换都更新）
 */
function updateNodeSpecificContent(node, nodeData) {
    console.log(`🔄 [NodeDetailsUI] 更新节点特定内容: ${node.id}`);
    
    // 更新标题区域
    const titleSection = document.getElementById('title-section');
    if (titleSection) {
        titleSection.innerHTML = `
            <input type="text" id="node-title-${node.id}" class="title-input" 
                   value="${nodeData.title || ''}" placeholder="标题">
        `;
    }
    
    // 更新节点元信息
    const metaSection = document.getElementById('node-meta-section');
    if (metaSection) {
        metaSection.innerHTML = `
            <div class="meta-row">
                <span class="meta-time">创建: ${formatDateTime(nodeData.created)}</span>
            </div>
        `;
    }
    
    // 更新内容编辑区域
    const editorSection = document.getElementById('content-editor-section');
    if (editorSection) {
        editorSection.innerHTML = `
            <div class="content-header">
                <div class="qa-switch-container">
                    <label class="qa-switch">
                        <input type="checkbox" id="qa-mode-${node.id}">
                        <span class="qa-slider"></span>
                        <span class="qa-label">问答模式</span>
                    </label>
                </div>
                <div class="content-controls">
                    <!-- 拷贝粘贴按钮 -->
                    <button class="btn-copy" onclick="copyContentFromEditor('${node.id}')">📋 拷贝</button>
                    <button class="btn-paste" onclick="pasteContentToEditor('${node.id}')">📋 粘贴</button>
                    <button class="btn-submit" onclick="submitContent('${node.id}')">提交</button>
                </div>
            </div>
            <textarea id="node-content-${node.id}" class="content-editor expanded" 
                      data-node-id="${node.id}"
                      placeholder="在此输入详细内容...">${nodeData.content || ''}</textarea>
        `;
    }
    
    // 更新会话列表
    const sessionSection = document.getElementById('session-list-section');
    if (sessionSection) {
        sessionSection.innerHTML = `
            <div class="section-header">
                <h4>会话列表</h4>
                <div style="display: flex; gap: 8px;">
                    <button class="view-mode-btn" id="view-all-btn-${node.id}" onclick="viewAllSessions('${node.id}')" title="查看所有会话内容">📖 查看全部</button>
                    <button class="view-mode-btn" onclick="clearAllSessions('${node.id}')" title="清空所有会话" style="background: #dc3545; color: white;">🗑️ 清空</button>
                </div>
            </div>
            <div class="session-list" id="session-list-${node.id}">
                <div class="session-item new-session-btn" onclick="addNewSession('${node.id}')">
                    <span class="new-session-icon">➕</span>
                    <span class="new-session-text">新增会话</span>
                </div>
            </div>
        `;
    }
    
    console.log('✅ [NodeDetailsUI] 节点特定内容已更新');
}

/**
 * 清理其他标签页的内容，防止内容混淆
 */
function clearOtherTabContents() {
    console.log('🧹 [NodeDetailsUI] 清理其他标签页内容...');
    
    // 清理命令注入标签页
    const injectionContent = document.getElementById('injection-info-content');
    if (injectionContent && !injectionContent.innerHTML.includes('命令注入功能面板')) {
        injectionContent.innerHTML = `
            <div class="empty-state">
                <div class="icon">💉</div>
                <div>命令注入功能面板</div>
            </div>
        `;
    }
    
    // 保持项目信息标签页不变
    // 项目信息标签页有自己的内容，不需要清理
}

/**
 * 自动切换到详细描述标签页
 */
function switchToDetailTab() {
    // 切换到detail标签页
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    const detailTabBtn = document.getElementById('detail_tab_detail');
    const detailTabContent = document.getElementById('tab-detail');
    
    if (detailTabBtn) detailTabBtn.classList.add('active');
    if (detailTabContent) detailTabContent.classList.add('active');
}

/**
 * 格式化日期时间显示
 */
function formatDateTime(dateString) {
    if (!dateString) return '未知';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        return '格式错误';
    }
}

/**
 * 清除节点详情显示
 */
export function clearNodeDetails() {
    const emptyStates = [
        { id: 'detail-info-content', icon: '📝', text: '点击思维导图中的节点编辑详细描述' },
        { id: 'history-info-content', icon: '📚', text: '点击思维导图中的节点查看历史记录' }
    ];

    emptyStates.forEach(s => {
        const element = document.getElementById(s.id);
        if (element) {
            element.innerHTML = `<div class="empty-state"><div class="icon">${s.icon}</div><div>${s.text}</div></div>`;
        }
    });

    state.currentEditingNodeId = null;
    document.getElementById('selectedNode').textContent = '无';
}


/**
 * 刷新选项卡内容
 * @param {string} tabName 
 * @param {string} nodeId 
 */
export function refreshTabContent(tabName, nodeId) {
    const node = getCurrentJsMind().get_node(nodeId);
    if (!node || !state.nodeDatabase[nodeId]) return;

    switch(tabName) {
        case 'basic':
            renderBasicInfo(nodeId);
            break;
        case 'detail':
            renderDetailInfo(nodeId);
            break;
        case 'history':
            renderHistoryInfo(nodeId);
            break;
    }
}

/**
 * 渲染基本信息选项卡
 * @param {string} nodeId 
 */
function renderBasicInfo(nodeId) {
    const container = document.getElementById('basic-info-content');
    if (!container) return;

    const jm = getCurrentJsMind();
    if (!jm) return;
    
    const node = jm.get_node(nodeId);
    if (!node) return;

    const path = getNodePath(node);
    const nodeData = state.nodeDatabase[nodeId] || {};

    container.innerHTML = `
        <div class="path-breadcrumb">${path.join(' / ')}</div>
        <div class="info-row">
            <span class="info-label">ID:</span>
            <span class="info-value">${nodeId}</span>
        </div>
        <div class="info-row">
            <span class="info-label">创建时间:</span>
            <span class="info-value">${nodeData.time?.created || 'N/A'}</span>
        </div>
        <div class="info-row">
            <span class="info-label">修改时间:</span>
            <span class="info-value">${nodeData.time?.modified || 'N/A'}</span>
        </div>
    `;
}

/**
 * 渲染详细信息选项卡
 * @param {string} nodeId 
 */
function renderDetailInfo(nodeId) {
    const container = document.getElementById('detail-info-content');
    if (!container) return;
    const nodeData = state.nodeDatabase[nodeId] || {};

    container.innerHTML = `
        <div class="node-detail-form">
            <div class="form-group">
                <label for="node-title-input" class="form-label">节点标题</label>
                <input type="text" id="node-title-input" class="form-input" value="${nodeData.title || ''}">
            </div>
            <div class="form-group" style="flex: 1; display: flex; flex-direction: column;">
                <label for="node-content-textarea" class="form-label">详细描述</label>
                <textarea id="node-content-textarea" class="form-textarea" style="flex: 1;">${nodeData.content || ''}</textarea>
            </div>
            
            <!-- 标签管理组件 -->
            <div class="tags-management-section">
                <h4 class="tags-management-title">🏷️ 标签管理</h4>
                
                <div class="tag-groups-container">
                    <!-- 常规标签组 -->
                    <div class="tag-group">
                        <div class="tag-group-title">常规</div>
                        <div class="tag-group-items">
                            <div class="tag-item tag-yellow" data-tag="项目" data-group="常规">项目</div>
                            <div class="tag-item tag-yellow" data-tag="里程碑" data-group="常规">里程碑</div>
                            <div class="tag-item tag-yellow" data-tag="完成" data-group="常规">完成</div>
                            <div class="tag-item tag-yellow" data-tag="进行中" data-group="常规">进行中</div>
                            <div class="tag-item tag-yellow" data-tag="计划" data-group="常规">计划</div>
                        </div>
                    </div>
                    
                    <!-- AI标签组 -->
                    <div class="tag-group">
                        <div class="tag-group-title">AI</div>
                        <div class="tag-group-items">
                            <div class="tag-item tag-green" data-tag="记忆" data-group="AI">记忆</div>
                            <div class="tag-item tag-green" data-tag="注意力" data-group="AI">注意力</div>
                            <div class="tag-item tag-green" data-tag="经验" data-group="AI">经验</div>
                            <div class="tag-item tag-green" data-tag="幻觉" data-group="AI">幻觉</div>
                        </div>
                    </div>
                    
                    <!-- 笔记标签组 -->
                    <div class="tag-group">
                        <div class="tag-group-title">笔记</div>
                        <div class="tag-group-items">
                            <div class="tag-item tag-blue" data-tag="跟进" data-group="笔记">跟进</div>
                            <div class="tag-item tag-blue" data-tag="议题" data-group="笔记">议题</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="form-actions">
                <button class="btn btn-sm btn-primary" onclick="window.NodeMind.nodeDetails.saveNodeDetails('${nodeId}')">保存</button>
                <button class="btn btn-sm btn-secondary" onclick="window.NodeMind.nodeDetails.resetNodeDetails('${nodeId}')">重置</button>
            </div>
        </div>
    `;
    
    document.getElementById('node-title-input').addEventListener('input', autoSaveCurrentNodeDetails);
    document.getElementById('node-content-textarea').addEventListener('input', autoSaveCurrentNodeDetails);
    
    // 初始化标签管理
    initializeTagManagement(nodeId);
}

/**
 * 渲染历史记录选项卡
 * @param {string} nodeId 
 */
function renderHistoryInfo(nodeId) {
    const container = document.getElementById('history-info-content');
    if (!container) return;
    container.innerHTML = `<div class="empty-state"><div class="icon">📚</div><div>历史记录功能待实现</div></div>`;
}

/**
 * 自动保存当前编辑节点的详细内容并同步到所有工作区
 */
export function autoSaveCurrentNodeDetails() {
    if (!state.currentEditingNodeId) return;
    saveNodeDetails(state.currentEditingNodeId, true);
}

/**
 * 保存节点详细信息并同步到所有工作区
 * @param {string} nodeId 
 */
export function saveNodeDetails(nodeId, isAuto = false) {
    if (!state.nodeDatabase[nodeId]) return;

    const titleInput = document.getElementById('node-title-input');
    const contentTextarea = document.getElementById('node-content-textarea');
    
    if (!titleInput || !contentTextarea) return;

    const newTitle = titleInput.value;
    const newContent = contentTextarea.value;

    const nodeData = state.nodeDatabase[nodeId];
    if (nodeData.title === newTitle && nodeData.content === newContent) {
        return; // No changes
    }

    nodeData.title = newTitle;
    nodeData.content = newContent;
    nodeData.time.modified = new Date().toLocaleString();

    const jm = getCurrentJsMind();
    jm.update_node(nodeId, newTitle);

    if (!isAuto) {
        showMessage('✅ 节点详情已保存');
    }
    
    // 🔧 新增：保存节点时自动更新项目文档
    projectService.onNodeDataUpdate(nodeId);
    
    storageService.autoSaveData(); // Save everything to localStorage
}

/**
 * 重置节点详细信息
 * @param {string} nodeId 
 */
export function resetNodeDetails(nodeId) {
    const activeTab = document.querySelector('.tab-content.active');
    if (activeTab) {
        const tabName = activeTab.id.replace('tab-', '');
        refreshTabContent(tabName, nodeId);
    }
    showMessage('节点详细信息已重置');
}

/**
 * 初始化标签管理功能
 * @param {string} nodeId 
 */
function initializeTagManagement(nodeId) {
    const nodeData = state.nodeDatabase[nodeId];
    if (!nodeData) return;
    
    // 确保标签数据结构存在
    if (!nodeData.tags) {
        nodeData.tags = { categories: [], technical: [], status: [] };
    }
    
    // 为所有标签添加点击事件
    const tagItems = document.querySelectorAll('.tag-item');
    tagItems.forEach(tagItem => {
        tagItem.addEventListener('click', function() {
            toggleTag(nodeId, this);
        });
    });
    
    // 恢复已选中的标签状态
    restoreTagStates(nodeId);
}

/**
 * 切换标签选择状态
 * @param {string} nodeId 
 * @param {HTMLElement} tagElement 
 */
function toggleTag(nodeId, tagElement) {
    const nodeData = state.nodeDatabase[nodeId];
    if (!nodeData) return;
    
    const tagName = tagElement.dataset.tag;
    const tagGroup = tagElement.dataset.group;
    
    // 切换选中状态
    if (tagElement.classList.contains('selected')) {
        // 取消选中
        tagElement.classList.remove('selected');
        removeTagFromNode(nodeData, tagName, tagGroup);
        showMessage(`🏷️ 已移除标签：${tagName}`);
    } else {
        // 选中
        tagElement.classList.add('selected');
        addTagToNode(nodeData, tagName, tagGroup);
        showMessage(`🏷️ 已添加标签：${tagName}`);
    }
    
    // 更新修改时间
    nodeData.time.modified = new Date().toLocaleString();
    
    // 🔧 新增：标签变更时自动更新项目文档
    projectService.onNodeDataUpdate(nodeId);
    
    // 自动保存
    storageService.autoSaveData();
}

/**
 * 将标签添加到节点
 * @param {Object} nodeData 
 * @param {string} tagName 
 * @param {string} tagGroup 
 */
function addTagToNode(nodeData, tagName, tagGroup) {
    // 根据标签组分类存储
    let targetArray;
    switch(tagGroup) {
        case '常规':
            targetArray = nodeData.tags.status;
            break;
        case 'AI':
            targetArray = nodeData.tags.technical;
            break;
        case '笔记':
            targetArray = nodeData.tags.categories;
            break;
        default:
            targetArray = nodeData.tags.categories;
    }
    
    // 避免重复添加
    if (!targetArray.includes(tagName)) {
        targetArray.push(tagName);
        
        // 特殊处理：添加"完成"标签时自动记录完成时间
        if (tagName === '完成') {
            addCompletionTimeToContent(nodeData);
        }
    }
}

/**
 * 在内容中添加完成时间记录（MD格式）
 * @param {Object} nodeData 
 */
function addCompletionTimeToContent(nodeData) {
    const currentTime = new Date().toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    }).replace(/\//g, '-');
    
    const completionRecord = `\n\n**完成时间:** ${currentTime}`;
    
    // 检查是否已存在完成时间记录
    if (!nodeData.content.includes('**完成时间:**')) {
        nodeData.content += completionRecord;
        
        // 更新DOM中的内容编辑器
        const contentTextarea = document.getElementById('node-content-textarea');
        if (contentTextarea) {
            contentTextarea.value = nodeData.content;
        }
        
        console.log(`✅ 已为节点添加完成时间记录: ${currentTime}`);
        showMessage(`✅ 已添加完成时间：${currentTime}`, 3000, 'success');
    }
}

/**
 * 从节点移除标签
 * @param {Object} nodeData 
 * @param {string} tagName 
 * @param {string} tagGroup 
 */
function removeTagFromNode(nodeData, tagName, tagGroup) {
    // 根据标签组分类移除
    let targetArray;
    switch(tagGroup) {
        case '常规':
            targetArray = nodeData.tags.status;
            break;
        case 'AI':
            targetArray = nodeData.tags.technical;
            break;
        case '笔记':
            targetArray = nodeData.tags.categories;
            break;
        default:
            targetArray = nodeData.tags.categories;
    }
    
    const index = targetArray.indexOf(tagName);
    if (index > -1) {
        targetArray.splice(index, 1);
        
        // 特殊处理：移除"完成"标签时询问是否移除完成时间记录
        if (tagName === '完成') {
            removeCompletionTimeFromContent(nodeData);
        }
    }
}

/**
 * 从内容中移除完成时间记录
 * @param {Object} nodeData 
 */
function removeCompletionTimeFromContent(nodeData) {
    // 移除完成时间记录的正则表达式
    const completionTimeRegex = /\n*\*\*完成时间:\*\*\s*\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}/g;
    
    if (nodeData.content.includes('**完成时间:**')) {
        nodeData.content = nodeData.content.replace(completionTimeRegex, '');
        
        // 更新DOM中的内容编辑器
        const contentTextarea = document.getElementById('node-content-textarea');
        if (contentTextarea) {
            contentTextarea.value = nodeData.content;
        }
        
        console.log('✅ 已移除完成时间记录');
        showMessage('🗑️ 已移除完成时间记录', 2000, 'info');
    }
}

/**
 * 恢复标签选中状态
 * @param {string} nodeId 
 */
function restoreTagStates(nodeId) {
    const nodeData = state.nodeDatabase[nodeId];
    if (!nodeData || !nodeData.tags) return;
    
    // 获取所有已选中的标签
    const allSelectedTags = [
        ...nodeData.tags.status,
        ...nodeData.tags.technical,
        ...nodeData.tags.categories
    ];
    
    // 恢复UI中的选中状态
    const tagItems = document.querySelectorAll('.tag-item');
    tagItems.forEach(tagItem => {
        const tagName = tagItem.dataset.tag;
        if (allSelectedTags.includes(tagName)) {
            tagItem.classList.add('selected');
        }

    });
}

/**
 * 获取节点的所有标签
 * @param {string} nodeId 
 * @returns {Array} 所有标签的数组
 */
export function getNodeTags(nodeId) {
    const nodeData = state.nodeDatabase[nodeId];
    if (!nodeData || !nodeData.tags) return [];
    
    return [
        ...nodeData.tags.status,
        ...nodeData.tags.technical,
        ...nodeData.tags.categories
    ];
}

// Make functions available on a global object for inline HTML onclick handlers
window.NodeMind = window.NodeMind || {};
window.NodeMind.nodeDetails = {
    saveNodeDetails,
    resetNodeDetails,
    getNodeTags
}; 
