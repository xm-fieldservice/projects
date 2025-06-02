/**
 * QA Note Toolkit v3.0 - 智能笔记问答工具包
 * 基于现有成熟的问答系统封装而成的独立工具包
 * 
 * 特性：
 * - 双模式设计（问答/笔记）
 * - 多智能体支持
 * - 本地文件保存
 * - 响应式设计
 * - 高度可配置
 */

class QANoteToolkit {
    constructor(config = {}) {
        // 默认配置
        this.config = {
            // 容器设置
            container: config.container || '#qa-note-container',
            
            // 智能体配置
            agents: {
                default: config.agents?.default || 'general',
                apiUrl: config.agents?.apiUrl || 'http://localhost:8001',
                timeout: config.agents?.timeout || 30000,
                retryAttempts: config.agents?.retryAttempts || 3,
                ...config.agents
            },
            
            // 存储配置
            storage: {
                mode: config.storage?.mode || 'local', // local | api | hybrid
                autoSave: config.storage?.autoSave !== false,
                saveInterval: config.storage?.saveInterval || 30000,
                maxHistory: config.storage?.maxHistory || 1000,
                ...config.storage
            },
            
            // UI配置
            ui: {
                theme: config.ui?.theme || 'modern',
                language: config.ui?.language || 'zh-CN',
                responsive: config.ui?.responsive !== false,
                animations: config.ui?.animations !== false,
                showDebugInfo: config.ui?.showDebugInfo || false,
                ...config.ui
            },
            
            // 功能配置
            features: {
                fileUpload: config.features?.fileUpload !== false,
                imageCapture: config.features?.imageCapture !== false,
                voiceInput: config.features?.voiceInput || false,
                exportFormats: config.features?.exportFormats || ['md', 'txt', 'json'],
                peopleSelection: config.features?.peopleSelection !== false,
                ...config.features
            }
        };
        
        // 内部状态
        this.isInitialized = false;
        this.container = null;
        this.qaBlock = null;
        this.eventListeners = new Map();
        
        // 绑定方法的this
        this.handleEvent = this.handleEvent.bind(this);
    }

    /**
     * 初始化工具包
     */
    async init() {
        if (this.isInitialized) {
            console.warn('QA Note Toolkit 已经初始化过了');
            return;
        }

        try {
            // 1. 验证容器
            this.container = document.querySelector(this.config.container);
            if (!this.container) {
                throw new Error(`找不到容器: ${this.config.container}`);
            }

            // 2. 注入HTML结构
            await this.injectHTML();
            
            // 3. 注入CSS样式
            await this.injectCSS();
            
            // 4. 初始化功能组件
            await this.initializeComponents();
            
            // 5. 设置事件监听
            this.setupEventListeners();
            
            this.isInitialized = true;
            this.emit('initialized', { config: this.config });
            
            console.log('🚀 QA Note Toolkit 初始化完成');
            
        } catch (error) {
            console.error('❌ QA Note Toolkit 初始化失败:', error);
            throw error;
        }
    }

    /**
     * 注入HTML结构
     */
    async injectHTML() {
        const htmlTemplate = `
            <div class="qa-note-toolkit" data-theme="${this.config.ui.theme}">
                ${await this.loadComponent('qa-interface')}
            </div>
        `;
        
        this.container.innerHTML = htmlTemplate;
    }

    /**
     * 注入CSS样式
     */
    async injectCSS() {
        // 检查是否已经存在样式表
        if (document.getElementById('qa-note-toolkit-styles')) {
            return;
        }

        const link = document.createElement('link');
        link.id = 'qa-note-toolkit-styles';
        link.rel = 'stylesheet';
        link.href = this.getAssetURL('qa-note-toolkit.min.css');
        
        document.head.appendChild(link);
        
        // 等待样式加载
        return new Promise((resolve, reject) => {
            link.onload = resolve;
            link.onerror = reject;
        });
    }

    /**
     * 初始化功能组件
     */
    async initializeComponents() {
        // 如果已有QANoteBlock，复用其功能
        if (window.QANoteBlock) {
            this.qaBlock = window.QANoteBlock;
            
            // 应用配置覆盖
            this.applyConfiguration();
            
        } else {
            // 动态加载QANoteBlock
            await this.loadQANoteBlock();
        }
        
        // 初始化智能体连接器
        if (window.agentConnector) {
            window.agentConnector.baseUrl = this.config.agents.apiUrl;
        }
    }

    /**
     * 应用配置覆盖
     */
    applyConfiguration() {
        if (!this.qaBlock) return;
        
        // 设置默认智能体
        if (this.config.agents.default) {
            this.qaBlock.selectedAgent = this.config.agents.default;
        }
        
        // 设置存储模式
        if (this.config.storage.mode) {
            this.qaBlock.setStorageMode(this.config.storage.mode);
        }
        
        // 应用UI配置
        this.applyUIConfiguration();
    }

    /**
     * 应用UI配置
     */
    applyUIConfiguration() {
        const toolkit = this.container.querySelector('.qa-note-toolkit');
        if (!toolkit) return;
        
        // 应用主题
        toolkit.setAttribute('data-theme', this.config.ui.theme);
        
        // 控制调试信息显示
        if (this.config.ui.showDebugInfo) {
            toolkit.classList.add('show-debug-info');
        }
        
        // 响应式设计
        if (this.config.ui.responsive) {
            toolkit.classList.add('responsive');
        }
        
        // 动画效果
        if (!this.config.ui.animations) {
            toolkit.classList.add('no-animations');
        }
    }

    /**
     * 设置事件监听
     */
    setupEventListeners() {
        // 监听QANoteBlock的事件
        if (this.qaBlock) {
            this.setupQABlockEventListeners();
        }
        
        // 监听智能体连接器事件
        if (window.agentConnector) {
            this.setupAgentConnectorEventListeners();
        }
        
        // 监听窗口事件
        window.addEventListener('resize', this.handleEvent);
    }

    /**
     * 设置QANoteBlock事件监听
     */
    setupQABlockEventListeners() {
        // 这里可以添加对QANoteBlock事件的监听
        // 由于QANoteBlock使用自定义事件，我们需要监听这些事件
        
        // 监听问答完成事件
        document.addEventListener('qaCompleted', (event) => {
            this.emit('questionAnswered', event.detail);
        });
        
        // 监听笔记保存事件
        document.addEventListener('noteSaved', (event) => {
            this.emit('noteSaved', event.detail);
        });
    }

    /**
     * 设置智能体连接器事件监听
     */
    setupAgentConnectorEventListeners() {
        // 监听智能体切换
        window.addEventListener('agentSwitched', (event) => {
            this.emit('agentSwitched', event.detail);
        });
        
        // 监听连接状态变化
        window.addEventListener('agentConnectionChange', (event) => {
            this.emit('connectionStatusChanged', event.detail);
        });
    }

    /**
     * 事件处理器
     */
    handleEvent(event) {
        switch (event.type) {
            case 'resize':
                this.handleResize();
                break;
        }
    }

    /**
     * 处理窗口大小变化
     */
    handleResize() {
        if (this.config.ui.responsive) {
            this.emit('resize', {
                width: window.innerWidth,
                height: window.innerHeight
            });
        }
    }

    /**
     * 发送问题
     */
    async askQuestion(questionData, options = {}) {
        if (!this.qaBlock) {
            throw new Error('QA组件未初始化');
        }

        try {
            // 如果传入了智能体，先切换
            if (questionData.agent) {
                this.switchAgent(questionData.agent);
            }
            
            // 设置输入内容
            const titleInput = document.getElementById('title-input');
            const contentInput = document.getElementById('content-input');
            
            if (titleInput && questionData.title) {
                titleInput.value = questionData.title;
            }
            
            if (contentInput && questionData.content) {
                contentInput.value = questionData.content;
            }
            
            // 触发提交
            return await this.qaBlock.handleSubmit();
            
        } catch (error) {
            this.emit('error', { type: 'askQuestion', error: error.message });
            throw error;
        }
    }

    /**
     * 切换智能体
     */
    switchAgent(agentId) {
        if (window.agentConnector) {
            return window.agentConnector.switchAgent(agentId);
        } else if (this.qaBlock) {
            return this.qaBlock.setSelectedAgent(agentId);
        }
        throw new Error('智能体连接器未初始化');
    }

    /**
     * 获取当前智能体
     */
    getCurrentAgent() {
        if (window.agentConnector) {
            return window.agentConnector.getCurrentAgent();
        } else if (this.qaBlock) {
            return {
                id: this.qaBlock.selectedAgent,
                name: this.qaBlock.getAgentDisplayName(this.qaBlock.selectedAgent)
            };
        }
        return null;
    }

    /**
     * 保存笔记
     */
    async saveNote(noteData) {
        if (!this.qaBlock) {
            throw new Error('笔记组件未初始化');
        }

        try {
            // 切换到笔记模式
            this.qaBlock.switchMode('note');
            
            // 设置笔记内容
            const titleInput = document.getElementById('title-input');
            const contentInput = document.getElementById('content-input');
            
            if (titleInput && noteData.title) {
                titleInput.value = noteData.title;
            }
            
            if (contentInput && noteData.content) {
                contentInput.value = noteData.content;
            }
            
            // 保存笔记
            return await this.qaBlock.saveNote();
            
        } catch (error) {
            this.emit('error', { type: 'saveNote', error: error.message });
            throw error;
        }
    }

    /**
     * 获取笔记列表
     */
    async getNotes() {
        // 这里需要实现获取笔记列表的逻辑
        // 可以从本地存储或API获取
        return [];
    }

    /**
     * 导出笔记
     */
    async exportNote(noteId, format = 'markdown') {
        if (!this.qaBlock) {
            throw new Error('导出功能未初始化');
        }

        try {
            // 根据格式调用相应的导出方法
            switch (format) {
                case 'markdown':
                case 'md':
                    return await this.qaBlock.saveToLocalFile();
                case 'txt':
                    return await this.qaBlock.exportToLocalFile();
                default:
                    throw new Error(`不支持的导出格式: ${format}`);
            }
        } catch (error) {
            this.emit('error', { type: 'exportNote', error: error.message });
            throw error;
        }
    }

    /**
     * 切换模式
     */
    switchMode(mode) {
        if (this.qaBlock) {
            this.qaBlock.switchMode(mode);
            this.emit('modeChanged', { mode });
        }
    }

    /**
     * 获取配置
     */
    getConfig() {
        return { ...this.config };
    }

    /**
     * 更新配置
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        this.applyConfiguration();
        this.emit('configUpdated', { config: this.config });
    }

    /**
     * 事件发射器
     */
    emit(eventName, data) {
        const event = new CustomEvent(`qaToolkit:${eventName}`, {
            detail: data
        });
        window.dispatchEvent(event);
        
        // 同时触发本地监听器
        if (this.eventListeners.has(eventName)) {
            this.eventListeners.get(eventName).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`事件监听器错误 (${eventName}):`, error);
                }
            });
        }
    }

    /**
     * 事件监听器
     */
    on(eventName, callback) {
        if (!this.eventListeners.has(eventName)) {
            this.eventListeners.set(eventName, []);
        }
        this.eventListeners.get(eventName).push(callback);
    }

    /**
     * 移除事件监听器
     */
    off(eventName, callback) {
        if (this.eventListeners.has(eventName)) {
            const listeners = this.eventListeners.get(eventName);
            const index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }

    /**
     * 工具方法 - 加载组件
     */
    async loadComponent(componentName) {
        // 这里应该返回组件的HTML模板
        // 目前返回一个占位符，实际实现中会加载真实的HTML
        return `<div class="${componentName}">组件加载中...</div>`;
    }

    /**
     * 工具方法 - 获取资源URL
     */
    getAssetURL(filename) {
        // 根据当前脚本位置构建资源URL
        const scriptPath = document.currentScript?.src || '';
        const basePath = scriptPath.substring(0, scriptPath.lastIndexOf('/'));
        return `${basePath}/../dist/${filename}`;
    }

    /**
     * 工具方法 - 加载QANoteBlock
     */
    async loadQANoteBlock() {
        // 动态加载QANoteBlock脚本
        const scriptURL = this.getAssetURL('qa-note-block.min.js');
        
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = scriptURL;
            script.onload = () => {
                this.qaBlock = window.QANoteBlock;
                if (this.qaBlock) {
                    this.qaBlock.init();
                    resolve();
                } else {
                    reject(new Error('QANoteBlock 加载失败'));
                }
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    /**
     * 注册自定义智能体
     */
    registerAgent(agentId, agentConfig) {
        if (window.agentConnector) {
            window.agentConnector.agentConfigs[agentId] = agentConfig;
            this.emit('agentRegistered', { agentId, agentConfig });
        } else {
            throw new Error('智能体连接器未初始化');
        }
    }

    /**
     * 销毁工具包
     */
    destroy() {
        // 清理事件监听器
        window.removeEventListener('resize', this.handleEvent);
        
        // 清理自定义事件监听器
        this.eventListeners.clear();
        
        // 清理DOM
        if (this.container) {
            this.container.innerHTML = '';
        }
        
        // 清理样式（如果是动态添加的）
        const styleElement = document.getElementById('qa-note-toolkit-styles');
        if (styleElement) {
            styleElement.remove();
        }
        
        this.isInitialized = false;
        this.emit('destroyed');
        
        console.log('🔚 QA Note Toolkit 已销毁');
    }
}

// 导出类和版本信息
QANoteToolkit.version = '3.0.0';

// 全局注册
window.QANoteToolkit = QANoteToolkit;

// ES6模块导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QANoteToolkit;
}

// AMD模块导出
if (typeof define === 'function' && define.amd) {
    define([], () => QANoteToolkit);
} 