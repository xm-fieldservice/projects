/**
 * 数据结构统一服务
 * 负责统一NodeMind项目中所有节点的数据结构
 */

class DataStructureUnifier {
    constructor() {
        this.STANDARD_SCHEMA_VERSION = '2.0';
        this.diagnosticReport = {
            totalNodes: 0,
            fixedNodes: 0,
            errors: [],
            warnings: [],
            fieldMappings: {}
        };
    }

    /**
     * 标准节点数据结构定义
     */
    getStandardNodeStructure() {
        return {
            // 基础标识
            id: null,                    // 节点唯一标识
            title: '',                   // 节点标题（主要显示字段）
            topic: '',                   // jsMind兼容字段，与title保持同步
            
            // 内容相关
            content: '',                 // 节点详细内容
            
            // 标签系统（统一结构）
            tags: {
                status: [],              // 状态标签：['项目', '进行中', '完成', '计划']
                categories: [],          // 分类标签
                technical: [],           // 技术标签
                custom: [],             // 自定义标签
                future: []              // 未来规划标签
            },
            
            // 时间信息
            time: {
                created: null,           // 创建时间 ISO字符串
                modified: null           // 修改时间 ISO字符串
            },
            
            // 作者信息
            author: '',                  // 作者名称
            
            // 关系信息
            relations: {
                parent: null,            // 父节点ID
                children: []             // 子节点ID数组
            },
            
            // 会话数据
            sessions: [],                // 会话记录数组
            
            // 元数据
            metadata: {
                schemaVersion: '2.0',    // 数据结构版本
                source: 'nodemind',      // 数据来源
                lastUnified: null        // 最后统一时间
            }
        };
    }

    /**
     * 诊断当前数据结构问题
     */
    diagnoseDataStructure() {
        console.log('🔍 开始诊断数据结构...');
        
        const report = {
            totalNodes: 0,
            structureTypes: {},
            fieldInconsistencies: {},
            missingFields: {},
            deprecatedFields: {},
            recommendedActions: []
        };

        // 检查nodeDatabase
        if (window.nodeDatabase) {
            report.totalNodes = Object.keys(window.nodeDatabase).length;
            
            Object.entries(window.nodeDatabase).forEach(([nodeId, node]) => {
                this.analyzeNodeStructure(nodeId, node, report);
            });
        }

        // 检查jsMind数据
        const mindmap = window.getCurrentJsMind && window.getCurrentJsMind();
        if (mindmap) {
            const mindData = mindmap.get_data();
            this.analyzeMindMapData(mindData, report);
        }

        this.generateRecommendations(report);
        return report;
    }

    /**
     * 分析单个节点结构
     */
    analyzeNodeStructure(nodeId, node, report) {
        // 检测结构类型
        const structureType = this.detectStructureType(node);
        report.structureTypes[structureType] = (report.structureTypes[structureType] || 0) + 1;

        // 检查字段不一致
        this.checkFieldInconsistencies(nodeId, node, report);

        // 检查缺失字段
        this.checkMissingFields(nodeId, node, report);

        // 检查废弃字段
        this.checkDeprecatedFields(nodeId, node, report);
    }

    /**
     * 检测节点结构类型
     */
    detectStructureType(node) {
        if (node.metadata && node.metadata.schemaVersion === '2.0') {
            return 'standard_v2';
        } else if (node.time && typeof node.time === 'object') {
            return 'extended_v1';
        } else if (node.statusTags) {
            return 'legacy_with_statusTags';
        } else if (node.created && typeof node.created === 'string') {
            return 'ui_structure';
        } else {
            return 'unknown_or_minimal';
        }
    }

    /**
     * 检查字段不一致问题
     */
    checkFieldInconsistencies(nodeId, node, report) {
        // title vs topic 不一致
        if (node.title && node.topic && node.title !== node.topic) {
            this.addInconsistency(report, 'title_topic_mismatch', nodeId, {
                title: node.title,
                topic: node.topic
            });
        }

        // 时间字段格式不一致
        if (node.created && node.time && node.time.created) {
            if (node.created !== node.time.created) {
                this.addInconsistency(report, 'time_format_mismatch', nodeId, {
                    created: node.created,
                    timeCreated: node.time.created
                });
            }
        }

        // 标签字段不一致
        if (node.statusTags && node.tags && node.tags.status) {
            if (JSON.stringify(node.statusTags) !== JSON.stringify(node.tags.status)) {
                this.addInconsistency(report, 'tags_mismatch', nodeId, {
                    statusTags: node.statusTags,
                    tagsStatus: node.tags.status
                });
            }
        }
    }

    /**
     * 检查缺失字段
     */
    checkMissingFields(nodeId, node, report) {
        const required = ['id', 'title', 'tags', 'time', 'metadata'];
        const recommended = ['content', 'author', 'relations'];
        
        required.forEach(field => {
            if (!node[field]) {
                this.addMissingField(report, field, nodeId, 'required');
            }
        });

        recommended.forEach(field => {
            if (!node[field]) {
                this.addMissingField(report, field, nodeId, 'recommended');
            }
        });
    }

    /**
     * 检查废弃字段
     */
    checkDeprecatedFields(nodeId, node, report) {
        const deprecatedFields = ['statusTags', 'status', 'created', 'modified'];
        
        deprecatedFields.forEach(field => {
            if (node.hasOwnProperty(field)) {
                if (!report.deprecatedFields[field]) {
                    report.deprecatedFields[field] = [];
                }
                report.deprecatedFields[field].push(nodeId);
            }
        });
    }

    /**
     * 分析思维导图数据
     */
    analyzeMindMapData(mindData, report) {
        if (!mindData || !mindData.data) return;
        
        // 递归分析节点
        const analyzeNode = (node) => {
            if (node && node.id) {
                // 简单统计，不进行详细分析（避免重复）
                if (!report.mindmapNodes) {
                    report.mindmapNodes = 0;
                }
                report.mindmapNodes++;
                
                // 递归处理子节点
                if (node.children && Array.isArray(node.children)) {
                    node.children.forEach(child => analyzeNode(child));
                }
            }
        };
        
        analyzeNode(mindData.data);
    }

    /**
     * 统一数据结构
     */
    unifyDataStructure(options = {}) {
        console.log('🔧 开始统一数据结构...');
        
        const { 
            force = false, 
            backup = true,
            validateOnly = false 
        } = options;

        // 备份原始数据
        if (backup) {
            this.backupCurrentData();
        }

        const unificationReport = {
            processedNodes: 0,
            unifiedNodes: 0,
            errors: [],
            warnings: [],
            skippedNodes: []
        };

        if (!window.nodeDatabase) {
            window.nodeDatabase = {};
        }

        // 统一nodeDatabase中的数据
        Object.entries(window.nodeDatabase).forEach(([nodeId, node]) => {
            try {
                unificationReport.processedNodes++;
                
                if (validateOnly) {
                    this.validateNodeStructure(nodeId, node, unificationReport);
                } else {
                    const unifiedNode = this.unifyNodeStructure(nodeId, node, force);
                    if (unifiedNode) {
                        window.nodeDatabase[nodeId] = unifiedNode;
                        unificationReport.unifiedNodes++;
                    } else {
                        unificationReport.skippedNodes.push(nodeId);
                    }
                }
            } catch (error) {
                unificationReport.errors.push({
                    nodeId,
                    error: error.message
                });
            }
        });

        // 同步jsMind数据
        if (!validateOnly) {
            this.syncWithJsMind(unificationReport);
        }

        // 启用统一模式
        window.NODEMIND_UNIFIED_MODE = true;
        window.DATA_STRUCTURE_VERSION = this.STANDARD_SCHEMA_VERSION;

        console.log('✅ 数据结构统一完成:', unificationReport);
        return unificationReport;
    }

    /**
     * 统一单个节点结构
     */
    unifyNodeStructure(nodeId, node, force = false) {
        // 创建标准结构
        const standardNode = this.getStandardNodeStructure();
        const now = new Date().toISOString();

        // 基础字段统一
        standardNode.id = nodeId;
        standardNode.title = this.extractTitle(node);
        standardNode.topic = standardNode.title; // 保持同步
        standardNode.content = node.content || '';

        // 标签统一
        standardNode.tags = this.unifyTagsStructure(node);

        // 时间信息统一
        standardNode.time = this.unifyTimeStructure(node, now);

        // 作者信息
        standardNode.author = node.author || window.projectInfo?.author || 'NodeMind';

        // 关系信息统一
        standardNode.relations = this.unifyRelationsStructure(node);

        // 会话数据
        standardNode.sessions = Array.isArray(node.sessions) ? node.sessions : [];

        // 元数据
        standardNode.metadata = {
            schemaVersion: this.STANDARD_SCHEMA_VERSION,
            source: node.metadata?.source || 'nodemind',
            lastUnified: now,
            previousVersion: node.metadata?.schemaVersion || 'unknown'
        };

        return standardNode;
    }

    /**
     * 提取标题字段
     */
    extractTitle(node) {
        // 优先级：title > topic > id
        if (node.title && node.title.trim()) {
            return node.title.trim();
        } else if (node.topic && node.topic.trim()) {
            return node.topic.trim();
        } else {
            return `节点_${node.id || 'unknown'}`;
        }
    }

    /**
     * 统一标签结构
     */
    unifyTagsStructure(node) {
        const unifiedTags = {
            status: [],
            categories: [],
            technical: [],
            custom: [],
            future: []
        };

        // 从各种可能的字段中提取标签
        
        // 1. 从node.tags中提取
        if (node.tags && typeof node.tags === 'object') {
            Object.keys(unifiedTags).forEach(key => {
                if (Array.isArray(node.tags[key])) {
                    unifiedTags[key] = [...node.tags[key]];
                }
            });
        }

        // 2. 从node.statusTags中提取到status
        if (Array.isArray(node.statusTags)) {
            unifiedTags.status = [...node.statusTags];
        }

        // 3. 从其他可能的字段中提取
        if (Array.isArray(node.status)) {
            unifiedTags.status = [...node.status];
        }

        // 去重处理
        Object.keys(unifiedTags).forEach(key => {
            unifiedTags[key] = [...new Set(unifiedTags[key])];
        });

        return unifiedTags;
    }

    /**
     * 统一时间结构
     */
    unifyTimeStructure(node, defaultTime) {
        const time = {
            created: defaultTime,
            modified: defaultTime
        };

        // 从各种可能的字段中提取时间
        if (node.time && typeof node.time === 'object') {
            time.created = node.time.created || defaultTime;
            time.modified = node.time.modified || defaultTime;
        } else if (node.created) {
            time.created = node.created;
            time.modified = node.modified || node.created;
        }

        return time;
    }

    /**
     * 统一关系结构
     */
    unifyRelationsStructure(node) {
        return {
            parent: node.relations?.parent || node.parent || null,
            children: Array.isArray(node.relations?.children) 
                ? node.relations.children 
                : Array.isArray(node.children) 
                    ? node.children 
                    : []
        };
    }

    /**
     * 与jsMind数据同步
     */
    syncWithJsMind(report) {
        const mindmap = window.getCurrentJsMind && window.getCurrentJsMind();
        if (!mindmap) {
            report.warnings.push('jsMind实例未找到，跳过同步');
            return;
        }

        try {
            // 更新jsMind中的节点标题
            Object.entries(window.nodeDatabase).forEach(([nodeId, node]) => {
                const mindNode = mindmap.get_node(nodeId);
                if (mindNode && mindNode.topic !== node.title) {
                    mindmap.update_node(nodeId, node.title);
                }
            });

            report.warnings.push('已同步jsMind数据');
        } catch (error) {
            report.errors.push({
                source: 'jsMind同步',
                error: error.message
            });
        }
    }

    /**
     * 备份当前数据
     */
    backupCurrentData() {
        const backup = {
            nodeDatabase: JSON.parse(JSON.stringify(window.nodeDatabase || {})),
            timestamp: new Date().toISOString(),
            version: window.DATA_STRUCTURE_VERSION || 'unknown'
        };

        localStorage.setItem('nodemind_data_backup', JSON.stringify(backup));
        console.log('📦 数据已备份到localStorage');
    }

    /**
     * 验证数据结构
     */
    validateUnifiedStructure() {
        const validation = {
            isValid: true,
            errors: [],
            warnings: [],
            statistics: {}
        };

        if (!window.nodeDatabase) {
            validation.isValid = false;
            validation.errors.push('nodeDatabase不存在');
            return validation;
        }

        const nodes = Object.entries(window.nodeDatabase);
        validation.statistics.totalNodes = nodes.length;

        let validNodes = 0;
        let invalidNodes = 0;

        nodes.forEach(([nodeId, node]) => {
            const nodeValidation = this.validateSingleNode(nodeId, node);
            if (nodeValidation.isValid) {
                validNodes++;
            } else {
                invalidNodes++;
                validation.errors.push(...nodeValidation.errors);
                validation.warnings.push(...nodeValidation.warnings);
            }
        });

        validation.statistics.validNodes = validNodes;
        validation.statistics.invalidNodes = invalidNodes;
        validation.isValid = invalidNodes === 0;

        return validation;
    }

    /**
     * 验证单个节点
     */
    validateSingleNode(nodeId, node) {
        const result = { isValid: true, errors: [], warnings: [] };

        // 检查必需字段
        const required = ['id', 'title', 'tags', 'time', 'metadata'];
        required.forEach(field => {
            if (!node[field]) {
                result.isValid = false;
                result.errors.push(`节点${nodeId}缺少必需字段: ${field}`);
            }
        });

        // 检查字段类型
        if (node.tags && typeof node.tags !== 'object') {
            result.isValid = false;
            result.errors.push(`节点${nodeId}的tags字段类型错误`);
        }

        if (node.time && typeof node.time !== 'object') {
            result.isValid = false;
            result.errors.push(`节点${nodeId}的time字段类型错误`);
        }

        // 检查schema版本
        if (!node.metadata || node.metadata.schemaVersion !== this.STANDARD_SCHEMA_VERSION) {
            result.warnings.push(`节点${nodeId}的schema版本不匹配`);
        }

        return result;
    }

    // 辅助方法
    addInconsistency(report, type, nodeId, details) {
        if (!report.fieldInconsistencies[type]) {
            report.fieldInconsistencies[type] = [];
        }
        report.fieldInconsistencies[type].push({ nodeId, details });
    }

    addMissingField(report, field, nodeId, level) {
        if (!report.missingFields[field]) {
            report.missingFields[field] = { required: [], recommended: [] };
        }
        report.missingFields[field][level].push(nodeId);
    }

    generateRecommendations(report) {
        const actions = [];

        if (Object.keys(report.fieldInconsistencies).length > 0) {
            actions.push('执行字段统一修复');
        }

        if (Object.keys(report.missingFields).length > 0) {
            actions.push('补充缺失字段');
        }

        const nonStandardCount = Object.entries(report.structureTypes)
            .filter(([type]) => type !== 'standard_v2')
            .reduce((sum, [, count]) => sum + count, 0);

        if (nonStandardCount > 0) {
            actions.push('统一数据结构到标准版本');
        }

        report.recommendedActions = actions;
    }
}

// 导出服务
window.DataStructureUnifier = DataStructureUnifier;

// 创建全局实例
window.dataStructureUnifier = new DataStructureUnifier();

console.log('✅ 数据结构统一服务已加载'); 