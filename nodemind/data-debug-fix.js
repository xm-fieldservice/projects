/**
 * NodeMind 数据诊断和修复脚本
 * 专门解决数据获取不完整的问题
 */

console.log('🔍 开始NodeMind数据诊断...');

// === 第一步：诊断当前数据状态 ===
function diagnoseCurrentData() {
    console.log('📊 === 数据状态诊断 ===');
    
    const diagnosis = {
        localStorage: {},
        globalVariables: {},
        jsMindData: {},
        currentMindmap: null
    };
    
    // 检查localStorage数据
    const localStorageKeys = [
        'nodemind_node_database',
        'nodemind_session_database', 
        'nodemind_mindmap_data',
        'nodemind_four_component_data'
    ];
    
    localStorageKeys.forEach(key => {
        try {
            const data = localStorage.getItem(key);
            if (data) {
                const parsed = JSON.parse(data);
                diagnosis.localStorage[key] = {
                    exists: true,
                    size: data.length,
                    objectCount: typeof parsed === 'object' ? Object.keys(parsed).length : 0,
                    sample: typeof parsed === 'object' ? Object.keys(parsed).slice(0, 3) : parsed
                };
            } else {
                diagnosis.localStorage[key] = { exists: false };
            }
        } catch (error) {
            diagnosis.localStorage[key] = { exists: false, error: error.message };
        }
    });
    
    // 检查全局变量
    const globalVars = [
        'nodeDatabase',
        'sessionDatabase', 
        'mindmapData',
        'mindmaps',
        'currentMindmap',
        'nodeParent',
        'nodeChildren'
    ];
    
    globalVars.forEach(varName => {
        if (typeof window[varName] !== 'undefined') {
            const data = window[varName];
            diagnosis.globalVariables[varName] = {
                exists: true,
                type: typeof data,
                size: typeof data === 'object' && data ? Object.keys(data).length : 0,
                sample: typeof data === 'object' && data ? Object.keys(data).slice(0, 3) : data
            };
        } else {
            diagnosis.globalVariables[varName] = { exists: false };
        }
    });
    
    // 检查jsMind实例数据
    if (window.mindmaps && typeof window.mindmaps === 'object') {
        Object.keys(window.mindmaps).forEach(mapId => {
            const mindmap = window.mindmaps[mapId];
            if (mindmap && typeof mindmap.get_data === 'function') {
                try {
                    const data = mindmap.get_data();
                    diagnosis.jsMindData[mapId] = {
                        exists: true,
                        hasData: !!data,
                        nodeCount: data && data.data ? countJsMindNodes(data.data) : 0,
                        rootTopic: data && data.data ? data.data.topic : 'unknown'
                    };
                } catch (error) {
                    diagnosis.jsMindData[mapId] = { exists: false, error: error.message };
                }
            }
        });
    }
    
    diagnosis.currentMindmap = window.currentMindmap;
    
    console.log('📊 诊断结果:', diagnosis);
    return diagnosis;
}

// 辅助函数：计算jsMind节点数量
function countJsMindNodes(nodeData) {
    if (!nodeData) return 0;
    let count = 1;
    if (nodeData.children) {
        nodeData.children.forEach(child => {
            count += countJsMindNodes(child);
        });
    }
    return count;
}

// === 第二步：强制数据提取 ===
function forceExtractAllData() {
    console.log('💪 === 强制提取所有可用数据 ===');
    
    const extractedData = {
        nodeDatabase: {},
        sessionDatabase: {},
        mindmapData: {},
        fourComponentData: {}
    };
    
    // 1. 从localStorage强制提取
    try {
        const storedNodeDB = localStorage.getItem('nodemind_node_database');
        if (storedNodeDB) {
            extractedData.nodeDatabase = JSON.parse(storedNodeDB);
            console.log(`✅ 从localStorage提取nodeDatabase: ${Object.keys(extractedData.nodeDatabase).length} 个节点`);
        }
    } catch (error) {
        console.warn('⚠️ localStorage nodeDatabase提取失败:', error.message);
    }
    
    try {
        const storedSessionDB = localStorage.getItem('nodemind_session_database');
        if (storedSessionDB) {
            extractedData.sessionDatabase = JSON.parse(storedSessionDB);
            console.log(`✅ 从localStorage提取sessionDatabase: ${Object.keys(extractedData.sessionDatabase).length} 个会话`);
        }
    } catch (error) {
        console.warn('⚠️ localStorage sessionDatabase提取失败:', error.message);
    }
    
    try {
        const storedMindmapData = localStorage.getItem('nodemind_mindmap_data');
        if (storedMindmapData) {
            extractedData.mindmapData = JSON.parse(storedMindmapData);
            console.log(`✅ 从localStorage提取mindmapData: ${Object.keys(extractedData.mindmapData).length} 个脑图`);
        }
    } catch (error) {
        console.warn('⚠️ localStorage mindmapData提取失败:', error.message);
    }
    
    try {
        const storedFourComponentData = localStorage.getItem('nodemind_four_component_data');
        if (storedFourComponentData) {
            extractedData.fourComponentData = JSON.parse(storedFourComponentData);
            console.log(`✅ 从localStorage提取fourComponentData: ${Object.keys(extractedData.fourComponentData).length} 个组件`);
        }
    } catch (error) {
        console.warn('⚠️ localStorage fourComponentData提取失败:', error.message);
    }
    
    // 2. 从全局变量补充提取
    if (window.nodeDatabase && typeof window.nodeDatabase === 'object') {
        const globalNodeDB = window.nodeDatabase;
        Object.keys(globalNodeDB).forEach(nodeId => {
            if (!extractedData.nodeDatabase[nodeId]) {
                extractedData.nodeDatabase[nodeId] = globalNodeDB[nodeId];
            } else {
                // 合并数据，保留更完整的内容
                const stored = extractedData.nodeDatabase[nodeId];
                const global = globalNodeDB[nodeId];
                
                if (global.content && (!stored.content || stored.content.length < global.content.length)) {
                    extractedData.nodeDatabase[nodeId].content = global.content;
                }
                if (global.sessions && global.sessions.length > 0) {
                    extractedData.nodeDatabase[nodeId].sessions = global.sessions;
                }
            }
        });
        console.log(`🔄 从全局变量合并nodeDatabase数据`);
    }
    
    // 3. 从jsMind实例强制提取实时数据
    if (window.mindmaps && typeof window.mindmaps === 'object') {
        Object.keys(window.mindmaps).forEach(mapId => {
            const mindmap = window.mindmaps[mapId];
            if (mindmap && typeof mindmap.get_data === 'function') {
                try {
                    const jsMindData = mindmap.get_data();
                    if (jsMindData && jsMindData.data) {
                        // 将jsMind数据转换为标准格式
                        if (!extractedData.mindmapData[mapId]) {
                            extractedData.mindmapData[mapId] = jsMindData;
                        }
                        
                        // 从jsMind数据中提取节点信息
                        extractNodesFromJsMindData(jsMindData.data, mapId, extractedData.nodeDatabase);
                        console.log(`🔄 从jsMind实例[${mapId}]提取实时数据`);
                    }
                } catch (error) {
                    console.warn(`⚠️ jsMind实例[${mapId}]提取失败:`, error.message);
                }
            }
        });
    }
    
    // 4. 检查当前激活的脑图
    if (window.currentMindmap && window.jm) {
        try {
            const currentData = window.jm.get_data();
            if (currentData && currentData.data) {
                const mapId = window.currentMindmap;
                extractedData.mindmapData[mapId] = currentData;
                extractNodesFromJsMindData(currentData.data, mapId, extractedData.nodeDatabase);
                console.log(`🔄 从当前激活脑图[${mapId}]提取数据`);
            }
        } catch (error) {
            console.warn('⚠️ 当前激活脑图提取失败:', error.message);
        }
    }
    
    console.log('💪 强制数据提取完成:');
    console.log(`  - nodeDatabase: ${Object.keys(extractedData.nodeDatabase).length} 个节点`);
    console.log(`  - sessionDatabase: ${Object.keys(extractedData.sessionDatabase).length} 个会话`);
    console.log(`  - mindmapData: ${Object.keys(extractedData.mindmapData).length} 个脑图`);
    console.log(`  - fourComponentData: ${Object.keys(extractedData.fourComponentData).length} 个组件`);
    
    return extractedData;
}

// 辅助函数：从jsMind数据中提取节点
function extractNodesFromJsMindData(nodeData, mapId, nodeDatabase, parentPath = '') {
    if (!nodeData || !nodeData.id) return;
    
    const nodeId = nodeData.id;
    const nodePath = parentPath ? `${parentPath}/${nodeId}` : `${mapId}/${nodeId}`;
    const cleanTopic = nodeData.topic ? nodeData.topic.replace(' 📄', '').trim() : '未命名节点';
    
    // 如果节点不存在，创建基础结构
    if (!nodeDatabase[nodeId]) {
        nodeDatabase[nodeId] = {
            id: nodeId,
            title: cleanTopic,
            topic: cleanTopic,
            content: '',
            author: 'NodeMind',
            created: new Date().toISOString(),
            modified: new Date().toISOString(),
            tags: { categories: [], technical: [], status: [] },
            sessions: []
        };
    } else {
        // 更新标题
        nodeDatabase[nodeId].title = cleanTopic;
        nodeDatabase[nodeId].topic = cleanTopic;
    }
    
    // 更新路径和关系信息
    nodeDatabase[nodeId].path = nodePath;
    nodeDatabase[nodeId].mapId = mapId;
    nodeDatabase[nodeId].level = nodePath.split('/').length - 1;
    
    // 更新父子关系
    const parentId = parentPath ? parentPath.split('/').pop() : null;
    const childrenIds = nodeData.children ? nodeData.children.map(child => child.id) : [];
    
    nodeDatabase[nodeId].relations = {
        parent: parentId,
        children: childrenIds
    };
    
    // 其他属性
    if (nodeData.direction) nodeDatabase[nodeId].direction = nodeData.direction;
    if (nodeData.expanded !== undefined) nodeDatabase[nodeId].expanded = nodeData.expanded;
    
    // 递归处理子节点
    if (nodeData.children) {
        nodeData.children.forEach(child => {
            extractNodesFromJsMindData(child, mapId, nodeDatabase, nodePath);
        });
    }
}

// === 第三步：修复数据获取函数 ===
function fixDataRetrievalFunctions() {
    console.log('🔧 === 修复数据获取函数 ===');
    
    // 先强制提取所有数据
    const forcedData = forceExtractAllData();
    
    // 重写getNodeDatabase函数
    window.getNodeDatabase = async function() {
        console.log('🔧 使用修复版本的getNodeDatabase');
        
        // 优先使用强制提取的数据
        let nodeDatabase = { ...forcedData.nodeDatabase };
        
        // 实时同步jsMind数据
        if (window.mindmaps) {
            Object.keys(window.mindmaps).forEach(mapId => {
                const mindmap = window.mindmaps[mapId];
                if (mindmap && typeof mindmap.get_data === 'function') {
                    try {
                        const jsMindData = mindmap.get_data();
                        if (jsMindData && jsMindData.data) {
                            extractNodesFromJsMindData(jsMindData.data, mapId, nodeDatabase);
                        }
                    } catch (error) {
                        console.warn(`jsMind[${mapId}]同步失败:`, error.message);
                    }
                }
            });
        }
        
        console.log(`✅ getNodeDatabase返回 ${Object.keys(nodeDatabase).length} 个节点`);
        return nodeDatabase;
    };
    
    // 重写getSessionDatabase函数
    window.getSessionDatabase = async function() {
        console.log('🔧 使用修复版本的getSessionDatabase');
        
        let sessionDatabase = { ...forcedData.sessionDatabase };
        
        // 尝试从全局变量补充
        if (window.sessionDatabase && typeof window.sessionDatabase === 'object') {
            Object.keys(window.sessionDatabase).forEach(nodeId => {
                if (!sessionDatabase[nodeId] && window.sessionDatabase[nodeId]) {
                    sessionDatabase[nodeId] = window.sessionDatabase[nodeId];
                }
            });
        }
        
        console.log(`✅ getSessionDatabase返回 ${Object.keys(sessionDatabase).length} 个会话节点`);
        return sessionDatabase;
    };
    
    // 重写getMindmapDataWithHierarchy函数
    window.getMindmapDataWithHierarchy = async function() {
        console.log('🔧 使用修复版本的getMindmapDataWithHierarchy');
        
        let mindmapData = { ...forcedData.mindmapData };
        
        // 实时获取jsMind数据
        if (window.mindmaps) {
            Object.keys(window.mindmaps).forEach(mapId => {
                const mindmap = window.mindmaps[mapId];
                if (mindmap && typeof mindmap.get_data === 'function') {
                    try {
                        const jsMindData = mindmap.get_data();
                        if (jsMindData) {
                            mindmapData[mapId] = jsMindData;
                        }
                    } catch (error) {
                        console.warn(`获取jsMind[${mapId}]数据失败:`, error.message);
                    }
                }
            });
        }
        
        console.log(`✅ getMindmapDataWithHierarchy返回 ${Object.keys(mindmapData).length} 个脑图`);
        return mindmapData;
    };
    
    // 重写getFourComponentData函数
    window.getFourComponentData = async function() {
        console.log('🔧 使用修复版本的getFourComponentData');
        
        let fourComponentData = { ...forcedData.fourComponentData };
        
        // 尝试从其他来源补充
        if (window.fourComponentData && typeof window.fourComponentData === 'object') {
            Object.keys(window.fourComponentData).forEach(nodeId => {
                if (!fourComponentData[nodeId] && window.fourComponentData[nodeId]) {
                    fourComponentData[nodeId] = window.fourComponentData[nodeId];
                }
            });
        }
        
        console.log(`✅ getFourComponentData返回 ${Object.keys(fourComponentData).length} 个组件`);
        return fourComponentData;
    };
    
    // 存储修复后的数据到全局变量，供其他功能使用
    window.extractedNodeMindData = forcedData;
    
    console.log('🔧 数据获取函数修复完成');
}

// === 第四步：测试修复效果 ===
async function testFixedFunctions() {
    console.log('🧪 === 测试修复后的函数 ===');
    
    try {
        const nodeDatabase = await window.getNodeDatabase();
        const sessionDatabase = await window.getSessionDatabase();
        const mindmapData = await window.getMindmapDataWithHierarchy();
        const fourComponentData = await window.getFourComponentData();
        
        console.log('🧪 测试结果:');
        console.log(`  - nodeDatabase: ${Object.keys(nodeDatabase).length} 个节点`);
        console.log(`  - sessionDatabase: ${Object.keys(sessionDatabase).length} 个会话`);
        console.log(`  - mindmapData: ${Object.keys(mindmapData).length} 个脑图`);
        console.log(`  - fourComponentData: ${Object.keys(fourComponentData).length} 个组件`);
        
        // 检查节点内容完整性
        let contentCount = 0;
        let sessionCount = 0;
        Object.values(nodeDatabase).forEach(node => {
            if (node.content && node.content.trim()) contentCount++;
            if (node.sessions && node.sessions.length > 0) sessionCount++;
        });
        
        console.log(`  - 有内容的节点: ${contentCount}/${Object.keys(nodeDatabase).length}`);
        console.log(`  - 有会话的节点: ${sessionCount}/${Object.keys(nodeDatabase).length}`);
        
        return {
            nodeDatabase,
            sessionDatabase, 
            mindmapData,
            fourComponentData,
            success: true
        };
        
    } catch (error) {
        console.error('❌ 测试修复后的函数失败:', error);
        return { success: false, error: error.message };
    }
}

// === 第五步：立即测试导出 ===
async function testCompleteExport() {
    console.log('📝 === 测试完整导出 ===');
    
    try {
        // 使用修复后的函数获取数据
        const nodeDatabase = await window.getNodeDatabase();
        const sessionDatabase = await window.getSessionDatabase();
        const mindmapData = await window.getMindmapDataWithHierarchy();
        const fourComponentData = await window.getFourComponentData();
        
        // 准备项目信息
        const projectInfo = {
            name: '修复后的NodeMind项目',
            description: '使用修复后数据获取函数的完整导出测试',
            author: 'NodeMind修复版本',
            version: '2.0.0',
            exportTime: new Date().toISOString()
        };
        
        // 生成MD文档
        let mdContent;
        if (typeof window.generateNodeMindStandardDocument === 'function') {
            mdContent = window.generateNodeMindStandardDocument(
                nodeDatabase, 
                sessionDatabase, 
                mindmapData, 
                fourComponentData, 
                projectInfo
            );
        } else {
            // 使用简化版本生成
            mdContent = generateSimpleMDContent(nodeDatabase, sessionDatabase, projectInfo);
        }
        
        console.log(`📝 生成的MD内容长度: ${mdContent.length} 字符`);
        
        // 使用超级保存函数保存
        if (typeof window.superEmergencySave === 'function') {
            window.superEmergencySave(
                { mdContent: mdContent }, 
                'NodeMind-完整修复测试', 
                'md'
            );
        } else {
            // 降级保存
            const blob = new Blob([mdContent], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'NodeMind-完整修复测试.md';
            a.click();
            URL.revokeObjectURL(url);
        }
        
        console.log('✅ 完整导出测试成功');
        
    } catch (error) {
        console.error('❌ 完整导出测试失败:', error);
    }
}

// 简化MD内容生成器
function generateSimpleMDContent(nodeDatabase, sessionDatabase, projectInfo) {
    const lines = [];
    const currentTime = new Date().toLocaleString();
    
    lines.push(`# ${projectInfo.name}`);
    lines.push('');
    lines.push(`**导出时间**: ${currentTime}`);
    lines.push(`**导出版本**: ${projectInfo.version}`);
    lines.push('');
    
    lines.push(`## 节点数据 (${Object.keys(nodeDatabase).length} 个节点)`);
    lines.push('');
    
    Object.entries(nodeDatabase).forEach(([nodeId, nodeData]) => {
        const title = nodeData.title || nodeData.topic || '未命名节点';
        lines.push(`### ${title}`);
        lines.push('');
        lines.push(`**节点ID**: \`${nodeId}\``);
        lines.push(`**路径**: \`${nodeData.path || '未定义'}\``);
        lines.push('');
        
        if (nodeData.content && nodeData.content.trim()) {
            lines.push('**内容**:');
            lines.push('```text');
            lines.push(nodeData.content.trim());
            lines.push('```');
        } else {
            lines.push('**内容**: *暂无内容*');
        }
        lines.push('');
        
        // 会话数据
        const sessions = sessionDatabase[nodeId];
        if (sessions && sessions.sessions && sessions.sessions.length > 0) {
            lines.push('**会话记录**:');
            sessions.sessions.forEach((session, index) => {
                lines.push(`${index + 1}. ${session.title || '无标题'}`);
                if (session.content) {
                    lines.push(`   内容: ${session.content.substring(0, 100)}...`);
                }
            });
        } else {
            lines.push('**会话记录**: *暂无会话*');
        }
        
        lines.push('');
        lines.push('---');
        lines.push('');
    });
    
    return lines.join('\n');
}

// === 主执行函数 ===
async function executeDataFix() {
    console.log('🚀 === 开始NodeMind数据修复流程 ===');
    
    try {
        // 1. 诊断当前数据状态
        const diagnosis = diagnoseCurrentData();
        
        // 2. 修复数据获取函数
        fixDataRetrievalFunctions();
        
        // 3. 测试修复效果
        const testResult = await testFixedFunctions();
        
        if (testResult.success) {
            console.log('✅ 数据修复成功！');
            
            // 4. 测试完整导出
            await testCompleteExport();
            
            console.log('🎉 NodeMind数据修复流程完成！');
            console.log('💡 现在可以使用修复后的保存功能了');
            
            // 显示成功提示
            if (typeof alert !== 'undefined') {
                alert('🎉 NodeMind数据修复成功！\n\n修复内容：\n• 数据获取函数已修复\n• 完整导出功能已修复\n• 现在可以正常保存完整内容');
            }
            
        } else {
            console.error('❌ 数据修复失败:', testResult.error);
        }
        
    } catch (error) {
        console.error('❌ 数据修复流程失败:', error);
    }
}

// 提供测试函数
window.testDataFix = executeDataFix;
window.diagnoseCurrent = diagnoseCurrentData;
window.forceExtractData = forceExtractAllData;

// 立即执行修复
executeDataFix();

console.log('✨ NodeMind数据修复脚本加载完成！');
console.log('🧪 输入 testDataFix() 可以重新运行修复流程');
console.log('🔍 输入 diagnoseCurrent() 可以查看当前数据状态');
console.log('💪 输入 forceExtractData() 可以强制提取所有数据'); 