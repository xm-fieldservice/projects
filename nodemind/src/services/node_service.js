import state from './state.js';
import MDAdapter from './md_adapter_service.js';
import MDNodeColoringService from './md_node_coloring_service.js';

/**
 * NodeMind工具初始化器 - 声明使用融合数据结构
 */
export function initializeNodeMindTool() {
    console.log('🚀 NodeMind工具初始化开始...');
    console.log('📋 数据结构声明：所有节点数据将使用融合结构');
    window.NODEMIND_UNIFIED_MODE = true;
    console.log('✅ NodeMind工具初始化完成 - 融合数据结构已激活');
}

/**
 * 验证并修复节点数据库的数据结构
 */
export function validateAndFixNodeDatabase() {
    console.log('🔧 开始验证并修复节点数据库结构...');
    let fixedCount = 0;
    const now = new Date().toLocaleString();

    Object.keys(state.state.nodeDatabase).forEach(nodeId => {
        const node = state.state.nodeDatabase[nodeId];
        let needsFix = false;

        // 检查并补充缺失的融合结构字段
        if (!Object.prototype.hasOwnProperty.call(node, 'topic')) { node.topic = node.title || ''; needsFix = true; }
        if (!Object.prototype.hasOwnProperty.call(node, 'title')) { node.title = node.topic || ''; needsFix = true; }
        if (!Object.prototype.hasOwnProperty.call(node, 'content')) { node.content = ''; needsFix = true; }
        if (!Object.prototype.hasOwnProperty.call(node, 'statusTags')) { node.statusTags = []; needsFix = true; }
        if (!Object.prototype.hasOwnProperty.call(node, 'tags')) {
            node.tags = { categories: [], technical: [], status: [], custom: [], future: [] };
            needsFix = true;
        }
        if (!Object.prototype.hasOwnProperty.call(node, 'time')) {
            node.time = { created: now, modified: now };
            needsFix = true;
        }
        if (!Object.prototype.hasOwnProperty.call(node, 'author')) { node.author = ''; needsFix = true; }
        if (!Object.prototype.hasOwnProperty.call(node, 'relations')) {
            node.relations = { parent: null, children: [] };
            needsFix = true;
        }

        if (needsFix) {
            fixedCount++;
        }
    });

    if (fixedCount > 0) {
        console.log(`🔧 已修复 ${fixedCount} 个节点的数据结构`);
    } else {
        console.log('✅ 节点数据库结构验证通过，无需修复');
    }
}

/**
 * 递归遍历思维导图数据，初始化节点数据库
 */
export function initNodeDatabase() {
    console.log('🗄️ 开始初始化节点数据库...');
    
    // 遍历所有jsMind实例
    Object.keys(state.state.jsMindInstances).forEach(tabName => {
        const mindmapInstance = state.state.jsMindInstances[tabName];
        if (mindmapInstance) {
            console.log(`📋 初始化 ${tabName} 工作区的节点数据库...`);
            
            try {
                const data = mindmapInstance.get_data();
                if (data && data.data) {
                    const rootNode = mindmapInstance.get_node(data.data.id);
                    if (rootNode) {
                        traverseNode(rootNode);
                        console.log(`✅ ${tabName} 工作区节点数据库初始化完成`);
                    } else {
                        console.warn(`⚠️ ${tabName} 工作区未找到根节点`);
                    }
                } else {
                    console.warn(`⚠️ ${tabName} 工作区数据为空`);
                }
            } catch (error) {
                console.error(`❌ ${tabName} 工作区初始化失败:`, error);
            }
        }
    });
    
    console.log('🗄️ 所有工作区节点数据库初始化完成:', state.state.nodeDatabase);
}

/**
 * 遍历节点及其子节点 - 使用融合数据结构
 * @param {object} node - jsMind节点对象
 */
function traverseNode(node) {
    if (!node) return;
    const now = new Date().toLocaleString();

    state.state.nodeDatabase[node.id] = {
        id: node.id,
        topic: node.topic,
        title: node.topic,
        content: '',
        statusTags: [],
        tags: { categories: [], technical: [], status: [], custom: [], future: [] },
        time: { created: now, modified: now },
        author: '',
        relations: {
            parent: node.parent ? node.parent.id : null,
            children: node.children ? node.children.map(child => child.id) : []
        }
    };

    if (node.children) {
        node.children.forEach(child => traverseNode(child));
    }
}

/**
 * 更新节点关系
 * @param {string} nodeId - 节点ID
 */
export function updateNodeRelations(nodeId) {
    const currentMindmap = state.state.currentMindmap;
    const jm = state.state.jsMindInstances[currentMindmap];
    if (!jm) return;

    const node = jm.get_node(nodeId);
    if (!node || !state.state.nodeDatabase[nodeId]) return;

    state.state.nodeDatabase[nodeId].relations.parent = node.parent ? node.parent.id : null;
    state.state.nodeDatabase[nodeId].relations.children = node.children ? node.children.map(child => child.id) : [];
}

/**
 * 设置节点状态
 * @param {string} nodeId - 节点ID
 * @param {string} status - 状态字符串
 */
export function setNodeStatus(nodeId, status) {
    if (!state.state.nodeDatabase[nodeId]) return;
    state.state.nodeDatabase[nodeId].status = status;
    state.state.nodeDatabase[nodeId].time.modified = new Date().toLocaleString();
    console.log('🏷️ 设置节点状态:', nodeId, status);
}

/**
 * 更新节点作者信息
 * @param {string} nodeId - 节点ID
 * @param {string} authorValue - 作者名
 */
export function updateNodeAuthor(nodeId, authorValue) {
    if (state.state.nodeDatabase[nodeId]) {
        state.state.nodeDatabase[nodeId].author = authorValue;
        state.state.nodeDatabase[nodeId].time.modified = new Date().toLocaleString();
        console.log('✅ 节点作者已更新:', nodeId, authorValue);
    }
}

/**
 * 节点事件处理器模块
 * 用于替换HTML中的内联事件处理器
 */

// 节点标题更新处理器
export function handleNodeTitleChange(nodeId, newTitle) {
    console.log(`🏷️ 节点标题更新: ${nodeId} -> ${newTitle}`);
    
    // 更新jsMind中的节点标题
    if (window.jm && window.jm.get_node(nodeId)) {
        window.jm.update_node(nodeId, newTitle);
    }
    
    // 更新本地存储的节点数据
    if (window.updateNodeTitle) {
        window.updateNodeTitle(nodeId, newTitle);
    }
    
    // 触发自动保存
    if (window.autoSaveData) {
        setTimeout(window.autoSaveData, 500);
    }
}

// 节点内容更新处理器 - 现在支持MD格式
export function handleNodeContentChange(nodeId, newContent) {
    console.log(`📝 节点内容更新: ${nodeId}`, `长度: ${newContent?.length || 0}`);
    console.log(`📄 要保存的内容: "${newContent}"`);
    
    // 直接操作nodeDatabase，不依赖其他函数
    if (window.nodeDatabase) {
        // 确保节点数据存在
        if (!window.nodeDatabase[nodeId]) {
            console.log(`⚠️ 节点数据不存在，正在创建: ${nodeId}`);
            window.nodeDatabase[nodeId] = {
                id: nodeId,
                title: '未命名节点',
                content: '',
                sessions: [],
                author: 'NodeMind',
                created: new Date().toISOString(),
                modified: new Date().toISOString(),
                tags: { categories: [], technical: [], status: [] }
            };
        }
        
        // *** MD格式适配 - 同步MD内容到数据库 ***
        const updatedNodeData = MDAdapter.syncMDToNodeDatabase(nodeId, newContent || '');
        console.log(`✅ MD适配器同步完成: ${nodeId}`);
        
        // 同时调用原有的updateNodeContent函数（如果存在）
        if (window.updateNodeContent) {
            window.updateNodeContent(nodeId, newContent);
            console.log(`✅ 同时调用了 updateNodeContent`);
        }
        
        // *** MD格式适配 - 内容变更后重新同步标签节点 ***
        setTimeout(() => {
            MDAdapter.syncAllTagNodes();
            console.log(`🏷️ 标签节点已重新同步`);
        }, 100);
        
        // *** MD格式着色 - 内容变更后重新着色 ***
        setTimeout(() => {
            MDNodeColoringService.onNodeContentChanged(nodeId, newContent);
            console.log(`🎨 节点着色已更新: ${nodeId}`);
        }, 200);
        
        // 触发自动保存
        if (window.autoSaveData) {
            setTimeout(window.autoSaveData, 200);
            console.log(`✅ 触发了自动保存`);
        }
        
    } else {
        console.log(`❌ window.nodeDatabase 不存在`);
    }
}

// 项目作者更新处理器
export function handleProjectAuthorChange(newAuthor) {
    console.log(`👤 项目作者更新: ${newAuthor}`);
    
    // 更新项目作者信息
    if (window.updateCurrentNodeAuthor) {
        window.updateCurrentNodeAuthor(newAuthor);
    }
    
    // 触发自动保存
    if (window.autoSaveData) {
        setTimeout(window.autoSaveData, 500);
    }
}

// QA模式切换处理器
export function handleQAModeChange(nodeId, qaMode) {
    console.log(`❓ QA模式切换: ${nodeId} -> ${qaMode}`);
    
    // 更新QA模式
    if (window.toggleQAMode) {
        window.toggleQAMode(nodeId, qaMode);
    }
    
    // 触发自动保存
    if (window.autoSaveData) {
        setTimeout(window.autoSaveData, 500);
    }
}

/**
 * 初始化事件监听器（替换内联事件）
 */
export function initializeNodeEventListeners() {
    console.log('🔧 初始化节点事件监听器...');
    
    // 使用事件委托处理动态生成的元素
    document.addEventListener('change', function(event) {
        const target = event.target;
        
        // 处理节点标题变更
        if (target.matches('[id^="node-title-"]')) {
            const nodeId = target.id.replace('node-title-', '');
            handleNodeTitleChange(nodeId, target.value);
        }
        
        // 处理节点内容变更
        else if (target.matches('[id^="node-content-"]')) {
            const nodeId = target.id.replace('node-content-', '');
            handleNodeContentChange(nodeId, target.value);
            console.log(`🔧 模块化事件处理: 节点内容变更 ${nodeId}`, target.value?.length || 0, '个字符');
        }
        
        // 处理QA模式变更
        else if (target.matches('[id^="qa-mode-"]')) {
            const nodeId = target.id.replace('qa-mode-', '');
            handleQAModeChange(nodeId, target.checked);
        }
        
        // 处理项目作者变更
        else if (target.id === 'project-node-author') {
            handleProjectAuthorChange(target.value);
        }
    });
    
    // 处理input事件（实时更新）
    document.addEventListener('input', function(event) {
        const target = event.target;
        
        // 节点标题实时更新
        if (target.matches('[id^="node-title-"]')) {
            const nodeId = target.id.replace('node-title-', '');
            // 实时更新标题，但延迟保存
            if (window.jm && window.jm.get_node(nodeId)) {
                window.jm.update_node(nodeId, target.value);
            }
        }
        
        // 节点内容实时保存（重要！）
        else if (target.matches('[id^="node-content-"]')) {
            const nodeId = target.id.replace('node-content-', '');
            console.log(`📝 实时内容更新: ${nodeId}`, target.value?.length || 0, '个字符');
            // 延迟保存，避免频繁触发
            clearTimeout(target._saveTimeout);
            target._saveTimeout = setTimeout(() => {
                handleNodeContentChange(nodeId, target.value);
            }, 1000); // 1秒后保存
        }
    });
    
    // 处理blur事件（失去焦点时立即保存）
    document.addEventListener('blur', function(event) {
        const target = event.target;
        
        // 节点内容失去焦点时立即保存
        if (target.matches('[id^="node-content-"]')) {
            const nodeId = target.id.replace('node-content-', '');
            console.log(`💾 失去焦点，立即保存内容: ${nodeId}`);
            // 清除之前的延迟保存
            clearTimeout(target._saveTimeout);
            // 立即保存
            handleNodeContentChange(nodeId, target.value);
        }
        
        // 节点标题失去焦点时立即保存
        else if (target.matches('[id^="node-title-"]')) {
            const nodeId = target.id.replace('node-title-', '');
            console.log(`💾 失去焦点，立即保存标题: ${nodeId}`);
            handleNodeTitleChange(nodeId, target.value);
        }
    }, true); // 使用捕获阶段确保能捕获到事件
    
    // 将关键函数暴露到全局作用域，确保能被调用
    window.handleNodeContentChange = handleNodeContentChange;
    window.handleNodeTitleChange = handleNodeTitleChange;
    window.handleQAModeChange = handleQAModeChange;
    window.handleProjectAuthorChange = handleProjectAuthorChange;
    
    console.log('✅ 节点事件监听器初始化完成 (change + input + blur)');
    console.log('�� 关键函数已暴露到全局作用域');
}

/**
 * 遍历节点并同步到nodeDatabase
 */
function traverseAndSyncNode(nodeData, mapId) {
    if (!nodeData || !nodeData.id) return;
    
    const nodeId = nodeData.id;
    const cleanTitle = nodeData.topic ? nodeData.topic.replace(' 📄', '') : '未命名节点';
    
    // 检查nodeDatabase中是否存在该节点
    if (!state.nodeDatabase[nodeId]) {
        // 创建新的节点记录
        state.nodeDatabase[nodeId] = {
            id: nodeId,
            title: cleanTitle,
            content: '',
            sessions: [], // 新增会话数据
            author: state.projectInfo?.author || 'NodeMind',
            created: new Date().toISOString(),
            modified: new Date().toISOString(),
            tags: { categories: [], technical: [], status: [] }
        };
        console.log(`📝 创建节点记录: ${cleanTitle} (${nodeId})`);
    } else {
        // 确保现有节点数据结构完整
        const existingNode = state.nodeDatabase[nodeId];
        
        // 更新标题（如果节点标题在脑图中被修改）
        if (existingNode.title !== cleanTitle) {
            existingNode.title = cleanTitle;
            existingNode.modified = new Date().toISOString();
        }
        
        // 确保数据结构完整
        if (!existingNode.sessions) {
            existingNode.sessions = [];
        }
        if (!existingNode.tags) {
            existingNode.tags = { categories: [], technical: [], status: [] };
        }
    }
    
    // 递归处理子节点
    if (nodeData.children && Array.isArray(nodeData.children)) {
        nodeData.children.forEach(child => traverseAndSyncNode(child, mapId));
    }
}

/**
 * 同步标签从工作空间
 */
function syncTagsFromWorkspace() {
    try {
        console.log('🔄 开始同步标签...');
        
        // 从工作空间思维导图获取标签数据
        const workspaceMindmap = state.jsMindInstances.workspace;
        if (!workspaceMindmap) {
            utils.showMessage('⚠️ 工作空间未初始化', 2000);
            return;
        }
        
        const workspaceData = workspaceMindmap.get_data();
        const tagGroups = {};
        
        // 递归收集标签
        function collectTags(node) {
            if (node.isTag && node.tagGroup) {
                if (!tagGroups[node.tagGroup]) {
                    tagGroups[node.tagGroup] = [];
                }
                tagGroups[node.tagGroup].push({
                    id: node.id,
                    name: node.topic,
                    group: node.tagGroup
                });
            }
            
            if (node.children) {
                node.children.forEach(collectTags);
            }
        }
        
        collectTags(workspaceData.data);
        
        // 更新状态中的标签数据
        state.tagGroups = tagGroups;
        
        console.log('✅ 标签同步完成:', tagGroups);
        utils.showMessage(`✅ 已同步 ${Object.keys(tagGroups).length} 个标签组`, 2000);
        
    } catch (error) {
        console.error('❌ 标签同步失败:', error);
        utils.showMessage('❌ 标签同步失败', 2000);
    }
}

// 导出新增函数（其他函数已经单独导出）
export {
    traverseAndSyncNode,
    syncTagsFromWorkspace
}; 