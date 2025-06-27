/**
 * @file node_coloring_service.js
 * @description 节点着色服务 - 模块化处理点击标签给节点上色
 * 
 * 职责:
 * - 管理节点颜色状态
 * - 处理标签点击触发的着色逻辑
 * - 提供标签-颜色映射配置
 * - 与思维导图库的颜色API集成
 */

import { publish, subscribe } from '../event_bus.js';
import { addNodeTag, removeNodeTag, getNodeTags } from './tag_service.js';

// 颜色配置映射
const TAG_COLOR_CONFIG = {
    // 常规标签组 - 黄色系
    '常规': {
        '项目': { bg: '#fff3cd', fg: '#856404', jsmind: '#fff3cd' },
        '里程碑': { bg: '#d4edda', fg: '#155724', jsmind: '#d4edda' },
        '完成': { bg: '#d1ecf1', fg: '#0c5460', jsmind: '#d1ecf1' },
        '进行中': { bg: '#ffeaa7', fg: '#6c5ce7', jsmind: '#ffeaa7' },
        '计划': { bg: '#fab1a0', fg: '#e17055', jsmind: '#fab1a0' }
    },
    // AI标签组 - 绿色系
    'AI': {
        '记忆': { bg: '#d4edda', fg: '#155724', jsmind: '#d4edda' },
        '注意力': { bg: '#c3e6cb', fg: '#1e7e34', jsmind: '#c3e6cb' },
        '经验': { bg: '#b8daff', fg: '#004085', jsmind: '#b8daff' },
        '幻觉': { bg: '#f8d7da', fg: '#721c24', jsmind: '#f8d7da' }
    },
    // 笔记标签组 - 蓝色系
    '笔记': {
        '跟进': { bg: '#e3f2fd', fg: '#1976d2', jsmind: '#e3f2fd' },
        '议题': { bg: '#e1f5fe', fg: '#0277bd', jsmind: '#e1f5fe' }
    }
};

// 节点颜色状态管理
const nodeColorStates = new Map();

/**
 * 节点着色服务类
 */
class NodeColoringService {
    constructor() {
        this.isInitialized = false;
        this.currentMindmap = null;
        this.setupEventListeners();
    }

    /**
     * 初始化服务
     */
    initialize() {
        if (this.isInitialized) {
            console.log('🎨 NodeColoringService 已经初始化');
            return;
        }

        console.log('🎨 初始化 NodeColoringService...');
        
        // 获取当前思维导图实例
        this.updateMindmapInstance();
        
        this.isInitialized = true;
        console.log('✅ NodeColoringService 初始化完成');
    }

    /**
     * 更新思维导图实例引用
     */
    updateMindmapInstance() {
        if (typeof window.getCurrentJsMind === 'function') {
            this.currentMindmap = window.getCurrentJsMind();
            console.log('🎯 获取思维导图实例:', !!this.currentMindmap);
        } else {
            console.warn('⚠️ getCurrentJsMind 函数不存在');
        }
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // 监听标签点击事件
        subscribe('tag:clicked', (data) => {
            this.handleTagClick(data.nodeId, data.tagName, data.tagGroup, data.element);
        });

        // 监听思维导图变化
        subscribe('mindmap:changed', () => {
            this.updateMindmapInstance();
        });
    }

    /**
     * 处理标签点击事件
     * @param {string} nodeId - 节点ID
     * @param {string} tagName - 标签名称
     * @param {string} tagGroup - 标签组
     * @param {Element} tagElement - 标签DOM元素
     */
    handleTagClick(nodeId, tagName, tagGroup, tagElement) {
        console.log('🏷️ 处理标签点击:', { nodeId, tagName, tagGroup });

        if (!nodeId || !tagName || !tagGroup) {
            console.error('❌ 标签点击参数不完整');
            return;
        }

        // 检查标签是否已选中
        const isSelected = tagElement.classList.contains('selected');
        
        if (isSelected) {
            // 取消选中：移除标签和颜色
            this.removeTagAndColor(nodeId, tagName, tagGroup, tagElement);
        } else {
            // 选中：添加标签和颜色
            this.addTagAndColor(nodeId, tagName, tagGroup, tagElement);
        }
    }

    /**
     * 添加标签并应用颜色
     * @param {string} nodeId - 节点ID
     * @param {string} tagName - 标签名称
     * @param {string} tagGroup - 标签组
     * @param {Element} tagElement - 标签DOM元素
     */
    addTagAndColor(nodeId, tagName, tagGroup, tagElement) {
        try {
            // 1. 添加标签到数据
            const tagType = this.getTagTypeFromGroup(tagGroup);
            addNodeTag(nodeId, tagType, tagName);

            // 2. 更新UI状态
            tagElement.classList.add('selected');

            // 3. 应用节点颜色
            this.applyNodeColor(nodeId, tagName, tagGroup);

            // 4. 发布事件
            publish('node:tag:added', { nodeId, tagName, tagGroup });

            console.log(`✅ 已添加标签并着色: ${tagName} -> 节点 ${nodeId}`);

        } catch (error) {
            console.error('❌ 添加标签和颜色失败:', error);
        }
    }

    /**
     * 移除标签并清除颜色
     * @param {string} nodeId - 节点ID
     * @param {string} tagName - 标签名称
     * @param {string} tagGroup - 标签组
     * @param {Element} tagElement - 标签DOM元素
     */
    removeTagAndColor(nodeId, tagName, tagGroup, tagElement) {
        try {
            // 1. 从数据中移除标签
            const tagType = this.getTagTypeFromGroup(tagGroup);
            removeNodeTag(nodeId, tagType, tagName);

            // 2. 更新UI状态
            tagElement.classList.remove('selected');

            // 3. 移除节点颜色（如果没有其他相同类型的标签）
            this.removeNodeColorIfNeeded(nodeId, tagName, tagGroup);

            // 4. 发布事件
            publish('node:tag:removed', { nodeId, tagName, tagGroup });

            console.log(`✅ 已移除标签和颜色: ${tagName} -> 节点 ${nodeId}`);

        } catch (error) {
            console.error('❌ 移除标签和颜色失败:', error);
        }
    }

    /**
     * 应用节点颜色
     * @param {string} nodeId - 节点ID
     * @param {string} tagName - 标签名称
     * @param {string} tagGroup - 标签组
     */
    applyNodeColor(nodeId, tagName, tagGroup) {
        const colorConfig = this.getColorConfig(tagGroup, tagName);
        if (!colorConfig) {
            console.warn(`⚠️ 未找到标签颜色配置: ${tagGroup}.${tagName}`);
            return;
        }

        // 使用jsMind API设置颜色
        if (this.currentMindmap && this.currentMindmap.set_node_color) {
            this.currentMindmap.set_node_color(nodeId, colorConfig.jsmind, colorConfig.fg);
            console.log(`🎨 应用jsMind颜色: ${nodeId} -> ${colorConfig.jsmind}`);
        }

        // 同时设置DOM样式（作为备用）
        this.setDOMNodeColor(nodeId, colorConfig);

        // 记录颜色状态
        nodeColorStates.set(nodeId, { tagName, tagGroup, colorConfig });
    }

    /**
     * 移除节点颜色（如果需要）
     * @param {string} nodeId - 节点ID
     * @param {string} tagName - 标签名称
     * @param {string} tagGroup - 标签组
     */
    removeNodeColorIfNeeded(nodeId, tagName, tagGroup) {
        // 检查节点是否还有其他同组的标签
        const nodeTags = getNodeTags(nodeId);
        const tagType = this.getTagTypeFromGroup(tagGroup);
        const remainingTags = nodeTags[tagType] || [];

        // 如果同组还有其他标签，保持颜色
        const hasOtherTagsInGroup = remainingTags.some(tag => 
            tag !== tagName && this.getColorConfig(tagGroup, tag)
        );

        if (!hasOtherTagsInGroup) {
            // 清除颜色
            this.clearNodeColor(nodeId);
            nodeColorStates.delete(nodeId);
            console.log(`🧹 清除节点颜色: ${nodeId}`);
        }
    }

    /**
     * 清除节点颜色
     * @param {string} nodeId - 节点ID
     */
    clearNodeColor(nodeId) {
        // 使用jsMind API清除颜色
        if (this.currentMindmap && this.currentMindmap.set_node_color) {
            this.currentMindmap.set_node_color(nodeId, null, null);
        }

        // 清除DOM样式
        this.clearDOMNodeColor(nodeId);
    }

    /**
     * 设置DOM节点颜色
     * @param {string} nodeId - 节点ID
     * @param {Object} colorConfig - 颜色配置
     */
    setDOMNodeColor(nodeId, colorConfig) {
        const nodeElement = document.querySelector(`[nodeid="${nodeId}"]`);
        if (nodeElement) {
            nodeElement.style.backgroundColor = colorConfig.bg;
            nodeElement.style.color = colorConfig.fg;
            nodeElement.setAttribute('data-tag-colored', 'true');
        }
    }

    /**
     * 清除DOM节点颜色
     * @param {string} nodeId - 节点ID
     */
    clearDOMNodeColor(nodeId) {
        const nodeElement = document.querySelector(`[nodeid="${nodeId}"]`);
        if (nodeElement) {
            nodeElement.style.backgroundColor = '';
            nodeElement.style.color = '';
            nodeElement.removeAttribute('data-tag-colored');
        }
    }

    /**
     * 获取颜色配置
     * @param {string} tagGroup - 标签组
     * @param {string} tagName - 标签名称
     * @returns {Object|null} 颜色配置
     */
    getColorConfig(tagGroup, tagName) {
        return TAG_COLOR_CONFIG[tagGroup]?.[tagName] || null;
    }

    /**
     * 将标签组转换为标签类型
     * @param {string} tagGroup - 标签组
     * @returns {string} 标签类型
     */
    getTagTypeFromGroup(tagGroup) {
        const groupToTypeMap = {
            '常规': 'categories',
            'AI': 'technical', 
            '笔记': 'status'
        };
        return groupToTypeMap[tagGroup] || 'categories';
    }

    /**
     * 恢复节点的所有标签颜色
     * @param {string} nodeId - 节点ID
     */
    restoreNodeColors(nodeId) {
        const nodeTags = getNodeTags(nodeId);
        
        // 遍历所有标签类型
        Object.entries(nodeTags).forEach(([tagType, tags]) => {
            if (Array.isArray(tags) && tags.length > 0) {
                // 找到第一个有颜色配置的标签并应用
                for (const tagName of tags) {
                    const tagGroup = this.getGroupFromTagType(tagType);
                    const colorConfig = this.getColorConfig(tagGroup, tagName);
                    if (colorConfig) {
                        this.applyNodeColor(nodeId, tagName, tagGroup);
                        break; // 只应用第一个找到的颜色
                    }
                }
            }
        });
    }

    /**
     * 将标签类型转换为标签组
     * @param {string} tagType - 标签类型
     * @returns {string} 标签组
     */
    getGroupFromTagType(tagType) {
        const typeToGroupMap = {
            'categories': '常规',
            'technical': 'AI',
            'status': '笔记'
        };
        return typeToGroupMap[tagType] || '常规';
    }

    /**
     * 获取所有节点的颜色状态
     * @returns {Map} 颜色状态映射
     */
    getColorStates() {
        return new Map(nodeColorStates);
    }

    /**
     * 批量恢复所有节点颜色
     */
    restoreAllNodeColors() {
        if (!window.nodeDatabase) {
            console.warn('⚠️ nodeDatabase 不存在');
            return;
        }

        Object.keys(window.nodeDatabase).forEach(nodeId => {
            this.restoreNodeColors(nodeId);
        });

        console.log('🎨 已恢复所有节点颜色');
    }
}

// 创建服务实例
const nodeColoringService = new NodeColoringService();

// 导出服务实例和主要方法
export default nodeColoringService;

export {
    nodeColoringService,
    TAG_COLOR_CONFIG
};
