/**
 * @file md_adapter_service.js
 * @description MD格式适配器服务 - 实现MD内容与脑图数据的双向转换
 * 核心理念：数据结构是伪命题，一切都是MD格式的文本内容，通过语义解析提取结构化信息
 */

/**
 * 解析MD格式的节点内容，提取结构化信息
 * @param {string} mdContent - MD格式的节点内容
 * @returns {object} 解析后的结构化数据
 */
export function parseMDContent(mdContent) {
    if (!mdContent) return {};
    
    const result = {
        nodeId: null,
        title: '',
        content: mdContent,
        relationships: {},
        metadata: {}
    };
    
    // 提取节点标题（第一个 # 标题）
    const titleMatch = mdContent.match(/^#\s*(?:\[([^\]]+)\])?\s*(.+)$/m);
    if (titleMatch) {
        result.nodeId = titleMatch[1] || null; // 节点ID如 [2.1]
        result.title = titleMatch[2].trim();
    }
    
    // 解析关系符号的通用函数
    function parsePatterns(patterns, category) {
        result.relationships[category] = {};
        for (const [key, pattern] of Object.entries(patterns)) {
            const matches = [...mdContent.matchAll(pattern)];
            if (matches.length > 0) {
                result.relationships[category][key] = matches.map(match => ({
                    text: match[1] ? match[1].trim() : '',
                    symbol: match[2] || match[1],
                    fullMatch: match[0]
                }));
            }
        }
    }
    
    // 各种关系符号模式
    const patterns = {
        status: {
            status: /\*\*状态:\*\*\s*([^✅🔄📋⏸️❌🔒]*)(✅|🔄|📋|⏸️|❌|🔒)/g,
            reviewStatus: /\*\*审核状态:\*\*\s*([^👀✔️❗🚫]*)(👀|✔️|❗|🚫)/g
        },
        time: {
            completeTime: /🏁\s*\*\*完成时间:\*\*\s*([^\n\r]+)/g,
            deadline: /⚡\s*\*\*截止时间:\*\*\s*([^\n\r]+)/g
        },
        priority: {
            priority: /\*\*优先级:\*\*\s*([^🔴🟡🟢⚪]*)(🔴|🟡|🟢|⚪)/g
        },
        people: {
            assignee: /👤\s*\*\*负责人:\*\*\s*([^\n\r]+)/g,
            team: /👥\s*\*\*团队:\*\*\s*([^\n\r]+)/g
        },
        dependencies: {
            dependsOn: /➡️\s*\*\*依赖于:\*\*\s*([^\n\r]+)/g,
            blocks: /🚧\s*\*\*阻塞者:\*\*\s*([^\n\r]+)/g,
            blockedBy: /⛔\s*\*\*被阻塞:\*\*\s*([^\n\r]+)/g
        },
        nodeRelations: {
            nodeId: /\*\*节点ID:\*\*\s*([^\n\r]+)/g,
            parentNode: /👆\s*\*\*父节点:\*\*\s*\[([^\]]+)\]/g,
            childNodes: /👇\s*\*\*子节点:\*\*\s*\[([^\]]+)\]/g,
            references: /🔗\s*\*\*引用:\*\*\s*\[([^\]]+)\]/g
        }
    };
    
    // 解析所有模式
    Object.entries(patterns).forEach(([category, categoryPatterns]) => {
        parsePatterns(categoryPatterns, category);
    });
    
    // 解析标签
    const tagPattern = /\*\*(?:标签|项目标签):\*\*\s*([^\n\r]+)/g;
    const tagMatches = [...mdContent.matchAll(tagPattern)];
    if (tagMatches.length > 0) {
        result.relationships.tags = tagMatches.map(match => 
            match[1].split(/[#\s,，]+/).filter(tag => tag.trim())
        ).flat();
    }
    
    // 提取节点ID引用
    function extractNodeIds(text) {
        if (!text) return [];
        const nodeIdRegex = /\[([^\]]+)\]/g;
        const matches = [...text.matchAll(nodeIdRegex)];
        return matches.map(match => match[1].trim());
    }
    
    // 处理关系中的节点ID
    ['dependencies', 'nodeRelations'].forEach(category => {
        if (result.relationships[category]) {
            for (const [key, relations] of Object.entries(result.relationships[category])) {
                if (relations && relations.length > 0) {
                    result.relationships[category][key] = relations.map(rel => ({
                        ...rel,
                        nodeIds: key === 'childNodes' ? rel.text.split(',').map(id => id.trim()) : extractNodeIds(rel.text)
                    }));
                }
            }
        }
    });
    
    // 提取元数据
    result.metadata = {
        hasNodeId: !!result.nodeId,
        isCompleted: /\*\*状态:\*\*.*?✅/.test(mdContent),
        hasInjection: /\*\*\[已注入\]\*\*/.test(mdContent),
        lastModified: extractLastModified(mdContent),
        sessions: extractSessions(mdContent)
    };
    
    return result;
}

/**
 * 提取最后修改时间
 * @param {string} mdContent - MD内容
 * @returns {string|null} 最后修改时间
 */
function extractLastModified(mdContent) {
    const timeMatch = mdContent.match(/\*\*完成时间:\*\*\s*([^\n\r]+)/);
    if (timeMatch) return timeMatch[1];
    
    const injectionMatch = mdContent.match(/\*\*\[已注入\]\*\*.*?(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})/);
    if (injectionMatch) return injectionMatch[1];
    
    return null;
}

/**
 * 提取会话信息
 * @param {string} mdContent - MD内容
 * @returns {Array} 会话列表
 */
function extractSessions(mdContent) {
    const sessions = [];
    
    // 匹配所有二级标题作为会话
    const sessionMatches = [...mdContent.matchAll(/^##\s*(?:\[([^\]]+)\])?\s*(.+)$/gm)];
    
    sessionMatches.forEach((match, index) => {
        const sessionId = match[1] || `session-${index + 1}`;
        const sessionTitle = match[2].trim();
        
        // 提取该会话的内容（到下一个二级标题或文档末尾）
        const sessionStart = match.index;
        const nextSessionMatch = sessionMatches[index + 1];
        const sessionEnd = nextSessionMatch ? nextSessionMatch.index : mdContent.length;
        const sessionContent = mdContent.substring(sessionStart, sessionEnd);
        
        sessions.push({
            id: sessionId,
            title: sessionTitle,
            content: sessionContent,
            relationships: parseMDContent(sessionContent).relationships || {}
        });
    });
    
    return sessions;
}

/**
 * 将nodeDatabase中的数据转换为MD格式
 * @param {object} nodeData - 节点数据
 * @returns {string} MD格式内容
 */
export function convertToMDFormat(nodeData) {
    if (!nodeData) return '';
    
    let mdContent = '';
    
    // 标题部分
    const nodeId = nodeData.nodeId || nodeData.id;
    if (nodeId && nodeId !== nodeData.title) {
        mdContent += `# [${nodeId}] ${nodeData.title}\n\n`;
    } else {
        mdContent += `# ${nodeData.title}\n\n`;
    }
    
    // 如果已有MD格式内容，保持原有格式
    if (nodeData.content && nodeData.content.includes('**')) {
        mdContent += nodeData.content.replace(/^#[^\n]+\n\n?/, '');
        return mdContent;
    }
    
    // 从数据结构生成MD内容
    if (nodeData.nodeId) {
        mdContent += `**节点ID:** ${nodeData.nodeId}\n`;
    }
    
    if (nodeData.priority) {
        const prioritySymbol = getPrioritySymbol(nodeData.priority);
        mdContent += `**优先级:** ${nodeData.priority} ${prioritySymbol}\n`;
    }
    
    if (nodeData.author) {
        mdContent += `**负责人:** ${nodeData.author} 👤\n`;
    }
    
    if (nodeData.status) {
        const statusSymbol = getStatusSymbol(nodeData.status);
        mdContent += `**状态:** ${nodeData.status} ${statusSymbol}\n`;
    }
    
    if (nodeData.tags && Object.keys(nodeData.tags).length > 0) {
        const allTags = Object.values(nodeData.tags).flat().filter(tag => tag);
        if (allTags.length > 0) {
            mdContent += `**项目标签:** ${allTags.map(tag => '#' + tag).join(' ')}\n`;
        }
    }
    
    // 关系信息
    if (nodeData.relations) {
        if (nodeData.relations.parent) {
            mdContent += `**父节点:** [${nodeData.relations.parent}] 👆\n`;
        }
        if (nodeData.relations.children && nodeData.relations.children.length > 0) {
            mdContent += `**子节点:** [${nodeData.relations.children.join(', ')}] 👇\n`;
        }
    }
    
    mdContent += '\n';
    
    // 内容部分
    if (nodeData.content && !nodeData.content.includes('**')) {
        mdContent += nodeData.content;
    }
    
    // 会话部分
    if (nodeData.sessions && nodeData.sessions.length > 0) {
        nodeData.sessions.forEach((session, index) => {
            mdContent += `\n## [${session.id || `session-${index + 1}`}] ${session.title || `会话${index + 1}`}\n\n`;
            if (session.content) {
                mdContent += session.content + '\n';
            }
        });
    }
    
    return mdContent;
}

/**
 * 获取优先级符号
 * @param {string} priority - 优先级文本
 * @returns {string} 对应的emoji符号
 */
function getPrioritySymbol(priority) {
    const priorityMap = {
        '高': '🔴',
        'high': '🔴',
        '中': '🟡',
        'medium': '🟡',
        '低': '🟢',
        'low': '🟢'
    };
    return priorityMap[priority] || '⚪';
}

/**
 * 获取状态符号
 * @param {string} status - 状态文本
 * @returns {string} 对应的emoji符号
 */
function getStatusSymbol(status) {
    const statusMap = {
        '已完成': '✅',
        'completed': '✅',
        '完成': '✅',
        '进行中': '🔄',
        'in-progress': '🔄',
        '待开始': '📋',
        'pending': '📋',
        '暂停': '⏸️',
        'paused': '⏸️'
    };
    return statusMap[status] || '📋';
}

/**
 * 同步MD内容到nodeDatabase
 * @param {string} nodeId - 节点ID
 * @param {string} mdContent - MD内容
 */
export function syncMDToNodeDatabase(nodeId, mdContent) {
    if (!window.nodeDatabase) {
        window.nodeDatabase = {};
    }
    
    const parsedData = parseMDContent(mdContent);
    
    // 获取或创建节点数据
    if (!window.nodeDatabase[nodeId]) {
        window.nodeDatabase[nodeId] = {
            id: nodeId,
            title: '',
            content: '',
            sessions: [],
            author: 'NodeMind',
            created: new Date().toISOString(),
            modified: new Date().toISOString(),
            tags: { categories: [], technical: [], status: [] }
        };
    }
    
    const nodeData = window.nodeDatabase[nodeId];
    
    // 更新数据
    nodeData.title = parsedData.title || nodeData.title;
    nodeData.content = mdContent;
    nodeData.modified = new Date().toISOString();
    nodeData.nodeId = parsedData.nodeId;
    
    // 从解析结果更新各种信息
    if (parsedData.relationships.tags) {
        nodeData.tags.categories = parsedData.relationships.tags;
    }
    
    if (parsedData.relationships.status?.status?.[0]) {
        nodeData.status = parsedData.relationships.status.status[0].text || 
                          getStatusText(parsedData.relationships.status.status[0].symbol);
    }
    
    if (parsedData.relationships.people?.assignee?.[0]) {
        nodeData.author = parsedData.relationships.people.assignee[0].text;
    }
    
    if (parsedData.metadata.sessions) {
        nodeData.sessions = parsedData.metadata.sessions;
    }
    
    console.log(`📝 [MD适配器] 已同步节点 ${nodeId} 的MD内容到数据库`);
    return nodeData;
}

/**
 * 从符号获取状态文本
 * @param {string} symbol - 状态符号
 * @returns {string} 状态文本
 */
function getStatusText(symbol) {
    const symbolMap = {
        '✅': '已完成',
        '🔄': '进行中',
        '📋': '待开始',
        '⏸️': '暂停',
        '❌': '已取消',
        '🔒': '已锁定'
    };
    return symbolMap[symbol] || '待开始';
}

/**
 * 创建标签节点的MD内容
 * @param {string} tagName - 标签名称
 * @param {Array} relatedNodes - 关联的节点ID列表
 * @returns {string} 标签节点的MD内容
 */
export function createTagNodeMD(tagName, relatedNodes = []) {
    let mdContent = `# [Tag-${tagName}] 🏷️ ${tagName}\n\n`;
    mdContent += `**节点类型:** 标签节点 🏷️\n`;
    mdContent += `**标签名称:** ${tagName}\n`;
    mdContent += `**创建时间:** ${new Date().toLocaleString()} 📅\n`;
    
    if (relatedNodes.length > 0) {
        mdContent += `**关联节点:** [${relatedNodes.join(', ')}] 🔗\n`;
        mdContent += `**节点数量:** ${relatedNodes.length}个\n`;
    }
    
    mdContent += `\n## 标签描述\n`;
    mdContent += `这是一个自动生成的标签节点，用于管理带有"${tagName}"标签的所有节点。\n\n`;
    
    if (relatedNodes.length > 0) {
        mdContent += `## 关联节点列表\n`;
        relatedNodes.forEach((nodeId, index) => {
            mdContent += `${index + 1}. [${nodeId}] - 点击查看详情 🔗\n`;
        });
    }
    
    mdContent += `\n**自动更新:** 当节点标签发生变化时，此标签节点会自动更新 🔄\n`;
    
    return mdContent;
}

/**
 * 扫描所有节点，自动创建和更新标签节点
 */
export function syncAllTagNodes() {
    if (!window.nodeDatabase) return;
    
    console.log('🏷️ [MD适配器] 开始同步所有标签节点...');
    
    const tagToNodes = new Map();
    
    // 扫描所有节点，收集标签信息
    Object.values(window.nodeDatabase).forEach(node => {
        if (node.isTagNode) return; // 跳过标签节点本身
        
        // 从MD内容解析标签
        if (node.content) {
            const parsedData = parseMDContent(node.content);
            if (parsedData.relationships.tags) {
                parsedData.relationships.tags.forEach(tag => {
                    if (!tagToNodes.has(tag)) {
                        tagToNodes.set(tag, []);
                    }
                    tagToNodes.get(tag).push(node.id);
                });
            }
        }
        
        // 从传统tags字段解析标签
        if (node.tags) {
            Object.values(node.tags).flat().forEach(tag => {
                if (tag && tag.trim()) {
                    if (!tagToNodes.has(tag)) {
                        tagToNodes.set(tag, []);
                    }
                    if (!tagToNodes.get(tag).includes(node.id)) {
                        tagToNodes.get(tag).push(node.id);
                    }
                }
            });
        }
    });
    
    // 为每个标签创建或更新标签节点
    tagToNodes.forEach((nodeIds, tagName) => {
        const tagNodeId = `Tag-${tagName}`;
        
        if (!window.nodeDatabase[tagNodeId]) {
            window.nodeDatabase[tagNodeId] = {
                id: tagNodeId,
                title: `🏷️ ${tagName}`,
                content: createTagNodeMD(tagName, nodeIds),
                nodeId: tagNodeId,
                isTagNode: true,
                tagName: tagName,
                author: 'System',
                created: new Date().toISOString(),
                modified: new Date().toISOString(),
                tags: { categories: ['system', 'tag'], technical: [], status: [] },
                relations: { parent: null, children: nodeIds }
            };
        } else {
            // 更新现有标签节点
            const tagNode = window.nodeDatabase[tagNodeId];
            tagNode.content = createTagNodeMD(tagName, nodeIds);
            tagNode.modified = new Date().toISOString();
            tagNode.relations.children = nodeIds;
        }
    });
    
    console.log(`🏷️ [MD适配器] 标签节点同步完成，处理了 ${tagToNodes.size} 个标签`);
}

/**
 * 导出默认对象
 */
export default {
    parseMDContent,
    convertToMDFormat,
    syncMDToNodeDatabase,
    createTagNodeMD,
    syncAllTagNodes
}; 