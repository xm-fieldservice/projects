import { state } from '../state.js';
import { showMessage } from '../utils/utils.js';
import { copyNodeTree } from '../services/mindmap_service.js';

/**
 * 显示右键菜单
 * @param {number} x - 屏幕x坐标
 * @param {number} y - 屏幕y坐标
 */
export function showContextMenu(x, y) {
    const menu = document.getElementById('contextMenu');
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
    menu.style.display = 'block';

    const rect = menu.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
        menu.style.left = `${x - rect.width}px`;
    }
    if (rect.bottom > window.innerHeight) {
        menu.style.top = `${y - rect.height}px`;
    }
}

/**
 * 隐藏右键菜单
 */
export function hideContextMenu() {
    const menu = document.getElementById('contextMenu');
    menu.style.display = 'none';
    state.contextMenuTargetNode = null;
}

/**
 * 将焦点节点复制到临时工作区
 */
export function focusNodeToWorkspaces() {
    if (!state.contextMenuTargetNode) {
        hideContextMenu();
        return;
    }

    try {
        const nodeTree = copyNodeTree(state.contextMenuTargetNode);

        const workspaceData = {
            meta: { name: `临时工作区A - ${state.contextMenuTargetNode.topic}`, author: "NodeMind", version: "1.0.0" },
            format: "node_tree",
            data: nodeTree
        };
        state.mindmaps.workspace.show(workspaceData);

        const knowledgeData = {
            meta: { name: `临时工作区B - ${state.contextMenuTargetNode.topic}`, author: "NodeMind", version: "1.0.0" },
            format: "node_tree",
            data: nodeTree
        };
        state.mindmaps.knowledge.show(knowledgeData);

        showMessage(`🔬 已将焦点节点"${state.contextMenuTargetNode.topic}"复制到临时工作区`);
        console.log('✅ 焦点节点已复制到临时工作区:', state.contextMenuTargetNode.topic);

        hideContextMenu();

    } catch (error) {
        console.error('❌ 复制节点到临时工作区失败:', error);
        showMessage(`❌ 复制失败: ${error.message}`);
        hideContextMenu();
    }
} 