/**
 * QANoteBlock - 问答笔记统一功能块
 * v3.0 完整解耦版核心实现
 * 
 * 功能职责：
 * - 问答模式：AI问答交互
 * - 笔记模式：笔记编辑管理
 * - 智能存储：本地/云端存储策略
 * - 模式切换：问答与笔记的无缝切换
 */

window.QANoteBlock = {
    // 核心状态
    currentMode: 'qa',
    isProcessing: false,
    lastResponse: null,
    
    // 存储管理
    storageManager: null,
    
    // 网络状态
    networkStatus: {
        online: navigator.onLine,
        lastCheck: Date.now()
    },
    
    // 配置选项
    config: {
        apiBaseUrl: 'http://localhost:8000/api/v1',
        autoSave: true,
        storageMode: 'auto' // auto, local, cloud
    },

    /**
     * 初始化QANoteBlock
     */
    async init() {
        try {
            console.log('🚀 初始化QANoteBlock v3.0...');
            
            // 检查依赖
            this.checkDependencies();
            
            // 初始化存储管理器
            await this.initStorageManager();
            
            // 初始化网络监控
            this.initNetworkMonitoring();
            
            // 初始化用户认证状态
            this.initAuthStatus();
            
            // 初始化界面
            this.initUI();
            
            // 绑定事件
            this.bindEvents();
            
            // 默认模式
            this.switchMode('qa');
            
            console.log('✅ QANoteBlock初始化完成');
            return { success: true };
            
        } catch (error) {
            console.error('❌ QANoteBlock初始化失败:', error);
            this.showMessage('系统初始化失败: ' + error.message, 'error');
            return { success: false, error: error.message };
        }
    },

    /**
     * 检查依赖模块
     */
    checkDependencies() {
        const requiredModules = ['AuthBlock', 'UIBlock', 'NotebookManager'];
        const missingModules = [];
        
        requiredModules.forEach(module => {
            if (!window[module]) {
                missingModules.push(module);
            }
        });
        
        if (missingModules.length > 0) {
            throw new Error(`缺少依赖模块: ${missingModules.join(', ')}`);
        }
    },

    /**
     * 初始化存储管理器
     */
    async initStorageManager() {
        if (window.NotebookManager) {
            this.storageManager = window.NotebookManager;
            await this.storageManager.init();
        } else {
            console.warn('⚠️ NotebookManager未找到，使用降级存储');
            this.storageManager = {
                save: (data) => localStorage.setItem('qa-note-data', JSON.stringify(data)),
                load: () => JSON.parse(localStorage.getItem('qa-note-data') || '{}')
            };
        }
    },

    /**
     * 初始化网络状态监控
     */
    initNetworkMonitoring() {
        this.updateNetworkStatus();
        
        window.addEventListener('online', () => {
            this.networkStatus.online = true;
            this.networkStatus.lastCheck = Date.now();
            this.updateNetworkStatus();
            this.showMessage('网络已连接', 'success', { duration: 2000 });
        });
        
        window.addEventListener('offline', () => {
            this.networkStatus.online = false;
            this.networkStatus.lastCheck = Date.now();
            this.updateNetworkStatus();
            this.showMessage('网络已断开，将使用离线模式', 'warning');
        });
    },

    /**
     * 更新网络状态显示
     */
    updateNetworkStatus() {
        const indicator = document.getElementById('network-status');
        if (indicator) {
            indicator.className = `network-status ${this.networkStatus.online ? 'online' : 'offline'}`;
            indicator.textContent = this.networkStatus.online ? '🌐 在线' : '📴 离线';
        }
    },

    /**
     * 初始化认证状态
     */
    initAuthStatus() {
        if (window.AuthBlock) {
            const user = AuthBlock.getCurrentUser();
            if (user) {
                console.log('👤 当前用户:', user.username);
                this.updateUserInfo(user);
            }
        }
    },

    /**
     * 更新用户信息显示
     */
    updateUserInfo(user) {
        const userInfo = document.getElementById('current-user');
        if (userInfo) {
            userInfo.textContent = user.displayName || user.username;
        }
    },

    /**
     * 初始化界面
     */
    initUI() {
        // 确保界面容器存在
        this.ensureUIContainer();
        
        // 初始化模式切换按钮
        this.initModeButtons();
        
        // 初始化输入区域
        this.initInputArea();
        
        // 初始化结果显示区域
        this.initResultArea();
    },

    /**
     * 确保UI容器存在
     */
    ensureUIContainer() {
        let container = document.getElementById('qa-note-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'qa-note-container';
            container.className = 'qa-note-container';
            document.body.appendChild(container);
        }
        
        if (!container.innerHTML.trim()) {
            container.innerHTML = this.getUITemplate();
        }
    },

    /**
     * 获取UI模板
     */
    getUITemplate() {
        return `
            <div class="qa-note-header">
                <div class="mode-toggle">
                    <button id="qa-mode-btn" class="mode-btn active" data-mode="qa">💬 问答</button>
                    <button id="note-mode-btn" class="mode-btn" data-mode="note">📝 笔记</button>
                </div>
                <div class="status-bar">
                    <span id="network-status" class="network-status">🌐 在线</span>
                    <span id="current-user" class="current-user">未登录</span>
                </div>
            </div>
            
            <div class="qa-note-content">
                <div id="qa-mode-panel" class="mode-panel active">
                    <div class="input-section">
                        <div class="agent-selection">
                            <label for="agent-select">选择助手:</label>
                            <select id="agent-select">
                                <option value="general">通用助手</option>
                                <option value="code">编程助手</option>
                                <option value="writing">写作助手</option>
                                <option value="analysis">分析助手</option>
                            </select>
                        </div>
                        <div class="input-group">
                            <input type="text" id="qa-title" placeholder="问题标题" />
                            <textarea id="qa-content" placeholder="请输入你的问题..." rows="4"></textarea>
                        </div>
                        <div class="action-buttons">
                            <button id="ask-button" class="btn btn-primary">🤖 提问</button>
                            <button id="clear-button" class="btn btn-secondary">🗑️ 清空</button>
                        </div>
                    </div>
                    <div id="qa-result" class="result-section" style="display: none;">
                        <div class="result-header">
                            <h3>AI回答</h3>
                            <div class="result-actions">
                                <button id="copy-answer" class="btn btn-sm">📋 复制</button>
                                <button id="save-as-note" class="btn btn-sm">📝 保存为笔记</button>
                            </div>
                        </div>
                        <div id="qa-answer" class="result-content"></div>
                    </div>
                </div>
                
                <div id="note-mode-panel" class="mode-panel">
                    <div class="input-section">
                        <div class="input-group">
                            <input type="text" id="note-title" placeholder="笔记标题" />
                            <textarea id="note-content" placeholder="请输入笔记内容..." rows="10"></textarea>
                        </div>
                        <div class="note-metadata">
                            <input type="text" id="note-tags" placeholder="标签（用逗号分隔）" />
                        </div>
                        <div class="action-buttons">
                            <button id="save-note" class="btn btn-primary">💾 保存笔记</button>
                            <button id="clear-note" class="btn btn-secondary">🗑️ 清空</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * 初始化模式按钮
     */
    initModeButtons() {
        const modeButtons = document.querySelectorAll('.mode-btn');
        modeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const mode = btn.dataset.mode;
                this.switchMode(mode);
            });
        });
    },

    /**
     * 初始化输入区域
     */
    initInputArea() {
        // Agent选择变化
        const agentSelect = document.getElementById('agent-select');
        if (agentSelect) {
            agentSelect.addEventListener('change', () => {
                console.log('助手切换到:', agentSelect.value);
            });
        }
    },

    /**
     * 初始化结果区域
     */
    initResultArea() {
        // 复制答案按钮
        const copyBtn = document.getElementById('copy-answer');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => this.copyAnswer());
        }
        
        // 保存为笔记按钮
        const saveAsNoteBtn = document.getElementById('save-as-note');
        if (saveAsNoteBtn) {
            saveAsNoteBtn.addEventListener('click', () => this.saveAnswerAsNote());
        }
    },

    /**
     * 绑定事件
     */
    bindEvents() {
        // 提问按钮
        const askBtn = document.getElementById('ask-button');
        if (askBtn) {
            askBtn.addEventListener('click', () => this.handleAskQuestion());
        }
        
        // 清空按钮（问答模式）
        const clearBtn = document.getElementById('clear-button');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearQAInputs());
        }
        
        // 保存笔记按钮
        const saveNoteBtn = document.getElementById('save-note');
        if (saveNoteBtn) {
            saveNoteBtn.addEventListener('click', () => this.handleSaveNote());
        }
        
        // 清空按钮（笔记模式）
        const clearNoteBtn = document.getElementById('clear-note');
        if (clearNoteBtn) {
            clearNoteBtn.addEventListener('click', () => this.clearNoteInputs());
        }
        
        // 键盘快捷键
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    if (this.currentMode === 'qa') {
                        this.handleAskQuestion();
                    } else {
                        this.handleSaveNote();
                    }
                } else if (e.key === 's') {
                    e.preventDefault();
                    if (this.currentMode === 'note') {
                        this.handleSaveNote();
                    }
                }
            }
        });
    },

    /**
     * 切换模式
     */
    switchMode(mode) {
        if (mode === this.currentMode) return;
        
        console.log(`🔄 切换模式: ${this.currentMode} -> ${mode}`);
        
        this.currentMode = mode;
        
        // 更新按钮状态
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });
        
        // 更新面板显示
        document.querySelectorAll('.mode-panel').forEach(panel => {
            panel.classList.toggle('active', panel.id === `${mode}-mode-panel`);
        });
        
        // 模式特定的初始化
        if (mode === 'note') {
            this.loadRecentNotes();
        }
        
        this.showMessage(`已切换到${mode === 'qa' ? '问答' : '笔记'}模式`, 'info', { duration: 1500 });
    },

    /**
     * 处理提问
     */
    async handleAskQuestion() {
        if (this.isProcessing) {
            this.showMessage('正在处理中，请稍候...', 'warning');
            return;
        }
        
        const questionData = this.getQuestionData();
        if (!this.validateQuestionData(questionData)) {
            return;
        }
        
        this.isProcessing = true;
        this.showLoading('AI正在思考中...');
        
        try {
            const result = await this.askQuestion(questionData);
            
            if (result.success) {
                this.displayAIResponse(result.data);
                this.lastResponse = result.data;
                
                // 自动保存
                if (this.config.autoSave) {
                    await this.autoSaveQA(questionData, result.data);
                }
                
                this.showMessage('AI回答完成', 'success');
            } else {
                throw new Error(result.error || '未知错误');
            }
            
        } catch (error) {
            console.error('❌ 提问失败:', error);
            this.showMessage('提问失败: ' + error.message, 'error');
        } finally {
            this.isProcessing = false;
            this.hideLoading();
        }
    },

    /**
     * 获取问题数据
     */
    getQuestionData() {
        return {
            title: document.getElementById('qa-title')?.value?.trim() || '',
            content: document.getElementById('qa-content')?.value?.trim() || '',
            agent: document.getElementById('agent-select')?.value || 'general',
            timestamp: new Date().toISOString()
        };
    },

    /**
     * 验证问题数据
     */
    validateQuestionData(data) {
        if (!data.content) {
            this.showMessage('请输入问题内容', 'warning');
            document.getElementById('qa-content')?.focus();
            return false;
        }
        
        if (data.content.length > 2000) {
            this.showMessage('问题内容过长，请控制在2000字符以内', 'warning');
            return false;
        }
        
        return true;
    },

    /**
     * 发送问题到AI
     */
    async askQuestion(questionData) {
        try {
            // 如果在线，尝试调用后端API
            if (this.networkStatus.online && window.APIClient) {
                return await this.askQuestionOnline(questionData);
            } else {
                // 离线模式，使用模拟回答
                return await this.askQuestionOffline(questionData);
            }
        } catch (error) {
            // 网络错误时回退到离线模式
            console.warn('⚠️ 在线问答失败，切换到离线模式:', error);
            return await this.askQuestionOffline(questionData);
        }
    },

    /**
     * 在线问答
     */
    async askQuestionOnline(questionData) {
        const response = await APIClient.post('/qa/ask', {
            question: questionData.content,
            title: questionData.title,
            agent: questionData.agent,
            user_id: AuthBlock.getCurrentUser()?.id
        });
        
        return {
            success: true,
            data: {
                question: questionData.content,
                answer: response.answer,
                agent: questionData.agent,
                timestamp: new Date().toISOString(),
                source: 'online'
            }
        };
    },

    /**
     * 离线问答（模拟）
     */
    async askQuestionOffline(questionData) {
        // 模拟AI处理时间
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
        
        const mockResponses = {
            general: '这是一个通用回答。根据您的问题，我建议您...',
            code: '根据您的代码问题，建议的解决方案是...\n\n```javascript\n// 示例代码\nconsole.log("Hello World");\n```',
            writing: '关于写作技巧，我建议您注意以下几点：\n1. 结构清晰\n2. 逻辑连贯\n3. 语言简练',
            analysis: '根据数据分析，我们可以得出以下结论：\n• 趋势1\n• 趋势2\n• 建议措施'
        };
        
        const answer = mockResponses[questionData.agent] || mockResponses.general;
        
        return {
            success: true,
            data: {
                question: questionData.content,
                answer: answer,
                agent: questionData.agent,
                timestamp: new Date().toISOString(),
                source: 'offline'
            }
        };
    },

    /**
     * 显示AI回答
     */
    displayAIResponse(responseData) {
        const resultSection = document.getElementById('qa-result');
        const answerDiv = document.getElementById('qa-answer');
        
        if (resultSection && answerDiv) {
            answerDiv.innerHTML = this.formatAnswer(responseData.answer);
            resultSection.style.display = 'block';
            
            // 滚动到结果区域
            resultSection.scrollIntoView({ behavior: 'smooth' });
        }
    },

    /**
     * 格式化回答内容
     */
    formatAnswer(answer) {
        // 转换Markdown格式
        return answer
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>');
    },

    /**
     * 自动保存问答
     */
    async autoSaveQA(questionData, responseData) {
        try {
            const qaData = {
                type: 'qa',
                title: questionData.title || '问答记录',
                question: questionData.content,
                answer: responseData.answer,
                agent: questionData.agent,
                timestamp: new Date().toISOString()
            };
            
            await this.storageManager.save(qaData);
            console.log('✅ 问答自动保存成功');
            
        } catch (error) {
            console.error('❌ 问答自动保存失败:', error);
        }
    },

    /**
     * 复制回答
     */
    async copyAnswer() {
        if (!this.lastResponse) {
            this.showMessage('没有可复制的内容', 'warning');
            return;
        }
        
        try {
            await navigator.clipboard.writeText(this.lastResponse.answer);
            this.showMessage('回答已复制到剪贴板', 'success', { duration: 2000 });
        } catch (error) {
            console.error('复制失败:', error);
            this.showMessage('复制失败', 'error');
        }
    },

    /**
     * 保存回答为笔记
     */
    saveAnswerAsNote() {
        if (!this.lastResponse) {
            this.showMessage('没有可保存的回答', 'warning');
            return;
        }
        
        // 切换到笔记模式
        this.switchMode('note');
        
        // 填充笔记内容
        setTimeout(() => {
            const titleInput = document.getElementById('note-title');
            const contentInput = document.getElementById('note-content');
            const tagsInput = document.getElementById('note-tags');
            
            if (titleInput) titleInput.value = `AI回答: ${this.lastResponse.question.substring(0, 30)}...`;
            if (contentInput) {
                contentInput.value = `问题: ${this.lastResponse.question}\n\n回答: ${this.lastResponse.answer}`;
            }
            if (tagsInput) tagsInput.value = 'AI回答, 问答记录';
            
            this.showMessage('回答内容已填入笔记，请保存', 'info');
        }, 100);
    },

    /**
     * 处理保存笔记
     */
    async handleSaveNote() {
        const noteData = this.getNoteData();
        if (!this.validateNoteData(noteData)) {
            return;
        }
        
        this.showLoading('保存笔记中...');
        
        try {
            const result = await this.saveNote(noteData);
            
            if (result.success) {
                this.showMessage('笔记保存成功', 'success');
                this.clearNoteInputs();
            } else {
                throw new Error(result.error || '保存失败');
            }
            
        } catch (error) {
            console.error('❌ 保存笔记失败:', error);
            this.showMessage('保存失败: ' + error.message, 'error');
        } finally {
            this.hideLoading();
        }
    },

    /**
     * 获取笔记数据
     */
    getNoteData() {
        return {
            title: document.getElementById('note-title')?.value?.trim() || '',
            content: document.getElementById('note-content')?.value?.trim() || '',
            tags: document.getElementById('note-tags')?.value?.split(',').map(tag => tag.trim()).filter(tag => tag) || [],
            timestamp: new Date().toISOString()
        };
    },

    /**
     * 验证笔记数据
     */
    validateNoteData(data) {
        if (!data.title) {
            this.showMessage('请输入笔记标题', 'warning');
            document.getElementById('note-title')?.focus();
            return false;
        }
        
        if (!data.content) {
            this.showMessage('请输入笔记内容', 'warning');
            document.getElementById('note-content')?.focus();
            return false;
        }
        
        return true;
    },

    /**
     * 保存笔记
     */
    async saveNote(noteData) {
        try {
            const saveData = {
                type: 'note',
                ...noteData,
                user_id: AuthBlock.getCurrentUser()?.id
            };
            
            await this.storageManager.save(saveData);
            
            return { success: true };
            
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    /**
     * 加载最近笔记
     */
    async loadRecentNotes() {
        try {
            const notes = await this.storageManager.load({ type: 'note', limit: 5 });
            console.log('📝 加载到最近笔记:', notes.length);
        } catch (error) {
            console.error('❌ 加载笔记失败:', error);
        }
    },

    /**
     * 清空问答输入
     */
    clearQAInputs() {
        const elements = ['qa-title', 'qa-content'];
        elements.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.value = '';
        });
        
        // 隐藏结果区域
        const resultSection = document.getElementById('qa-result');
        if (resultSection) {
            resultSection.style.display = 'none';
        }
        
        this.lastResponse = null;
    },

    /**
     * 清空笔记输入
     */
    clearNoteInputs() {
        const elements = ['note-title', 'note-content', 'note-tags'];
        elements.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.value = '';
        });
    },

    /**
     * 显示消息
     */
    showMessage(text, type = 'info', options = {}) {
        if (window.UIBlock && UIBlock.showMessage) {
            UIBlock.showMessage(text, type, options);
        } else {
            // 降级消息显示
            console.log(`[${type.toUpperCase()}] ${text}`);
            alert(text);
        }
    },

    /**
     * 显示加载状态
     */
    showLoading(text = '处理中...') {
        if (window.UIBlock && UIBlock.showLoading) {
            UIBlock.showLoading(text);
        } else {
            console.log('🔄 ' + text);
        }
    },

    /**
     * 隐藏加载状态
     */
    hideLoading() {
        if (window.UIBlock && UIBlock.hideLoading) {
            UIBlock.hideLoading();
        }
    },

    /**
     * 销毁QANoteBlock
     */
    destroy() {
        // 清理事件监听器
        window.removeEventListener('online', this.updateNetworkStatus);
        window.removeEventListener('offline', this.updateNetworkStatus);
        
        // 清理状态
        this.currentMode = 'qa';
        this.isProcessing = false;
        this.lastResponse = null;
        
        console.log('🗑️ QANoteBlock已销毁');
    }
};

// 自动初始化（如果页面已加载）
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        QANoteBlock.init();
    });
} else {
    // 延迟初始化，确保其他模块已加载
    setTimeout(() => {
        QANoteBlock.init();
    }, 100);
} 