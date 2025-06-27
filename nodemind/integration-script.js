/**
 * NodeMind 数据结构升级和样式系统集成脚本
 * 运行此脚本以升级现有系统到新的标准化架构
 */

// 首先加载必要的服务（模拟ES6模块导入）
console.log('🚀 开始集成NodeMind新架构...');

// 数据结构迁移服务（内联版本）
const CURRENT_SCHEMA_VERSION = '2.0.0';

const STANDARD_NODE_SCHEMA = {
    id: '',
    title: '',
    content: '',
    metadata: {
        version: CURRENT_SCHEMA_VERSION,
        created: '',
        modified: '',
        author: '',
        source: 'user'
    },
    tags: {
        categories: [],
        technical: [],
        status: [],
        custom: [],
        future: []
    },
    relations: {
        parent: null,
        children: [],
        dependencies: [],
        references: [],
        conflicts: []
    },
    sessions: [],
    styling: {
        backgroundColor: null,
        textColor: null,
        fontWeight: null,
        borderColor: null,
        customCSS: {}
    },
    extensions: {
        task: {
            priority: null,
            deadline: null,
            progress: 0,
            assignee: null
        },
        document: {
            attachments: [],
            links: [],
            annotations: []
        },
        collaboration: {
            comments: [],
            reviews: [],
            approvals: []
        },
        custom: {}
    }
};

class NodeSchemaMigrator {
    constructor() {
        this.currentVersion = CURRENT_SCHEMA_VERSION;
        this.migrations = new Map();
        this.setupMigrations();
    }
    
    setupMigrations() {
        this.migrations.set('1.0.0->1.1.0', (node) => {
            if (!node.sessions) node.sessions = [];
            return node;
        });
        
        this.migrations.set('1.1.0->1.2.0', (node) => {
            if (!node.relations) {
                node.relations = {
                    parent: null,
                    children: [],
                    dependencies: [],
                    references: [],
                    conflicts: []
                };
            }
            return node;
        });
        
        this.migrations.set('1.2.0->2.0.0', (node) => {
            if (!node.metadata) {
                node.metadata = {
                    version: '2.0.0',
                    created: node.created || new Date().toISOString(),
                    modified: node.modified || new Date().toISOString(),
                    author: node.author || '',
                    source: 'migration'
                };
                delete node.created;
                delete node.modified;
                delete node.author;
            }
            
            if (!node.styling) {
                node.styling = {
                    backgroundColor: null,
                    textColor: null,
                    fontWeight: null,
                    borderColor: null,
                    customCSS: {}
                };
            }
            
            if (!node.extensions) {
                node.extensions = {
                    task: { priority: null, deadline: null, progress: 0, assignee: null },
                    document: { attachments: [], links: [], annotations: [] },
                    collaboration: { comments: [], reviews: [], approvals: [] },
                    custom: {}
                };
            }
            
            return node;
        });
    }
    
    detectNodeVersion(node) {
        if (node.metadata && node.metadata.version) return node.metadata.version;
        if (node.relations) return '1.2.0';
        if (node.sessions) return '1.1.0';
        return '1.0.0';
    }
    
    migrateNode(node) {
        const currentVersion = this.detectNodeVersion(node);
        if (currentVersion === this.currentVersion) return node;
        
        let migratedNode = { ...node };
        let fromVersion = currentVersion;
        
        while (fromVersion !== this.currentVersion) {
            const nextVersion = this.getNextVersion(fromVersion);
            const migrationKey = `${fromVersion}->${nextVersion}`;
            
            if (this.migrations.has(migrationKey)) {
                migratedNode = this.migrations.get(migrationKey)(migratedNode);
            }
            fromVersion = nextVersion;
        }
        
        return this.ensureStandardFields(migratedNode);
    }
    
    getNextVersion(currentVersion) {
        const versions = ['1.0.0', '1.1.0', '1.2.0', '2.0.0'];
        const currentIndex = versions.indexOf(currentVersion);
        return currentIndex < versions.length - 1 ? versions[currentIndex + 1] : currentVersion;
    }
    
    ensureStandardFields(node) {
        const standard = JSON.parse(JSON.stringify(STANDARD_NODE_SCHEMA));
        
        function deepMerge(target, source) {
            for (const key in source) {
                if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                    if (!target[key]) target[key] = {};
                    deepMerge(target[key], source[key]);
                } else if (target[key] === undefined) {
                    target[key] = source[key];
                }
            }
            return target;
        }
        
        return deepMerge(node, standard);
    }
    
    migrateNodeDatabase(nodeDatabase) {
        console.log('🔄 开始迁移节点数据库...');
        let migratedCount = 0;
        
        for (const nodeId in nodeDatabase) {
            const originalNode = nodeDatabase[nodeId];
            const migratedNode = this.migrateNode(originalNode);
            
            if (migratedNode !== originalNode) {
                nodeDatabase[nodeId] = migratedNode;
                migratedCount++;
            }
        }
        
        console.log(`✅ 迁移完成: ${migratedCount} 个节点已升级`);
        return migratedCount;
    }
}

// 样式服务（内联版本）
const STYLE_THEMES = {
    status: {
        '需求': { backgroundColor: '#e3f2fd', textColor: '#000000', fontWeight: 'bold', priority: 10 },
        '项目': { backgroundColor: '#e3f2fd', textColor: '#000000', fontWeight: 'bold', priority: 10 },
        '进行中': { backgroundColor: '#ffebee', textColor: '#000000', fontWeight: 'normal', priority: 8 },
        '完成': { backgroundColor: '#e8f5e8', textColor: '#000000', fontWeight: 'normal', priority: 9 },
        '计划': { backgroundColor: '#fff3e0', textColor: '#000000', fontWeight: 'normal', priority: 7 }
    }
};

class NodeStylingService {
    constructor() {
        this.themes = STYLE_THEMES;
        this.styleCache = new Map();
    }
    
    calculateNodeStyle(nodeId, nodeDatabase) {
        const node = nodeDatabase[nodeId];
        if (!node) return null;
        
        let finalStyle = {
            backgroundColor: null,
            textColor: null,
            fontWeight: null,
            priority: 0
        };
        
        if (node.tags && node.tags.status) {
            for (const statusTag of node.tags.status) {
                const statusStyle = this.themes.status[statusTag];
                if (statusStyle && statusStyle.priority > finalStyle.priority) {
                    Object.assign(finalStyle, statusStyle);
                }
            }
        }
        
        if (node.styling) {
            if (node.styling.backgroundColor) finalStyle.backgroundColor = node.styling.backgroundColor;
            if (node.styling.textColor) finalStyle.textColor = node.styling.textColor;
            if (node.styling.fontWeight) finalStyle.fontWeight = node.styling.fontWeight;
        }
        
        return finalStyle;
    }
    
    applyStyleToNode(nodeId, style, mindmapInstance) {
        if (!style || (!style.backgroundColor && !style.textColor)) return false;
        
        try {
            const nodeElement = document.querySelector(`[nodeid="${nodeId}"]`);
            if (nodeElement) {
                if (style.backgroundColor) {
                    nodeElement.style.setProperty('background-color', style.backgroundColor, 'important');
                }
                if (style.textColor) {
                    nodeElement.style.setProperty('color', style.textColor, 'important');
                }
                if (style.fontWeight) {
                    nodeElement.style.setProperty('font-weight', style.fontWeight, 'important');
                }
                return true;
            }
            return false;
        } catch (error) {
            console.error(`❌ 应用样式失败:`, error);
            return false;
        }
    }
    
    applyStylesToAllNodes(nodeDatabase, mindmapInstance) {
        let successCount = 0;
        
        for (const nodeId in nodeDatabase) {
            const style = this.calculateNodeStyle(nodeId, nodeDatabase);
            if (style && (style.backgroundColor || style.textColor)) {
                const success = this.applyStyleToNode(nodeId, style, mindmapInstance);
                if (success) successCount++;
            }
        }
        
        console.log(`🎨 样式应用完成: ${successCount} 个节点`);
        return successCount;
    }
}

// 创建服务实例
const migrator = new NodeSchemaMigrator();
const stylingService = new NodeStylingService();

// 主集成函数
function integrateNodeMindNewArchitecture() {
    console.log('🚀 开始集成NodeMind新架构...');
    
    // 1. 检查环境
    if (typeof nodeDatabase === 'undefined') {
        console.error('❌ nodeDatabase 未定义，请确保在主页面中运行此脚本');
        return false;
    }
    
    console.log(`📊 发现 ${Object.keys(nodeDatabase).length} 个节点`);
    
    // 2. 迁移数据结构
    const migratedCount = migrator.migrateNodeDatabase(nodeDatabase);
    
    // 3. 为测试节点分配标签
    const testNodeIds = Object.keys(nodeDatabase).slice(0, 20);
    const tags = ['需求', '项目', '进行中', '完成', '计划'];
    let taggedCount = 0;
    
    testNodeIds.forEach((nodeId, index) => {
        const node = nodeDatabase[nodeId];
        if (node) {
            if (!node.tags) node.tags = { categories: [], technical: [], status: [], custom: [], future: [] };
            node.tags.status = [tags[index % tags.length]];
            taggedCount++;
        }
    });
    
    console.log(`🏷️ 为 ${taggedCount} 个节点分配了测试标签`);
    
    // 4. 应用样式
    const mindmapInstance = typeof getCurrentJsMind === 'function' ? getCurrentJsMind() : null;
    if (mindmapInstance) {
        const styledCount = stylingService.applyStylesToAllNodes(nodeDatabase, mindmapInstance);
        console.log(`🎨 成功为 ${styledCount} 个节点应用了样式`);
    } else {
        console.warn('⚠️ 未找到思维导图实例，样式应用可能失败');
    }
    
    // 5. 更新全局函数
    window.nodeSchemaMigrator = migrator;
    window.nodeStylingService = stylingService;
    window.STANDARD_NODE_SCHEMA = STANDARD_NODE_SCHEMA;
    
    // 更新现有的样式函数
    window.applyTagStylesToAllNodes = function() {
        const mindmap = getCurrentJsMind();
        return stylingService.applyStylesToAllNodes(nodeDatabase, mindmap);
    };
    
    window.applyTagBasedNodeStyle = function(nodeId, mindmapInstance) {
        const style = stylingService.calculateNodeStyle(nodeId, nodeDatabase);
        return stylingService.applyStyleToNode(nodeId, style, mindmapInstance);
    };
    
    // 6. 设置自动保存
    if (typeof autoSaveData === 'function') {
        setTimeout(autoSaveData, 1000);
        console.log('💾 数据将在1秒后自动保存');
    }
    
    console.log('✅ NodeMind新架构集成完成！');
    
    // 7. 显示统计信息
    const stats = {
        totalNodes: Object.keys(nodeDatabase).length,
        migratedNodes: migratedCount,
        taggedNodes: taggedCount,
        currentVersion: CURRENT_SCHEMA_VERSION
    };
    
    console.table(stats);
    
    return true;
}

// 快速测试函数
function quickTest() {
    console.log('🧪 开始快速测试...');
    
    // 测试几个节点
    const testNodeIds = Object.keys(nodeDatabase).slice(0, 5);
    testNodeIds.forEach(nodeId => {
        const node = nodeDatabase[nodeId];
        const style = stylingService.calculateNodeStyle(nodeId, nodeDatabase);
        console.log(`节点 ${nodeId} (${node.title}):`, {
            tags: node.tags?.status || [],
            style: style
        });
    });
    
    // 立即应用样式
    const mindmap = getCurrentJsMind();
    if (mindmap) {
        stylingService.applyStylesToAllNodes(nodeDatabase, mindmap);
    }
}

// 导出到全局
window.integrateNodeMindNewArchitecture = integrateNodeMindNewArchitecture;
window.quickTest = quickTest;

console.log('📦 集成脚本已加载，运行 integrateNodeMindNewArchitecture() 开始升级'); 