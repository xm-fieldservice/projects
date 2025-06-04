/**
 * 自动策略生成器 v1.0
 * 通过样例分析自动生成可插拔的笔记格式策略
 */

class AutoStrategyGenerator {
    constructor(config = {}) {
        this.version = '1.0.0';
        this.config = {
            debugMode: config.debugMode || false,
            strictMode: config.strictMode || false,
            ...config
        };
        
        // 绑定的插拔生成器
        this.pluggableGenerator = null;
        
        this.log('自动策略生成器初始化完成');
    }
    
    /**
     * 设置插拔生成器实例
     */
    setPluggableGenerator(generator) {
        this.pluggableGenerator = generator;
        this.log('已绑定插拔生成器');
        return this;
    }
    
    /**
     * 🔥 核心流程：从样例生成策略
     */
    generateFromSample(sampleText, strategyName, displayName = null) {
        this.log('开始生成策略:', strategyName);
        
        // 1. 样例输入（已提供）
        const sample = sampleText.trim();
        
        // 2. 样例分析
        const analysis = this.analyzeSample(sample);
        this.log('样例分析完成:', analysis.patternCount, '个模式');
        
        // 3. 产生"生成新样式的机制"
        const mechanism = this.createGenerationMechanism(analysis);
        this.log('生成机制创建完成');
        
        // 4. 形成"插拔"组件
        const pluggableStrategy = this.createPluggableComponent(mechanism, strategyName, displayName);
        this.log('插拔组件创建完成');
        
        // 5. 完成插拔
        const success = this.completePlug(pluggableStrategy, strategyName);
        
        if (success) {
            this.log('✅ 策略生成并插拔完成:', strategyName);
            return {
                success: true,
                strategyName: strategyName,
                analysis: analysis,
                mechanism: mechanism
            };
        } else {
            this.log('❌ 插拔失败');
            return { success: false, error: '插拔失败' };
        }
    }
    
    /**
     * 步骤2：样例分析
     */
    analyzeSample(sample) {
        const lines = sample.split('\n').map(line => line.trim()).filter(line => line);
        const analysis = {
            structure: [],
            patterns: {},
            symbols: {},
            separators: [],
            metadataSection: null,
            patternCount: 0
        };
        
        let currentSection = 'title';
        let metadataStartIndex = -1;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            // 检测分隔符
            if (this.isSeparator(line)) {
                analysis.separators.push(line);
                analysis.structure.push({ type: 'separator', content: line, index: i });
                break; // 分隔符后通常结束
            }
            
            // 检测元数据段开始
            if (this.isMetadataStart(line)) {
                metadataStartIndex = i;
                currentSection = 'metadata';
                analysis.metadataSection = line;
                analysis.structure.push({ type: 'metadata_start', content: line, index: i });
                continue;
            }
            
            // 分析不同段落
            if (currentSection === 'title' && analysis.structure.length === 0) {
                analysis.structure.push({ type: 'title', content: line, index: i });
                currentSection = 'content';
            } else if (currentSection === 'content' && metadataStartIndex === -1) {
                analysis.structure.push({ type: 'content', content: line, index: i });
            } else if (currentSection === 'metadata') {
                const pattern = this.analyzeMetadataLine(line);
                if (pattern) {
                    analysis.patterns[pattern.key] = pattern;
                    analysis.symbols[pattern.key] = pattern.symbol;
                    analysis.structure.push({ type: 'metadata_item', content: line, pattern: pattern, index: i });
                    analysis.patternCount++;
                }
            }
        }
        
        return analysis;
    }
    
    /**
     * 检测是否为分隔符
     */
    isSeparator(line) {
        const separatorPatterns = [
            /^-{3,}$/,           // ---
            /^={3,}$/,           // ===
            /^━{3,}$/,           // ━━━
            /^[*]{3,}$/,         // ***
            /^[#]{3,}$/          // ###
        ];
        
        return separatorPatterns.some(pattern => pattern.test(line));
    }
    
    /**
     * 检测是否为元数据段开始
     */
    isMetadataStart(line) {
        const metadataPatterns = [
            /标记族[：:]/,
            /元数据[：:]/,
            /信息[：:]/,
            /metadata[：:]/i,
            /^📋.*[：:]/,
            /^🏷️.*[：:]/
        ];
        
        return metadataPatterns.some(pattern => pattern.test(line));
    }
    
    /**
     * 分析元数据行模式
     */
    analyzeMetadataLine(line) {
        // 常见的元数据模式
        const patterns = [
            { regex: /^[-*+]\s*([^：:]+)[：:]\s*(.*)$/, type: 'dash_colon' },      // - 时间戳：xxx
            { regex: /^([^：:]+)[：:]\s*(.*)$/, type: 'direct_colon' },           // 时间：xxx  
            { regex: /^[📍🕐🏷️🖼️⭐📊📚]\s*([^：:]+)[：:]\s*(.*)$/, type: 'emoji_colon' }, // 🕐 时间：xxx
            { regex: /^(\w+)\s+(.*)$/, type: 'space_separated' },               // 时间 xxx
            { regex: /^\*\*([^*]+)\*\*[：:]?\s*(.*)$/, type: 'bold_colon' }      // **标签：**xxx
        ];
        
        for (const pattern of patterns) {
            const match = line.match(pattern.regex);
            if (match) {
                const key = this.normalizeKey(match[1]);
                const value = match[2];
                const symbol = line.substring(0, line.indexOf(value)).trim();
                
                return {
                    key: key,
                    symbol: symbol,
                    value: value,
                    type: pattern.type,
                    original: line
                };
            }
        }
        
        return null;
    }
    
    /**
     * 标准化键名
     */
    normalizeKey(key) {
        const keyMap = {
            '时间戳': 'timestamp',
            '时间': 'timestamp', 
            '创建时间': 'timestamp',
            '来源': 'source',
            '数据来源': 'source',
            '源': 'source',
            '标签': 'tags',
            '分类标签': 'tags',
            '图片': 'images',
            '附加图片': 'images',
            '关联图像': 'images',
            '优先级': 'priority',
            '状态': 'status',
            '处理状态': 'status',
            '参考': 'reference'
        };
        
        return keyMap[key.trim()] || key.trim().toLowerCase();
    }
    
    /**
     * 步骤3：产生生成新样式的机制
     */
    createGenerationMechanism(analysis) {
        const mechanism = {
            config: {
                metadataLabel: analysis.metadataSection || '标记族：',
                symbols: analysis.symbols,
                separator: analysis.separators[0] || '---',
                tagPrefix: this.detectTagPrefix(analysis)
            },
            
            // 生成函数
            generateFunction: (data) => {
                const result = [];
                
                // 根据分析的结构生成
                for (const item of analysis.structure) {
                    switch (item.type) {
                        case 'title':
                            if (data.title) result.push(data.title);
                            break;
                        case 'content':
                            if (data.content) result.push(data.content);
                            break;
                        case 'metadata_start':
                            if (data.title || data.content) result.push('');
                            result.push(mechanism.config.metadataLabel);
                            break;
                        case 'metadata_item':
                            const key = item.pattern.key;
                            if (data[key]) {
                                if (key === 'tags' && Array.isArray(data[key])) {
                                    const prefix = mechanism.config.tagPrefix || '';
                                    const tags = data[key].map(tag => `${prefix}${tag}`).join(' ');
                                    result.push(`${item.pattern.symbol}${tags}`);
                                } else if (key === 'images' && Array.isArray(data[key])) {
                                    result.push(`${item.pattern.symbol}${data[key].length}张`);
                                } else {
                                    result.push(`${item.pattern.symbol}${data[key]}`);
                                }
                            }
                            break;
                        case 'separator':
                            result.push('');
                            result.push(item.content);
                            break;
                    }
                }
                
                return result.join('\n');
            },
            
            // 解析函数
            parseFunction: (content) => {
                const result = { title: '', content: '', metadata: {} };
                const lines = content.split('\n');
                
                let section = 'title';
                let contentLines = [];
                
                for (const line of lines) {
                    if (line === mechanism.config.metadataLabel) {
                        section = 'metadata';
                        if (contentLines.length > 0) {
                            result.content = contentLines.join('\n').trim();
                        }
                        continue;
                    }
                    
                    if (line === mechanism.config.separator) break;
                    
                    if (section === 'title' && !result.title && line.trim()) {
                        result.title = line.trim();
                        section = 'content';
                    } else if (section === 'content') {
                        contentLines.push(line);
                    } else if (section === 'metadata') {
                        this.parseMetadataLine(line, result.metadata, analysis.patterns);
                    }
                }
                
                return result;
            }
        };
        
        return mechanism;
    }
    
    /**
     * 检测标签前缀
     */
    detectTagPrefix(analysis) {
        if (analysis.patterns.tags) {
            const tagLine = analysis.patterns.tags.original;
            if (tagLine.includes('#')) return '#';
            if (tagLine.includes('@')) return '@';
        }
        return '#'; // 默认
    }
    
    /**
     * 解析元数据行（用于解析函数）
     */
    parseMetadataLine(line, metadata, patterns) {
        Object.entries(patterns).forEach(([key, pattern]) => {
            if (line.startsWith(pattern.symbol)) {
                metadata[key] = line.substring(pattern.symbol.length).trim();
            }
        });
    }
    
    /**
     * 步骤4：形成插拔组件
     */
    createPluggableComponent(mechanism, strategyName, displayName) {
        return {
            name: displayName || `自动生成策略-${strategyName}`,
            generate: mechanism.generateFunction,
            parse: mechanism.parseFunction,
            config: mechanism.config,
            metadata: {
                autoGenerated: true,
                generatedAt: new Date().toISOString(),
                version: '1.0.0'
            }
        };
    }
    
    /**
     * 步骤5：完成插拔
     */
    completePlug(strategy, strategyName) {
        if (!this.pluggableGenerator) {
            this.log('错误：未绑定插拔生成器');
            return false;
        }
        
        try {
            this.pluggableGenerator.registerStrategy(strategyName, strategy);
            return true;
        } catch (error) {
            this.log('插拔失败:', error.message);
            return false;
        }
    }
    
    /**
     * 便捷方法：从样例快速生成并切换
     */
    quickGenerate(sample, strategyName, switchImmediately = true) {
        const result = this.generateFromSample(sample, strategyName);
        
        if (result.success && switchImmediately && this.pluggableGenerator) {
            this.pluggableGenerator.switchStrategy(strategyName);
            this.log('已自动切换到新策略:', strategyName);
        }
        
        return result;
    }
    
    /**
     * 样例验证：检查生成的策略是否能正确重现样例
     */
    validateWithSample(originalSample, strategyName) {
        if (!this.pluggableGenerator || !this.pluggableGenerator.strategies.has(strategyName)) {
            return { valid: false, error: '策略不存在' };
        }
        
        try {
            // 解析原样例
            const parsed = this.pluggableGenerator.parse(originalSample, strategyName);
            
            // 重新生成
            const regenerated = this.pluggableGenerator.preview(parsed, strategyName);
            
            // 比较（简化比较）
            const originalLines = originalSample.split('\n').map(l => l.trim()).filter(l => l);
            const regeneratedLines = regenerated.split('\n').map(l => l.trim()).filter(l => l);
            
            const similarity = this.calculateSimilarity(originalLines, regeneratedLines);
            
            return {
                valid: similarity > 0.8,
                similarity: similarity,
                original: originalSample,
                regenerated: regenerated,
                parsed: parsed
            };
        } catch (error) {
            return { valid: false, error: error.message };
        }
    }
    
    /**
     * 计算相似度
     */
    calculateSimilarity(arr1, arr2) {
        const maxLength = Math.max(arr1.length, arr2.length);
        if (maxLength === 0) return 1;
        
        let matches = 0;
        const minLength = Math.min(arr1.length, arr2.length);
        
        for (let i = 0; i < minLength; i++) {
            if (arr1[i] === arr2[i]) matches++;
        }
        
        return matches / maxLength;
    }
    
    /**
     * 调试日志
     */
    log(...args) {
        if (this.config.debugMode) {
            console.log('[AutoStrategyGenerator]', ...args);
        }
    }
    
    /**
     * 获取生成器信息
     */
    getGeneratorInfo() {
        return {
            name: 'AutoStrategyGenerator',
            version: this.version,
            hasPluggableGenerator: !!this.pluggableGenerator,
            features: ['样例分析', '自动生成', '智能插拔', '验证测试']
        };
    }
}

// 全局导出
window.AutoStrategyGenerator = AutoStrategyGenerator;

// 便捷创建方法
window.createAutoGenerator = function(config = {}) {
    return new AutoStrategyGenerator(config);
};

console.log('🤖 AutoStrategyGenerator toolkit loaded v1.0.0');
console.log('💡 使用示例: const autoGen = new AutoStrategyGenerator().setPluggableGenerator(pluggableGen);'); 