/**
 * TagService适配器 - 外科手术式替换的第一个目标
 * 
 * 功能：
 * 1. 保持与原tag_service.js完全相同的API接口
 * 2. 内部使用UniversalDataService的万能数据架构
 * 3. 实现无缝替换，UI层面零感知
 */

import { getUniversalDataService } from '../core/universal_data_service.js';

class TagServiceAdapter {
    constructor() {
        this.universalService = getUniversalDataService();
        this.isEnabled = false; // 特性开关
        
        // 监听数据变化，保持与原有state系统的同步
        this.universalService.on('data:updated:tag', (data) => {
            this.syncToLegacyState(data);
        });
    }

    /**
     * 特性开关控制
     */
    enable() {
        this.isEnabled = true;
        console.log('🔄 TagService适配器已启用 - 使用万能数据架构');
    }

    disable() {
        this.isEnabled = false;
        console.log('🔄 TagService适配器已禁用 - 回退到原有架构');
    }

    /**
     * 为节点添加标签 - 适配原有API
     * @param {string} nodeId - 节点ID
     * @param {string} tagType - 标签类型 (categories, technical, status, custom, future)
     * @param {string} tag - 标签内容
     */
    addNodeTag(nodeId, tagType, tag) {
        if (!this.isEnabled) {
            // 回退到原有逻辑
            return this.fallbackToOriginal('addNodeTag', arguments);
        }

        try {
            // 使用万能数据架构
            const nodeData = this.universalService.get(nodeId);
            
            if (!nodeData) {
                console.warn(`节点 ${nodeId} 不存在`);
                return;
            }

            // 构建标签更新内容
            const updatedContent = this.buildUpdatedTagContent(nodeData, tagType, tag, 'add');
            
            // 通过万能数据架构更新
            const result = this.universalService.update(nodeId, updatedContent, 'tag-manager');
            
            if (result.success) {
                console.log(`🏷️ [万能架构] 为节点 ${nodeId} 添加 ${tagType} 标签: ${tag}`);
            }
            
            return result;
            
        } catch (error) {
            console.error('TagService适配器错误:', error);
            // 出错时回退到原有逻辑
            return this.fallbackToOriginal('addNodeTag', arguments);
        }
    }

    /**
     * 从节点移除标签 - 适配原有API
     * @param {string} nodeId - 节点ID
     * @param {string} tagType - 标签类型
     * @param {string} tag - 标签内容
     */
    removeNodeTag(nodeId, tagType, tag) {
        if (!this.isEnabled) {
            return this.fallbackToOriginal('removeNodeTag', arguments);
        }

        try {
            const nodeData = this.universalService.get(nodeId);
            
            if (!nodeData) {
                return;
            }

            // 构建标签移除内容
            const updatedContent = this.buildUpdatedTagContent(nodeData, tagType, tag, 'remove');
            
            // 通过万能数据架构更新
            const result = this.universalService.update(nodeId, updatedContent, 'tag-manager');
            
            if (result.success) {
                console.log(`🗑️ [万能架构] 从节点 ${nodeId} 移除 ${tagType} 标签: ${tag}`);
            }
            
            return result;
            
        } catch (error) {
            console.error('TagService适配器错误:', error);
            return this.fallbackToOriginal('removeNodeTag', arguments);
        }
    }

    /**
     * 获取节点的所有标签 - 适配原有API
     * @param {string} nodeId - 节点ID
     * @returns {Object} 标签对象
     */
    getNodeTags(nodeId) {
        if (!this.isEnabled) {
            return this.fallbackToOriginal('getNodeTags', arguments);
        }

        try {
            const nodeData = this.universalService.get(nodeId);
            
            if (!nodeData) {
                return { categories: [], technical: [], status: [], custom: [], future: [] };
            }

            // 从万能数据架构中提取标签信息，转换为原有格式
            return this.extractTagsFromUniversalData(nodeData);
            
        } catch (error) {
            console.error('TagService适配器错误:', error);
            return this.fallbackToOriginal('getNodeTags', arguments);
        }
    }

    /**
     * 切换节点状态标签 - 适配原有API
     * @param {string} nodeId - 节点ID
     * @param {string} statusTag - 状态标签
     */
    toggleNodeStatusTag(nodeId, statusTag) {
        if (!this.isEnabled) {
            return this.fallbackToOriginal('toggleNodeStatusTag', arguments);
        }

        try {
            const nodeData = this.universalService.get(nodeId);
            
            if (!nodeData) {
                console.warn(`节点 ${nodeId} 不存在`);
                return;
            }

            // 检查当前是否已有该状态标签
            const currentTags = this.extractTagsFromUniversalData(nodeData);
            const hasTag = currentTags.status.includes(statusTag);
            
            // 构建切换后的内容
            const action = hasTag ? 'remove' : 'add';
            const updatedContent = this.buildUpdatedTagContent(nodeData, 'status', statusTag, action);
            
            // 通过万能数据架构更新
            const result = this.universalService.update(nodeId, updatedContent, 'tag-manager');
            
            if (result.success) {
                const actionText = hasTag ? '移除' : '添加';
                console.log(`🔄 [万能架构] ${actionText}节点 ${nodeId} 状态标签: ${statusTag}`);
            }
            
            return result;
            
        } catch (error) {
            console.error('TagService适配器错误:', error);
            return this.fallbackToOriginal('toggleNodeStatusTag', arguments);
        }
    }

    /**
     * 构建更新后的标签内容
     */
    buildUpdatedTagContent(nodeData, tagType, tag, action) {
        const currentTags = this.extractTagsFromUniversalData(nodeData);
        
        // 根据操作类型更新标签
        if (action === 'add') {
            if (!currentTags[tagType].includes(tag)) {
                currentTags[tagType].push(tag);
            }
        } else if (action === 'remove') {
            const index = currentTags[tagType].indexOf(tag);
            if (index > -1) {
                currentTags[tagType].splice(index, 1);
            }
        }
        
        // 重新构建MD内容，包含更新后的标签
        return this.rebuildContentWithTags(nodeData, currentTags);
    }

    /**
     * 从万能数据中提取标签信息，转换为原有格式
     */
    extractTagsFromUniversalData(nodeData) {
        const result = {
            categories: [],
            technical: [],
            status: [],
            custom: [],
            future: []
        };

        // 从显性标记中提取
        if (nodeData.explicitMarkers) {
            const { explicitMarkers } = nodeData;
            
            // 状态标签
            if (explicitMarkers.status) {
                result.status.push(explicitMarkers.status);
            }
            
            // 技术标签
            if (explicitMarkers.tech && explicitMarkers.tech.length > 0) {
                result.technical.push(...explicitMarkers.tech);
            }
            
            // 上下文标签映射到分类
            if (explicitMarkers.context && explicitMarkers.context.length > 0) {
                result.categories.push(...explicitMarkers.context);
            }
            
            // 其他标签归类为自定义
            const allTags = explicitMarkers.allTags || [];
            const processedTags = [
                ...result.status,
                ...result.technical,
                ...result.categories
            ];
            
            const customTags = allTags.filter(tag => 
                !processedTags.some(processed => tag.includes(processed))
            );
            result.custom.push(...customTags);
        }

        return result;
    }

    /**
     * 重新构建包含标签的MD内容
     */
    rebuildContentWithTags(nodeData, tags) {
        let content = nodeData.content || nodeData.title || '';
        
        // 移除现有标签
        content = content.replace(/#[\w\u4e00-\u9fa5]+/g, '').trim();
        
        // 添加更新后的标签
        const allTags = [
            ...tags.categories.map(t => `#${t}`),
            ...tags.technical.map(t => `#${t}`),
            ...tags.status.map(t => `#${t}`),
            ...tags.custom,
            ...tags.future.map(t => `#${t}`)
        ];
        
        if (allTags.length > 0) {
            content += '\n\n' + allTags.join(' ');
        }
        
        return content;
    }

    /**
     * 同步到原有state系统（保持兼容性）
     */
    syncToLegacyState(data) {
        // 这里可以添加与原有state系统的同步逻辑
        // 确保在过渡期间两套系统的数据保持一致
        console.log('🔄 同步数据到原有state系统:', data.id);
    }

    /**
     * 回退到原有逻辑的安全机制
     */
    fallbackToOriginal(methodName, args) {
        console.warn(`🚨 TagService适配器回退到原有逻辑: ${methodName}`);
        
        // 这里需要导入并调用原有的tag_service
        // 为了避免循环依赖，使用动态导入
        return import('../../../src/services/tag_service.js').then(originalService => {
            return originalService.default[methodName](...args);
        });
    }
}

// 创建单例实例
let tagServiceAdapter = null;

export function getTagServiceAdapter() {
    if (!tagServiceAdapter) {
        tagServiceAdapter = new TagServiceAdapter();
    }
    return tagServiceAdapter;
}

export default TagServiceAdapter; 