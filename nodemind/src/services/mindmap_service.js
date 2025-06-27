/**
 * @file mindmap_service.js
 * @description This service is responsible for creating and managing jsMind instances.
 * 现在集成MD格式适配器，实现MD内容与脑图数据的双向同步
 */
import State from './state.js';
import { mindmapData, baseOptions } from '../config.js';
import MDAdapter from './md_adapter_service.js';
import MDNodeColoringService from './md_node_coloring_service.js';

const { state } = State;

/**
 * Initialize all mindmap instances - 迁移自index.html的完整实现
 */
function initMindmaps() {
    console.log('🧠 [MindmapService] 初始化思维导图...');
    
    // 确保全局变量可用
    if (!window.mindmaps) {
        window.mindmaps = {};
    }
    
    // 创建工作空间脑图
    window.mindmaps.workspace = new jsMind({ ...baseOptions, container: 'jsmind_container_workspace' });
    window.mindmaps.workspace.show(mindmapData.workspace);
    
    // 创建知识库脑图
    window.mindmaps.knowledge = new jsMind({ ...baseOptions, container: 'jsmind_container_knowledge' });
    window.mindmaps.knowledge.show(mindmapData.knowledge);
    
    // 创建项目管理脑图
    window.mindmaps.project = new jsMind({ ...baseOptions, container: 'jsmind_container_project' });
    window.mindmaps.project.show(mindmapData.project);

    // 启用拖拽功能
    Object.values(window.mindmaps).forEach((mindmap, index) => {
        try {
            if (typeof mindmap.enable_draggable_node === 'function') {
                mindmap.enable_draggable_node();
                console.log(`✅ 脑图${index + 1}拖拽功能已启用`);
            }
        } catch (dragError) {
            console.log(`⚠️ 脑图${index + 1}拖拽功能启用失败:`, dragError.message);
        }
    });
    
    // 同时更新state中的实例
    state.jsMindInstances = window.mindmaps;
    
    // *** 关键修复：数据融合 - 确保jsMind节点与nodeDatabase同步 ***
    console.log('🔄 开始数据融合...');
    syncMindmapDataWithNodeDatabase();
    
    // *** MD格式适配 - 同步标签节点 ***
    console.log('🏷️ 开始同步标签节点...');
    MDAdapter.syncAllTagNodes();
    
    // *** MD格式着色 - 应用基于内容的节点颜色 ***
    console.log('🎨 开始应用MD格式着色...');
    setTimeout(() => {
        MDNodeColoringService.colorAllNodesByMDContent();
    }, 1000); // 延迟1秒确保所有数据已加载
    
    console.log('✅ [MindmapService] 思维导图初始化完成');
    
    // 绑定节点选择事件
    bindNodeEvents();
}

/**
 * 数据融合函数：确保jsMind中的所有节点在nodeDatabase中都有对应记录
 */
function syncMindmapDataWithNodeDatabase() {
    console.log('🔗 [MindmapService] 执行数据融合...');
    
    let syncCount = 0;
    let newCount = 0;
    
    // 确保nodeDatabase和projectInfo可用
    if (!window.nodeDatabase) {
        window.nodeDatabase = {};
    }
    if (!window.projectInfo) {
        window.projectInfo = { author: 'NodeMind' };
    }
    
    // 遍历所有思维导图
    Object.keys(window.mindmaps).forEach(mapId => {
        const mindmap = window.mindmaps[mapId];
        if (mindmap) {
            console.log(`🔍 融合脑图: ${mapId}`);
            
            // 获取该脑图的数据
            const mapData = mindmap.get_data();
            if (mapData && mapData.data) {
                // 递归遍历所有节点
                traverseAndSyncNode(mapData.data);
            }
        }
    });
    
    // 遍历节点并同步到nodeDatabase
    function traverseAndSyncNode(nodeData) {
        if (!nodeData || !nodeData.id) return;
        
        const nodeId = nodeData.id;
        const cleanTitle = nodeData.topic ? nodeData.topic.replace(' 📄', '') : '未命名节点';
        
        // 检查nodeDatabase中是否存在该节点
        if (!window.nodeDatabase[nodeId]) {
            // 创建新的节点记录
            window.nodeDatabase[nodeId] = {
                id: nodeId,
                title: cleanTitle,
                content: '',
                sessions: [], // 新增会话数据
                author: window.projectInfo.author || 'NodeMind',
                created: new Date().toISOString(),
                modified: new Date().toISOString(),
                tags: { categories: [], technical: [], status: [] }
            };
            newCount++;
            console.log(`📝 创建节点记录: ${cleanTitle} (${nodeId})`);
            
            // *** MD格式适配 - 将新节点转换为MD格式 ***
            const mdContent = MDAdapter.convertToMDFormat(window.nodeDatabase[nodeId]);
            window.nodeDatabase[nodeId].content = mdContent;
            
        } else {
            // 确保现有节点数据结构完整
            const existingNode = window.nodeDatabase[nodeId];
            
            // 更新标题（如果节点标题在脑图中被修改）
            if (existingNode.title !== cleanTitle) {
                existingNode.title = cleanTitle;
                existingNode.modified = new Date().toISOString();
                
                // *** MD格式适配 - 标题变更时重新生成MD内容 ***
                const mdContent = MDAdapter.convertToMDFormat(existingNode);
                existingNode.content = mdContent;
            }
            
            // 确保必要字段存在
            if (!existingNode.sessions) existingNode.sessions = [];
            if (!existingNode.tags) existingNode.tags = { categories: [], technical: [], status: [] };
            if (!existingNode.author) existingNode.author = window.projectInfo.author || 'NodeMind';
            if (!existingNode.created) existingNode.created = new Date().toISOString();
            if (!existingNode.modified) existingNode.modified = new Date().toISOString();
            
            // *** MD格式适配 - 如果没有MD格式内容，生成一个 ***
            if (!existingNode.content || !existingNode.content.includes('**')) {
                const mdContent = MDAdapter.convertToMDFormat(existingNode);
                existingNode.content = mdContent;
            }
            
            syncCount++;
            console.log(`🔄 同步节点记录: ${cleanTitle} (${nodeId})`);
        }
        
        // 递归处理子节点
        if (nodeData.children && Array.isArray(nodeData.children)) {
            nodeData.children.forEach(childNode => {
                traverseAndSyncNode(childNode);
            });
        }
    }
    
    console.log(`✅ [MindmapService] 数据融合完成: 同步${syncCount}个节点，新建${newCount}个节点`);
}

/**
 * 绑定节点事件
 */
function bindNodeEvents() {
    console.log('🔗 [MindmapService] 开始绑定节点事件...');
    
    Object.keys(window.mindmaps).forEach(mapId => {
        const mindmap = window.mindmaps[mapId];
        if (mindmap) {
            console.log(`🔗 绑定 ${mapId} 脑图事件`);
            // 绑定节点选择事件  
            mindmap.add_event_listener(function(type, data) {
                console.log(`📡 接收到事件: ${type}, 数据:`, data);
                // 兼容不同版本的事件类型
                if (type === 'select' || type === 1 || (jsMind.event_type && type === jsMind.event_type.select)) {
                    handleNodeSelect(data.node, mapId);
                } else if (type === 'edit' || type === 2 || (jsMind.event_type && type === jsMind.event_type.edit)) {
                    handleNodeEdit(data.node, mapId);
                }
            });
        } else {
            console.log(`❌ ${mapId} 脑图不存在`);
        }
    });
    
    console.log('✅ [MindmapService] 节点事件绑定完成');
    
    // 备用方案：直接绑定 DOM 点击事件
    setTimeout(() => {
        console.log('🔄 [MindmapService] 设置备用点击事件监听器...');
        const containers = ['jsmind_container_workspace', 'jsmind_container_knowledge', 'jsmind_container_project'];
        containers.forEach(containerId => {
            const container = document.getElementById(containerId);
            if (container) {
                container.addEventListener('click', function(e) {
                    console.log('🖱️ 备用点击事件触发:', e.target);
                    // 查找被点击的节点
                    const nodeElement = e.target.closest('jmnode');
                    if (nodeElement) {
                        const nodeId = nodeElement.getAttribute('nodeid');
                        const mapId = containerId.replace('jsmind_container_', '');
                        const mindmap = window.mindmaps[mapId];
                        if (mindmap && nodeId) {
                            const node = mindmap.get_node(nodeId);
                            if (node) {
                                console.log('🎯 备用方案：节点选中:', node.topic);
                                handleNodeSelect(node, mapId);
                            }
                        }
                    }
                });
            }
        });
    }, 1000);
}

/**
 * 处理节点选择 - 更新为调用模块化函数
 */
function handleNodeSelect(node, mapId) {
    if (!node) {
        console.log('❌ handleNodeSelect: 节点为空');
        return;
    }
    
    console.log(`🎯 [MindmapService] 节点选中: ${node.topic} (${node.id}) 在 ${mapId}`);
    
    window.selectedNodeId = node.id;
    window.currentMindmap = mapId;
    
    // 更新状态
    state.selectedNode = node;
    state.currentMindmap = mapId;
    
    // 发布事件到事件总线
    import('./event_bus.js').then(({ publish }) => {
        publish('node:selected', { node, mindmap: mapId });
        console.log('📡 已发布node:selected事件', { nodeId: node.id, mapId });
    }).catch(error => {
        console.error('❌ 发布事件失败:', error);
    });
    
    // 兼容性：调用全局函数
    if (typeof window.showNodeDetails === 'function') {
        window.showNodeDetails(node);
    }
}

/**
 * 处理节点编辑 - 临时处理，后续迁移到UI控制器
 */
function handleNodeEdit(node, mapId) {
    if (!node) return;
    
    console.log(`✏️ [MindmapService] 节点编辑: ${node.topic} (${node.id}) 在 ${mapId}`);
    
    // 这里可以添加编辑逻辑
}

/**
 * Enable draggable functionality for all mindmap instances
 */
function enableDraggableForAllMindmaps() {
    console.log('[mindmap_service.js] Enabling draggable functionality...');
    
    Object.entries(state.jsMindInstances).forEach(([mapId, mindmap], index) => {
        try {
            if (typeof mindmap.enable_draggable_node === 'function') {
                mindmap.enable_draggable_node();
                console.log(`✅ 脑图${index + 1}(${mapId})拖拽功能已启用`);
            } else {
                console.log(`⚠️ 脑图${index + 1}(${mapId})拖拽功能不支持（jsMind版本问题）`);
            }
        } catch (dragError) {
            console.log(`⚠️ 脑图${index + 1}(${mapId})拖拽功能启用失败:`, dragError.message);
        }
    });
}

/**
 * Get current active jsMind instance
 */
function getCurrentJsMind() {
    const currentMapId = state.currentMindmap;
    return getMindmapInstance(currentMapId);
}

/**
 * Switch to a different mindmap tab
 */
function switchMindmapTab(mapId) {
    console.log(`[mindmap_service.js] Switching to mindmap: ${mapId}`);
    
    // Check if the mindmap data exists in config
    if (mindmapData[mapId]) {
        State.setCurrentMindmap(mapId);
        
        // Hide all containers and tab contents
        ['workspace', 'knowledge', 'project'].forEach(id => {
            const container = document.getElementById(`jsmind_container_${id}`);
            const tabContent = document.getElementById(`mindmap-tab-${id}`);
            if (container) {
                container.style.display = 'none';
            }
            if (tabContent) {
                tabContent.style.display = 'none';
                tabContent.classList.remove('active');
            }
        });
        
        // Show target container and tab content
        const targetContainer = document.getElementById(`jsmind_container_${mapId}`);
        const targetTabContent = document.getElementById(`mindmap-tab-${mapId}`);
        if (targetContainer && targetTabContent) {
            targetContainer.style.display = 'block';
            targetTabContent.style.display = 'block';
            targetTabContent.classList.add('active');
            
            // Resize the mindmap to fit the container
            const instance = getMindmapInstance(mapId);
            if (instance) {
                setTimeout(() => {
                    instance.resize();
                }, 100);
            }
        }
        
        // Update tab UI
        updateTabUI(mapId);
        
        console.log(`[mindmap_service.js] Switched to mindmap: ${mapId}`);
    } else {
        console.error(`[mindmap_service.js] Mindmap '${mapId}' not found in config`);
    }
}

/**
 * Update tab UI to reflect current selection
 */
function updateTabUI(activeMapId) {
    // Remove active class from all mindmap tab buttons
    document.querySelectorAll('.mindmap-tab-button').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Add active class to current tab
    const activeTab = document.querySelector(`[data-tab="${activeMapId}"]`);
    if (activeTab) {
        activeTab.classList.add('active');
    }
}

/**
 * Add event listeners to all mindmap instances
 */
function addEventListenersToAllMindmaps() {
    console.log('[mindmap_service.js] Adding event listeners to all mindmaps...');
    
    ['workspace', 'knowledge', 'project'].forEach(mapId => {
        const container = document.getElementById(`jsmind_container_${mapId}`);
        if (container) {
            addMindmapEventListeners(mapId, container);
        }
    });
}

/**
 * Add event listeners to a specific mindmap container
 */
function addMindmapEventListeners(mapId, container) {
    console.log(`[mindmap_service.js] Adding event listeners for ${mapId}...`);
    
    // Left click events
    container.addEventListener('click', function(e) {
        // Hide context menu
        hideContextMenu();
        
        // Find node element
        let nodeEl = e.target.closest('.jmnode') || e.target.closest('[nodeid]');
        
        if (nodeEl) {
            const nodeId = nodeEl.getAttribute('nodeid');
            if (nodeId) {
                console.log(`🎯 DOM捕获${mapId}节点点击:`, nodeId);
                
                // Switch to corresponding mindmap
                if (state.currentMindmap !== mapId) {
                    switchMindmapTab(mapId);
                }
                
                // Ensure node is selected
                const instance = getMindmapInstance(mapId);
                if (instance) {
                    instance.select_node(nodeId);
                    const node = instance.get_node(nodeId);
                    state.selectedNode = node;
                    
                    // Publish events
                    import('../services/event_bus.js').then(({ publish }) => {
                        publish('node:selected', { node, mindmap: mapId });
                    });
                }
            }
        }
    });
    
    // Right click context menu (only for project tab)
    if (mapId === 'project') {
        container.addEventListener('contextmenu', function(e) {
            e.preventDefault();
            
            let nodeEl = e.target.closest('.jmnode') || e.target.closest('[nodeid]');
            
            if (nodeEl) {
                const nodeId = nodeEl.getAttribute('nodeid');
                if (nodeId) {
                    const instance = getMindmapInstance(mapId);
                    if (instance) {
                        const node = instance.get_node(nodeId);
                        
                        // Show context menu
                        import('../controllers/context_menu_controller.js').then(({ showContextMenu, setContextMenuTargetNode }) => {
                            setContextMenuTargetNode(node);
                            showContextMenu(e.clientX, e.clientY);
                        });
                        
                        console.log('🖱️ 右键点击节点:', node.topic);
                    }
                }
            }
        });
    }
}

/**
 * Hide context menu (placeholder - will be implemented in context menu controller)
 */
function hideContextMenu() {
    // This will be handled by context menu controller
    import('../controllers/context_menu_controller.js').then(({ hideContextMenu }) => {
        hideContextMenu();
    }).catch(() => {
        // Fallback if context menu controller not available
        const menu = document.getElementById('contextMenu');
        if (menu) {
            menu.style.display = 'none';
        }
    });
}

/**
 * Retrieves a stored jsMind instance.
 * @param {string} mapId - The ID of the mind map instance to retrieve.
 * @returns {object|undefined} The jsMind instance.
 */
function getMindmapInstance(mapId) {
    console.log(`[mindmap_service.js] Getting instance for mapId: ${mapId}`);
    const instance = state.jsMindInstances[mapId];
    if (!instance) {
        console.warn(`[mindmap_service.js] No instance found for mapId: ${mapId}.`);
    }
    return instance;
}

/**
 * Triggers the resize method on a specific jsMind instance.
 * @param {string} mapId - The ID of the mind map to resize.
 */
function resize(mapId) {
    console.log(`[mindmap_service.js] Attempting to resize mapId: ${mapId}`);
    const jm = getMindmapInstance(mapId);
    if (jm) {
        const container = document.getElementById(jm.options.container);
        console.log(`[mindmap_service.js] Instance for ${mapId} found. Container #${container.id} dimensions: ${container.offsetWidth}x${container.offsetHeight}. Calling jm.resize().`);
        jm.resize();
    } else {
        console.error(`[mindmap_service.js] Resize failed: could not find instance for mapId: ${mapId}.`);
    }
}

/**
 * 使用指定数据初始化所有思维导图
 */
function initMindmapsWithData(mindmapData) {
    console.log('🧠 使用数据初始化思维导图...');
    
    // 基础配置
    const baseOptions = {
        editable: true,
        theme: 'primary',
        view: { engine: 'canvas', hmargin: 150, vmargin: 80, line_width: 2, line_color: '#566' },
        layout: { hspace: 40, vspace: 30, pspace: 15 },
        shortcut: { enable: true, handles: {}, mapping: { addchild: 4096 + 13, addbrother: 13, editnode: 113, delnode: 46, toggle: 32, left: 37, up: 38, right: 39, down: 40 } },
        default_direction: 'right'
    };
    
    try {
        // 创建工作空间脑图
        if (mindmapData.workspace) {
            state.jsMindInstances.workspace = new jsMind({ ...baseOptions, container: 'jsmind_container_workspace' });
            state.jsMindInstances.workspace.show(mindmapData.workspace);
        }
        
        // 创建知识库脑图
        if (mindmapData.knowledge) {
            state.jsMindInstances.knowledge = new jsMind({ ...baseOptions, container: 'jsmind_container_knowledge' });
            state.jsMindInstances.knowledge.show(mindmapData.knowledge);
        }
        
        // 创建项目管理脑图
        if (mindmapData.project) {
            state.jsMindInstances.project = new jsMind({ ...baseOptions, container: 'jsmind_container_project' });
            state.jsMindInstances.project.show(mindmapData.project);
        }

        // 启用拖拽功能
        Object.values(state.jsMindInstances).forEach((mindmap, index) => {
            try {
                if (typeof mindmap.enable_draggable_node === 'function') {
                    mindmap.enable_draggable_node();
                    console.log(`✅ 脑图${index + 1}拖拽功能已启用`);
                }
            } catch (dragError) {
                console.log(`⚠️ 脑图${index + 1}拖拽功能启用失败:`, dragError.message);
            }
        });
        
        console.log('✅ 思维导图初始化完成');
        
    } catch (error) {
        console.error('❌ 思维导图初始化失败:', error);
        throw error;
    }
}

/**
 * 展开所有节点
 */
function expandAll() {
    const currentJsMind = getCurrentJsMind();
    if (currentJsMind) {
        currentJsMind.expand_all();
    }
}

/**
 * 收起所有节点
 */
function collapseAll() {
    const currentJsMind = getCurrentJsMind();
    if (currentJsMind) {
        currentJsMind.collapse_all();
    }
}

/**
 * 添加新节点
 * @param {string} parentId - 父节点ID
 * @param {string} nodeId - 新节点ID
 * @param {string} topic - 节点标题
 * @param {object} data - 节点数据（可选）
 * @returns {object|null} 创建的节点对象或null
 */
function addNode(parentId, nodeId, topic, data = {}) {
    console.log(`🧠 [MindmapService] 添加节点: parentId=${parentId}, nodeId=${nodeId}, topic=${topic}`);
    
    const currentJsMind = getCurrentJsMind();
    if (!currentJsMind) {
        console.error('❌ [MindmapService] 无法添加节点: 当前没有活跃的思维导图实例');
        return null;
    }
    
    try {
        // 获取父节点
        const parentNode = currentJsMind.get_node(parentId);
        if (!parentNode) {
            console.error(`❌ [MindmapService] 无法找到父节点: ${parentId}`);
            return null;
        }
        
        // 使用jsMind API添加节点
        const newNode = currentJsMind.add_node(parentNode, nodeId, topic, data);
        
        if (newNode) {
            console.log(`✅ [MindmapService] 节点添加成功: ${nodeId} - ${topic}`);
            
            // 确保新节点在nodeDatabase中有记录
            if (window.nodeDatabase && !window.nodeDatabase[nodeId]) {
                window.nodeDatabase[nodeId] = {
                    id: nodeId,
                    title: topic,
                    content: '',
                    sessions: [],
                    author: window.projectInfo?.author || 'NodeMind',
                    created: new Date().toISOString(),
                    modified: new Date().toISOString(),
                    tags: { categories: [], technical: [], status: [] }
                };
                console.log(`📝 [MindmapService] 已为新节点创建数据库记录: ${nodeId}`);
            }
            
            // 自动选择新创建的节点
            currentJsMind.select_node(nodeId);
            
            return newNode;
        } else {
            console.error(`❌ [MindmapService] 节点添加失败: jsMind.add_node 返回null`);
            return null;
        }
        
    } catch (error) {
        console.error(`❌ [MindmapService] 添加节点时发生错误:`, error);
        return null;
    }
}

/**
 * 删除节点
 * @param {string} nodeId - 要删除的节点ID
 * @returns {boolean} 删除是否成功
 */
function removeNode(nodeId) {
    console.log(`🗑️ [MindmapService] 删除节点: ${nodeId}`);
    
    const currentJsMind = getCurrentJsMind();
    if (!currentJsMind) {
        console.error('❌ [MindmapService] 无法删除节点: 当前没有活跃的思维导图实例');
        return false;
    }
    
    try {
        // 检查是否为根节点
        const node = currentJsMind.get_node(nodeId);
        if (!node) {
            console.error(`❌ [MindmapService] 无法找到要删除的节点: ${nodeId}`);
            return false;
        }
        
        if (node.isroot) {
            console.error('❌ [MindmapService] 无法删除根节点');
            return false;
        }
        
        // 使用jsMind API删除节点
        const result = currentJsMind.remove_node(nodeId);
        
        if (result) {
            console.log(`✅ [MindmapService] 节点删除成功: ${nodeId}`);
            
            // 从nodeDatabase中删除记录
            if (window.nodeDatabase && window.nodeDatabase[nodeId]) {
                delete window.nodeDatabase[nodeId];
                console.log(`🗑️ [MindmapService] 已从数据库删除节点记录: ${nodeId}`);
            }
            
            return true;
        } else {
            console.error(`❌ [MindmapService] 节点删除失败: jsMind.remove_node 返回false`);
            return false;
        }
        
    } catch (error) {
        console.error(`❌ [MindmapService] 删除节点时发生错误:`, error);
        return false;
    }
}

/**
 * 开始编辑节点
 * @param {string} nodeId - 要编辑的节点ID
 * @returns {boolean} 是否成功开始编辑
 */
function beginEdit(nodeId) {
    console.log(`✏️ [MindmapService] 开始编辑节点: ${nodeId}`);
    
    const currentJsMind = getCurrentJsMind();
    if (!currentJsMind) {
        console.error('❌ [MindmapService] 无法编辑节点: 当前没有活跃的思维导图实例');
        return false;
    }
    
    try {
        // 确保节点存在
        const node = currentJsMind.get_node(nodeId);
        if (!node) {
            console.error(`❌ [MindmapService] 无法找到要编辑的节点: ${nodeId}`);
            return false;
        }
        
        // 使用jsMind API开始编辑
        currentJsMind.begin_edit(node);
        console.log(`✅ [MindmapService] 开始编辑节点: ${nodeId}`);
        return true;
        
    } catch (error) {
        console.error(`❌ [MindmapService] 开始编辑节点时发生错误:`, error);
        return false;
    }
}

export default {
    initMindmaps,
    initMindmapsWithData,
    getCurrentJsMind,
    switchMindmapTab,
    addEventListenersToAllMindmaps,
    resize,
    expandAll,
    collapseAll,
    syncMindmapDataWithNodeDatabase,
    bindNodeEvents,
    // 节点操作函数
    addNode,
    removeNode,
    beginEdit
};