/**
 * @file project_service.js
 * @description 项目管理服务
 * 
 * 职责:
 * - 管理项目信息和元数据
 * - 处理项目相关的操作
 * - 管理项目MD文档的创建和同步
 */

import state from './state.js';
import { convertToMDFormat } from './md_adapter_service.js';

/**
 * 获取项目信息
 */
export function getProjectInfo() {
    return state.state.projectInfo;
}

/**
 * 更新项目信息
 * @param {Object} info - 项目信息对象
 */
export function updateProjectInfo(info) {
    state.state.projectInfo = { ...state.state.projectInfo, ...info };
    console.log('📋 项目信息已更新:', state.state.projectInfo);
    
    // 如果项目名称发生变化，重新生成项目文档
    if (info.name && info.name !== state.state.projectInfo.name) {
        generateProjectDocument();
    }
}

/**
 * 设置项目名称
 * @param {string} name - 项目名称
 */
export function setProjectName(name) {
    const oldName = state.state.projectInfo.name;
    state.state.projectInfo.name = name;
    console.log('📝 项目名称已设置:', name);
    
    // 如果是首次设置或名称变更，创建/更新项目文档
    if (!oldName || oldName !== name) {
        initializeProjectDocument(name);
    }
}

/**
 * 设置项目作者
 * @param {string} author - 作者名称
 */
export function setProjectAuthor(author) {
    state.state.projectInfo.author = author;
    console.log('👤 项目作者已设置:', author);
    
    // 更新项目文档
    generateProjectDocument();
}

/**
 * 设置项目版本
 * @param {string} version - 版本号
 */
export function setProjectVersion(version) {
    state.state.projectInfo.version = version;
    console.log('🔢 项目版本已设置:', version);
    
    // 更新项目文档
    generateProjectDocument();
}

/**
 * 初始化项目文档
 * @param {string} projectName - 项目名称
 */
export function initializeProjectDocument(projectName) {
    console.log('📄 [项目服务] 初始化项目文档:', projectName);
    
    // 设置文档文件名
    const documentFileName = `${projectName}.md`;
    state.state.projectInfo.documentFileName = documentFileName;
    
    // 生成初始项目文档
    generateProjectDocument();
    
    console.log(`📄 [项目服务] 项目文档已初始化: ${documentFileName}`);
}

/**
 * 生成完整的项目MD文档内容
 * @returns {string} 项目MD文档内容
 */
export function generateProjectDocument() {
    console.log('📖 [项目服务] 开始生成项目文档...');
    
    const projectInfo = state.state.projectInfo;
    const nodeDatabase = state.state.nodeDatabase || window.nodeDatabase || {};
    
    if (!projectInfo.name) {
        console.warn('⚠️ [项目服务] 项目名称未设置，无法生成文档');
        return '';
    }
    
    let mdContent = '';
    
    // 生成项目文档头部
    mdContent += generateProjectHeader(projectInfo);
    
    // 生成节点目录
    mdContent += generateNodeDirectory(nodeDatabase);
    
    // 生成所有节点的详细内容
    mdContent += generateAllNodesContent(nodeDatabase);
    
    // 生成文档尾部
    mdContent += generateProjectFooter(projectInfo);
    
    // 自动保存到文件（如果支持）
    saveProjectDocument(mdContent);
    
    console.log('📖 [项目服务] 项目文档生成完成');
    return mdContent;
}

/**
 * 生成项目文档头部
 * @param {Object} projectInfo - 项目信息
 * @returns {string} 文档头部内容
 */
function generateProjectHeader(projectInfo) {
    const currentTime = new Date().toLocaleString('zh-CN');
    
    let header = '';
    header += `# ${projectInfo.name}\n\n`;
    header += `**文档类型:** 项目文档 📄\n`;
    header += `**生成时间:** ${currentTime}\n`;
    
    if (projectInfo.author) {
        header += `**项目负责人:** ${projectInfo.author} 👤\n`;
    }
    
    if (projectInfo.version) {
        header += `**项目版本:** ${projectInfo.version}\n`;
    }
    
    if (projectInfo.description) {
        header += `**项目描述:** ${projectInfo.description}\n`;
    }
    
    header += `\n---\n\n`;
    header += `> 此文档由 NodeMind 自动生成，包含项目中所有节点的完整信息。\n`;
    header += `> 每次节点更新时，此文档会自动同步最新内容。\n\n`;
    
    return header;
}

/**
 * 生成节点目录
 * @param {Object} nodeDatabase - 节点数据库
 * @returns {string} 节点目录内容
 */
function generateNodeDirectory(nodeDatabase) {
    if (!nodeDatabase || Object.keys(nodeDatabase).length === 0) {
        return `## 📋 节点目录\n\n*暂无节点*\n\n`;
    }
    
    let directory = `## 📋 节点目录\n\n`;
    
    const nodeEntries = Object.entries(nodeDatabase);
    nodeEntries.forEach(([nodeId, nodeData], index) => {
        const statusIcon = getStatusIcon(nodeData);
        const priorityIcon = getPriorityIcon(nodeData);
        
        directory += `${index + 1}. [${nodeId}](#${nodeId.toLowerCase().replace(/[^a-z0-9]/g, '-')}) - ${nodeData.title || '未命名节点'} ${statusIcon}${priorityIcon}\n`;
    });
    
    directory += `\n**节点总数:** ${nodeEntries.length}\n\n`;
    directory += `---\n\n`;
    
    return directory;
}

/**
 * 生成所有节点的详细内容
 * @param {Object} nodeDatabase - 节点数据库
 * @returns {string} 所有节点内容
 */
function generateAllNodesContent(nodeDatabase) {
    if (!nodeDatabase || Object.keys(nodeDatabase).length === 0) {
        return `## 📝 节点详情\n\n*暂无节点详情*\n\n`;
    }
    
    let allContent = `## 📝 节点详情\n\n`;
    
    const nodeEntries = Object.entries(nodeDatabase).sort((a, b) => {
        // 按创建时间排序
        const timeA = new Date(a[1].time?.created || 0);
        const timeB = new Date(b[1].time?.created || 0);
        return timeA - timeB;
    });
    
    nodeEntries.forEach(([nodeId, nodeData], index) => {
        if (index > 0) {
            allContent += `\n---\n\n`;
        }
        
        // 使用MD适配器服务生成节点的MD格式内容
        const nodeMDContent = convertToMDFormat({
            ...nodeData,
            id: nodeId,
            nodeId: nodeId
        });
        
        allContent += nodeMDContent;
        
        // 添加节点元数据
        if (nodeData.time) {
            allContent += `\n\n**📅 节点时间信息:**\n`;
            if (nodeData.time.created) {
                allContent += `- **创建时间:** ${new Date(nodeData.time.created).toLocaleString('zh-CN')}\n`;
            }
            if (nodeData.time.modified) {
                allContent += `- **修改时间:** ${new Date(nodeData.time.modified).toLocaleString('zh-CN')}\n`;
            }
        }
        
        allContent += `\n`;
    });
    
    return allContent;
}

/**
 * 生成项目文档尾部
 * @param {Object} projectInfo - 项目信息
 * @returns {string} 文档尾部内容
 */
function generateProjectFooter(projectInfo) {
    const currentTime = new Date().toLocaleString('zh-CN');
    
    let footer = `\n---\n\n`;
    footer += `## 📊 项目统计\n\n`;
    
    const nodeDatabase = state.state.nodeDatabase || window.nodeDatabase || {};
    const nodeCount = Object.keys(nodeDatabase).length;
    
    // 统计各种状态的节点数量
    const statusStats = {};
    const priorityStats = {};
    const tagStats = {};
    
    Object.values(nodeDatabase).forEach(nodeData => {
        // 状态统计
        const status = nodeData.status || '未设置';
        statusStats[status] = (statusStats[status] || 0) + 1;
        
        // 优先级统计
        const priority = nodeData.priority || '未设置';
        priorityStats[priority] = (priorityStats[priority] || 0) + 1;
        
        // 标签统计
        if (nodeData.tags) {
            Object.values(nodeData.tags).flat().forEach(tag => {
                if (tag) {
                    tagStats[tag] = (tagStats[tag] || 0) + 1;
                }
            });
        }
    });
    
    footer += `**节点总数:** ${nodeCount}\n\n`;
    
    if (Object.keys(statusStats).length > 0) {
        footer += `**状态分布:**\n`;
        Object.entries(statusStats).forEach(([status, count]) => {
            const icon = getStatusIcon({ status });
            footer += `- ${status} ${icon}: ${count}个\n`;
        });
        footer += `\n`;
    }
    
    if (Object.keys(priorityStats).length > 0) {
        footer += `**优先级分布:**\n`;
        Object.entries(priorityStats).forEach(([priority, count]) => {
            const icon = getPriorityIcon({ priority });
            footer += `- ${priority} ${icon}: ${count}个\n`;
        });
        footer += `\n`;
    }
    
    if (Object.keys(tagStats).length > 0) {
        footer += `**热门标签:**\n`;
        Object.entries(tagStats)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .forEach(([tag, count]) => {
                footer += `- #${tag}: ${count}次\n`;
            });
        footer += `\n`;
    }
    
    footer += `---\n\n`;
    footer += `*文档最后更新: ${currentTime}*\n`;
    footer += `*由 NodeMind 自动生成 🤖*\n`;
    
    return footer;
}

/**
 * 保存项目文档到文件
 * @param {string} content - 文档内容
 */
async function saveProjectDocument(content) {
    const projectInfo = state.state.projectInfo;
    if (!projectInfo.documentFileName) {
        console.warn('⚠️ [项目服务] 文档文件名未设置');
        return;
    }
    
    try {
        // 如果支持文件系统API，直接保存
        if ('showSaveFilePicker' in window) {
            const fileName = projectInfo.documentFileName;
            console.log(`💾 [项目服务] 尝试保存项目文档: ${fileName}`);
            
            // 创建下载链接
            const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            console.log(`✅ [项目服务] 项目文档已保存: ${fileName}`);
            
            if (window.showMessage) {
                window.showMessage(`📄 项目文档已保存: ${fileName}`, 3000, 'success');
            }
        } else {
            console.log('📋 [项目服务] 文档内容已生成，但浏览器不支持自动保存');
            
            // 将内容复制到剪贴板
            if (navigator.clipboard) {
                await navigator.clipboard.writeText(content);
                if (window.showMessage) {
                    window.showMessage('📄 项目文档内容已复制到剪贴板', 3000, 'info');
                }
            }
        }
    } catch (error) {
        console.error('❌ [项目服务] 保存项目文档失败:', error);
        if (window.showMessage) {
            window.showMessage('❌ 保存项目文档失败: ' + error.message, 3000, 'error');
        }
    }
}

/**
 * 获取状态图标
 * @param {Object} nodeData - 节点数据
 * @returns {string} 状态图标
 */
function getStatusIcon(nodeData) {
    const statusMap = {
        '已完成': '✅',
        'completed': '✅',
        '完成': '✅',
        '进行中': '🔄',
        'in-progress': '🔄',
        '待开始': '📋',
        'pending': '📋',
        '暂停': '⏸️',
        'paused': '⏸️',
        '已取消': '❌',
        'cancelled': '❌'
    };
    return statusMap[nodeData.status] || '';
}

/**
 * 获取优先级图标
 * @param {Object} nodeData - 节点数据
 * @returns {string} 优先级图标
 */
function getPriorityIcon(nodeData) {
    const priorityMap = {
        '高': '🔴',
        'high': '🔴',
        '中': '🟡',
        'medium': '🟡',
        '低': '🟢',
        'low': '🟢'
    };
    return priorityMap[nodeData.priority] || '';
}

/**
 * 当节点数据更新时，自动重新生成项目文档
 * @param {string} nodeId - 更新的节点ID
 */
export function onNodeDataUpdate(nodeId) {
    console.log(`🔄 [项目服务] 节点 ${nodeId} 数据已更新，重新生成项目文档`);
    
    // 延迟100ms执行，避免频繁更新
    if (state.documentUpdateTimer) {
        clearTimeout(state.documentUpdateTimer);
    }
    
    state.documentUpdateTimer = setTimeout(() => {
        generateProjectDocument();
    }, 100);
}

/**
 * 手动触发项目文档生成
 */
export function triggerDocumentGeneration() {
    console.log('🔄 [项目服务] 手动触发项目文档生成');
    generateProjectDocument();
}

export default {
    getProjectInfo,
    updateProjectInfo,
    setProjectName,
    setProjectAuthor,
    setProjectVersion,
    initializeProjectDocument,
    generateProjectDocument,
    onNodeDataUpdate,
    triggerDocumentGeneration
}; 