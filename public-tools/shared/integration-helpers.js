/**
 * Public Tools - 集成辅助函数
 * 帮助开发者快速集成和使用工具包
 */

// 工具包加载器
class ToolkitLoader {
    constructor() {
        this.loadedToolkits = new Map();
        this.basePath = './public-tools';
    }
    
    setBasePath(path) {
        this.basePath = path;
    }
    
    async loadToolkit(category, name, file = null) {
        const key = `${category}/${name}`;
        
        if (this.loadedToolkits.has(key)) {
            return this.loadedToolkits.get(key);
        }
        
        try {
            let modulePath;
            
            // 根据工具包类型确定文件路径
            switch (category) {
                case 'ai-tools':
                    modulePath = `${this.basePath}/ai-tools/${name}/src/${name}.js`;
                    break;
                case 'note-tools':
                    modulePath = `${this.basePath}/note-tools/${name}/tools/note-toolkit.js`;
                    break;
                case 'storage-tools':
                    modulePath = `${this.basePath}/storage-tools/${name}/local-note-saver.js`;
                    break;
                default:
                    modulePath = file || `${this.basePath}/${category}/${name}/${name}.js`;
            }
            
            const module = await import(modulePath);
            const ToolkitClass = module.default || module;
            
            this.loadedToolkits.set(key, ToolkitClass);
            return ToolkitClass;
            
        } catch (error) {
            console.error(`加载工具包失败: ${key}`, error);
            throw error;
        }
    }
    
    async loadQAToolkit() {
        return this.loadToolkit('ai-tools', 'qa-note-toolkit');
    }
    
    async loadNoteToolkit() {
        return this.loadToolkit('note-tools', 'note-block-toolkit');
    }
    
    async loadStorageToolkit() {
        return this.loadToolkit('storage-tools', 'local-note-saver-toolkit');
    }
}

// 工具包管理器
class ToolkitManager {
    constructor() {
        this.toolkits = new Map();
        this.loader = new ToolkitLoader();
        this.eventBus = new (window.PublicToolsUtils?.EventEmitter || EventEmitter)();
    }
    
    async register(name, category, toolkitName, config = {}) {
        try {
            const ToolkitClass = await this.loader.loadToolkit(category, toolkitName);
            const instance = new ToolkitClass(config);
            
            // 绑定事件转发
            if (instance.on) {
                instance.on('*', (event, data) => {
                    this.eventBus.emit(`${name}:${event}`, data);
                });
            }
            
            this.toolkits.set(name, instance);
            this.eventBus.emit('toolkit:registered', { name, category, toolkitName });
            
            return instance;
        } catch (error) {
            this.eventBus.emit('toolkit:error', { name, error });
            throw error;
        }
    }
    
    get(name) {
        return this.toolkits.get(name);
    }
    
    async init(name) {
        const toolkit = this.get(name);
        if (toolkit && toolkit.init) {
            await toolkit.init();
            this.eventBus.emit('toolkit:initialized', { name });
        }
        return toolkit;
    }
    
    async initAll() {
        const promises = Array.from(this.toolkits.entries()).map(async ([name, toolkit]) => {
            if (toolkit.init) {
                await toolkit.init();
                this.eventBus.emit('toolkit:initialized', { name });
            }
        });
        
        await Promise.all(promises);
        this.eventBus.emit('toolkit:all-initialized');
    }
    
    destroy(name) {
        const toolkit = this.get(name);
        if (toolkit && toolkit.destroy) {
            toolkit.destroy();
            this.toolkits.delete(name);
            this.eventBus.emit('toolkit:destroyed', { name });
        }
    }
    
    destroyAll() {
        this.toolkits.forEach((toolkit, name) => {
            if (toolkit.destroy) {
                toolkit.destroy();
            }
        });
        this.toolkits.clear();
        this.eventBus.emit('toolkit:all-destroyed');
    }
    
    on(event, callback) {
        this.eventBus.on(event, callback);
    }
    
    off(event, callback) {
        this.eventBus.off(event, callback);
    }
}

// 快速配置生成器
class ConfigGenerator {
    static generateQAConfig(options = {}) {
        return {
            container: options.container || '#qa-container',
            agents: {
                default: options.defaultAgent || 'general',
                apiUrl: options.apiUrl || 'http://localhost:8001',
                timeout: options.timeout || 30000,
                ...options.agents
            },
            ui: {
                theme: options.theme || 'modern',
                responsive: options.responsive !== false,
                showDebugInfo: options.debug || false,
                ...options.ui
            },
            features: {
                fileUpload: options.fileUpload !== false,
                imageCapture: options.imageCapture !== false,
                voiceInput: options.voiceInput || false,
                ...options.features
            },
            ...options
        };
    }
    
    static generateNoteConfig(options = {}) {
        return {
            mode: options.mode || 'auto',
            rules: options.rules || 'default',
            format: options.format || 'markdown',
            autoSave: options.autoSave !== false,
            ...options
        };
    }
    
    static generateStorageConfig(options = {}) {
        return {
            mode: options.mode || 'auto',
            fileName: options.fileName || 'notes.md',
            encoding: options.encoding || 'utf-8',
            includeImages: options.includeImages !== false,
            autoSave: options.autoSave || false,
            saveInterval: options.saveInterval || 30000,
            ...options
        };
    }
}

// 预设配置
const PresetConfigs = {
    // 基础笔记应用
    basicNoteApp: {
        qa: ConfigGenerator.generateQAConfig({
            container: '#qa-container',
            theme: 'light',
            defaultAgent: 'general'
        }),
        note: ConfigGenerator.generateNoteConfig({
            mode: 'auto',
            format: 'markdown'
        }),
        storage: ConfigGenerator.generateStorageConfig({
            mode: 'auto',
            fileName: 'my-notes.md'
        })
    },
    
    // 智能问答系统
    smartQASystem: {
        qa: ConfigGenerator.generateQAConfig({
            container: '#qa-container',
            theme: 'modern',
            defaultAgent: 'rag',
            debug: true,
            features: {
                fileUpload: true,
                imageCapture: true,
                voiceInput: true
            }
        }),
        storage: ConfigGenerator.generateStorageConfig({
            mode: 'append',
            fileName: 'qa-history.md',
            autoSave: true
        })
    },
    
    // 专业笔记处理
    professionalNoteProcessor: {
        note: ConfigGenerator.generateNoteConfig({
            mode: 'professional',
            rules: 'advanced',
            format: 'markdown',
            autoSave: true
        }),
        storage: ConfigGenerator.generateStorageConfig({
            mode: 'new',
            includeImages: true,
            autoSave: false
        })
    }
};

// 快速启动器
class QuickStarter {
    constructor() {
        this.manager = new ToolkitManager();
    }
    
    async startBasicNoteApp(container = '#app') {
        const config = PresetConfigs.basicNoteApp;
        
        // 注册工具包
        await this.manager.register('qa', 'ai-tools', 'qa-note-toolkit', config.qa);
        await this.manager.register('note', 'note-tools', 'note-block-toolkit', config.note);
        await this.manager.register('storage', 'storage-tools', 'local-note-saver-toolkit', config.storage);
        
        // 初始化
        await this.manager.initAll();
        
        // 设置工具包间的协作
        this.setupBasicIntegration();
        
        return this.manager;
    }
    
    async startSmartQASystem(container = '#app') {
        const config = PresetConfigs.smartQASystem;
        
        await this.manager.register('qa', 'ai-tools', 'qa-note-toolkit', config.qa);
        await this.manager.register('storage', 'storage-tools', 'local-note-saver-toolkit', config.storage);
        
        await this.manager.initAll();
        this.setupQAIntegration();
        
        return this.manager;
    }
    
    async startProfessionalNoteProcessor(container = '#app') {
        const config = PresetConfigs.professionalNoteProcessor;
        
        await this.manager.register('note', 'note-tools', 'note-block-toolkit', config.note);
        await this.manager.register('storage', 'storage-tools', 'local-note-saver-toolkit', config.storage);
        
        await this.manager.initAll();
        this.setupNoteIntegration();
        
        return this.manager;
    }
    
    setupBasicIntegration() {
        const qa = this.manager.get('qa');
        const note = this.manager.get('note');
        const storage = this.manager.get('storage');
        
        if (qa && storage) {
            qa.on('noteSaved', async (data) => {
                await storage.saveNote(data);
            });
        }
        
        if (note && storage) {
            // 可以添加笔记处理后的自动保存
        }
    }
    
    setupQAIntegration() {
        const qa = this.manager.get('qa');
        const storage = this.manager.get('storage');
        
        if (qa && storage) {
            qa.on('questionAnswered', async (data) => {
                await storage.saveNote({
                    title: `问答记录 - ${new Date().toLocaleString()}`,
                    content: `**问题**: ${data.question}\n\n**回答**: ${data.answer}`,
                    type: 'qa-record',
                    timestamp: new Date().toISOString()
                });
            });
        }
    }
    
    setupNoteIntegration() {
        const note = this.manager.get('note');
        const storage = this.manager.get('storage');
        
        if (note && storage) {
            // 可以添加笔记处理完成后的自动保存逻辑
        }
    }
}

// 兼容性检查器
class CompatibilityChecker {
    static checkEnvironment() {
        const support = window.PublicToolsUtils?.Utils?.checkBrowserSupport() || {};
        
        return {
            ...support,
            publicTools: typeof window.PublicToolsUtils !== 'undefined',
            es6Modules: typeof import !== 'undefined',
            asyncAwait: (async () => {})().constructor === Promise
        };
    }
    
    static checkToolkitRequirements(toolkitName) {
        const requirements = {
            'qa-note-toolkit': {
                es6: true,
                fetch: true,
                localStorage: true,
                eventTarget: true
            },
            'note-block-toolkit': {
                es6: true,
                localStorage: false,
                dom: true
            },
            'local-note-saver-toolkit': {
                es6: true,
                localStorage: true,
                fileSystemAPI: false, // 可选
                blob: true
            }
        };
        
        const required = requirements[toolkitName] || {};
        const support = this.checkEnvironment();
        const result = { compatible: true, missing: [] };
        
        Object.entries(required).forEach(([feature, isRequired]) => {
            if (isRequired && !support[feature]) {
                result.compatible = false;
                result.missing.push(feature);
            }
        });
        
        return result;
    }
    
    static generateCompatibilityReport() {
        const toolkits = ['qa-note-toolkit', 'note-block-toolkit', 'local-note-saver-toolkit'];
        const report = {
            environment: this.checkEnvironment(),
            toolkits: {}
        };
        
        toolkits.forEach(toolkit => {
            report.toolkits[toolkit] = this.checkToolkitRequirements(toolkit);
        });
        
        return report;
    }
}

// 导出所有工具
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ToolkitLoader,
        ToolkitManager,
        ConfigGenerator,
        PresetConfigs,
        QuickStarter,
        CompatibilityChecker
    };
} else {
    window.PublicToolsIntegration = {
        ToolkitLoader,
        ToolkitManager,
        ConfigGenerator,
        PresetConfigs,
        QuickStarter,
        CompatibilityChecker
    };
} 