/**
 * 统一数据服务 - 万物皆任务的核心服务
 * 
 * 核心功能：
 * 1. 统一数据模型管理
 * 2. 三层智能解析（隐性+显性+界面标记）
 * 3. 类型化数据操作API
 * 4. 与现有UI的适配接口
 */

import { SmartTaggingSystem } from './smart_tagging_system.js';

class UniversalDataService {
    constructor() {
        this.taggingSystem = new SmartTaggingSystem();
        this.dataStore = new Map(); // 内存数据存储
        this.eventListeners = new Map(); // 事件监听器
        
        // 数据类型注册表
        this.typeRegistry = {
            note: { 
                label: '笔记',
                defaultInterface: 'note-editor',
                autoTags: ['#笔记']
            },
            task: { 
                label: '任务', 
                defaultInterface: 'task-manager',
                autoTags: ['#任务']
            },
            template: { 
                label: '模板', 
                defaultInterface: 'template-editor',
                autoTags: ['#模板']
            },
            tag: { 
                label: '标签', 
                defaultInterface: 'tag-manager',
                autoTags: ['#标签']
            },
            project: { 
                label: '项目', 
                defaultInterface: 'project-dashboard',
                autoTags: ['#项目']
            },
            team: { 
                label: '团队', 
                defaultInterface: 'team-panel',
                autoTags: ['#团队']
            }
        };
    }

    /**
     * 核心API：添加万能数据
     * @param {string} mdContent - MD格式内容
     * @param {string} sourceInterface - 来源界面
     * @param {Object} options - 额外选项
     */
    add(mdContent, sourceInterface = null, options = {}) {
        try {
            // 三层智能解析
            const parsedData = this.taggingSystem.comprehensiveParse(
                mdContent, 
                sourceInterface, 
                options.additionalTags || []
            );
            
            // 数据增强
            const enhancedData = this.enhanceData(parsedData, options);
            
            // 存储数据
            this.dataStore.set(enhancedData.id, enhancedData);
            
            // 触发事件
            this.emit('data:added', enhancedData);
            this.emit(`data:added:${enhancedData.finalClassification.type}`, enhancedData);
            
            return {
                success: true,
                id: enhancedData.id,
                data: enhancedData,
                suggestions: this.generateActionSuggestions(enhancedData)
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 按类型获取数据 - 替代现有的各种Service
     */
    getByType(type, filters = {}) {
        const allData = Array.from(this.dataStore.values());
        
        let filtered = allData.filter(item => 
            item.finalClassification.type === type
        );
        
        // 应用过滤器
        if (filters.status) {
            filtered = filtered.filter(item => 
                item.finalClassification.status === filters.status
            );
        }
        
        if (filters.priority) {
            filtered = filtered.filter(item => 
                item.finalClassification.priority === filters.priority
            );
        }
        
        if (filters.tags) {
            const requiredTags = Array.isArray(filters.tags) ? filters.tags : [filters.tags];
            filtered = filtered.filter(item => 
                requiredTags.every(tag => 
                    item.explicitMarkers.allTags.includes(tag)
                )
            );
        }
        
        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            filtered = filtered.filter(item => 
                item.title.toLowerCase().includes(searchTerm) ||
                item.content.toLowerCase().includes(searchTerm)
            );
        }
        
        return filtered;
    }

    /**
     * 更新数据
     */
    update(id, newContent, sourceInterface = null) {
        const existingData = this.dataStore.get(id);
        if (!existingData) {
            throw new Error(`数据不存在: ${id}`);
        }
        
        // 重新解析更新后的内容
        const updatedData = this.taggingSystem.comprehensiveParse(
            newContent, 
            sourceInterface || existingData.sourceInterface
        );
        
        // 保持原有ID和时间戳
        updatedData.id = id;
        updatedData.metadata.created = existingData.metadata.created;
        updatedData.metadata.modified = new Date().toISOString();
        
        // 更新存储
        this.dataStore.set(id, updatedData);
        
        // 触发事件
        this.emit('data:updated', updatedData);
        this.emit(`data:updated:${updatedData.finalClassification.type}`, updatedData);
        
        return updatedData;
    }

    /**
     * 删除数据
     */
    delete(id) {
        const data = this.dataStore.get(id);
        if (!data) {
            throw new Error(`数据不存在: ${id}`);
        }
        
        this.dataStore.delete(id);
        
        // 触发事件
        this.emit('data:deleted', { id, data });
        this.emit(`data:deleted:${data.finalClassification.type}`, { id, data });
        
        return true;
    }

    /**
     * 获取单个数据
     */
    get(id) {
        return this.dataStore.get(id);
    }

    /**
     * 数据增强处理
     */
    enhanceData(parsedData, options) {
        const enhanced = {
            ...parsedData,
            metadata: {
                ...parsedData.metadata,
                created: new Date().toISOString(),
                modified: new Date().toISOString(),
                version: 1,
                sourceInterface: options.sourceInterface || null
            }
        };
        
        // 添加类型特定的增强
        const typeConfig = this.typeRegistry[enhanced.finalClassification.type];
        if (typeConfig) {
            enhanced.typeConfig = typeConfig;
            
            // 自动添加类型标签
            const autoTags = typeConfig.autoTags || [];
            enhanced.explicitMarkers.allTags = [
                ...new Set([...enhanced.explicitMarkers.allTags, ...autoTags])
            ];
        }
        
        return enhanced;
    }

    /**
     * 生成操作建议
     */
    generateActionSuggestions(data) {
        const suggestions = [];
        const type = data.finalClassification.type;
        
        // 基于类型的建议
        switch (type) {
            case 'note':
                suggestions.push('💡 可以转换为任务');
                suggestions.push('🏷️ 添加更多标签分类');
                break;
            case 'task':
                suggestions.push('📋 设置截止时间');
                suggestions.push('👥 分配负责人');
                if (!data.explicitMarkers.priority) {
                    suggestions.push('⚠️ 设置优先级');
                }
                break;
            case 'template':
                suggestions.push('🧪 创建使用示例');
                suggestions.push('📚 添加到模板库');
                break;
        }
        
        // 基于完整性的建议
        const completeness = this.calculateCompleteness(data);
        if (completeness < 70) {
            suggestions.push('📝 完善内容信息');
        }
        
        return suggestions;
    }

    /**
     * 计算数据完整性
     */
    calculateCompleteness(data) {
        const checks = [
            !!data.title,
            !!data.finalClassification.type,
            !!data.finalClassification.status,
            !!data.finalClassification.priority,
            data.explicitMarkers.allTags.length > 0,
            !!data.sixElements.who,
            !!data.sixElements.why,
            data.content.length > 10
        ];
        
        return Math.round((checks.filter(Boolean).length / checks.length) * 100);
    }

    /**
     * 事件系统
     */
    on(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }

    emit(event, data) {
        const listeners = this.eventListeners.get(event) || [];
        listeners.forEach(callback => callback(data));
    }

    /**
     * 兼容性适配器 - 为现有UI提供接口
     */
    createCompatibilityAdapters() {
        return {
            // 标签服务适配器
            tagService: {
                getAllTags: () => this.getByType('tag'),
                addTag: (name, color) => {
                    const mdContent = `# ${name}\n\n标签颜色: ${color}\n\n#标签`;
                    return this.add(mdContent, 'tag-manager');
                },
                removeTag: (id) => this.delete(id)
            },
            
            // 模板服务适配器  
            templateService: {
                getAllTemplates: () => this.getByType('template'),
                addTemplate: (name, content) => {
                    const mdContent = `# ${name}\n\n${content}\n\n#模板`;
                    return this.add(mdContent, 'template-editor');
                },
                getTemplate: (id) => this.get(id)
            },
            
            // 项目服务适配器
            projectService: {
                getProjectInfo: () => {
                    const projects = this.getByType('project');
                    return projects[0] || null; // 假设单项目
                },
                updateProjectInfo: (info) => {
                    const mdContent = `# ${info.name}\n\n${info.description}\n\n#项目`;
                    const existing = this.getByType('project')[0];
                    if (existing) {
                        return this.update(existing.id, mdContent, 'project-dashboard');
                    } else {
                        return this.add(mdContent, 'project-dashboard');
                    }
                }
            }
        };
    }

    /**
     * 数据导出
     */
    exportData(format = 'json') {
        const allData = Array.from(this.dataStore.values());
        
        if (format === 'json') {
            return JSON.stringify(allData, null, 2);
        }
        
        if (format === 'md') {
            return allData.map(item => item.content).join('\n\n---\n\n');
        }
        
        throw new Error(`不支持的导出格式: ${format}`);
    }

    /**
     * 数据导入
     */
    importData(data, format = 'json') {
        if (format === 'json') {
            const parsedData = JSON.parse(data);
            parsedData.forEach(item => {
                this.dataStore.set(item.id, item);
            });
        }
        
        this.emit('data:imported', { count: this.dataStore.size });
    }

    /**
     * 统计信息
     */
    getStatistics() {
        const allData = Array.from(this.dataStore.values());
        const typeCount = {};
        const statusCount = {};
        
        allData.forEach(item => {
            const type = item.finalClassification.type;
            const status = item.finalClassification.status;
            
            typeCount[type] = (typeCount[type] || 0) + 1;
            statusCount[status] = (statusCount[status] || 0) + 1;
        });
        
        return {
            total: allData.length,
            byType: typeCount,
            byStatus: statusCount,
            completenessAvg: Math.round(
                allData.reduce((sum, item) => sum + this.calculateCompleteness(item), 0) / allData.length
            )
        };
    }
}

// 全局单例
let universalDataService = null;

export function getUniversalDataService() {
    if (!universalDataService) {
        universalDataService = new UniversalDataService();
    }
    return universalDataService;
}

export { UniversalDataService }; 