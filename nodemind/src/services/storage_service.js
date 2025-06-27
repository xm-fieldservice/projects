/**
 * @file storage_service.js
 * @description 存储服务模块
 * 
 * 职责:
 * - 封装所有与数据持久化相关的逻辑。
 * - 包括与 localStorage 的交互（自动保存、加载）。
 * - 包括与文件系统的交互（导入、导出）。
 */

// 导入所需的状态和设置器
import state, {
    getState,
    setState,
    setLastSavedFilePath,
    setNodeDatabase,
    setCurrentMindmap,
    setProjectInfo
} from './state.js';

// 导入可能需要的辅助函数
import * as mindmapService from './mindmap_service.js';
import { publish } from './event_bus.js';
import { STORAGE_KEYS } from '../config.js';
import { getCurrentJsMind } from './mindmap_service.js';
import { showMessage, getAutoSaveFileName } from '../utils/utils.js';
import { autoSaveCurrentNodeDetails } from '../ui/components/node_details_ui.js';
import { validateAndFixNodeDatabase, initNodeDatabase } from './node_service.js';
import { switchMindmapTab } from '../controllers/ui_controller.js';
import { showNodeDetails } from '../ui/components/node_details_ui.js';

const storageService = (() => {
    const STORAGE_KEYS = {
        MINDMAP_DATA: 'nodemind_mindmap_data',
        NODE_DATABASE: 'nodemind_node_database',
        LAST_SAVED_PATH: 'nodemind_last_saved_path'
    };

    function checkStorageStatus() {
        try {
            localStorage.setItem('test', 'test');
            localStorage.removeItem('test');
        } catch (e) {
            publish('error', '本地存储功能被禁用或不可用，部分功能（如自动保存）将无法正常工作。');
        }
    }

    function autoSaveData() {
        try {
            console.log('💾 [StorageService] 开始自动保存...');
            
            // 保存思维导图数据
            const mindmapDataToSave = {
                workspace: window.mindmaps.workspace ? window.mindmaps.workspace.get_data() : window.mindmapData?.workspace,
                knowledge: window.mindmaps.knowledge ? window.mindmaps.knowledge.get_data() : window.mindmapData?.knowledge,
                project: window.mindmaps.project ? window.mindmaps.project.get_data() : window.mindmapData?.project
            };
            
                         localStorage.setItem(window.STORAGE_KEYS.MINDMAP_DATA, JSON.stringify(mindmapDataToSave));
             localStorage.setItem(window.STORAGE_KEYS.NODE_DATABASE, JSON.stringify(window.nodeDatabase));
             localStorage.setItem(window.STORAGE_KEYS.PROJECT_INFO, JSON.stringify(window.projectInfo));
             localStorage.setItem(window.STORAGE_KEYS.SELECTED_NODE, window.selectedNodeId || '');
            
            // *** 关键修复：同时保存会话数据 ***
            if (window.sessionDatabase) {
                localStorage.setItem('nodemind_sessions', JSON.stringify(window.sessionDatabase));
            }
            
            console.log('💾 [StorageService] 自动保存完成');
            return true;
        } catch (error) {
            console.error('❌ [StorageService] 自动保存失败:', error);
            // 调用消息显示函数
            if (typeof window.showMessage === 'function') {
                window.showMessage('❌ 自动保存失败: ' + error.message, 3000);
            }
            return false;
        }
    }

    function loadSavedData() {
        try {
            console.log('📂 [StorageService] 开始加载数据...');
            
                         // 加载思维导图数据
             const savedMindmapData = localStorage.getItem(window.STORAGE_KEYS.MINDMAP_DATA);
             if (savedMindmapData) {
                 const parsedData = JSON.parse(savedMindmapData);
                 if (window.mindmapData) {
                     Object.assign(window.mindmapData, parsedData);
                 }
                 console.log('📂 [StorageService] 思维导图数据已加载');
             }
             
             // 加载节点数据库
             const savedNodeDatabase = localStorage.getItem(window.STORAGE_KEYS.NODE_DATABASE);
             if (savedNodeDatabase) {
                 window.nodeDatabase = JSON.parse(savedNodeDatabase);
                 console.log('📂 [StorageService] 节点数据库已加载');
             }
            
            // *** 关键修复：加载会话数据 ***
            const savedSessionData = localStorage.getItem('nodemind_sessions');
            if (savedSessionData) {
                window.sessionDatabase = JSON.parse(savedSessionData);
                console.log('📂 [StorageService] 会话数据已加载');
            } else {
                window.sessionDatabase = {};
                console.log('📂 [StorageService] 初始化空会话数据库');
            }
            
                         // 加载项目信息
             const savedProjectInfo = localStorage.getItem(window.STORAGE_KEYS.PROJECT_INFO);
             if (savedProjectInfo) {
                 if (window.projectInfo) {
                     Object.assign(window.projectInfo, JSON.parse(savedProjectInfo));
                 }
                 console.log('📂 [StorageService] 项目信息已加载');
             }
             
             // 加载选中节点
             const savedSelectedNode = localStorage.getItem(window.STORAGE_KEYS.SELECTED_NODE);
             if (savedSelectedNode) {
                 window.selectedNodeId = savedSelectedNode;
             }
            
            // 延迟执行任务管理更新，确保数据加载完成
            setTimeout(() => {
                if (typeof window.updateTaskManagement === 'function') {
                    window.updateTaskManagement();
                }
            }, 500);
            
            console.log('✅ [StorageService] 数据加载完成');
            return true;
        } catch (error) {
            console.error('❌ [StorageService] 数据加载失败:', error);
            return false;
        }
    }

    function setupAutoSave() {
        console.log('🔄 [StorageService] 启动自动保存系统...');
        
        // 定时自动保存（每30秒）
        setInterval(autoSaveData, 30000);
        
        // 页面关闭前保存
        window.addEventListener('beforeunload', function(e) {
            autoSaveData();
        });
        
        // 页面失去焦点时保存
        window.addEventListener('blur', function() {
            autoSaveData();
        });
        
        console.log('🔄 [StorageService] 自动保存系统已启动');
    }

    function setupFileAutoSave() {
        if (state.autoSaveFileTimer) {
            clearInterval(state.autoSaveFileTimer);
        }
        state.autoSaveFileTimer = setInterval(() => {
            if (state.lastSavedFilePath) {
                autoSaveToFile();
            }
        }, 120000); // 2 minutes
        console.log('🕒 文件自动保存定时器已启动（每2分钟）');
    }

    function autoSaveToFile() {
        // ... Implementation will be moved here ...
    }

    async function exportToCustomFile(defaultName) {
        const mind = mindmapService.getMindMapData('node_tree');
        const { nodeDatabase } = getState();
        const dataToSave = {
            ...mind,
            node_database: nodeDatabase
        };
        const content = JSON.stringify(dataToSave, null, 4);
        const filename = `${defaultName || 'nodemind'}.jm`;

        try {
            const handle = await window.showSaveFilePicker({
                suggestedName: filename,
                types: [{
                    description: 'jsMind Files',
                    accept: { 'application/json': ['.jm'] },
                }],
            });
            const writable = await handle.createWritable();
            await writable.write(content);
            await writable.close();
            setState({ lastSavedFilePath: handle.name });
            publish('dataLoaded', { name: defaultName, path: handle.name });
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error('File save failed:', err);
            }
        }
    }

    function triggerImport() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.jm,application/json';
        input.onchange = e => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function(event) {
                try {
                    const fileContent = JSON.parse(event.target.result);
                    const mindData = {
                        meta: fileContent.meta,
                        format: fileContent.format,
                        data: fileContent.data
                    };
                    publish('mindmapDataImported', mindData);
                    
                    if (fileContent.node_database) {
                        setState({ nodeDatabase: fileContent.node_database });
                    }

                    publish('dataLoaded', { name: fileContent.meta.name, path: file.name });
                    
                } catch (err) {
                    publish('error', '文件格式无效或已损坏。');
                    console.error('Error parsing imported file:', err);
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }

    return {
        checkStorageStatus,
        autoSaveData,
        loadSavedData,
        setupAutoSave,
        setupFileAutoSave,
        autoSaveToFile,
        exportToCustomFile,
        triggerImport
    };
})();

export default storageService;
