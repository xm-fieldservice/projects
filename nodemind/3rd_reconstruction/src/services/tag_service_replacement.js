/**
 * @file tag_service_replacement.js
 * @description 基于万能数据架构的标签管理服务 - 直接替换版本
 * 
 * 职责:
 * - 管理节点标签（使用万能数据架构）
 * - 处理标签相关的操作
 * - 完全兼容原有API
 * - 提供增强功能
 */

import { getUniversalDataService } from '../core/universal_data_service.js';
import { getUIIntegrationAdapter } from '../adapters/ui_integration_adapter.js';

// 获取服务实例
const universalService = getUniversalDataService();
const uiAdapter = getUIIntegrationAdapter();

/**
 * 为节点添加标签
 * @param {string} nodeId - 节点ID
 * @param {string} tagType - 标签类型 (categories, technical, status, custom, future)
 * @param {string} tag - 标签内容
 */
export function addNodeTag(nodeId, tagType, tag) {
    try {
        // 获取节点数据
        let nodeData = universalService.get(nodeId);
        
        if (!nodeData) {
            console.warn(`节点 ${nodeId} 不存在，创建新节点`);
            // 创建新节点
            const result = universalService.add(`# 节点 ${nodeId}\n\n新创建的节点`, 'node-editor');
            nodeData = result.data;
            // 更新nodeId为实际ID
            nodeId = nodeData.id;
        }

        // 构建标签标记
        const tagMarker = buildTagMarker(tagType, tag);
        
        // 获取当前内容
        let content = nodeData.content || nodeData.title || '';
        
        // 检查标签是否已存在
        if (content.includes(tagMarker)) {
            console.log(`标签 ${tagMarker} 已存在于节点 ${nodeId}`);
            return;
        }
        
        // 添加标签到内容
        content = addTagToContent(content, tagMarker);
        
        // 更新节点
        const updateResult = universalService.update(nodeId, content, 'node-editor');
        
        console.log(`🏷️ [万能架构] 为节点 ${nodeId} 添加 ${tagType} 标签: ${tag}`);
        
        // 同步到原有state系统（如果需要）
        syncToLegacyState(nodeId, updateResult);
        
        return updateResult;
        
    } catch (error) {
        console.error('添加标签失败:', error);
        // 这里可以添加回退逻辑
        throw error;
    }
}

/**
 * 从节点移除标签
 * @param {string} nodeId - 节点ID
 * @param {string} tagType - 标签类型
 * @param {string} tag - 标签内容
 */
export function removeNodeTag(nodeId, tagType, tag) {
    try {
        const nodeData = universalService.get(nodeId);
        
        if (!nodeData) {
            console.warn(`节点 ${nodeId} 不存在`);
            return;
        }
        
        // 构建标签标记
        const tagMarker = buildTagMarker(tagType, tag);
        
        // 获取当前内容
        let content = nodeData.content || nodeData.title || '';
        
        // 移除标签
        content = removeTagFromContent(content, tagMarker);
        
        // 更新节点
        const updateResult = universalService.update(nodeId, content, 'node-editor');
        
        console.log(`🗑️ [万能架构] 从节点 ${nodeId} 移除 ${tagType} 标签: ${tag}`);
        
        // 同步到原有state系统
        syncToLegacyState(nodeId, updateResult);
        
        return updateResult;
        
    } catch (error) {
        console.error('移除标签失败:', error);
        throw error;
    }
}

/**
 * 获取节点的所有标签
 * @param {string} nodeId - 节点ID
 * @returns {Object} 标签对象
 */
export function getNodeTags(nodeId) {
    try {
        const nodeData = universalService.get(nodeId);
        
        if (!nodeData) {
            return { categories: [], technical: [], status: [], custom: [], future: [] };
        }
        
        // 使用UI适配器转换标签格式
        const legacyTags = uiAdapter.convertTagsToLegacyFormat(nodeData);
        
        console.log(`📋 [万能架构] 获取节点 ${nodeId} 标签:`, legacyTags);
        
        return legacyTags;
        
    } catch (error) {
        console.error('获取标签失败:', error);
        return { categories: [], technical: [], status: [], custom: [], future: [] };
    }
}

/**
 * 切换节点状态标签
 * @param {string} nodeId - 节点ID
 * @param {string} statusTag - 状态标签
 */
export function toggleNodeStatusTag(nodeId, statusTag) {
    try {
        const nodeData = universalService.get(nodeId);
        
        if (!nodeData) {
            console.warn(`节点 ${nodeId} 不存在`);
            return;
        }
        
        // 获取当前标签
        const currentTags = getNodeTags(nodeId);
        const hasTag = currentTags.status.includes(statusTag);
        
        if (hasTag) {
            // 移除标签
            removeNodeTag(nodeId, 'status', statusTag);
            console.log(`🔄 [万能架构] 移除节点 ${nodeId} 状态标签: ${statusTag}`);
        } else {
            // 添加标签
            addNodeTag(nodeId, 'status', statusTag);
            console.log(`🔄 [万能架构] 添加节点 ${nodeId} 状态标签: ${statusTag}`);
        }
        
    } catch (error) {
        console.error('切换状态标签失败:', error);
        throw error;
    }
}

/**
 * 构建标签标记
 * @param {string} tagType - 标签类型
 * @param {string} tag - 标签内容
 * @returns {string} 标签标记
 */
function buildTagMarker(tagType, tag) {
    // 根据标签类型构建不同的标记格式
    switch (tagType) {
        case 'status':
            return `#${tag}`;
        case 'technical':
            return `#${tag}`;
        case 'categories':
            return `#${tag}`;
        case 'custom':
            return tag.startsWith('#') ? tag : `#${tag}`;
        case 'future':
            return `#未来-${tag}`;
        default:
            return tag.startsWith('#') ? tag : `#${tag}`;
    }
}

/**
 * 将标签添加到内容中
 * @param {string} content - 原内容
 * @param {string} tagMarker - 标签标记
 * @returns {string} 更新后的内容
 */
function addTagToContent(content, tagMarker) {
    // 检查内容末尾是否已有标签区域
    const lines = content.split('\n');
    const lastLine = lines[lines.length - 1];
    
    // 如果最后一行包含标签，直接添加
    if (lastLine.includes('#')) {
        lines[lines.length - 1] = lastLine + ' ' + tagMarker;
    } else {
        // 否则新增一行
        lines.push('');
        lines.push(tagMarker);
    }
    
    return lines.join('\n');
}

/**
 * 从内容中移除标签
 * @param {string} content - 原内容
 * @param {string} tagMarker - 标签标记
 * @returns {string} 更新后的内容
 */
function removeTagFromContent(content, tagMarker) {
    // 移除指定标签
    let updatedContent = content.replace(new RegExp(`\\s*${escapeRegExp(tagMarker)}\\s*`, 'g'), ' ');
    
    // 清理多余的空格
    updatedContent = updatedContent.replace(/\s+/g, ' ').trim();
    
    return updatedContent;
}

/**
 * 转义正则表达式特殊字符
 * @param {string} string - 要转义的字符串
 * @returns {string} 转义后的字符串
 */
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * 同步到原有state系统（保持兼容性）
 * @param {string} nodeId - 节点ID
 * @param {Object} nodeData - 节点数据
 */
function syncToLegacyState(nodeId, nodeData) {
    // 这里可以添加与原有state系统的同步逻辑
    // 确保在过渡期间两套系统的数据保持一致
    
    try {
        // 检查是否存在原有的state系统
        if (typeof window !== 'undefined' && window.state) {
            // 更新原有state中的数据
            if (window.state.nodeDatabase && window.state.nodeDatabase[nodeId]) {
                const legacyTags = getNodeTags(nodeId);
                window.state.nodeDatabase[nodeId].tags = legacyTags;
                window.state.nodeDatabase[nodeId].time.modified = new Date().toLocaleString();
            }
        }
    } catch (error) {
        console.warn('同步到原有state系统失败:', error);
    }
}

/**
 * 获取所有标签统计
 * @returns {Object} 标签统计信息
 */
export function getTagStatistics() {
    try {
        const allData = Array.from(universalService.dataStore.values());
        const tagStats = {
            total: 0,
            byType: {
                categories: new Set(),
                technical: new Set(),
                status: new Set(),
                custom: new Set(),
                future: new Set()
            },
            usage: {}
        };
        
        allData.forEach(item => {
            if (item.explicitMarkers && item.explicitMarkers.allTags) {
                item.explicitMarkers.allTags.forEach(tag => {
                    tagStats.total++;
                    tagStats.usage[tag] = (tagStats.usage[tag] || 0) + 1;
                    
                    // 分类统计
                    if (item.explicitMarkers.context && item.explicitMarkers.context.length > 0) {
                        item.explicitMarkers.context.forEach(ctx => tagStats.byType.categories.add(ctx));
                    }
                    if (item.explicitMarkers.tech && item.explicitMarkers.tech.length > 0) {
                        item.explicitMarkers.tech.forEach(tech => tagStats.byType.technical.add(tech));
                    }
                    if (item.explicitMarkers.status) {
                        tagStats.byType.status.add(item.explicitMarkers.status);
                    }
                });
            }
        });
        
        // 转换Set为Array
        Object.keys(tagStats.byType).forEach(type => {
            tagStats.byType[type] = Array.from(tagStats.byType[type]);
        });
        
        return tagStats;
        
    } catch (error) {
        console.error('获取标签统计失败:', error);
        return { total: 0, byType: {}, usage: {} };
    }
}

/**
 * 批量更新节点标签
 * @param {Array} operations - 操作列表 [{nodeId, action, tagType, tag}]
 * @returns {Array} 操作结果列表
 */
export function batchUpdateTags(operations) {
    const results = [];
    
    operations.forEach(op => {
        try {
            let result;
            switch (op.action) {
                case 'add':
                    result = addNodeTag(op.nodeId, op.tagType, op.tag);
                    break;
                case 'remove':
                    result = removeNodeTag(op.nodeId, op.tagType, op.tag);
                    break;
                case 'toggle':
                    result = toggleNodeStatusTag(op.nodeId, op.tag);
                    break;
                default:
                    throw new Error(`未知操作: ${op.action}`);
            }
            
            results.push({
                success: true,
                operation: op,
                result: result
            });
            
        } catch (error) {
            results.push({
                success: false,
                operation: op,
                error: error.message
            });
        }
    });
    
    return results;
}

/**
 * 搜索包含特定标签的节点
 * @param {string} tag - 要搜索的标签
 * @param {string} tagType - 标签类型（可选）
 * @returns {Array} 匹配的节点列表
 */
export function searchNodesByTag(tag, tagType = null) {
    try {
        const filters = {
            tags: [tag]
        };
        
        // 获取所有类型的数据
        const allNodes = universalService.getByType('note', filters)
            .concat(universalService.getByType('task', filters))
            .concat(universalService.getByType('template', filters));
        
        // 如果指定了标签类型，进一步过滤
        if (tagType) {
            return allNodes.filter(node => {
                const tags = uiAdapter.convertTagsToLegacyFormat(node);
                return tags[tagType] && tags[tagType].includes(tag);
            });
        }
        
        return allNodes.map(node => ({
            id: node.id,
            title: node.title,
            type: node.finalClassification.type,
            tags: uiAdapter.convertTagsToLegacyFormat(node)
        }));
        
    } catch (error) {
        console.error('搜索节点失败:', error);
        return [];
    }
}

// 导出默认对象以保持兼容性
export default {
    addNodeTag,
    removeNodeTag,
    getNodeTags,
    toggleNodeStatusTag,
    getTagStatistics,
    batchUpdateTags,
    searchNodesByTag
}; 