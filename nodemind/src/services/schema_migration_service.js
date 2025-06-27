/**
 * 节点数据结构迁移服务
 * 负责管理节点数据结构的版本升级和兼容性处理
 */

// 当前数据结构版本
const CURRENT_SCHEMA_VERSION = '2.0.0';

// 标准节点数据结构定义
const STANDARD_NODE_SCHEMA = {
    // 基础字段
    id: '',
    title: '',
    content: '',
    
    // 元数据
    metadata: {
        version: CURRENT_SCHEMA_VERSION,
        created: '',
        modified: '',
        author: '',
        source: 'user' // user, import, sync, etc.
    },
    
    // 标签系统
    tags: {
        categories: [],    // 分类标签
        technical: [],     // 技术标签
        status: [],        // 状态标签
        custom: [],        // 自定义标签
        future: []         // 未来扩展标签
    },
    
    // 关系系统
    relations: {
        parent: null,      // 父节点ID
        children: [],      // 子节点ID列表
        dependencies: [],  // 依赖关系
        references: [],    // 引用关系
        conflicts: []      // 冲突关系
    },
    
    // 会话系统
    sessions: [],
    
    // 样式系统（新增）
    styling: {
        backgroundColor: null,
        textColor: null,
        fontWeight: null,
        borderColor: null,
        customCSS: {}
    },
    
    // 扩展字段（为未来功能预留）
    extensions: {
        // 任务管理
        task: {
            priority: null,
            deadline: null,
            progress: 0,
            assignee: null
        },
        
        // 文档系统
        document: {
            attachments: [],
            links: [],
            annotations: []
        },
        
        // 协作系统
        collaboration: {
            comments: [],
            reviews: [],
            approvals: []
        },
        
        // 自定义扩展
        custom: {}
    }
};

// 数据结构版本历史
const SCHEMA_VERSIONS = {
    '1.0.0': {
        description: '初始版本',
        fields: ['id', 'title', 'content', 'author', 'created', 'modified', 'tags']
    },
    '1.1.0': {
        description: '添加会话系统',
        fields: ['sessions']
    },
    '1.2.0': {
        description: '添加关系系统',
        fields: ['relations']
    },
    '2.0.0': {
        description: '统一数据结构，添加样式和扩展系统',
        fields: ['metadata', 'styling', 'extensions']
    }
};

/**
 * 节点数据结构迁移器
 */
class NodeSchemaMigrator {
    constructor() {
        this.currentVersion = CURRENT_SCHEMA_VERSION;
        this.migrations = new Map();
        this.setupMigrations();
    }
    
    /**
     * 设置迁移规则
     */
    setupMigrations() {
        // 从1.0.0升级到1.1.0
        this.migrations.set('1.0.0->1.1.0', (node) => {
            if (!node.sessions) {
                node.sessions = [];
            }
            return node;
        });
        
        // 从1.1.0升级到1.2.0
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
        
        // 从1.2.0升级到2.0.0
        this.migrations.set('1.2.0->2.0.0', (node) => {
            // 重构metadata
            if (!node.metadata) {
                node.metadata = {
                    version: '2.0.0',
                    created: node.created || new Date().toISOString(),
                    modified: node.modified || new Date().toISOString(),
                    author: node.author || '',
                    source: 'migration'
                };
                
                // 清理旧字段
                delete node.created;
                delete node.modified;
                delete node.author;
            }
            
            // 添加样式系统
            if (!node.styling) {
                node.styling = {
                    backgroundColor: null,
                    textColor: null,
                    fontWeight: null,
                    borderColor: null,
                    customCSS: {}
                };
            }
            
            // 添加扩展系统
            if (!node.extensions) {
                node.extensions = {
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
                };
            }
            
            return node;
        });
    }
    
    /**
     * 检测节点数据版本
     */
    detectNodeVersion(node) {
        // 通过字段存在性检测版本
        if (node.metadata && node.metadata.version) {
            return node.metadata.version;
        }
        
        if (node.relations) {
            return '1.2.0';
        }
        
        if (node.sessions) {
            return '1.1.0';
        }
        
        return '1.0.0';
    }
    
    /**
     * 迁移单个节点
     */
    migrateNode(node) {
        const currentVersion = this.detectNodeVersion(node);
        
        if (currentVersion === this.currentVersion) {
            return node; // 已是最新版本
        }
        
        console.log(`🔄 迁移节点 ${node.id} 从版本 ${currentVersion} 到 ${this.currentVersion}`);
        
        let migratedNode = { ...node };
        let fromVersion = currentVersion;
        
        // 逐步升级到最新版本
        while (fromVersion !== this.currentVersion) {
            const nextVersion = this.getNextVersion(fromVersion);
            const migrationKey = `${fromVersion}->${nextVersion}`;
            
            if (this.migrations.has(migrationKey)) {
                migratedNode = this.migrations.get(migrationKey)(migratedNode);
                console.log(`  ✅ 升级到版本 ${nextVersion}`);
            }
            
            fromVersion = nextVersion;
        }
        
        // 确保所有必需字段存在
        migratedNode = this.ensureStandardFields(migratedNode);
        
        return migratedNode;
    }
    
    /**
     * 获取下一个版本号
     */
    getNextVersion(currentVersion) {
        const versions = Object.keys(SCHEMA_VERSIONS);
        const currentIndex = versions.indexOf(currentVersion);
        return currentIndex < versions.length - 1 ? versions[currentIndex + 1] : currentVersion;
    }
    
    /**
     * 确保标准字段存在
     */
    ensureStandardFields(node) {
        const standard = JSON.parse(JSON.stringify(STANDARD_NODE_SCHEMA));
        
        // 递归合并，保留现有数据
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
    
    /**
     * 批量迁移节点数据库
     */
    migrateNodeDatabase(nodeDatabase) {
        console.log('🚀 开始批量迁移节点数据库...');
        
        let migratedCount = 0;
        let errorCount = 0;
        
        for (const nodeId in nodeDatabase) {
            try {
                const originalNode = nodeDatabase[nodeId];
                const migratedNode = this.migrateNode(originalNode);
                
                if (migratedNode !== originalNode) {
                    nodeDatabase[nodeId] = migratedNode;
                    migratedCount++;
                }
            } catch (error) {
                console.error(`❌ 迁移节点 ${nodeId} 失败:`, error);
                errorCount++;
            }
        }
        
        console.log(`✅ 迁移完成: ${migratedCount} 个节点已升级, ${errorCount} 个错误`);
        
        return {
            migrated: migratedCount,
            errors: errorCount,
            total: Object.keys(nodeDatabase).length
        };
    }
    
    /**
     * 创建新节点（使用最新结构）
     */
    createNewNode(nodeData = {}) {
        const newNode = JSON.parse(JSON.stringify(STANDARD_NODE_SCHEMA));
        
        // 设置基础信息
        newNode.id = nodeData.id || this.generateNodeId();
        newNode.title = nodeData.title || '新节点';
        newNode.content = nodeData.content || '';
        
        // 设置元数据
        newNode.metadata.created = new Date().toISOString();
        newNode.metadata.modified = new Date().toISOString();
        newNode.metadata.author = nodeData.author || '用户';
        newNode.metadata.source = nodeData.source || 'user';
        
        // 合并其他数据
        if (nodeData.tags) Object.assign(newNode.tags, nodeData.tags);
        if (nodeData.relations) Object.assign(newNode.relations, nodeData.relations);
        if (nodeData.styling) Object.assign(newNode.styling, nodeData.styling);
        if (nodeData.extensions) Object.assign(newNode.extensions, nodeData.extensions);
        
        return newNode;
    }
    
    /**
     * 生成节点ID
     */
    generateNodeId() {
        return 'node_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    /**
     * 验证节点数据结构
     */
    validateNode(node) {
        const errors = [];
        
        // 检查必需字段
        if (!node.id) errors.push('缺少节点ID');
        if (!node.title) errors.push('缺少节点标题');
        if (!node.metadata) errors.push('缺少元数据');
        if (!node.tags) errors.push('缺少标签系统');
        
        // 检查版本
        const version = this.detectNodeVersion(node);
        if (version !== this.currentVersion) {
            errors.push(`版本过期: ${version}, 需要: ${this.currentVersion}`);
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors,
            version: version
        };
    }
}

// 创建全局迁移器实例
const nodeSchemaMigrator = new NodeSchemaMigrator();

// 导出服务
export {
    NodeSchemaMigrator,
    nodeSchemaMigrator,
    CURRENT_SCHEMA_VERSION,
    STANDARD_NODE_SCHEMA,
    SCHEMA_VERSIONS
};

// 全局函数（用于控制台调试）
if (typeof window !== 'undefined') {
    window.nodeSchemaMigrator = nodeSchemaMigrator;
    window.STANDARD_NODE_SCHEMA = STANDARD_NODE_SCHEMA;
} 