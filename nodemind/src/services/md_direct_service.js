/**
 * MD直存服务 - 基于模块化架构的MD直接存储
 * 
 * 核心功能：
 * 1. 接收MD格式内容
 * 2. 通过SmartMDParser智能解析
 * 3. 使用UniversalDataService统一存储
 * 4. 通过UIIntegrationAdapter保持联动
 */

import { getUniversalDataService } from '../core/universal_data_service.js';
import { getUIIntegrationAdapter } from '../adapters/ui_integration_adapter.js';

class MDDirectService {
    constructor() {
        this.universalService = null;
        this.uiAdapter = null;
        this.isInitialized = false;
        
        this.init();
    }
    
    async init() {
        try {
            console.log('🔧 初始化MD直存服务...');
            
            // 初始化核心服务
            this.universalService = getUniversalDataService();
            this.uiAdapter = getUIIntegrationAdapter();
            
            // 设置事件监听
            this.setupEventListeners();
            
            this.isInitialized = true;
            console.log('✅ MD直存服务初始化完成');
            
        } catch (error) {
            console.error('❌ MD直存服务初始化失败:', error);
        }
    }
    
    /**
     * 核心API：直接存储MD内容
     * @param {string} mdContent - MD格式内容
     * @param {Object} options - 额外选项
     */
    async addMDContent(mdContent, options = {}) {
        if (!this.isInitialized) {
            throw new Error('MD直存服务尚未初始化');
        }
        
        try {
            console.log('📝 处理MD直存请求...', options);
            
            // 解析MD内容
            const parsed = this.parseContent(mdContent);
            
            // 如果指定了nodeId，更新现有节点
            if (options.nodeId && options.updateExisting) {
                return this.updateExistingNode(options.nodeId, parsed, options);
            }
            
            // 否则创建新节点
            return this.createNewNode(parsed, options);
            
        } catch (error) {
            console.error('❌ MD直存失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    /**
     * 更新现有节点
     */
    updateExistingNode(nodeId, parsedData, options = {}) {
        try {
            // 更新nodeDatabase
            if (window.nodeDatabase && window.nodeDatabase[nodeId]) {
                window.nodeDatabase[nodeId].title = parsedData.title;
                window.nodeDatabase[nodeId].content = parsedData.content;
                window.nodeDatabase[nodeId].modified = new Date().toISOString();
                
                console.log(`✅ 更新nodeDatabase: ${nodeId}`);
            }
            
            // 更新四组件数据
            if (window.fourComponentNodeState && window.fourComponentNodeState.nodeData) {
                if (!window.fourComponentNodeState.nodeData[nodeId]) {
                    window.fourComponentNodeState.nodeData[nodeId] = {};
                }
                
                window.fourComponentNodeState.nodeData[nodeId].title = parsedData.title;
                window.fourComponentNodeState.nodeData[nodeId].content = parsedData.content;
                window.fourComponentNodeState.nodeData[nodeId].modified = new Date().toISOString();
                
                // 保存四组件数据
                if (window.saveFourComponentData) {
                    window.saveFourComponentData();
                }
                
                console.log(`✅ 更新四组件数据: ${nodeId}`);
            }
            
            // 自动保存
            if (window.autoSaveData) {
                window.autoSaveData();
            }
            
            return {
                success: true,
                id: nodeId,
                data: parsedData,
                message: `节点 ${nodeId} 已更新`
            };
            
        } catch (error) {
            console.error('❌ 更新节点失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    /**
     * 创建新节点
     */
    createNewNode(parsedData, options = {}) {
        try {
            // 生成新节点ID
            const nodeId = options.nodeId || 'md_' + Date.now();
            
            const nodeData = {
                id: nodeId,
                title: parsedData.title,
                content: parsedData.content,
                tags: parsedData.tags || [],
                created: new Date().toISOString(),
                modified: new Date().toISOString(),
                type: parsedData.type || 'note'
            };
            
            // 添加到nodeDatabase
            if (window.nodeDatabase) {
                window.nodeDatabase[nodeId] = nodeData;
                console.log(`✅ 添加到nodeDatabase: ${nodeId}`);
            }
            
            // 添加到四组件数据
            if (window.fourComponentNodeState) {
                if (!window.fourComponentNodeState.nodeData) {
                    window.fourComponentNodeState.nodeData = {};
                }
                window.fourComponentNodeState.nodeData[nodeId] = nodeData;
                
                if (window.saveFourComponentData) {
                    window.saveFourComponentData();
                }
                console.log(`✅ 添加到四组件数据: ${nodeId}`);
            }
            
            // 自动保存
            if (window.autoSaveData) {
                window.autoSaveData();
            }
            
            return {
                success: true,
                id: nodeId,
                data: nodeData,
                message: 'MD内容已成功存储到NodeMind'
            };
            
        } catch (error) {
            console.error('❌ 创建节点失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    /**
     * 解析MD内容
     */
    parseContent(content) {
        const lines = content.split('\n');
        const title = lines[0].replace(/^#+\s*/, '') || '未命名';
        
        // 提取正文内容（去除标题行）
        const contentLines = lines.slice(1).filter(line => line.trim() !== '');
        const actualContent = contentLines.join('\n').trim();
        
        let type = 'note';
        if (content.includes('任务') || content.includes('实现') || content.includes('开发')) {
            type = 'task';
        } else if (content.includes('模板') || content.includes('格式')) {
            type = 'template';
        } else if (content.includes('#') && lines.length <= 3) {
            type = 'tag';
        }
        
        return {
            title,
            content: actualContent,
            type,
            originalMD: content,
            estimatedSize: content.length
        };
    }
    
    /**
     * 预览MD解析结果（不实际存储）
     */
    previewMDParsing(mdContent) {
        try {
            // 简单的预览解析
            const lines = mdContent.split('\n');
            const title = lines[0].replace(/^#+\s*/, '') || '未命名';
            
            let type = 'note';
            if (mdContent.includes('任务') || mdContent.includes('实现') || mdContent.includes('开发')) {
                type = 'task';
            } else if (mdContent.includes('模板') || mdContent.includes('格式')) {
                type = 'template';
            } else if (mdContent.includes('#') && lines.length <= 3) {
                type = 'tag';
            }
            
            const sixElements = {};
            if (mdContent.includes('我要') || mdContent.includes('我需要')) {
                sixElements.who = '我';
            }
            if (mdContent.includes('今天') || mdContent.includes('明天')) {
                sixElements.when = '近期';
            }
            if (mdContent.includes('JWT') || mdContent.includes('React')) {
                sixElements.what = '技术工具';
            }
            
            return {
                success: true,
                preview: {
                    id: 'preview_' + Date.now(),
                    title,
                    content: mdContent,
                    type,
                    sixElements,
                    metadata: {
                        created: new Date().toISOString(),
                        source: 'md-direct-preview'
                    }
                }
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        if (this.universalService && this.universalService.on) {
            // 监听数据变化，确保联动机制正常
            this.universalService.on('data:added', (data) => {
                console.log('🔗 数据添加事件触发，联动机制自动工作:', data.id);
            });
            
            this.universalService.on('data:updated', (data) => {
                console.log('🔗 数据更新事件触发，联动机制自动工作:', data.id);
            });
        }
    }
    
    /**
     * 获取统计信息
     */
    getStats() {
        return {
            totalItems: this.universalService?.dataStore?.size || 0,
            isInitialized: this.isInitialized,
            lastActivity: new Date().toISOString()
        };
    }
}

// 单例模式
let mdDirectServiceInstance = null;

export function getMDDirectService() {
    if (!mdDirectServiceInstance) {
        mdDirectServiceInstance = new MDDirectService();
    }
    return mdDirectServiceInstance;
}

// 便捷API
export async function addMDContent(mdContent, options = {}) {
    const service = getMDDirectService();
    return await service.addMDContent(mdContent, options);
}

export function previewMDParsing(mdContent) {
    const service = getMDDirectService();
    return service.previewMDParsing(mdContent);
} 