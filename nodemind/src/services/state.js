/**
 * @file state.js
 * @description 应用的单一状态管理中心
 * 
 * 职责:
 * - 维护整个应用的共享状态。
 * - 提供获取 (get) 和设置 (set) 状态的纯函数。
 * - 避免在其他模块中直接修改状态。
 */

import { v4 as uuidv4 } from 'uuid';

console.log('[state.js] Initializing state...');

const state = {
    projectInfo: {
        name: 'Untitled Project',
        author: 'Author',
        version: '1.0.0',
        description: '',
        documentFileName: '',
        created: null,
        modified: null
    },
    nodeDatabase: {},
    currentMindmap: 'project', // 初始激活的脑图
    selectedNodeId: null,
    jsMindInstances: {}, // Store jsmind instances, e.g., { project: jm, workspace: jm, knowledge: jm }
    autoSaveFileTimer: null,
    documentUpdateTimer: null,
    lastSavedFilePath: null
};

console.log('[state.js] Initial state object:', JSON.parse(JSON.stringify(state)));

function findNodeByIdRecursive(node, id) {
    if (node.id === id) {
        return node;
    }
    if (node.children) {
        for (const child of node.children) {
            const found = findNodeByIdRecursive(child, id);
            if (found) {
                return found;
            }
        }
    }
    return null;
}

function findParentNodeRecursive(node, id, parent = null) {
    if (node.id === id) {
        return parent;
    }
    if (node.children) {
        for (const child of node.children) {
            const found = findParentNodeRecursive(child, id, node);
            if (found) {
                return found;
            }
        }
    }
    return null;
}

// addNode函数已删除 - 未被使用且功能重复

function removeNode(nodeId) {
    console.log(`[state.js] removeNode called with nodeId: ${nodeId}`);
    if (nodeId === 'root' || nodeId.includes('_root')) {
        console.error("[state.js] Cannot remove root node.");
        return;
    }
    
    const currentInstance = state.jsMindInstances[state.currentMindmap];
    if (!currentInstance) {
        console.error(`[state.js] removeNode failed: no jsMind instance for '${state.currentMindmap}'.`);
        return;
    }

    const node = currentInstance.get_node(nodeId);
    if (node) {
        currentInstance.remove_node(nodeId);
        console.log(`[state.js] Node ${nodeId} removed successfully.`);
        
        // Clear selection if the removed node was selected
        if (state.selectedNodeId && state.selectedNodeId === nodeId) {
            setSelectedNodeId(null);
        }
    } else {
        console.error(`[state.js] Node with id "${nodeId}" not found.`);
    }
}

function findNodeById(nodeId) {
    console.log(`[state.js] findNodeById called with nodeId: ${nodeId}`);
    if (!nodeId) {
        return null;
    }
    
    const currentInstance = state.jsMindInstances[state.currentMindmap];
    if (!currentInstance) {
        console.error(`[state.js] findNodeById failed: no jsMind instance for '${state.currentMindmap}'.`);
        return null;
    }
    
    return currentInstance.get_node(nodeId);
}

function setSelectedNodeId(nodeId) {
    console.log(`[state.js] setSelectedNodeId called with nodeId: ${nodeId}`);
    state.selectedNodeId = nodeId;
    console.log('[state.js] state.selectedNodeId is now:', state.selectedNodeId);
}

function getSelectedNodeId() {
    return state.selectedNodeId;
}

function setCurrentMindmap(mapId) {
    console.log(`[state.js] setCurrentMindmap called with mapId: ${mapId}`);
    // Validate that the mapId exists in our supported mindmaps
    const supportedMaps = ['workspace', 'knowledge', 'project'];
    if (supportedMaps.includes(mapId)) {
        state.currentMindmap = mapId;
        console.log('[state.js] state.currentMindmap is now:', state.currentMindmap);
    } else {
        console.error(`[state.js] setCurrentMindmap failed: mindmap '${mapId}' is not supported. Supported maps:`, supportedMaps);
    }
}

function setLastSavedFilePath(path) {
    console.log(`[state.js] setLastSavedFilePath called with path: ${path}`);
    state.lastSavedFilePath = path;
    console.log('[state.js] state.lastSavedFilePath is now:', state.lastSavedFilePath);
}

function setProjectInfo(projectInfo) {
    console.log(`[state.js] setProjectInfo called with projectInfo:`, projectInfo);
    state.projectInfo = { ...state.projectInfo, ...projectInfo };
    console.log('[state.js] state.projectInfo is now:', state.projectInfo);
}

export default {
    state,
    removeNode,
    findNodeById,
    setSelectedNodeId,
    getSelectedNodeId,
    setCurrentMindmap,
    setLastSavedFilePath,
    setProjectInfo
};