/**
 * UI集成适配器 - 连接万能数据架构与现有UI系统
 * 
 * 功能：
 * 1. 将新架构的数据格式转换为UI期望的格式
 * 2. 处理UI事件并转发到新架构
 * 3. 保持UI组件的完全兼容性
 * 4. 提供渐进式迁移路径
 */

import { getUniversalDataService } from '../core/universal_data_service.js';
import { getFeatureSwitchController } from '../core/feature_switch_controller.js';

class UIIntegrationAdapter {
    constructor() {
        this.universalService = getUniversalDataService();
        this.switchController = getFeatureSwitchController();
        
        // UI组件映射表
        this.uiComponentMap = {
            'tag-manager': 'tagService',
            'template-editor': 'templateService', 
            'project-dashboard': 'projectService',
            'node-editor': 'nodeService'
        };
        
        // 数据格式转换器
        this.formatConverters = new Map();
        this.setupFormatConverters();
        
        // 事件监听器
        this.eventListeners = new Map();
        this.setupEventListeners();
    }

    /**
     * 设置数据格式转换器
     */
    setupFormatConverters() {
        // 标签数据转换器
        this.formatConverters.set('tags', (universalData) => {
            return universalData.map(item => ({
                id: item.id,
                name: item.title,
                color: this.extractTagColor(item),
                count: this.getTagUsageCount(item.title),
                type: item.explicitMarkers.context[0] || 'custom',
                created: item.metadata.created,
                modified: item.metadata.modified
            }));
        });

        // 模板数据转换器
        this.formatConverters.set('templates', (universalData) => {
            return universalData.map(item => ({
                id: item.id,
                name: item.title,
                content: item.content,
                description: item.summary || '',
                category: item.explicitMarkers.context[0] || 'general',
                tags: item.explicitMarkers.allTags,
                usage_count: this.getTemplateUsageCount(item.id),
                created: item.metadata.created,
                modified: item.metadata.modified
            }));
        });

        // 项目数据转换器
        this.formatConverters.set('project', (universalData) => {
            if (!universalData || universalData.length === 0) {
                return {
                    name: '未命名项目',
                    description: '',
                    status: 'active',
                    created: new Date().toISOString(),
                    stats: { nodes: 0, tasks: 0, completed: 0 }
                };
            }

            const project = universalData[0];
            return {
                id: project.id,
                name: project.title,
                description: project.content,
                status: project.finalClassification.status || 'active',
                priority: project.finalClassification.priority || 'medium',
                tags: project.explicitMarkers.allTags,
                created: project.metadata.created,
                modified: project.metadata.modified,
                stats: this.calculateProjectStats()
            };
        });

        // 节点数据转换器
        this.formatConverters.set('nodes', (universalData) => {
            return universalData.map(item => ({
                id: item.id,
                title: item.title,
                content: item.content,
                type: item.finalClassification.type,
                status: item.finalClassification.status,
                priority: item.finalClassification.priority,
                tags: this.convertTagsToLegacyFormat(item),
                parent_id: item.parent_id || null,
                children: item.children || [],
                metadata: {
                    created: item.metadata.created,
                    modified: item.metadata.modified,
                    completeness: this.calculateCompleteness(item)
                },
                // 兼容原有格式
                time: {
                    created: item.metadata.created,
                    modified: item.metadata.modified
                },
                statusTags: this.extractStatusTags(item),
                sixElements: item.sixElements || {}
            }));
        });
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // 监听数据变化，同步到UI
        this.universalService.on('data:added', (data) => {
            this.notifyUIComponents('data:added', data);
        });

        this.universalService.on('data:updated', (data) => {
            this.notifyUIComponents('data:updated', data);
        });

        this.universalService.on('data:deleted', (data) => {
            this.notifyUIComponents('data:deleted', data);
        });
    }

    /**
     * 获取UI组件数据
     * @param {string} componentType - UI组件类型
     * @param {Object} filters - 过滤条件
     */
    getUIData(componentType, filters = {}) {
        try {
            let universalData = [];
            let dataType = '';

            // 根据UI组件类型确定数据类型
            switch (componentType) {
                case 'tag-manager':
                    dataType = 'tag';
                    universalData = this.universalService.getByType('tag', filters);
                    break;
                case 'template-editor':
                    dataType = 'template';
                    universalData = this.universalService.getByType('template', filters);
                    break;
                case 'project-dashboard':
                    dataType = 'project';
                    universalData = this.universalService.getByType('project', filters);
                    break;
                case 'node-editor':
                    dataType = 'note';
                    universalData = this.universalService.getByType('note', filters)
                        .concat(this.universalService.getByType('task', filters));
                    break;
                default:
                    throw new Error(`未知的UI组件类型: ${componentType}`);
            }

            // 使用对应的格式转换器
            const converter = this.formatConverters.get(dataType === 'note' ? 'nodes' : dataType + 's');
            if (converter) {
                return converter(universalData);
            }

            return universalData;

        } catch (error) {
            console.error('获取UI数据失败:', error);
            return [];
        }
    }

    /**
     * 处理UI操作
     * @param {string} componentType - UI组件类型
     * @param {string} action - 操作类型
     * @param {Object} data - 操作数据
     */
    async handleUIAction(componentType, action, data) {
        try {
            const serviceType = this.uiComponentMap[componentType];
            
            // 检查对应服务是否启用
            if (serviceType && !this.switchController.switches[serviceType]) {
                console.warn(`服务 ${serviceType} 未启用，回退到原有逻辑`);
                return this.fallbackToOriginalUI(componentType, action, data);
            }

            switch (action) {
                case 'add':
                    return await this.handleAdd(componentType, data);
                case 'update':
                    return await this.handleUpdate(componentType, data);
                case 'delete':
                    return await this.handleDelete(componentType, data);
                case 'get':
                    return this.handleGet(componentType, data);
                case 'list':
                    return this.handleList(componentType, data);
                default:
                    throw new Error(`未知的操作类型: ${action}`);
            }

        } catch (error) {
            console.error('处理UI操作失败:', error);
            return this.fallbackToOriginalUI(componentType, action, data);
        }
    }

    /**
     * 处理添加操作
     */
    async handleAdd(componentType, data) {
        let mdContent = '';
        let sourceInterface = componentType;

        switch (componentType) {
            case 'tag-manager':
                mdContent = `# ${data.name}\n\n标签颜色: ${data.color || '#007bff'}\n\n#标签`;
                break;
            case 'template-editor':
                mdContent = `# ${data.name}\n\n${data.content}\n\n#模板`;
                if (data.description) {
                    mdContent += `\n\n## 描述\n${data.description}`;
                }
                break;
            case 'project-dashboard':
                mdContent = `# ${data.name}\n\n${data.description || ''}\n\n#项目`;
                if (data.status) {
                    mdContent += ` #${data.status}`;
                }
                break;
            case 'node-editor':
                mdContent = data.content || `# ${data.title}\n\n${data.description || ''}`;
                if (data.type) {
                    mdContent += ` #${data.type}`;
                }
                break;
        }

        const result = this.universalService.add(mdContent, sourceInterface);
        
        // 转换为UI期望的格式
        return this.convertToUIFormat(componentType, result.data);
    }

    /**
     * 处理更新操作
     */
    async handleUpdate(componentType, data) {
        const { id, ...updateData } = data;
        
        // 获取现有数据
        const existingData = this.universalService.get(id);
        if (!existingData) {
            throw new Error(`数据不存在: ${id}`);
        }

        // 构建更新后的MD内容
        let updatedContent = this.buildUpdatedContent(componentType, existingData, updateData);
        
        const result = this.universalService.update(id, updatedContent, componentType);
        
        // 转换为UI期望的格式
        return this.convertToUIFormat(componentType, result);
    }

    /**
     * 处理删除操作
     */
    async handleDelete(componentType, data) {
        const { id } = data;
        return this.universalService.delete(id);
    }

    /**
     * 处理获取操作
     */
    handleGet(componentType, data) {
        const { id } = data;
        const universalData = this.universalService.get(id);
        
        if (!universalData) {
            return null;
        }

        return this.convertToUIFormat(componentType, universalData);
    }

    /**
     * 处理列表操作
     */
    handleList(componentType, filters = {}) {
        return this.getUIData(componentType, filters);
    }

    /**
     * 转换为UI格式
     */
    convertToUIFormat(componentType, universalData) {
        if (!universalData) return null;

        switch (componentType) {
            case 'tag-manager':
                return {
                    id: universalData.id,
                    name: universalData.title,
                    color: this.extractTagColor(universalData),
                    count: this.getTagUsageCount(universalData.title),
                    created: universalData.metadata.created
                };
            case 'template-editor':
                return {
                    id: universalData.id,
                    name: universalData.title,
                    content: universalData.content,
                    description: universalData.summary || '',
                    category: universalData.explicitMarkers.context[0] || 'general',
                    created: universalData.metadata.created
                };
            case 'project-dashboard':
                return {
                    id: universalData.id,
                    name: universalData.title,
                    description: universalData.content,
                    status: universalData.finalClassification.status,
                    created: universalData.metadata.created
                };
            case 'node-editor':
                return {
                    id: universalData.id,
                    title: universalData.title,
                    content: universalData.content,
                    type: universalData.finalClassification.type,
                    status: universalData.finalClassification.status,
                    tags: this.convertTagsToLegacyFormat(universalData),
                    created: universalData.metadata.created
                };
            default:
                return universalData;
        }
    }

    /**
     * 构建更新后的内容
     */
    buildUpdatedContent(componentType, existingData, updateData) {
        let content = existingData.content;

        switch (componentType) {
            case 'tag-manager':
                if (updateData.name) {
                    content = content.replace(/^# .+/m, `# ${updateData.name}`);
                }
                if (updateData.color) {
                    content = content.replace(/标签颜色: .+/m, `标签颜色: ${updateData.color}`);
                }
                break;
            case 'template-editor':
                if (updateData.name) {
                    content = content.replace(/^# .+/m, `# ${updateData.name}`);
                }
                if (updateData.content) {
                    // 保留标题，更新内容
                    const lines = content.split('\n');
                    lines[2] = updateData.content; // 假设内容在第3行
                    content = lines.join('\n');
                }
                break;
            case 'project-dashboard':
                if (updateData.name) {
                    content = content.replace(/^# .+/m, `# ${updateData.name}`);
                }
                if (updateData.description) {
                    const lines = content.split('\n');
                    lines[2] = updateData.description;
                    content = lines.join('\n');
                }
                break;
            case 'node-editor':
                if (updateData.title) {
                    content = content.replace(/^# .+/m, `# ${updateData.title}`);
                }
                if (updateData.content) {
                    content = updateData.content;
                }
                break;
        }

        return content;
    }

    /**
     * 辅助方法
     */
    extractTagColor(item) {
        const colorMatch = item.content.match(/标签颜色: (#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3}|\w+)/);
        return colorMatch ? colorMatch[1] : '#007bff';
    }

    getTagUsageCount(tagName) {
        // 统计使用该标签的数据数量
        const allData = Array.from(this.universalService.dataStore.values());
        return allData.filter(item => 
            item.explicitMarkers.allTags.some(tag => tag.includes(tagName))
        ).length;
    }

    getTemplateUsageCount(templateId) {
        // 这里可以实现模板使用统计逻辑
        return 0;
    }

    calculateProjectStats() {
        const stats = this.universalService.getStatistics();
        return {
            nodes: stats.total,
            tasks: stats.byType.task || 0,
            completed: stats.byStatus.done || 0
        };
    }

    calculateCompleteness(item) {
        // 复用万能数据服务的完整性计算
        return this.universalService.calculateCompleteness ? 
            this.universalService.calculateCompleteness(item) : 100;
    }

    convertTagsToLegacyFormat(item) {
        return {
            categories: item.explicitMarkers.context || [],
            technical: item.explicitMarkers.tech || [],
            status: item.explicitMarkers.status ? [item.explicitMarkers.status] : [],
            custom: item.explicitMarkers.allTags.filter(tag => 
                !tag.includes('任务') && !tag.includes('笔记') && !tag.includes('模板')
            ),
            future: []
        };
    }

    extractStatusTags(item) {
        return item.explicitMarkers.status ? [item.explicitMarkers.status] : [];
    }

    /**
     * 通知UI组件数据变化
     */
    notifyUIComponents(eventType, data) {
        // 这里可以实现向UI组件发送事件的逻辑
        const event = new CustomEvent(`universal-data-${eventType}`, {
            detail: data
        });
        
        if (typeof window !== 'undefined' && window.document) {
            window.document.dispatchEvent(event);
        }
    }

    /**
     * 回退到原有UI逻辑
     */
    fallbackToOriginalUI(componentType, action, data) {
        console.warn(`回退到原有UI逻辑: ${componentType}.${action}`);
        // 这里可以实现回退逻辑
        return { success: false, error: '服务未启用，已回退到原有逻辑' };
    }

    /**
     * 批量数据迁移
     */
    async migrateUIData(componentType, legacyData) {
        const migratedData = [];
        
        for (const item of legacyData) {
            try {
                const result = await this.handleAdd(componentType, item);
                migratedData.push(result);
            } catch (error) {
                console.error(`迁移数据失败:`, item, error);
            }
        }
        
        return migratedData;
    }

    /**
     * 获取迁移状态
     */
    getMigrationStatus() {
        const stats = this.universalService.getStatistics();
        const switches = this.switchController.getStatus().switches;
        
        return {
            totalData: stats.total,
            dataTypes: stats.byType,
            enabledServices: Object.entries(switches).filter(([_, enabled]) => enabled).map(([name, _]) => name),
            migrationComplete: Object.values(switches).filter(Boolean).length >= 4
        };
    }
}

// 创建单例实例
let uiIntegrationAdapter = null;

export function getUIIntegrationAdapter() {
    if (!uiIntegrationAdapter) {
        uiIntegrationAdapter = new UIIntegrationAdapter();
    }
    return uiIntegrationAdapter;
}

export default UIIntegrationAdapter; 