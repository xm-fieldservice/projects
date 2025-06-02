/**
 * 笔记工具包 v1.0
 * 一体化解决方案：样例→策略→插拔，支持类接口和函数接口
 */

class NoteToolkit {
    constructor(config = {}) {
        this.version = '1.0.0';
        this.config = {
            debugMode: config.debugMode || false,
            defaultStrategy: config.defaultStrategy || 'standard',
            ...config
        };
        
        // 初始化内部组件
        this.pluggableGenerator = new PluggableNoteGenerator({
            defaultStrategy: this.config.defaultStrategy,
            debugMode: this.config.debugMode
        });
        
        this.autoGenerator = new AutoStrategyGenerator({
            debugMode: this.config.debugMode
        }).setPluggableGenerator(this.pluggableGenerator);
        
        this.log('笔记工具包初始化完成');
    }
    
    /**
     * 🔥 一键式：从样例生成并使用策略
     */
    useStrategy(sampleOrName, strategyName = null) {
        if (strategyName) {
            // 提供了样例和策略名：从样例生成
            return this.generateFromSample(sampleOrName, strategyName, true);
        } else {
            // 只提供策略名：切换到已有策略
            return this.switchStrategy(sampleOrName);
        }
    }
    
    /**
     * 从样例生成策略
     */
    generateFromSample(sample, strategyName, switchImmediately = false) {
        const result = this.autoGenerator.generateFromSample(sample, strategyName);
        
        if (result.success && switchImmediately) {
            this.pluggableGenerator.switchStrategy(strategyName);
        }
        
        return result;
    }
    
    /**
     * 切换策略
     */
    switchStrategy(strategyName) {
        try {
            this.pluggableGenerator.switchStrategy(strategyName);
            return { success: true, currentStrategy: strategyName };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    /**
     * 生成笔记块
     */
    generate(data) {
        return this.pluggableGenerator.generate(data);
    }
    
    /**
     * 解析笔记块
     */
    parse(content, strategyName = null) {
        return this.pluggableGenerator.parse(content, strategyName);
    }
    
    /**
     * 获取所有可用策略
     */
    getStrategies() {
        return this.pluggableGenerator.getAvailableStrategies();
    }
    
    /**
     * 预览策略效果
     */
    preview(data, strategyName) {
        return this.pluggableGenerator.preview(data, strategyName);
    }
    
    /**
     * 验证样例
     */
    validate(sample, strategyName) {
        return this.autoGenerator.validateWithSample(sample, strategyName);
    }
    
    /**
     * 获取工具包状态
     */
    getStatus() {
        return {
            version: this.version,
            currentStrategy: this.pluggableGenerator.getCurrentStrategy(),
            availableStrategies: this.pluggableGenerator.getAvailableStrategies().length,
            switchHistory: this.pluggableGenerator.getSwitchHistory()
        };
    }
    
    /**
     * 调试日志
     */
    log(...args) {
        if (this.config.debugMode) {
            console.log('[NoteToolkit]', ...args);
        }
    }
}

// ====================================
// 🚀 全局单例实例
// ====================================
let globalToolkit = null;

function getGlobalToolkit() {
    if (!globalToolkit) {
        globalToolkit = new NoteToolkit({ debugMode: false });
    }
    return globalToolkit;
}

// ====================================
// ⚡ 函数式接口（简化使用）
// ====================================

/**
 * 一键生成策略并使用
 */
function useNoteStrategy(sampleOrName, strategyName = null) {
    return getGlobalToolkit().useStrategy(sampleOrName, strategyName);
}

/**
 * 从样例生成策略
 */
function generateStrategyFromSample(sample, strategyName) {
    return getGlobalToolkit().generateFromSample(sample, strategyName, false);
}

/**
 * 切换到策略
 */
function switchToStrategy(strategyName) {
    return getGlobalToolkit().switchStrategy(strategyName);
}

/**
 * 生成笔记块
 */
function generateNote(data) {
    return getGlobalToolkit().generate(data);
}

/**
 * 解析笔记块
 */
function parseNote(content, strategyName = null) {
    return getGlobalToolkit().parse(content, strategyName);
}

/**
 * 预览策略效果
 */
function previewStrategy(data, strategyName) {
    return getGlobalToolkit().preview(data, strategyName);
}

/**
 * 获取所有策略
 */
function getAllStrategies() {
    return getGlobalToolkit().getStrategies();
}

/**
 * 验证样例
 */
function validateSample(sample, strategyName) {
    return getGlobalToolkit().validate(sample, strategyName);
}

/**
 * 获取状态
 */
function getToolkitStatus() {
    return getGlobalToolkit().getStatus();
}

// ====================================
// 🔧 高级工具函数
// ====================================

/**
 * 批量处理样例
 */
function batchProcessSamples(samples) {
    const toolkit = getGlobalToolkit();
    const results = [];
    
    samples.forEach((sample, index) => {
        const strategyName = `auto_${index + 1}`;
        const result = toolkit.generateFromSample(sample.content, strategyName);
        results.push({
            index: index,
            name: sample.name || strategyName,
            success: result.success,
            strategy: strategyName,
            error: result.error
        });
    });
    
    return results;
}

/**
 * 策略对比工具
 */
function compareStrategies(data, strategyNames = null) {
    return getGlobalToolkit().pluggableGenerator.compare(data, strategyNames);
}

/**
 * 快速原型验证
 */
function quickPrototype(sample, testData) {
    const toolkit = getGlobalToolkit();
    const strategyName = 'prototype_' + Date.now();
    
    // 1. 从样例生成策略
    const generateResult = toolkit.generateFromSample(sample, strategyName);
    if (!generateResult.success) {
        return { success: false, error: '策略生成失败', details: generateResult };
    }
    
    // 2. 验证策略
    const validateResult = toolkit.validate(sample, strategyName);
    if (!validateResult.valid) {
        return { success: false, error: '策略验证失败', details: validateResult };
    }
    
    // 3. 测试数据
    toolkit.switchStrategy(strategyName);
    const testOutput = toolkit.generate(testData);
    
    return {
        success: true,
        strategyName: strategyName,
        validation: validateResult,
        testOutput: testOutput,
        analysis: generateResult.analysis
    };
}

// ====================================
// 导出
// ====================================

// 类接口
window.NoteToolkit = NoteToolkit;

// 函数接口
window.useNoteStrategy = useNoteStrategy;
window.generateStrategyFromSample = generateStrategyFromSample;
window.switchToStrategy = switchToStrategy;
window.generateNote = generateNote;
window.parseNote = parseNote;
window.previewStrategy = previewStrategy;
window.getAllStrategies = getAllStrategies;
window.validateSample = validateSample;
window.getToolkitStatus = getToolkitStatus;

// 高级工具
window.batchProcessSamples = batchProcessSamples;
window.compareStrategies = compareStrategies;
window.quickPrototype = quickPrototype;

// 工厂方法
window.createNoteToolkit = function(config = {}) {
    return new NoteToolkit(config);
};

// 获取全局实例
window.getNoteToolkit = getGlobalToolkit;

console.log('🛠️ NoteToolkit loaded v1.0.0');
console.log('💡 类接口: const toolkit = new NoteToolkit()');
console.log('⚡ 函数接口: useNoteStrategy(sample, "myStrategy")');
console.log('🚀 快速原型: quickPrototype(sample, testData)'); 