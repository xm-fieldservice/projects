/**
 * @file tag_service.js
 * @description 标签管理服务
 * 
 * 职责:
 * - 管理节点标签
 * - 处理标签相关的操作
 */

import state from './state.js';

/**
 * 为节点添加标签
 * @param {string} nodeId - 节点ID
 * @param {string} tagType - 标签类型 (categories, technical, status, custom, future)
 * @param {string} tag - 标签内容
 */
export function addNodeTag(nodeId, tagType, tag) {
    if (!state.state.nodeDatabase[nodeId]) {
        console.warn(`节点 ${nodeId} 不存在`);
        return;
    }
    
    if (!state.state.nodeDatabase[nodeId].tags[tagType]) {
        state.state.nodeDatabase[nodeId].tags[tagType] = [];
    }
    
    if (!state.state.nodeDatabase[nodeId].tags[tagType].includes(tag)) {
        state.state.nodeDatabase[nodeId].tags[tagType].push(tag);
        state.state.nodeDatabase[nodeId].time.modified = new Date().toLocaleString();
        console.log(`🏷️ 为节点 ${nodeId} 添加 ${tagType} 标签: ${tag}`);
    }
}

/**
 * 从节点移除标签
 * @param {string} nodeId - 节点ID
 * @param {string} tagType - 标签类型
 * @param {string} tag - 标签内容
 */
export function removeNodeTag(nodeId, tagType, tag) {
    if (!state.state.nodeDatabase[nodeId] || !state.state.nodeDatabase[nodeId].tags[tagType]) {
        return;
    }
    
    const index = state.state.nodeDatabase[nodeId].tags[tagType].indexOf(tag);
    if (index > -1) {
        state.state.nodeDatabase[nodeId].tags[tagType].splice(index, 1);
        state.state.nodeDatabase[nodeId].time.modified = new Date().toLocaleString();
        console.log(`🗑️ 从节点 ${nodeId} 移除 ${tagType} 标签: ${tag}`);
    }
}

/**
 * 获取节点的所有标签
 * @param {string} nodeId - 节点ID
 * @returns {Object} 标签对象
 */
export function getNodeTags(nodeId) {
    if (!state.state.nodeDatabase[nodeId]) {
        return { categories: [], technical: [], status: [], custom: [], future: [] };
    }
    return state.state.nodeDatabase[nodeId].tags;
}

/**
 * 切换节点状态标签
 * @param {string} nodeId - 节点ID
 * @param {string} statusTag - 状态标签
 */
export function toggleNodeStatusTag(nodeId, statusTag) {
    if (!state.state.nodeDatabase[nodeId]) {
        console.warn(`节点 ${nodeId} 不存在`);
        return;
    }
    
    if (!state.state.nodeDatabase[nodeId].statusTags) {
        state.state.nodeDatabase[nodeId].statusTags = [];
    }
    
    const index = state.state.nodeDatabase[nodeId].statusTags.indexOf(statusTag);
    if (index > -1) {
        state.state.nodeDatabase[nodeId].statusTags.splice(index, 1);
        console.log(`🔄 移除节点 ${nodeId} 状态标签: ${statusTag}`);
    } else {
        state.state.nodeDatabase[nodeId].statusTags.push(statusTag);
        console.log(`🔄 添加节点 ${nodeId} 状态标签: ${statusTag}`);
    }
    
    state.state.nodeDatabase[nodeId].time.modified = new Date().toLocaleString();
}

export default {
    addNodeTag,
    removeNodeTag,
    getNodeTags,
    toggleNodeStatusTag
}; 