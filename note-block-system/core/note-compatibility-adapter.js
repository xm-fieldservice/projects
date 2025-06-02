/**
 * 笔记兼容性适配器 v1.0
 * 处理不同符号规则版本的笔记，确保向后兼容性
 */

class NoteCompatibilityAdapter {
    constructor(config = {}) {
        this.version = '1.0.0';
        this.config = {
            defaultRuleSet: config.defaultRuleSet || 'current',
            enableVersionDetection: config.enableVersionDetection !== false,
            debugMode: config.debugMode || false,
            ...config
        };
        
        // 历史符号规则版本库
        this.historicalRules = {
            'v1.0': {
                name: '笔记系统v1.0规则',
                patterns: {
                    metadata: /^\*\*标签：\*\*/,
                    tags: /\*\*标签：\*\*\s*(.+)/,
                    timestamp: /\*\*时间：\*\*\s*(.+)/,
                    source: /\*\*来源：\*\*\s*(.+)/
                },
                symbols: {
                    tags: '**标签：**',
                    timestamp: '**时间：**',
                    source: '**来源：**'
                }
            },
            
            'v2.0': {
                name: '笔记系统v2.0规则',
                patterns: {
                    metadata: /^标记族：/,
                    tags: /- 标签：\s*(.+)/,
                    timestamp: /- 时间戳：\s*(.+)/,
                    source: /- 来源：\s*(.+)/,
                    images: /- 附加图片：\s*(.+)/
                },
                symbols: {
                    metadataLabel: '标记族：',
                    tags: '- 标签：',
                    timestamp: '- 时间戳：',
                    source: '- 来源：',
                    images: '- 附加图片：',
                    separator: '---'
                }
            },
            
            'current': {
                name: '当前活跃规则',
                patterns: {
                    metadata: /^标记族：/,
                    tags: /- 标签：\s*(.+)/,
                    timestamp: /- 时间戳：\s*(.+)/,
                    source: /- 来源：\s*(.+)/,
                    images: /- 附加图片：\s*(.+)/
                },
                symbols: {
                    metadataLabel: '标记族：',
                    tags: '- 标签：',
                    timestamp: '- 时间戳：',
                    source: '- 来源：',
                    images: '- 附加图片：',
                    separator: '---'
                }
            }
        };
        
        // 当前使用的符号规则引擎实例
        this.symbolEngine = null;
        
        this.init();
    }
    
    init() {
        this.log('笔记兼容性适配器初始化完成');
    }
    
    /**
     * 设置符号规则引擎实例
     */
    setSymbolEngine(engine) {
        this.symbolEngine = engine;
        this.log('已绑定符号规则引擎');
        return this;
    }
    
    /**
     * 自动检测笔记的符号规则版本
     */
    detectRuleVersion(noteContent) {
        for (const [version, rules] of Object.entries(this.historicalRules)) {
            if (this.matchesRulePattern(noteContent, rules.patterns)) {
                this.log('检测到规则版本:', version, rules.name);
                return version;
            }
        }
        
        this.log('未检测到已知规则版本，使用默认版本');
        return this.config.defaultRuleSet;
    }
    
    /**
     * 检查笔记内容是否匹配特定规则模式
     */
    matchesRulePattern(content, patterns) {
        const lines = content.split('\n');
        let metadataFound = false;
        let patternMatches = 0;
        
        for (const line of lines) {
            // 检查元数据标识
            if (patterns.metadata && patterns.metadata.test(line)) {
                metadataFound = true;
                continue;
            }
            
            // 在元数据区域内检查其他模式
            if (metadataFound) {
                Object.entries(patterns).forEach(([key, pattern]) => {
                    if (key !== 'metadata' && pattern.test(line)) {
                        patternMatches++;
                    }
                });
            }
        }
        
        // 至少需要匹配元数据标识和一个其他模式
        return metadataFound && patternMatches > 0;
    }
    
    /**
     * 解析任意版本的笔记
     */
    parseNote(noteContent) {
        const version = this.detectRuleVersion(noteContent);
        const rules = this.historicalRules[version];
        
        if (!rules) {
            throw new Error(`未知的规则版本: ${version}`);
        }
        
        return this.parseWithRules(noteContent, rules, version);
    }
    
    /**
     * 使用特定规则解析笔记
     */
    parseWithRules(content, rules, version) {
        const result = {
            version: version,
            title: '',
            content: '',
            metadata: {},
            rawContent: content
        };
        
        const lines = content.split('\n');
        let section = 'title';
        let contentLines = [];
        let metadataStarted = false;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            // 检测元数据区域开始
            if (rules.patterns.metadata && rules.patterns.metadata.test(line)) {
                section = 'metadata';
                metadataStarted = true;
                if (contentLines.length > 0) {
                    result.content = contentLines.join('\n').trim();
                }
                continue;
            }
            
            // 检测分隔符（结束）
            if (line.trim() === '---' || line.trim() === '═══' || line.trim() === '━━━━━━━') {
                break;
            }
            
            if (section === 'title' && !result.title && line.trim()) {
                result.title = line.trim();
                section = 'content';
            } else if (section === 'content' && !metadataStarted) {
                contentLines.push(line);
            } else if (section === 'metadata') {
                this.parseMetadataLine(line, result.metadata, rules.patterns);
            }
        }
        
        return result;
    }
    
    /**
     * 解析元数据行
     */
    parseMetadataLine(line, metadata, patterns) {
        Object.entries(patterns).forEach(([key, pattern]) => {
            if (key !== 'metadata') {
                const match = line.match(pattern);
                if (match) {
                    metadata[key] = match[1].trim();
                }
            }
        });
    }
    
    /**
     * 转换笔记到当前符号规则
     */
    convertToCurrentRule(noteContent, targetRuleSet = null) {
        // 1. 解析原笔记
        const parsed = this.parseNote(noteContent);
        
        // 2. 准备转换数据
        const convertData = {
            title: parsed.title,
            content: parsed.content,
            timestamp: parsed.metadata.timestamp,
            source: parsed.metadata.source,
            tags: this.parseTagsFromMetadata(parsed.metadata.tags),
            images: this.parseImagesFromMetadata(parsed.metadata.images)
        };
        
        // 3. 使用符号规则引擎生成新格式
        if (this.symbolEngine) {
            if (targetRuleSet) {
                // 临时切换规则集
                const originalRuleSet = this.symbolEngine.config.ruleSet;
                this.symbolEngine.loadRuleSet(targetRuleSet);
                const result = this.symbolEngine.generateNoteBlock(convertData);
                this.symbolEngine.loadRuleSet(originalRuleSet);
                return result;
            } else {
                return this.symbolEngine.generateNoteBlock(convertData);
            }
        }
        
        // 4. 降级：使用默认当前规则
        return this.generateWithCurrentRule(convertData);
    }
    
    /**
     * 从元数据解析标签
     */
    parseTagsFromMetadata(tagsText) {
        if (!tagsText) return [];
        
        // 处理不同格式的标签
        return tagsText
            .replace(/[#@]/g, '') // 移除标签前缀
            .split(/\s+/)
            .filter(tag => tag.trim())
            .map(tag => tag.trim());
    }
    
    /**
     * 从元数据解析图片信息
     */
    parseImagesFromMetadata(imagesText) {
        if (!imagesText) return [];
        
        // 简单解析图片数量
        const countMatch = imagesText.match(/(\d+)张?/);
        if (countMatch) {
            const count = parseInt(countMatch[1]);
            return Array(count).fill('image-placeholder');
        }
        
        return [];
    }
    
    /**
     * 使用当前规则生成笔记块（降级方案）
     */
    generateWithCurrentRule(data) {
        const currentRules = this.historicalRules.current;
        let result = [];
        
        if (data.title) {
            result.push(data.title);
        }
        
        if (data.content) {
            result.push(data.content);
        }
        
        if (data.title || data.content) {
            result.push('');
        }
        
        result.push(currentRules.symbols.metadataLabel);
        
        if (data.timestamp) {
            result.push(`${currentRules.symbols.timestamp}${data.timestamp}`);
        }
        
        if (data.source) {
            result.push(`${currentRules.symbols.source}${data.source}`);
        }
        
        if (data.tags && data.tags.length > 0) {
            result.push(`${currentRules.symbols.tags}${data.tags.map(tag => `#${tag}`).join(' ')}`);
        }
        
        if (data.images && data.images.length > 0) {
            result.push(`${currentRules.symbols.images}${data.images.length}张`);
        }
        
        result.push('');
        result.push(currentRules.symbols.separator);
        
        return result.join('\n');
    }
    
    /**
     * 批量转换笔记
     */
    batchConvert(noteContents, targetRuleSet = null) {
        const results = [];
        
        for (let i = 0; i < noteContents.length; i++) {
            try {
                const converted = this.convertToCurrentRule(noteContents[i], targetRuleSet);
                results.push({
                    index: i,
                    success: true,
                    content: converted
                });
            } catch (error) {
                results.push({
                    index: i,
                    success: false,
                    error: error.message,
                    originalContent: noteContents[i]
                });
            }
        }
        
        this.log('批量转换完成:', results.filter(r => r.success).length, '/', results.length);
        return results;
    }
    
    /**
     * 验证转换结果
     */
    validateConversion(original, converted) {
        const originalParsed = this.parseNote(original);
        const convertedParsed = this.parseNote(converted);
        
        const validation = {
            titleMatch: originalParsed.title === convertedParsed.title,
            contentMatch: originalParsed.content === convertedParsed.content,
            metadataPreserved: true,
            issues: []
        };
        
        // 检查关键元数据是否保留
        if (originalParsed.metadata.timestamp !== convertedParsed.metadata.timestamp) {
            validation.issues.push('时间戳不匹配');
            validation.metadataPreserved = false;
        }
        
        if (originalParsed.metadata.source !== convertedParsed.metadata.source) {
            validation.issues.push('来源不匹配');
            validation.metadataPreserved = false;
        }
        
        validation.isValid = validation.titleMatch && validation.contentMatch && validation.metadataPreserved;
        
        return validation;
    }
    
    /**
     * 获取版本兼容性报告
     */
    getCompatibilityReport() {
        return {
            supportedVersions: Object.keys(this.historicalRules),
            currentVersion: this.config.defaultRuleSet,
            hasSymbolEngine: !!this.symbolEngine,
            features: {
                autoDetection: this.config.enableVersionDetection,
                batchConversion: true,
                validation: true
            }
        };
    }
    
    /**
     * 调试日志
     */
    log(...args) {
        if (this.config.debugMode) {
            console.log('[NoteCompatibilityAdapter]', ...args);
        }
    }
    
    /**
     * 获取适配器信息
     */
    getAdapterInfo() {
        return {
            name: 'NoteCompatibilityAdapter',
            version: this.version,
            supportedVersions: Object.keys(this.historicalRules).length,
            compatibilityReport: this.getCompatibilityReport()
        };
    }
}

// 全局导出
window.NoteCompatibilityAdapter = NoteCompatibilityAdapter;

// 便捷创建方法
window.createCompatibilityAdapter = function(config = {}) {
    return new NoteCompatibilityAdapter(config);
};

console.log('🔄 NoteCompatibilityAdapter toolkit loaded v1.0.0');
console.log('💡 使用示例: const adapter = new NoteCompatibilityAdapter({enableVersionDetection: true});'); 