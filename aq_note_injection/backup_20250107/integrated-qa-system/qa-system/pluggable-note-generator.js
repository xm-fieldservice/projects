/**
 * 可插拔笔记生成器 v1.0
 * 支持动态切换格式策略，实现迅速可靠的笔记块格式变更
 */

class PluggableNoteGenerator {
    constructor(config = {}) {
        this.version = '1.0.0';
        this.config = {
            defaultStrategy: config.defaultStrategy || 'standard',
            enableHotSwap: config.enableHotSwap !== false,
            debugMode: config.debugMode || false,
            ...config
        };
        
        // 格式策略注册表
        this.strategies = new Map();
        
        // 当前活跃策略
        this.activeStrategy = null;
        
        // 策略切换历史
        this.switchHistory = [];
        
        this.init();
    }
    
    init() {
        // 注册内置策略
        this.registerBuiltinStrategies();
        
        // 加载默认策略
        this.switchStrategy(this.config.defaultStrategy);
        
        this.log('可插拔笔记生成器初始化完成');
    }
    
    /**
     * 注册内置格式策略
     */
    registerBuiltinStrategies() {
        // 标准策略
        this.registerStrategy('standard', {
            name: '标准格式策略',
            generate: (data) => this.generateStandard(data),
            parse: (content) => this.parseStandard(content),
            config: {
                metadataLabel: '标记族：',
                symbols: {
                    timestamp: '- 时间戳：',
                    source: '- 来源：',
                    tags: '- 标签：',
                    images: '- 附加图片：'
                },
                separator: '---',
                tagPrefix: '#'
            }
        });
        
        // 简化策略
        this.registerStrategy('minimal', {
            name: '简化格式策略',
            generate: (data) => this.generateMinimal(data),
            parse: (content) => this.parseMinimal(content),
            config: {
                metadataLabel: '信息：',
                symbols: {
                    timestamp: '时间 ',
                    source: '来源 ',
                    tags: '标签 '
                },
                separator: '---',
                tagPrefix: ''
            }
        });
        
        // 丰富策略
        this.registerStrategy('rich', {
            name: '丰富格式策略',
            generate: (data) => this.generateRich(data),
            parse: (content) => this.parseRich(content),
            config: {
                metadataLabel: '📋 元数据信息：',
                symbols: {
                    timestamp: '🕐 创建时间：',
                    source: '📍 数据来源：',
                    tags: '🏷️ 分类标签：',
                    images: '🖼️ 附加图片：',
                    priority: '⭐ 优先级：',
                    status: '📊 处理状态：'
                },
                separator: '━━━━━━━━━━',
                tagPrefix: '#'
            }
        });
        
        this.log('已注册', this.strategies.size, '个内置策略');
    }
    
    /**
     * 注册新的格式策略
     */
    registerStrategy(name, strategy) {
        if (!strategy.generate || !strategy.parse) {
            throw new Error('策略必须包含 generate 和 parse 方法');
        }
        
        const fullStrategy = {
            name: strategy.name || name,
            generate: strategy.generate,
            parse: strategy.parse,
            config: strategy.config || {},
            hooks: strategy.hooks || {},
            metadata: {
                registeredAt: new Date().toISOString(),
                version: strategy.version || '1.0.0'
            }
        };
        
        this.strategies.set(name, fullStrategy);
        this.log('已注册策略:', name);
        
        return this;
    }
    
    /**
     * 动态切换策略 - 核心功能
     */
    switchStrategy(strategyName) {
        if (!this.strategies.has(strategyName)) {
            throw new Error(`未找到策略: ${strategyName}`);
        }
        
        const oldStrategy = this.activeStrategy ? this.activeStrategy.name : null;
        this.activeStrategy = this.strategies.get(strategyName);
        
        // 记录切换历史
        this.switchHistory.push({
            from: oldStrategy,
            to: strategyName,
            timestamp: new Date().toISOString()
        });
        
        // 执行切换钩子
        if (this.activeStrategy.hooks.onActivate) {
            this.activeStrategy.hooks.onActivate();
        }
        
        this.log('策略已切换:', oldStrategy, '→', strategyName);
        
        return this;
    }
    
    /**
     * 生成笔记块 - 统一入口
     */
    generate(data) {
        if (!this.activeStrategy) {
            throw new Error('没有活跃的格式策略');
        }
        
        // 执行前置钩子
        if (this.activeStrategy.hooks.beforeGenerate) {
            data = this.activeStrategy.hooks.beforeGenerate(data) || data;
        }
        
        const result = this.activeStrategy.generate(data);
        
        // 执行后置钩子
        if (this.activeStrategy.hooks.afterGenerate) {
            return this.activeStrategy.hooks.afterGenerate(result, data) || result;
        }
        
        return result;
    }
    
    /**
     * 解析笔记块 - 统一入口
     */
    parse(content, strategyName = null) {
        const strategy = strategyName ? 
            this.strategies.get(strategyName) : 
            this.activeStrategy;
            
        if (!strategy) {
            throw new Error('没有可用的解析策略');
        }
        
        return strategy.parse(content);
    }
    
    /**
     * 标准格式生成器
     */
    generateStandard(data) {
        const config = this.activeStrategy.config;
        const result = [];
        
        // 标题
        if (data.title) {
            result.push(data.title);
        }
        
        // 内容
        if (data.content) {
            result.push(data.content);
        }
        
        // 空行
        if (data.title || data.content) {
            result.push('');
        }
        
        // 元数据标签
        result.push(config.metadataLabel);
        
        // 元数据项目
        if (data.timestamp) {
            result.push(`${config.symbols.timestamp}${data.timestamp}`);
        }
        
        if (data.source) {
            result.push(`${config.symbols.source}${data.source}`);
        }
        
        if (data.tags && data.tags.length > 0) {
            const formattedTags = data.tags.map(tag => `${config.tagPrefix}${tag}`).join(' ');
            result.push(`${config.symbols.tags}${formattedTags}`);
        }
        
        if (data.images && data.images.length > 0) {
            result.push(`${config.symbols.images}${data.images.length}张`);
        }
        
        // 分隔符
        result.push('');
        result.push(config.separator);
        
        return result.join('\n');
    }
    
    /**
     * 简化格式生成器
     */
    generateMinimal(data) {
        const config = this.activeStrategy.config;
        const result = [];
        
        if (data.title) result.push(data.title);
        if (data.content) result.push(data.content);
        if (data.title || data.content) result.push('');
        
        result.push(config.metadataLabel);
        
        const metaItems = [];
        if (data.timestamp) metaItems.push(`${config.symbols.timestamp}${data.timestamp}`);
        if (data.source) metaItems.push(`${config.symbols.source}${data.source}`);
        if (data.tags && data.tags.length > 0) {
            metaItems.push(`${config.symbols.tags}${data.tags.join(' ')}`);
        }
        
        result.push(metaItems.join(' | '));
        result.push('');
        result.push(config.separator);
        
        return result.join('\n');
    }
    
    /**
     * 丰富格式生成器
     */
    generateRich(data) {
        const config = this.activeStrategy.config;
        const result = [];
        
        if (data.title) result.push(`# ${data.title}`);
        if (data.content) result.push(data.content);
        if (data.title || data.content) result.push('');
        
        result.push(config.metadataLabel);
        
        // 标准元数据
        Object.entries(config.symbols).forEach(([key, symbol]) => {
            if (data[key]) {
                if (key === 'tags' && Array.isArray(data[key])) {
                    result.push(`${symbol}${data[key].map(tag => `${config.tagPrefix}${tag}`).join(' ')}`);
                } else if (key === 'images' && Array.isArray(data[key])) {
                    result.push(`${symbol}${data[key].length}张`);
                } else {
                    result.push(`${symbol}${data[key]}`);
                }
            }
        });
        
        result.push('');
        result.push(config.separator);
        
        return result.join('\n');
    }
    
    /**
     * 标准格式解析器
     */
    parseStandard(content) {
        const config = this.activeStrategy.config;
        const result = { title: '', content: '', metadata: {} };
        const lines = content.split('\n');
        
        let section = 'title';
        let contentLines = [];
        
        for (const line of lines) {
            if (line === config.metadataLabel) {
                section = 'metadata';
                if (contentLines.length > 0) {
                    result.content = contentLines.join('\n').trim();
                }
                continue;
            }
            
            if (line === config.separator) break;
            
            if (section === 'title' && !result.title && line.trim()) {
                result.title = line.trim();
                section = 'content';
            } else if (section === 'content') {
                contentLines.push(line);
            } else if (section === 'metadata') {
                this.parseMetadataLine(line, result.metadata, config.symbols);
            }
        }
        
        return result;
    }
    
    /**
     * 简化格式解析器
     */
    parseMinimal(content) {
        // 简化解析逻辑
        return this.parseStandard(content);
    }
    
    /**
     * 丰富格式解析器
     */
    parseRich(content) {
        // 丰富解析逻辑
        return this.parseStandard(content);
    }
    
    /**
     * 解析元数据行
     */
    parseMetadataLine(line, metadata, symbols) {
        Object.entries(symbols).forEach(([key, symbol]) => {
            if (line.startsWith(symbol)) {
                metadata[key] = line.substring(symbol.length).trim();
            }
        });
    }
    
    /**
     * 热切换预览 - 不改变当前策略
     */
    preview(data, strategyName) {
        if (!this.strategies.has(strategyName)) {
            throw new Error(`预览策略不存在: ${strategyName}`);
        }
        
        const strategy = this.strategies.get(strategyName);
        return strategy.generate(data);
    }
    
    /**
     * 策略对比
     */
    compare(data, strategies = null) {
        const targetStrategies = strategies || Array.from(this.strategies.keys());
        const results = {};
        
        targetStrategies.forEach(strategyName => {
            if (this.strategies.has(strategyName)) {
                try {
                    results[strategyName] = this.preview(data, strategyName);
                } catch (error) {
                    results[strategyName] = `错误: ${error.message}`;
                }
            }
        });
        
        return results;
    }
    
    /**
     * 获取所有可用策略
     */
    getAvailableStrategies() {
        return Array.from(this.strategies.entries()).map(([name, strategy]) => ({
            name: name,
            displayName: strategy.name,
            version: strategy.metadata.version,
            registeredAt: strategy.metadata.registeredAt
        }));
    }
    
    /**
     * 获取当前策略信息
     */
    getCurrentStrategy() {
        return this.activeStrategy ? {
            name: this.activeStrategy.name,
            config: this.activeStrategy.config,
            metadata: this.activeStrategy.metadata
        } : null;
    }
    
    /**
     * 获取切换历史
     */
    getSwitchHistory() {
        return [...this.switchHistory];
    }
    
    /**
     * 导出策略配置
     */
    exportStrategy(strategyName) {
        if (!this.strategies.has(strategyName)) {
            throw new Error(`策略不存在: ${strategyName}`);
        }
        
        const strategy = this.strategies.get(strategyName);
        return JSON.stringify({
            name: strategy.name,
            config: strategy.config,
            metadata: strategy.metadata
        }, null, 2);
    }
    
    /**
     * 重置到默认策略
     */
    reset() {
        this.switchStrategy(this.config.defaultStrategy);
        this.log('已重置到默认策略');
        return this;
    }
    
    /**
     * 调试日志
     */
    log(...args) {
        if (this.config.debugMode) {
            console.log('[PluggableNoteGenerator]', ...args);
        }
    }
    
    /**
     * 获取生成器信息
     */
    getGeneratorInfo() {
        return {
            name: 'PluggableNoteGenerator',
            version: this.version,
            strategiesCount: this.strategies.size,
            currentStrategy: this.activeStrategy ? this.activeStrategy.name : null,
            switchCount: this.switchHistory.length,
            enableHotSwap: this.config.enableHotSwap
        };
    }
}

// 全局导出
window.PluggableNoteGenerator = PluggableNoteGenerator;

// 便捷创建方法
window.createNoteGenerator = function(config = {}) {
    return new PluggableNoteGenerator(config);
};

console.log('🔧 PluggableNoteGenerator toolkit loaded v1.0.0');
console.log('💡 使用示例: const generator = new PluggableNoteGenerator({defaultStrategy: "standard"});'); 