/**
 * 笔记块符号规则引擎 v1.0
 * 支持动态配置标记族符号规则，实现模块化的符号管理
 */

class NoteSymbolRuleEngine {
    constructor(config = {}) {
        this.version = '1.0.0';
        this.config = {
            ruleSet: config.ruleSet || 'default',
            customRules: config.customRules || {},
            debugMode: config.debugMode || false,
            ...config
        };
        
        // 笔记块固定结构
        this.noteStructure = {
            title: { optional: true, position: 1 },
            content: { optional: true, position: 2 },
            metadata: { optional: false, position: 3, label: '标记族：' }
        };
        
        // 符号规则集合库
        this.ruleSets = {
            'default': {
                name: '默认规则集',
                symbols: {
                    timestamp: '- 时间戳：',
                    source: '- 来源：',
                    tags: '- 标签：',
                    images: '- 附加图片：',
                    separator: '---'
                },
                relations: {
                    parent: '↳',
                    child: '├─',
                    sibling: '├─',
                    lastChild: '└─'
                },
                logic: {
                    tagPrefix: '#',
                    imageCount: true,
                    timestampFormat: 'zh-CN'
                }
            },
            
            'hierarchical': {
                name: '层级关系规则集',
                symbols: {
                    timestamp: '⏰ 时间：',
                    source: '📍 源：',
                    tags: '🏷️ 标签：',
                    images: '🖼️ 图片：',
                    separator: '═══'
                },
                relations: {
                    parent: '📁',
                    child: '├📄',
                    sibling: '├📄',
                    lastChild: '└📄',
                    level1: '▪️',
                    level2: '  ▫️',
                    level3: '    ◦'
                },
                logic: {
                    tagPrefix: '@',
                    imageCount: true,
                    timestampFormat: 'zh-CN',
                    maxNestingLevel: 3
                }
            },
            
            'minimal': {
                name: '简化规则集',
                symbols: {
                    timestamp: '时间: ',
                    source: '来源: ',
                    tags: '标签: ',
                    images: '图片: ',
                    separator: '---'
                },
                relations: {
                    parent: '>',
                    child: '·',
                    sibling: '·'
                },
                logic: {
                    tagPrefix: '',
                    imageCount: false,
                    timestampFormat: 'simple'
                }
            },
            
            'advanced': {
                name: '高级规则集',
                symbols: {
                    timestamp: '🕐 创建时间：',
                    source: '🔗 数据源：',
                    tags: '🔖 分类标签：',
                    images: '📷 关联图像：',
                    priority: '⭐ 优先级：',
                    status: '📊 状态：',
                    reference: '📚 参考：',
                    separator: '━━━━━━━'
                },
                relations: {
                    parent: '🗂️',
                    child: '├─📝',
                    sibling: '├─📝',
                    lastChild: '└─📝',
                    crossRef: '🔄',
                    dependency: '⬅️'
                },
                logic: {
                    tagPrefix: '#',
                    imageCount: true,
                    timestampFormat: 'full',
                    supportExtendedMeta: true
                }
            }
        };
        
        this.currentRuleSet = this.ruleSets[this.config.ruleSet];
        this.customRuleRegistry = new Map();
        
        this.init();
    }
    
    init() {
        this.loadRuleSet(this.config.ruleSet);
        this.log('符号规则引擎初始化完成，当前规则集:', this.config.ruleSet);
    }
    
    /**
     * 加载规则集 - 像更换积木一样
     */
    loadRuleSet(ruleSetName) {
        if (!this.ruleSets[ruleSetName]) {
            throw new Error(`未知的规则集: ${ruleSetName}`);
        }
        
        this.currentRuleSet = this.ruleSets[ruleSetName];
        this.config.ruleSet = ruleSetName;
        this.log('已切换到规则集:', this.currentRuleSet.name);
        
        return this;
    }
    
    /**
     * 添加自定义规则集
     */
    addRuleSet(name, ruleSet) {
        this.ruleSets[name] = {
            name: ruleSet.name || name,
            symbols: ruleSet.symbols || {},
            relations: ruleSet.relations || {},
            logic: ruleSet.logic || {}
        };
        this.log('已添加自定义规则集:', name);
        return this;
    }
    
    /**
     * 动态修改当前规则集的符号
     */
    updateSymbol(symbolName, newSymbol) {
        if (this.currentRuleSet.symbols[symbolName] !== undefined) {
            this.currentRuleSet.symbols[symbolName] = newSymbol;
            this.log('已更新符号:', symbolName, '→', newSymbol);
        } else {
            this.currentRuleSet.symbols[symbolName] = newSymbol;
            this.log('已添加新符号:', symbolName, '→', newSymbol);
        }
        return this;
    }
    
    /**
     * 动态修改关系符号
     */
    updateRelation(relationName, newSymbol) {
        this.currentRuleSet.relations[relationName] = newSymbol;
        this.log('已更新关系符号:', relationName, '→', newSymbol);
        return this;
    }
    
    /**
     * 生成笔记块 - 根据当前规则集
     */
    generateNoteBlock(data) {
        const result = [];
        
        // 1. 标题部分
        if (data.title) {
            result.push(data.title);
        }
        
        // 2. 内容部分
        if (data.content) {
            result.push(data.content);
        }
        
        // 3. 空行
        if (data.title || data.content) {
            result.push('');
        }
        
        // 4. 标记族部分
        result.push(this.noteStructure.metadata.label);
        
        // 生成元数据项
        const metadataItems = this.generateMetadata(data);
        result.push(...metadataItems);
        
        // 5. 分隔符
        if (this.currentRuleSet.symbols.separator) {
            result.push('');
            result.push(this.currentRuleSet.symbols.separator);
        }
        
        this.log('生成笔记块完成，行数:', result.length);
        return result.join('\n');
    }
    
    /**
     * 生成元数据部分
     */
    generateMetadata(data) {
        const items = [];
        const symbols = this.currentRuleSet.symbols;
        const logic = this.currentRuleSet.logic;
        
        // 时间戳
        if (data.timestamp || symbols.timestamp) {
            const timestamp = data.timestamp || this.formatTimestamp(logic.timestampFormat);
            items.push(`${symbols.timestamp}${timestamp}`);
        }
        
        // 来源
        if (data.source || symbols.source) {
            const source = data.source || '智能问答系统v3.0';
            items.push(`${symbols.source}${source}`);
        }
        
        // 标签
        if (data.tags && data.tags.length > 0) {
            const tagPrefix = logic.tagPrefix || '';
            const formattedTags = data.tags.map(tag => `${tagPrefix}${tag}`).join(' ');
            items.push(`${symbols.tags}${formattedTags}`);
        }
        
        // 图片
        if (data.images && data.images.length > 0) {
            if (logic.imageCount) {
                items.push(`${symbols.images}${data.images.length}张`);
                data.images.forEach((imageData, index) => {
                    items.push(`  ![图片${index + 1}](${imageData})`);
                });
            } else {
                items.push(`${symbols.images}${data.images.join(', ')}`);
            }
        }
        
        // 扩展元数据（高级规则集支持）
        if (logic.supportExtendedMeta) {
            ['priority', 'status', 'reference'].forEach(field => {
                if (data[field] && symbols[field]) {
                    items.push(`${symbols[field]}${data[field]}`);
                }
            });
        }
        
        return items;
    }
    
    /**
     * 解析笔记块
     */
    parseNoteBlock(noteBlockText) {
        const lines = noteBlockText.split('\n');
        const result = {
            title: '',
            content: '',
            metadata: {}
        };
        
        let section = 'title';
        let contentLines = [];
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            if (line === this.noteStructure.metadata.label) {
                section = 'metadata';
                if (contentLines.length > 0) {
                    result.content = contentLines.join('\n').trim();
                }
                continue;
            }
            
            if (line === this.currentRuleSet.symbols.separator) {
                break;
            }
            
            if (section === 'title' && !result.title && line.trim()) {
                result.title = line.trim();
                section = 'content';
            } else if (section === 'content') {
                contentLines.push(line);
            } else if (section === 'metadata') {
                this.parseMetadataLine(line, result.metadata);
            }
        }
        
        return result;
    }
    
    /**
     * 解析元数据行
     */
    parseMetadataLine(line, metadata) {
        const symbols = this.currentRuleSet.symbols;
        
        Object.keys(symbols).forEach(key => {
            if (line.startsWith(symbols[key])) {
                const value = line.substring(symbols[key].length).trim();
                metadata[key] = value;
            }
        });
    }
    
    /**
     * 生成层级关系结构
     */
    generateHierarchy(items, parentId = null, level = 0) {
        const relations = this.currentRuleSet.relations;
        const logic = this.currentRuleSet.logic;
        const maxLevel = logic.maxNestingLevel || 5;
        
        if (level >= maxLevel) {
            this.log('达到最大嵌套层级，停止生成');
            return [];
        }
        
        const result = [];
        const filteredItems = items.filter(item => item.parentId === parentId);
        
        filteredItems.forEach((item, index) => {
            const isLast = index === filteredItems.length - 1;
            const symbol = isLast ? relations.lastChild : relations.child;
            const indent = '  '.repeat(level);
            
            result.push(`${indent}${symbol} ${item.title}`);
            
            // 递归处理子项
            const children = this.generateHierarchy(items, item.id, level + 1);
            result.push(...children);
        });
        
        return result;
    }
    
    /**
     * 格式化时间戳
     */
    formatTimestamp(format) {
        const now = new Date();
        
        switch (format) {
            case 'zh-CN':
                return now.toLocaleString('zh-CN');
            case 'simple':
                return now.toLocaleDateString();
            case 'full':
                return `${now.toLocaleString('zh-CN')} (${now.getTime()})`;
            default:
                return now.toISOString();
        }
    }
    
    /**
     * 获取当前规则集信息
     */
    getCurrentRuleInfo() {
        return {
            name: this.currentRuleSet.name,
            symbolCount: Object.keys(this.currentRuleSet.symbols).length,
            relationCount: Object.keys(this.currentRuleSet.relations).length,
            logicRules: Object.keys(this.currentRuleSet.logic).length
        };
    }
    
    /**
     * 获取所有可用规则集
     */
    getAvailableRuleSets() {
        return Object.keys(this.ruleSets).map(key => ({
            id: key,
            name: this.ruleSets[key].name,
            description: `${Object.keys(this.ruleSets[key].symbols).length}个符号，${Object.keys(this.ruleSets[key].relations).length}个关系`
        }));
    }
    
    /**
     * 导出当前规则集配置
     */
    exportRuleSet() {
        return JSON.stringify(this.currentRuleSet, null, 2);
    }
    
    /**
     * 导入规则集配置
     */
    importRuleSet(jsonConfig, name) {
        try {
            const ruleSet = JSON.parse(jsonConfig);
            this.addRuleSet(name, ruleSet);
            return true;
        } catch (error) {
            this.log('导入规则集失败:', error.message);
            return false;
        }
    }
    
    /**
     * 预览规则集效果
     */
    previewRuleSet(ruleSetName, sampleData) {
        const originalRuleSet = this.config.ruleSet;
        this.loadRuleSet(ruleSetName);
        
        const preview = this.generateNoteBlock(sampleData);
        
        // 恢复原规则集
        this.loadRuleSet(originalRuleSet);
        
        return preview;
    }
    
    /**
     * 调试日志
     */
    log(...args) {
        if (this.config.debugMode) {
            console.log('[NoteSymbolRuleEngine]', ...args);
        }
    }
    
    /**
     * 获取引擎信息
     */
    getEngineInfo() {
        return {
            name: 'NoteSymbolRuleEngine',
            version: this.version,
            currentRuleSet: this.config.ruleSet,
            availableRuleSets: Object.keys(this.ruleSets).length,
            currentRuleInfo: this.getCurrentRuleInfo()
        };
    }
}

// 全局导出
window.NoteSymbolRuleEngine = NoteSymbolRuleEngine;

// 便捷创建方法
window.createNoteRuleEngine = function(config = {}) {
    return new NoteSymbolRuleEngine(config);
};

console.log('🔧 NoteSymbolRuleEngine toolkit loaded v1.0.0');
console.log('💡 使用示例: const engine = new NoteSymbolRuleEngine({ruleSet: "hierarchical"});'); 