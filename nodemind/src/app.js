/**
 * @file app.js
 * @description 应用主入口和协调器
 */

// Import all modules
import state from './services/state.js';
import * as config from './config.js';
import * as utils from './utils/utils.js';
import { subscribe } from './services/event_bus.js';
import mindmapService from './services/mindmap_service.js';
import * as nodeService from './services/node_service.js';
import * as storageService from './services/storage_service.js';
import * as projectService from './services/project_service.js';
import * as uiController from './controllers/ui_controller.js';
import * as contextMenuController from './controllers/context_menu_controller.js';
import * as nodeDetailsUI from './ui/components/node_details_ui.js';
import * as mdBrowserUI from './ui/components/md_browser_ui.js';
import { SessionService } from './services/session_service.js';
import { InjectionService } from './services/injection_service.js';
import { TemplateService } from './services/template_service.js';
import { Splitter } from './ui/components/splitter.js';
import nodeColoringService from './services/node_coloring_service.js';

/**
 * 思维导图数据配置
 */
const MINDMAP_DATA = {
    workspace: {
        meta: { name: "标签管理", author: "NodeMind", version: "1.0.0" },
        format: "node_tree",
        data: {
            id: "workspace_root",
            topic: "🏷️ 标签管理",
            children: [
                {
                    id: "tag_group_normal", 
                    topic: "常规组", 
                    direction: "right",
                    children: [
                        { id: "tag_project", topic: "项目", isTag: true, tagGroup: "常规" },
                        { id: "tag_milestone", topic: "里程碑", isTag: true, tagGroup: "常规" },
                        { id: "tag_completed", topic: "完成", isTag: true, tagGroup: "常规" },
                        { id: "tag_inprogress", topic: "进行中", isTag: true, tagGroup: "常规" },
                        { id: "tag_planned", topic: "计划", isTag: true, tagGroup: "常规" }
                    ]
                },
                {
                    id: "tag_group_ai", 
                    topic: "AI组", 
                    direction: "left",
                    children: [
                        { id: "tag_memory", topic: "记忆", isTag: true, tagGroup: "AI" },
                        { id: "tag_attention", topic: "注意力", isTag: true, tagGroup: "AI" },
                        { id: "tag_experience", topic: "经验", isTag: true, tagGroup: "AI" },
                        { id: "tag_hallucination", topic: "幻觉", isTag: true, tagGroup: "AI" }
                    ]
                },
                {
                    id: "tag_group_notes", 
                    topic: "笔记组", 
                    direction: "left",
                    children: [
                        { id: "tag_followup", topic: "跟进", isTag: true, tagGroup: "笔记" },
                        { id: "tag_issue", topic: "议题", isTag: true, tagGroup: "笔记" }
                    ]
                }
            ]
        }
    },
    knowledge: {
        meta: { name: "临时工作区B", author: "NodeMind", version: "1.0.0" },
        format: "node_tree",
        data: {
            id: "knowledge_root",
            topic: "📋 临时工作区B",
            children: []
        }
    },
    project: {
        meta: { name: "项目管理", author: "NodeMind", version: "1.0.0" },
        format: "node_tree",
        data: {
            id: "project_root",
            topic: "🚀 项目管理",
            children: [
                { id: "pj_1", topic: "需求分析", direction: "right" },
                { id: "pj_2", topic: "设计阶段", direction: "right" },
                { id: "pj_3", topic: "开发实施", direction: "left" },
                { id: "pj_4", topic: "测试部署", direction: "left" }
            ]
        }
    }
};

/**
 * Binds application-level event listeners from the event bus to handler functions.
 */
function bindAppEventListeners() {
    console.log("Binding application event listeners...");

    subscribe('node:selected', (data) => {
        uiController.updateSelectedNodeDisplay();
        nodeDetailsUI.showNodeDetails(data.node);
        setTimeout(storageService.autoSaveData, 100);
    });

    subscribe('node:edited', (data) => {
        nodeDetailsUI.showNodeDetails(data.node);
        setTimeout(storageService.autoSaveData, 500);
    });

    subscribe('node:moved', (data) => {
        uiController.updateSelectedNodeDisplay();
        nodeService.updateNodeRelations(data.node.id);
        if (data.parent_node) {
            nodeService.updateNodeRelations(data.parent_node.id);
        }
        setTimeout(storageService.autoSaveData, 200);
    });

    subscribe('node:added', (data) => {
        nodeService.updateNodeRelations(data.node.id);
        if (data.parent_node) {
            nodeService.updateNodeRelations(data.parent_node.id);
        }
        nodeDetailsUI.showNodeDetails(data.node);
        setTimeout(storageService.autoSaveData, 200);
    });

    subscribe('node:removed', (data) => {
        if (data.parent_node) {
            nodeService.updateNodeRelations(data.parent_node.id);
        }
        setTimeout(storageService.autoSaveData, 200);
    });
}

/**
 * 初始化思维导图数据
 */
function initializeMindmapData() {
    // 将思维导图数据设置到状态中
    state.mindmapData = MINDMAP_DATA;
    
    // 初始化项目信息
    projectService.initProjectInfo({
        name: '未设置',
        path: '未设置', 
        description: '未设置',
        author: '未设置',
        version: '1.0.0'
    });
}

/**
 * 绑定工具栏事件
 */
function bindToolbarEvents() {
    // 主题切换
    const themeSelect = document.getElementById('theme-select');
    if (themeSelect) {
        themeSelect.addEventListener('change', (e) => {
            mindmapService.setMindMapTheme(e.target.value);
        });
    }

    // 节点操作按钮
    const addNodeBtn = document.getElementById('add-node-btn');
    if (addNodeBtn) {
        addNodeBtn.addEventListener('click', () => {
            const selectedNode = mindmapService.getCurrentJsMind()?.get_selected_node();
            if (selectedNode) {
                const nodeId = jsMind.util.uuid.newid();
                mindmapService.addNode(selectedNode.id, nodeId, 'New Node');
            } else {
                utils.showMessage('请先选择一个节点', 2000);
            }
        });
    }
    
    const removeNodeBtn = document.getElementById('remove-node-btn');
    if (removeNodeBtn) {
        removeNodeBtn.addEventListener('click', () => {
            const selectedNode = mindmapService.getCurrentJsMind()?.get_selected_node();
            if (selectedNode && !selectedNode.isroot) {
                mindmapService.removeNode(selectedNode.id);
            } else {
                utils.showMessage('无法删除根节点', 2000);
            }
        });
    }

    const editNodeBtn = document.getElementById('edit-node-btn');
    if (editNodeBtn) {
        editNodeBtn.addEventListener('click', () => {
            const selectedNode = mindmapService.getCurrentJsMind()?.get_selected_node();
            if (selectedNode) {
                mindmapService.beginEdit(selectedNode.id);
            } else {
                utils.showMessage('请先选择一个节点', 2000);
            }
        });
    }

    const expandAllBtn = document.getElementById('expand-all-btn');
    if (expandAllBtn) {
        expandAllBtn.addEventListener('click', () => {
            mindmapService.expandAll();
        });
    }

    const collapseAllBtn = document.getElementById('collapse-all-btn');
    if (collapseAllBtn) {
        collapseAllBtn.addEventListener('click', () => {
            mindmapService.collapseAll();
        });
    }

    // 文件操作按钮
    const exportBtn = document.getElementById('export_custom_file_button');
    if (exportBtn) {
        exportBtn.addEventListener('click', async () => {
            try {
                // 调用MD文档导出保存功能
                if (window.exportToMDDocument) {
                    await window.exportToMDDocument();
                    utils.showMessage('✅ 已保存到MD文档', 2000);
                } else {
                    // 降级使用传统导出
                    storageService.exportMindmapData();
                    utils.showMessage('✅ 数据已导出', 2000);
                }
            } catch (error) {
                console.error('MD文档保存失败:', error);
                utils.showMessage(`❌ 保存失败: ${error.message}`, 3000);
            }
        });
    }

    const importBtn = document.getElementById('import_file_button');
    if (importBtn) {
        importBtn.addEventListener('click', async () => {
            try {
                utils.showMessage('🔄 正在启动MD文档导入...', 2000);
                
                // 调用MD文档导入功能
                if (window.importMDDocument) {
                    const result = await window.importMDDocument();
                    if (result && result.success) {
                        utils.showMessage(`✅ MD文档导入成功: ${result.nodesCount} 个节点`, 5000);
                        
                        // 强制刷新脑图
                        setTimeout(() => {
                            if (window.mindmapService && window.mindmapService.refreshDisplay) {
                                window.mindmapService.refreshDisplay();
                            }
                            // 刷新当前页面其他相关组件
                            if (window.location.reload) {
                                utils.showMessage('🔄 正在刷新页面以显示导入的节点...', 2000);
                                setTimeout(() => window.location.reload(), 2000);
                            }
                        }, 1000);
                    } else {
                        utils.showMessage('❌ 文档导入取消或失败', 3000);
                    }
                } else {
                    console.error('MD文档导入功能未找到');
                    utils.showMessage('❌ MD文档导入功能未找到', 3000);
                    
                    // 降级到传统导入
                    document.getElementById('import_file_input').click();
                }
            } catch (error) {
                console.error('MD文档导入错误:', error);
                utils.showMessage(`❌ 导入失败: ${error.message}`, 5000);
                
                // 降级到传统导入
                document.getElementById('import_file_input').click();
            }
        });
    }

    // 保留旧的导入输入处理作为备用
    const importInput = document.getElementById('import_file_input');
    if (importInput) {
        importInput.addEventListener('change', (e) => {
            // 备用：传统JSON格式导入
            storageService.importMindmapData(e.target.files[0]);
        });
    }

    const syncTagsBtn = document.getElementById('sync_tags_button');
    if (syncTagsBtn) {
        syncTagsBtn.addEventListener('click', () => {
            nodeService.syncTagsFromWorkspace();
        });
    }

    const showGuideBtn = document.getElementById('show_guide_button');
    if (showGuideBtn) {
        showGuideBtn.addEventListener('click', () => {
            uiController.showUserGuide();
        });
    }
}

/**
 * 绑定标签页事件
 */
function bindTabEvents() {
    // 绑定思维导图标签页切换
    document.getElementById('tab_button_workspace')?.addEventListener('click', () => {
        uiController.switchMindmapTab('workspace');
    });
    document.getElementById('tab_button_knowledge')?.addEventListener('click', () => {
        uiController.switchMindmapTab('knowledge');
    });
    document.getElementById('tab_button_project')?.addEventListener('click', () => {
        uiController.switchMindmapTab('project');
    });
    
    // 绑定详情面板标签页切换
    document.getElementById('detail_tab_detail')?.addEventListener('click', () => {
        uiController.switchDetailTab('detail');
    });
    document.getElementById('detail_tab_injection')?.addEventListener('click', () => {
        uiController.switchDetailTab('injection');
    });
    document.getElementById('detail_tab_project')?.addEventListener('click', () => {
        uiController.switchDetailTab('project');
    });
    
    console.log('✅ [App] 标签页事件绑定完成');
}

/**
 * 绑定全局快捷键
 */
function bindGlobalKeyboardEvents() {
    document.addEventListener('keydown', (e) => {
        // Ctrl+S 保存
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            storageService.saveData();
            utils.showMessage('💾 数据已保存', 1500);
        }
        
        // Ctrl+Z 撤销 (TODO: 实现撤销功能)
        if (e.ctrlKey && e.key === 'z') {
            e.preventDefault();
            // utils.showMessage('撤销功能开发中...', 1500);
        }
        
        // ESC 关闭模态框
        if (e.key === 'Escape') {
            // 关闭任何打开的模态框
            const modals = document.querySelectorAll('.template-manager-modal');
            modals.forEach(modal => {
                if (modal.style.display !== 'none') {
                    modal.style.display = 'none';
                }
            });
        }
    });
}

/**
 * 初始化数据同步
 */
function initializeDataSync() {
    // 同步思维导图数据与节点数据库
    Object.keys(state.mindmapData).forEach(mapId => {
        const mapData = state.mindmapData[mapId];
        if (mapData && mapData.data) {
            nodeService.traverseAndSyncNode(mapData.data, mapId);
        }
    });
}

/**
 * 设置全局函数映射（兼容性支持）
 * 确保HTML中的内联事件可以调用模块化函数
 */
function setupGlobalFunctionMapping() {
    console.log('🔗 [App] 设置全局函数映射...');
    
    // 映射UI控制函数
    window.switchMindmapTab = uiController.switchMindmapTab;
    window.getCurrentJsMind = uiController.getCurrentJsMind;
    
    // 映射节点详情函数
    window.showNodeDetails = (node) => {
        nodeDetailsUI.showNodeDetails(node);
    };
    
    // 映射思维导图服务函数
    window.initMindmaps = mindmapService.initMindmaps;
    
    // 映射数据管理函数
    window.autoSaveData = storageService.autoSaveData;
    window.loadSavedData = storageService.loadSavedData;
    window.setupAutoSave = storageService.setupAutoSave;
    
    // 映射会话管理函数
    window.initializeNodeSessions = SessionService.initialize;
    window.generateFullMarkdownContent = SessionService.generateMarkdown;
    window.updateNodeFullContent = SessionService.updateFullContent;
    window.addNewSession = SessionService.addSession;
    window.renderSessionList = SessionService.renderList;
    window.selectSession = SessionService.selectSession;
    window.clearAllSessions = SessionService.clearAll;
    window.viewAllSessions = SessionService.viewAll;
    window.saveSessionData = SessionService.save;
    window.loadSessionData = SessionService.load;
    window.parseContentToSessions = SessionService.parseContent;
    window.toggleQAMode = SessionService.toggleQAMode;
    window.copyContentFromEditor = SessionService.copyFromEditor;
    window.pasteContentToEditor = SessionService.pasteToEditor;
    
    // 映射命令注入函数
    window.performCalibration = InjectionService.calibrate;
    window.injectCommand = InjectionService.inject;
    window.checkTemplateAvailability = InjectionService.checkTemplate;
    window.applyTemplate = InjectionService.applyTemplate;
    window.performCommandInjection = InjectionService.performInjection;
    window.executeMouseInjection = InjectionService.executeMouseInjection;
    window.simulatePaste = InjectionService.simulatePaste;
    window.provideUserGuidance = InjectionService.provideGuidance;
    window.logInjectionResult = InjectionService.logResult;
    window.updateLogDisplay = InjectionService.updateLogDisplay;
    window.exportLogs = InjectionService.exportLogs;
    window.clearLogs = InjectionService.clearLogs;
    window.clearCommandInput = InjectionService.clearInput;
    window.updateInjectionStatus = InjectionService.updateStatus;
    window.exportInjectionLogs = InjectionService.exportInjectionLogs;
    
    // 映射模板管理函数
    window.openTemplateManager = TemplateService.open;
    window.initializeTemplateManagerContent = TemplateService.initContent;
    window.bindTemplateManagerEvents = TemplateService.bindEvents;
    window.closeTemplateManager = TemplateService.close;
    window.addNewTemplate = TemplateService.addNew;
    window.toggleTemplateSelection = TemplateService.toggleSelection;
    window.editTemplate = TemplateService.edit;
    window.deleteTemplate = TemplateService.delete;
    window.closeTemplateEditModal = TemplateService.closeEditModal;
    window.saveTemplate = TemplateService.save;
    window.importTemplates = TemplateService.import;
    window.exportTemplates = TemplateService.export;
    window.updateSelectedTemplatesList = TemplateService.updateSelectedList;
    window.syncTemplateManagerSelection = TemplateService.syncSelection;
    window.useSelectedTemplates = TemplateService.useSelected;
    window.removeSelectedTemplate = TemplateService.removeSelected;
    window.toggleFilterTag = TemplateService.toggleFilter;
    window.filterTemplates = TemplateService.filter;
    window.getFilterDisplayNames = TemplateService.getFilterNames;
    window.onTemplateSceneChanged = TemplateService.onSceneChanged;
    window.onTemplateVersionChanged = TemplateService.onVersionChanged;
    window.testTemplate = TemplateService.test;
    
    // 映射UI分割器函数
    window.initializeDetailSplitter = Splitter.initializeDetailSplitter;
    window.initializeSidePanelSplitter = Splitter.initializeSidePanelSplitter;
    
    // 映射工具函数
    window.showMessage = utils.showMessage;
    window.copyToClipboard = InjectionService.copyToClipboard;
    window.sleep = InjectionService.sleep;
    
    // 映射事件总线（用于标签着色等功能）
    window.eventBus = {
        publish: (eventName, data) => {
            import('./services/event_bus.js').then(eventBus => {
                eventBus.publish(eventName, data);
            });
        },
        subscribe: (eventName, callback) => {
            import('./services/event_bus.js').then(eventBus => {
                return eventBus.subscribe(eventName, callback);
            });
        }
    };
    
    console.log('✅ [App] 全局函数映射完成');
}

/**
 * Main application initialization
 */
function main() {
    console.log('🚀 [App] Starting NodeMind application...');
    
    try {
        // 初始化全局变量（兼容性）
        initializeGlobalVariables();
        
        // 设置全局函数映射
        setupGlobalFunctionMapping();
        
        // 初始化思维导图数据
        initializeMindmapData();
        
        // 初始化数据同步
        initializeDataSync();
        
        // 绑定全局键盘事件
        bindGlobalKeyboardEvents();
        
        // 绑定标签页事件
        bindTabEvents();
        
        // 绑定工具栏事件
        bindToolbarEvents();
        
        // 绑定应用级事件监听器
        bindAppEventListeners();
        
        // 初始化思维导图 - 使用模块化的函数
        mindmapService.initMindmaps();
        
        // 初始化节点着色服务
        nodeColoringService.initialize();
        
        // 延迟添加DOM事件监听器，确保思维导图已完全初始化
        setTimeout(() => {
            console.log('🔗 [App] 添加DOM事件监听器...');
            mindmapService.addEventListenersToAllMindmaps();
        }, 500);
        
        // 绑定其他事件监听器
        bindEventListeners();
        
        // 绑定UI控制器的事件监听器（模块化）
        uiController.bindUIEventListeners();
        
        // 加载保存的数据 - 使用模块化的函数
        storageService.loadSavedData();
        
        // 设置自动保存 - 使用模块化的函数
        storageService.setupAutoSave();
        
        // 更新项目信息显示
        updateProjectInfoDisplay();
        
        // 更新布局高度
        uiController.updateLayoutHeight();
        
        console.log('✅ [App] Application initialized successfully');
        
    } catch (error) {
        console.error('❌ [App] Failed to initialize application:', error);
        utils.showMessage('应用初始化失败，请刷新页面重试', 5000);
    }
}

/**
 * 初始化全局变量（兼容性支持）
 */
function initializeGlobalVariables() {
    console.log('🔧 [App] 初始化全局变量...');
    
    // 初始化思维导图实例容器
    if (!window.mindmaps) {
        window.mindmaps = {};
    }
    
    // 初始化节点数据库
    if (!window.nodeDatabase) {
        window.nodeDatabase = {};
    }
    
    // 初始化项目信息
    if (!window.projectInfo) {
        window.projectInfo = {
            name: 'NodeMind 思维导图',
            path: '未设置',
            description: '基于jsMind的思维导图应用',
            author: 'NodeMind Team',
            version: '1.0.0'
        };
    }
    
    // 初始化选中状态
    if (!window.selectedNodeId) {
        window.selectedNodeId = null;
    }
    
    if (!window.currentMindmap) {
        window.currentMindmap = 'project';
    }
    
    // 初始化存储键
    if (!window.STORAGE_KEYS) {
        window.STORAGE_KEYS = {
            NODE_DATABASE: 'nodemind_node_database',
            MINDMAP_DATA: 'nodemind_mindmap_data',
            LAST_SAVED_PATH: 'nodemind_last_saved_path',
            PROJECT_INFO: 'nodemind_project_info'
        };
    }
    
    console.log('✅ [App] 全局变量初始化完成');
}

// Run the app once the DOM is fully loaded
window.addEventListener('load', main);

// 自动保存当前编辑节点的详细内容
function autoSaveCurrentNodeDetails() {
    const { currentEditingNodeId, nodeDatabase } = getState();
    if (!currentEditingNodeId) return;

    try {
        const titleEl = document.getElementById('node_title_' + currentEditingNodeId);
        const contentEl = document.getElementById('node_content_' + currentEditingNodeId);
        const authorEl = document.getElementById('node_author_' + currentEditingNodeId);
        
        if (titleEl && contentEl && authorEl && nodeDatabase[currentEditingNodeId]) {
            const currentNodeData = nodeDatabase[currentEditingNodeId];
            let hasChanges = false;

            if (titleEl.value !== currentNodeData.title) {
                currentNodeData.title = titleEl.value;
                hasChanges = true;
                mindmapService.updateNode(currentEditingNodeId, titleEl.value);
            }
            if (contentEl.value !== currentNodeData.content) {
                currentNodeData.content = contentEl.value;
                hasChanges = true;
            }
            if (authorEl.value !== currentNodeData.author) {
                currentNodeData.author = authorEl.value;
                hasChanges = true;
            }

            if (hasChanges) {
                currentNodeData.time.modified = new Date().toLocaleString();
                setState({ nodeDatabase });
                showMessage('💾 内容已自动保存', 1500);
            }
        }
    } catch (error) {
        console.error('❌ 自动保存节点详情失败:', error);
        // eventBus.publish('error', '自动保存节点详情失败');
    }
}

// 绑定所有事件监听器
function bindEventListeners() {
    // 主题切换
    const themeSelect = document.getElementById('theme-select');
    if (themeSelect) {
        themeSelect.addEventListener('change', (e) => {
            mindmapService.setMindMapTheme(e.target.value);
        });
    }

    // 节点操作
    const addNodeBtn = document.getElementById('add-node-btn');
    if (addNodeBtn) {
        addNodeBtn.addEventListener('click', () => {
            const { jm } = getState();
            if (!jm) return;
            const selectedNode = jm.get_selected_node();
            if (selectedNode) {
                const nodeId = jsMind.util.uuid.newid();
                mindmapService.addNode(selectedNode.id, nodeId, 'New Node');
            } else {
                alert('Please select a node first.');
            }
        });
    }
    
    const removeNodeBtn = document.getElementById('remove-node-btn');
    if(removeNodeBtn) {
        removeNodeBtn.addEventListener('click', () => {
            const { jm } = getState();
            if (!jm) return;
            const selectedNode = jm.get_selected_node();
            if (selectedNode && !selectedNode.isroot) {
                mindmapService.removeNode(selectedNode.id);
            } else {
                alert('Cannot remove the root node.');
            }
        });
    }

    // 截图
    const screenshotBtn = document.getElementById('screenshot-btn');
    if(screenshotBtn) {
        screenshotBtn.addEventListener('click', mindmapService.getScreenshot);
    }

    // 文件操作
    const newFileBtn = document.getElementById('new-file-btn');
    if(newFileBtn) {
        newFileBtn.addEventListener('click', createNewMindmap);
    }
    const openFileBtn = document.getElementById('open-file-btn');
    if(openFileBtn) {
        openFileBtn.addEventListener('click', () => { /* storageService.triggerImport */ });
    }
    const saveFileBtn = document.getElementById('save-file-btn');
    if(saveFileBtn) {
        saveFileBtn.addEventListener('click', () => {
            // const { projectInfo } = getState();
            // storageService.exportToCustomFile(projectInfo.name);
        });
    }
    
    // 自动保存节点详情的输入事件
    const nodeDetailContainer = document.getElementById('node-details-content');
    if(nodeDetailContainer){
        nodeDetailContainer.addEventListener('input', (e) => {
            if (e.target.matches('.node-detail-field')) {
                 autoSaveCurrentNodeDetails();
            }
        });
    }

    // 暗黑模式切换
    const toggleDarkModeBtn = document.getElementById('toggle-dark-mode');
    if(toggleDarkModeBtn) {
        toggleDarkModeBtn.addEventListener('click', toggleDarkMode);
    }
    
    // 选中节点事件
    const { jm } = getState();
    if(jm) {
        jm.add_event_listener((type, data) => {
            if (type === 'select_node') {
                // 使用全局映射的showNodeDetails函数，传递完整的node对象
                if (typeof window.showNodeDetails === 'function') {
                    window.showNodeDetails(data.node);
                }
                updateSelectedNodeDisplay();
            }
        });
    }
}

// 创建新的脑图
function createNewMindmap() {
    if (confirm('确定要创建新的脑图吗？未保存的更改将丢失。')) {
        mindmapService.clearMindMap();
        setProjectInfo({ name: 'Untitled', path: '' });
        updateProjectInfoDisplay();
    }
}

// UI Controller
// ----------------------------------------------------------------

function updateProjectInfoDisplay() {
    const { projectInfo } = getState();
    const nameElements = document.querySelectorAll('#project-name-display');
    nameElements.forEach(el => {
        el.textContent = projectInfo.name || 'Untitled';
        el.title = projectInfo.path || 'No file loaded';
    });
}

// showMessage函数已迁移到utils.js，通过全局映射使用

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
}

function updateSelectedNodeDisplay() {
    // Placeholder for updating UI based on selected node
}

// 导出主要函数供其他模块使用
export { main, bindAppEventListeners }; 