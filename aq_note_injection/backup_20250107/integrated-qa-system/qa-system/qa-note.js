/**
 * QANoteBlock - 问答笔记统一功能块
 * v3.0 完整解耦版核心实现 + LocalNoteSaver集成 + AuthBlock认证集成
 */
window.QANoteBlock = {
    // 当前状态
    currentMode: 'qa',
    isProcessing: false,
    lastResponse: null,
    qaSaver: null,
    localNoteSaver: null,
    
    // 认证相关状态
    authToken: null,
    currentUser: null,
    
    // 新增：网络状态监控
    networkStatus: {
        online: navigator.onLine,
        lastCheck: Date.now(),
        checkInterval: null
    },

    /**
     * 初始化
     */
    async init() {
        console.log('🚀 QANoteBlock 初始化开始...');
        
        // 首先检查认证状态
        if (!await this.checkAuthStatus()) {
            console.log('❌ 认证检查失败，即将跳转到登录页面');
            this.redirectToLogin();
            return;
        }
        
        console.log('✅ 认证检查通过，继续初始化系统...');
        
        // 初始化网络监控
        this.initNetworkMonitoring();
        
        // 初始化人员选择功能
        this.initPeopleSelection();
        
        // 初始化附件数组
        this.attachments = [];
        this.selectedAgent = 'general';
        
        // 初始化智能存储器
        this.qaSaver = new QANoteSaver({
            mode: this.getStorageMode(),
            apiUrl: '/api',
            debugMode: false,
            onSaveSuccess: this.handleSaveSuccess.bind(this),
            onSaveError: this.handleSaveError.bind(this)
        });

        // 初始化本地文件保存器
        this.initLocalNoteSaver();

        // 初始化界面
        this.initializeUI();
        this.bindEvents();
        this.bindMenuEvents(); // 新增：绑定菜单事件
        this.loadUserInfo();
        this.switchMode('qa'); // 默认问答模式
        this.checkFileSystemSupport();
        
        console.log('🎉 QANoteBlock 初始化完成');
    },

    /**
     * 检查认证状态
     */
    async checkAuthStatus() {
        console.log('🔐 检查用户认证状态...');
        
        // 从多个源获取认证令牌
        this.authToken = this.getAuthToken();
        
        if (!this.authToken) {
            console.log('❌ 未找到认证令牌');
            return false;
        }
        
        try {
            const response = await fetch('/api/auth/user', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const result = await response.json();
                this.currentUser = result.data.user;
                console.log('✅ 用户认证成功:', this.currentUser.name);
                return true;
            } else {
                console.log('❌ 认证令牌无效');
                this.clearAuthToken();
                return false;
            }
        } catch (error) {
            console.error('❌ 认证检查失败:', error);
            return false;
        }
    },

    /**
     * 获取认证令牌
     */
    getAuthToken() {
        // 优先从Cookie获取
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === 'auth_token') {
                return value;
            }
        }
        
        // 其次从localStorage获取
        return localStorage.getItem('auth_token') || localStorage.getItem('qa_auth_token');
    },

    /**
     * 清除认证令牌
     */
    clearAuthToken() {
        document.cookie = 'auth_token=; path=/; max-age=0';
        localStorage.removeItem('auth_token');
        localStorage.removeItem('qa_auth_token');
        localStorage.removeItem('user_info');
        this.authToken = null;
        this.currentUser = null;
    },

    /**
     * 跳转到登录页面
     */
    redirectToLogin() {
        console.log('🔄 跳转到登录页面...');
        this.clearAuthToken();
        window.location.href = '/auth';
    },

    /**
     * 新增：初始化网络监控
     */
    initNetworkMonitoring() {
        // 更新初始状态
        this.updateNetworkStatus();
        
        // 监听网络状态变化
        window.addEventListener('online', () => {
            this.networkStatus.online = true;
            this.networkStatus.lastCheck = Date.now();
            this.updateNetworkStatus();
            this.showMessage('网络已连接', 'success');
        });
        
        window.addEventListener('offline', () => {
            this.networkStatus.online = false;
            this.networkStatus.lastCheck = Date.now();
            this.updateNetworkStatus();
            this.showMessage('网络已断开', 'warning');
        });
        
        // 定期检查网络状态
        this.networkStatus.checkInterval = setInterval(() => {
            const wasOnline = this.networkStatus.online;
            this.networkStatus.online = navigator.onLine;
            this.networkStatus.lastCheck = Date.now();
            
            if (wasOnline !== this.networkStatus.online) {
                this.updateNetworkStatus();
            }
        }, 30000); // 每30秒检查一次
    },

    /**
     * 更新网络状态显示
     */
    updateNetworkStatus() {
        const indicator = document.getElementById('network-status-compact');
        const icon = document.getElementById('network-icon-compact');
        const text = document.getElementById('network-text-compact');
        
        if (!indicator || !icon || !text) return;
        
        if (this.networkStatus.online) {
            indicator.className = 'network-status-compact online';
            icon.textContent = '🌐';
            text.textContent = '在线';
        } else {
            indicator.className = 'network-status-compact offline';
            icon.textContent = '❌';
            text.textContent = '离线';
        }
    },

    /**
     * 新增：绑定菜单事件
     */
    bindMenuEvents() {
        console.log('🔧 开始绑定菜单事件...');
        
        // 汉堡菜单按钮
        const hamburgerMenu = document.getElementById('hamburger-menu');
        if (hamburgerMenu) {
            hamburgerMenu.addEventListener('click', () => this.toggleSidebar());
            console.log('✅ 汉堡菜单按钮绑定成功');
        } else {
            console.error('❌ 找不到汉堡菜单按钮');
        }

        // 关闭侧边栏
        const closeSidebar = document.getElementById('close-sidebar');
        if (closeSidebar) {
            closeSidebar.addEventListener('click', () => this.closeSidebar());
            console.log('✅ 关闭侧边栏按钮绑定成功');
        }

        // 侧边栏菜单项
        const menuLinks = document.querySelectorAll('.menu-link');
        console.log(`🔍 找到 ${menuLinks.length} 个菜单项`);
        menuLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const action = link.dataset.action;
                console.log(`🖱️ 菜单项被点击: ${action}`);
                this.handleMenuAction(action);
            });
        });

        // 背景遮罩点击
        const backdrop = document.getElementById('backdrop');
        if (backdrop) {
            backdrop.addEventListener('click', () => this.closeSidebar());
            console.log('✅ 背景遮罩绑定成功');
        }

        // ESC键关闭侧边栏
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeSidebar();
            }
        });
        
        console.log('🎉 菜单事件绑定完成');
    },

    /**
     * 新增：切换侧边栏
     */
    toggleSidebar() {
        console.log('🔄 切换侧边栏状态...');
        const sidebar = document.getElementById('left-sidebar');
        const hamburger = document.getElementById('hamburger-menu');
        const backdrop = document.getElementById('backdrop');

        if (sidebar && hamburger && backdrop) {
            const isOpen = sidebar.classList.contains('active');
            console.log(`📋 当前状态: ${isOpen ? '已打开' : '已关闭'}`);
            
            if (isOpen) {
                this.closeSidebar();
            } else {
                sidebar.classList.add('active');
                hamburger.classList.add('active');
                backdrop.classList.add('show');
                console.log('✅ 侧边栏已打开');
            }
        } else {
            console.error('❌ 找不到侧边栏相关元素:', {
                sidebar: !!sidebar,
                hamburger: !!hamburger,
                backdrop: !!backdrop
            });
        }
    },

    /**
     * 新增：关闭侧边栏
     */
    closeSidebar() {
        const sidebar = document.getElementById('left-sidebar');
        const hamburger = document.getElementById('hamburger-menu');
        const backdrop = document.getElementById('backdrop');

        if (sidebar && hamburger && backdrop) {
            sidebar.classList.remove('active');
            hamburger.classList.remove('active');
            backdrop.classList.remove('show');
        }
    },

    /**
     * 新增：处理菜单操作
     */
    handleMenuAction(action) {
        // 关闭侧边栏
        this.closeSidebar();
        
        // 更新菜单激活状态
        this.updateMenuActiveState(action);

        switch (action) {
            case 'switch-qa':
                const modeSwitchQA = document.getElementById('mode-switch');
                if (modeSwitchQA) {
                    modeSwitchQA.checked = true;
                }
                this.switchMode('qa');
                this.showMessage('已切换到问答模式', 'info');
                break;
                
            case 'switch-note':
                const modeSwitchNote = document.getElementById('mode-switch');
                if (modeSwitchNote) {
                    modeSwitchNote.checked = false;
                }
                this.switchMode('note');
                this.showMessage('已切换到笔记模式', 'info');
                break;
                
            case 'export-data':
                this.exportNotebook();
                break;
                
            case 'clear-all':
                if (confirm('确定要清空所有数据吗？此操作不可恢复。')) {
                    this.clearNotebook();
                    this.clearInputs();
                    this.showMessage('数据已清空', 'success');
                }
                break;
                
            case 'settings':
                this.showSettings();
                break;
                
            default:
                console.warn('未知的菜单操作:', action);
        }
    },

    /**
     * 新增：更新菜单激活状态
     */
    updateMenuActiveState(action) {
        const menuItems = document.querySelectorAll('.menu-item');
        menuItems.forEach(item => {
            const link = item.querySelector('.menu-link');
            if (link) {
                const linkAction = link.dataset.action;
                if (linkAction === action) {
                    item.classList.add('active');
                } else {
                    item.classList.remove('active');
                }
            }
        });
    },

    /**
     * 新增：显示设置
     */
    showSettings() {
        this.showMessage('设置功能开发中，敬请期待！', 'info');
    },

    /**
     * 新增：更新系统状态显示
     */
    updateSystemStatus() {
        const storageModeDisplay = document.getElementById('storage-mode-display');
        const syncStatusDisplay = document.getElementById('sync-status-display');
        const dataCountDisplay = document.getElementById('data-count-display');

        if (storageModeDisplay) {
            storageModeDisplay.textContent = this.getStorageModeDisplay(this.getStorageMode());
        }

        if (syncStatusDisplay) {
            syncStatusDisplay.textContent = this.networkStatus.online ? '已同步' : '离线模式';
        }

        if (dataCountDisplay) {
            // 这里可以统计实际的数据量
            dataCountDisplay.textContent = '0 条记录';
        }
    },

    /**
     * 初始化本地文件保存器
     */
    initLocalNoteSaver() {
        try {
            this.localNoteSaver = new LocalNoteSaver({
                appName: '智能问答笔记系统v3.0',
                timestampFormat: 'zh-CN',
                debugMode: false
            });

            // 绑定本地保存功能
            this.localNoteSaver.bindSelectButton('#select-file-btn');
            this.localNoteSaver.bindInput('#content-input');
            this.localNoteSaver.bindCreateButton('#create-file-btn');

            // 重写状态显示方法
            this.localNoteSaver.showStatus = this.showLocalStatus.bind(this);

            console.log('✅ LocalNoteSaver 初始化成功');
        } catch (error) {
            console.error('❌ LocalNoteSaver 初始化失败:', error);
            this.showMessage('本地文件保存功能初始化失败', 'warning');
        }
    },

    /**
     * 检查File System API支持
     */
    checkFileSystemSupport() {
        const supportElement = document.getElementById('file-api-support');
        const statusElement = document.getElementById('file-api-status');
        
        if ('showSaveFilePicker' in window) {
            supportElement.textContent = '✅ 支持直接文件读写';
            statusElement.classList.add('supported');
            this.enableLocalFileFeatures();
        } else {
            supportElement.textContent = '⚠️ 仅支持下载保存';
            statusElement.classList.add('unsupported');
            this.limitLocalFileFeatures();
        }
    },

    /**
     * 启用本地文件功能
     */
    enableLocalFileFeatures() {
        // 显示本地保存按钮
        document.getElementById('local-save-btn').style.display = 'inline-flex';
        document.getElementById('local-save-answer-btn').style.display = 'inline-flex';
        document.getElementById('local-export-btn').style.display = 'inline-flex';
        
        // 更新存储模式选项
        const fileOption = document.querySelector('option[value="file"]');
        if (fileOption) {
            fileOption.style.display = 'block';
        }
    },

    /**
     * 限制本地文件功能
     */
    limitLocalFileFeatures() {
        // 隐藏部分本地保存按钮
        const fileOption = document.querySelector('option[value="file"]');
        if (fileOption) {
            fileOption.textContent = '📥 本地下载保存（兼容模式）';
        }
    },

    /**
     * 显示本地状态
     */
    showLocalStatus(message, type = 'info') {
        // 只更新文件状态显示，不显示弹窗
        const fileStatus = document.getElementById('file-status');
        if (this.localNoteSaver && this.localNoteSaver.currentFileName) {
            fileStatus.textContent = `已选择: ${this.localNoteSaver.currentFileName}`;
            fileStatus.className = 'file-status success';
            
            // 🔧 修复：文件选择成功后自动切换到文件存储模式
            if (message.includes('File selected') || message.includes('文件选择成功')) {
                const storageSelect = document.getElementById('storage-select');
                if (storageSelect && storageSelect.value !== 'file') {
                    console.log('🔄 [AUTO] 文件选择成功，自动切换到本地文件存储模式');
                    storageSelect.value = 'file';
                    this.setStorageMode('file');
                }
            }
        }
        
        // 在控制台显示状态信息，但不显示弹窗
        console.log('📁 [本地文件状态]', message, `(${type})`);
        
        // 如果是错误类型，使用showMessage显示
        if (type === 'error') {
            this.showMessage(message, 'error');
        } else if (type === 'success' && message.includes('File selected')) {
            // 文件选择成功时显示简单提示
            this.showMessage('文件选择成功，已切换到本地文件存储模式', 'success');
        }
    },

    /**
     * 初始化界面
     */
    initializeUI() {
        // 设置存储模式选择器
        const storageSelect = document.getElementById('storage-select');
        if (storageSelect) {
            storageSelect.value = this.getStorageMode();
        }

        // 加载笔记本预览
        this.loadNotebookPreview();
        
        // 新增：更新网络状态显示
        this.updateNetworkStatus();
    },

    /**
     * 绑定事件
     */
    bindEvents() {
        // 开关模式切换
        const modeSwitch = document.getElementById('mode-switch');
        if (modeSwitch) {
            modeSwitch.addEventListener('change', (e) => {
                const isQAMode = e.target.checked;
                this.switchMode(isQAMode ? 'qa' : 'note');
            });
        }

        // 统一操作按钮
        const submitBtn = document.getElementById('submit-btn');
        if (submitBtn) {
            submitBtn.addEventListener('click', () => {
                this.handleSubmit();
            });
        }

        // 附件按钮和文件选择
        const attachmentBtn = document.getElementById('attachment-btn');
        const fileInput = document.getElementById('file-input');
        
        if (attachmentBtn && fileInput) {
            attachmentBtn.addEventListener('click', () => {
                fileInput.click();
            });
            
            fileInput.addEventListener('change', (e) => {
                this.handleFileUpload(e);
            });
        }

        // 顶部智能体选择器
        const agentSelectHeader = document.getElementById('agent-select-header');
        if (agentSelectHeader) {
            agentSelectHeader.addEventListener('change', (e) => {
                this.setSelectedAgent(e.target.value);
            });
        }

        // 结果区域按钮
        const saveAnswerBtn = document.getElementById('save-answer-btn');
        const copyAnswerBtn = document.getElementById('copy-answer-btn');
        
        if (saveAnswerBtn) {
            saveAnswerBtn.addEventListener('click', () => {
                this.saveLastResponse();
            });
        }
        
        if (copyAnswerBtn) {
            copyAnswerBtn.addEventListener('click', () => {
                this.copyAnswer();
            });
        }

        // 存储模式切换
        const storageSelect = document.getElementById('storage-select');
        if (storageSelect) {
            storageSelect.addEventListener('change', (e) => {
                this.setStorageMode(e.target.value);
            });
        }

        // 退出登录
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.logout();
            });
        }

        // 输入框变化监听
        const titleInput = document.getElementById('title-input');
        const contentInput = document.getElementById('content-input');
        
        if (titleInput) {
            titleInput.addEventListener('input', () => {
                this.validateInputs();
            });
        }

        if (contentInput) {
            contentInput.addEventListener('input', () => {
                this.validateInputs();
            });
            
            // 图片粘贴监听
            contentInput.addEventListener('paste', (event) => {
                this.handleImagePaste(event);
            });
        }
    },

    /**
     * 处理图片粘贴
     */
    handleImagePaste(event) {
        const items = event.clipboardData.items;
        
        for (let item of items) {
            if (item.type.indexOf('image') !== -1) {
                const file = item.getAsFile();
                this.addImagePreview(file);
                event.preventDefault();
                break;
            }
        }
    },

    /**
     * 添加图片预览
     */
    addImagePreview(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const imageSection = document.getElementById('image-preview-section');
            const container = document.getElementById('image-preview-container');
            
            // 显示图片预览区域
            imageSection.style.display = 'block';
            
            // 创建图片预览元素
            const preview = document.createElement('div');
            preview.className = 'image-preview';
            
            const img = document.createElement('img');
            img.src = e.target.result;
            img.alt = file.name || '粘贴的图片';
            
            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-btn';
            removeBtn.innerHTML = '×';
            removeBtn.onclick = () => {
                preview.remove();
                // 如果没有图片了，隐藏预览区域
                if (container.children.length === 0) {
                    imageSection.style.display = 'none';
                }
            };
            
            preview.appendChild(img);
            preview.appendChild(removeBtn);
            container.appendChild(preview);
            
            // 更新LocalNoteSaver的图片数组
            if (this.localNoteSaver) {
                this.localNoteSaver.addImage(e.target.result);
            }
        };
        
        reader.readAsDataURL(file);
        this.showMessage('图片已添加，将包含在保存的笔记中', 'success');
    },

    /**
     * 保存到本地文件
     */
    async saveToLocalFile() {
        if (!this.localNoteSaver) {
            this.showMessage('本地文件保存功能未初始化', 'error');
            return;
        }

        try {
            const result = await this.localNoteSaver.saveNote();
            if (result && result.success) {
                this.showMessage(`已保存到本地文件: ${result.fileName}`, 'success');
                this.clearInputs();
            }
        } catch (error) {
            this.showMessage(`本地保存失败: ${error.message}`, 'error');
        }
    },

    /**
     * 保存最后回答到本地文件
     */
    async saveLastResponseToLocalFile() {
        if (!this.lastResponse || !this.localNoteSaver) {
            this.showMessage('没有可保存的回答或本地保存功能未初始化', 'warning');
            return;
        }

        try {
            // 临时设置输入内容为AI回答
            const originalContent = this.localNoteSaver.getInputContent();
            const contentElement = document.getElementById('content-input');
            const aiResponse = this.lastResponse.ai_response?.response || this.lastResponse.content;
            
            contentElement.value = `AI回答：\n\n${aiResponse}`;
            
            const result = await this.localNoteSaver.saveNote();
            
            // 恢复原始内容
            contentElement.value = originalContent;
            
            if (result && result.success) {
                this.showMessage(`AI回答已保存到本地文件: ${result.fileName}`, 'success');
            }
        } catch (error) {
            this.showMessage(`本地保存失败: ${error.message}`, 'error');
        }
    },

    /**
     * 导出到本地文件
     */
    async exportToLocalFile() {
        if (!this.localNoteSaver) {
            this.showMessage('本地文件保存功能未初始化', 'error');
            return;
        }

        try {
            const notebookContent = this.qaSaver.getNotebookContent();
            if (!notebookContent.trim()) {
                this.showMessage('笔记本为空，无法导出', 'warning');
                return;
            }

            // 临时设置内容
            const contentElement = document.getElementById('content-input');
            const originalContent = contentElement.value;
            
            contentElement.value = `# 笔记本完整导出\n\n${notebookContent}`;
            
            const result = await this.localNoteSaver.saveNote();
            
            // 恢复原始内容
            contentElement.value = originalContent;
            
            if (result && result.success) {
                this.showMessage(`笔记本已导出到本地文件: ${result.fileName}`, 'success');
            }
        } catch (error) {
            this.showMessage(`导出失败: ${error.message}`, 'error');
        }
    },

    /**
     * 模式切换 - 统一设计版本
     */
    switchMode(mode) {
        this.currentMode = mode;
        
        // 只更新必要的差异元素
        const submitText = document.getElementById('submit-text');
        const resultSection = document.getElementById('result-section');
        const agentHeader = document.getElementById('agent-select-header');

        if (mode === 'qa') {
            // 问答模式
            submitText.textContent = '🚀 发送问题';
            
            // 显示智能体选择器
            if (agentHeader) {
                agentHeader.style.display = 'block';
            }
            
            // 显示AI回答结果（如果有）
            if (this.lastResponse) {
                resultSection.style.display = 'block';
            }
            
        } else {
            // 笔记模式  
            submitText.textContent = '💾 保存笔记';
            
            // 隐藏智能体选择器（笔记模式不需要选择智能体）
            if (agentHeader) {
                agentHeader.style.display = 'none';
            }
            
            // 隐藏AI回答结果
            resultSection.style.display = 'none';
        }

        // 更新开关状态
        const modeSwitch = document.getElementById('mode-switch');
        if (modeSwitch) {
            modeSwitch.checked = (mode === 'qa');
        }

        this.showMessage(`已切换到${mode === 'qa' ? '问答' : '笔记'}模式`, 'info');
    },

    /**
     * 处理提交（问答或笔记）
     */
    async handleSubmit() {
        if (this.isProcessing) {
            this.showMessage('请等待当前操作完成', 'warning');
            return;
        }

        if (!this.validateInputs()) {
            return;
        }

        if (this.currentMode === 'qa') {
            await this.askQuestion();
        } else {
            await this.saveNote();
        }
    },

    /**
     * 发送问题（含自动保存逻辑）
     */
    async askQuestion() {
        const questionData = this.getInputData();
        questionData.agent_id = this.getSelectedAgent();

        try {
            this.isProcessing = true;
            this.showLoading('正在向AI提问...');

            // 1. 模拟AI回答（实际部署时连接真实API）
            const response = await this.mockAIResponse(questionData);

            if (response.success && response.data) {
                // 2. 显示AI回答
                this.displayAIResponse(response.data);

                // 3. 使用智能存储器自动保存
                let autoSaveResult = null;
                try {
                    autoSaveResult = await this.qaSaver.saveContent({
                        title: `问答：${questionData.title}`,
                        content: response.data.ai_response?.response || response.data.content,
                        type: 'qa',
                        agentId: questionData.agent_id,
                        tags: [...(questionData.tags || []), 'AI问答', 'auto-saved']
                    });
                } catch (saveError) {
                    console.warn('自动保存失败:', saveError);
                    autoSaveResult = { success: false, error: saveError.message };
                }

                // 4. 更新响应数据
                response.data.autoSaved = autoSaveResult ? autoSaveResult.success : false;
                response.data.autoSaveDetails = autoSaveResult;
                response.data.userMessage = this.generateSaveMessage(autoSaveResult);

                this.lastResponse = response.data;

                // 5. 处理问答完成后的后续操作
                await this.handleQuestionComplete(response);

                return response;

            } else {
                throw new Error(response.error || '问答失败');
            }

        } catch (error) {
            console.error('问答处理失败:', error);
            this.showMessage(`问答失败: ${error.message}`, 'error');
            return {
                success: false,
                error: error.message,
                data: {
                    autoSaved: false,
                    autoSaveDetails: null
                }
            };

        } finally {
            this.isProcessing = false;
            this.hideLoading();
        }
    },

    /**
     * 模拟AI回答（演示用）
     */
    async mockAIResponse(questionData) {
        // 模拟网络延迟
        await new Promise(resolve => setTimeout(resolve, 1500));

        const responses = {
            general: `基于您的问题"${questionData.title}"，我的建议如下：\n\n这是一个很好的问题。根据我的分析，您可以从以下几个方面来考虑：\n\n1. 首先分析问题的核心要点\n2. 然后寻找相关的解决方案\n3. 最后制定具体的执行计划\n\n希望这个回答对您有帮助。如果还有其他问题，请随时提问。`,
            code: `关于您的编程问题"${questionData.title}"：\n\n这里是一个示例解决方案：\n\n\`\`\`python\n# 示例代码\ndef solve_problem():\n    # 实现逻辑\n    result = process_data()\n    return result\n\`\`\`\n\n主要要点：\n- 代码结构清晰\n- 注意错误处理\n- 性能优化考虑\n\n建议您可以进一步优化和测试这个方案。`,
            writing: `关于您的写作需求"${questionData.title}"：\n\n写作建议如下：\n\n**结构框架：**\n1. 开头：引入主题，吸引读者\n2. 主体：详细展开，逻辑清晰\n3. 结尾：总结要点，呼应开头\n\n**写作技巧：**\n- 语言简洁明了\n- 逻辑结构清晰\n- 适当使用例子说明\n\n希望这些建议能帮助您完成高质量的写作。`
        };

        return {
            success: true,
            data: {
                questionId: `q_${Date.now()}`,
                ai_response: {
                    response: responses[questionData.agent_id] || responses.general,
                    tokens_used: Math.floor(Math.random() * 1000) + 500,
                    model: questionData.agent_id === 'code' ? 'GPT-4-Code' : 'GPT-4'
                },
                agent_id: questionData.agent_id,
                timestamp: new Date().toISOString()
            }
        };
    },

    /**
     * 问答完成后的后续处理
     */
    async handleQuestionComplete(result) {
        if (result.success && result.data.autoSaved) {
            // 自动清空输入内容
            this.clearInputs();
            
            // 自动切换到笔记模式
            setTimeout(() => {
                this.switchMode('note');
            }, 1000);

            // 显示成功消息
            this.showMessage(
                result.data.userMessage || '问答已自动保存为笔记',
                'success',
                {
                    duration: 4000,
                    actions: [
                        {
                            text: '查看笔记',
                            callback: () => {
                                this.switchMode('note');
                                this.loadNotebookPreview();
                            }
                        }
                    ]
                }
            );

        } else if (result.success && !result.data.autoSaved) {
            // 问答成功但自动保存失败 - 仍然清空输入
            this.clearInputs();
            
            this.showMessage(
                'AI回答成功，但自动保存失败，请手动保存',
                'warning',
                {
                    duration: 5000,
                    actions: [
                        {
                            text: '手动保存',
                            callback: () => this.saveLastResponse()
                        }
                    ]
                }
            );
        }
    },

    /**
     * 保存笔记
     */
    async saveNote() {
        const noteData = this.getInputData();

        // 在笔记模式下，只要有标题或内容其中之一就可以保存
        if (!noteData.title.trim() && !noteData.content.trim()) {
            this.showMessage('请至少填写标题或内容', 'warning');
            return;
        }

        const storageMode = this.getStorageMode();
        
        try {
            this.isProcessing = true;
            this.showLoading('正在保存笔记...');

            let result;

            // 🔧 修复：根据存储模式和文件选择状态决定保存方式
            if (storageMode === 'file' && this.localNoteSaver && this.localNoteSaver.selectedFileHandle) {
                // 本地文件直接读写模式，且已选择文件
                console.log('🔍 [DEBUG] 使用本地文件直接保存模式');
                result = await this.localNoteSaver.saveNote();
                
                // 格式化结果以匹配其他保存方式
                if (result && result.success) {
                    result = {
                        success: true,
                        data: {
                            noteId: `local_file_${Date.now()}`,
                            savedAt: new Date().toISOString(),
                            fileName: result.fileName,
                            method: result.method
                        }
                    };
                }
            } else {
                // 使用 QANoteSaver（混合模式、服务器模式等）
                console.log('🔍 [DEBUG] 使用QANoteSaver保存模式, 存储模式:', storageMode);
                result = await this.qaSaver.saveContent({
                    title: noteData.title,
                    content: noteData.content,
                    type: 'note',
                    tags: noteData.tags || []
                });
            }

            if (result && result.success) {
                this.showMessage('笔记保存成功！', 'success');
                this.clearInputs();
            } else {
                throw new Error(result?.error || '保存失败');
            }

            return this.formatSaveResult(result);

        } catch (error) {
            console.error('保存笔记失败:', error);
            this.showMessage(`保存失败: ${error.message}`, 'error');
            return {
                success: false,
                error: error.message
            };

        } finally {
            this.isProcessing = false;
            this.hideLoading();
        }
    },

    /**
     * 显示AI回答
     */
    displayAIResponse(data) {
        const resultSection = document.getElementById('result-section');
        const resultContent = document.getElementById('result-content');
        const resultMeta = document.getElementById('result-meta');

        // 显示回答内容
        const aiResponse = data.ai_response?.response || data.content || '未能获取到回答';
        resultContent.textContent = aiResponse;

        // 显示元信息
        const metaHTML = `
            <div class="meta-item">时间: ${new Date().toLocaleString('zh-CN')}</div>
            <div class="meta-item">智能体: ${this.getAgentDisplayName(data.agent_id)}</div>
            ${data.ai_response?.tokens_used ? `<div class="meta-item">Token: ${data.ai_response.tokens_used}</div>` : ''}
            ${data.autoSaved ? '<div class="meta-item" style="color: #10b981;">✅ 已自动保存</div>' : '<div class="meta-item" style="color: #f59e0b;">⚠️ 自动保存失败</div>'}
        `;
        resultMeta.innerHTML = metaHTML;

        // 显示结果区域
        resultSection.style.display = 'block';
        resultSection.scrollIntoView({ behavior: 'smooth' });
    },

    /**
     * 获取智能体显示名称
     */
    getAgentDisplayName(agentId) {
        const names = {
            general: '🧠 通用智能体',
            code: '💻 代码助手', 
            writing: '✍️ 写作助手'
        };
        return names[agentId] || '通用';
    },

    /**
     * 获取输入数据
     */
    getInputData() {
        const title = document.getElementById('title-input').value.trim();
        const content = document.getElementById('content-input').value.trim();
        const tagsText = document.getElementById('tags-input').value.trim();
        const tags = tagsText ? tagsText.split(',').map(tag => tag.trim()).filter(tag => tag) : [];

        return { title, content, tags };
    },

    /**
     * 获取选中的AI智能体
     */
    getSelectedAgent() {
        return this.selectedAgent || document.getElementById('agent-select-header')?.value || 'general';
    },

    /**
     * 验证输入
     */
    validateInputs() {
        const { title, content } = this.getInputData();
        
        // 在笔记模式下，只要有标题或内容其中之一就有效
        const isValid = title.trim() || content.trim();

        const submitBtn = document.getElementById('submit-btn');
        if (submitBtn) {
            submitBtn.disabled = !isValid;
        }

        return isValid;
    },

    /**
     * 清空输入框
     */
    clearInputs() {
        document.getElementById('title-input').value = '';
        document.getElementById('content-input').value = '';
        document.getElementById('tags-input').value = '';
        
        // 重置AI智能体选择
        const agentSelect = document.getElementById('agent-select');
        if (agentSelect) {
            agentSelect.value = 'general';
        }

        // 清空图片预览
        const imageSection = document.getElementById('image-preview-section');
        const container = document.getElementById('image-preview-container');
        container.innerHTML = '';
        imageSection.style.display = 'none';

        // 清空LocalNoteSaver的图片
        if (this.localNoteSaver) {
            this.localNoteSaver.images = [];
        }
        
        this.validateInputs();

        return { success: true };
    },

    /**
     * 加载用户信息
     */
    loadUserInfo() {
        const userDisplay = document.getElementById('user-display');
        
        if (this.currentUser) {
            userDisplay.textContent = this.currentUser.name || this.currentUser.username;
            console.log(`👤 用户信息已加载: ${this.currentUser.name}`);
        } else {
            // 尝试从localStorage获取用户信息
            const userInfo = localStorage.getItem('user_info');
            if (userInfo) {
                try {
                    const user = JSON.parse(userInfo);
                    userDisplay.textContent = user.name || user.username;
                } catch (error) {
                    console.error('解析用户信息失败:', error);
                    userDisplay.textContent = '用户';
                }
            } else {
                userDisplay.textContent = '用户';
            }
        }
    },

    /**
     * 加载笔记本预览
     */
    async loadNotebookPreview() {
        const notebookContent = document.getElementById('notebook-content');
        const content = this.qaSaver.getNotebookContent();

        if (content.trim()) {
            notebookContent.innerHTML = `<pre style="white-space: pre-wrap; padding: 1rem; font-family: monospace; line-height: 1.6;">${content}</pre>`;
        } else {
            notebookContent.innerHTML = '<div class="empty-state"><p>📝 还没有笔记，开始记录您的想法吧！</p></div>';
        }
    },

    /**
     * 保存最后一次回答
     */
    async saveLastResponse() {
        if (!this.lastResponse) {
            this.showMessage('没有可保存的回答', 'warning');
            return;
        }

        try {
            const content = this.lastResponse.ai_response?.response || this.lastResponse.content;
            const result = await this.qaSaver.saveContent({
                title: `手动保存的问答`,
                content: content,
                type: 'qa-manual',
                tags: ['手动保存', 'AI问答']
            });

            if (result.success) {
                this.showMessage('回答已保存为笔记！', 'success');
            } else {
                throw new Error(result.error);
            }

        } catch (error) {
            this.showMessage(`保存失败: ${error.message}`, 'error');
        }
    },

    /**
     * 复制回答
     */
    copyAnswer() {
        const resultContent = document.getElementById('result-content');
        const text = resultContent.textContent;

        navigator.clipboard.writeText(text).then(() => {
            this.showMessage('回答已复制到剪贴板', 'success');
        }).catch(error => {
            this.showMessage('复制失败', 'error');
        });
    },

    /**
     * 导出笔记本
     */
    exportNotebook() {
        try {
            this.qaSaver.exportNotebook();
            this.showMessage('笔记本导出成功！', 'success');
        } catch (error) {
            this.showMessage(`导出失败: ${error.message}`, 'error');
        }
    },

    /**
     * 清空笔记本
     */
    clearNotebook() {
        if (confirm('确定要清空所有笔记吗？此操作不可恢复！')) {
            this.qaSaver.clearNotebook();
            this.loadNotebookPreview();
            this.showMessage('笔记本已清空', 'info');
        }
    },

    /**
     * 设置存储模式
     */
    setStorageMode(mode) {
        localStorage.setItem('qa-storage-mode', mode);
        
        // 重新初始化QANoteSaver
        if (this.qaSaver) {
            this.qaSaver = new QANoteSaver({
                mode: mode,
                apiUrl: '/api',
                debugMode: false,
                onSaveSuccess: this.handleSaveSuccess.bind(this),
                onSaveError: this.handleSaveError.bind(this)
            });
        }
        
        // 更新界面显示
        this.updateNetworkStatus();
        this.showMessage(`存储模式已切换为: ${this.getStorageModeName(mode)}`, 'info');
    },

    /**
     * 获取存储模式
     */
    getStorageMode() {
        return localStorage.getItem('qa-storage-mode') || 'hybrid';
    },

    /**
     * 获取存储模式显示名称
     */
    getStorageModeDisplay(mode) {
        const displays = {
            'hybrid': '混合模式',
            'server': '仅服务器',
            'local': '仅本地',
            'file': '本地文件直接读写'
        };
        return displays[mode] || mode;
    },

    /**
     * 生成保存消息
     */
    generateSaveMessage(saveResult) {
        if (!saveResult) return '问答完成，但保存失败';

        const mode = this.qaSaver.config.mode;

        if (mode === 'hybrid') {
            if (saveResult.synced) {
                return '问答已完成并同步保存到服务器和本地';
            } else {
                return '问答已完成并保存到本地，将在网络恢复时同步';
            }
        } else if (mode === 'server') {
            return saveResult.success ? '问答已完成并保存到服务器' : '问答完成，但服务器保存失败';
        } else {
            return saveResult.success ? '问答已完成并保存到本地文件' : '问答完成，但本地保存失败';
        }
    },

    /**
     * 格式化保存结果
     */
    formatSaveResult(result) {
        return {
            success: result.success || false,
            data: {
                noteId: result.id || result.server?.id || `local_${Date.now()}`,
                savedAt: new Date().toISOString(),
                storageMode: this.qaSaver.config.mode,
                storage: {
                    server: {
                        success: result.server?.success || false,
                        noteId: result.server?.id,
                        error: result.server?.error
                    },
                    local: {
                        success: result.local?.success || result.cached || false,
                        cached: result.cached || false,
                        downloaded: result.local?.downloaded || false,
                        error: result.local?.error
                    }
                },
                performance: {
                    totalTime: result.performance?.totalTime || 0,
                    mode: this.qaSaver.config.mode
                }
            },
            error: result.error
        };
    },

    /**
     * 退出登录
     */
    async logout() {
        if (confirm('确定要退出登录吗？')) {
            try {
                // 调用后端登出API
                if (this.authToken) {
                    await fetch('/api/auth/logout', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${this.authToken}`,
                            'Content-Type': 'application/json'
                        }
                    });
                }
            } catch (error) {
                console.error('登出API调用失败:', error);
            }
            
            // 清除本地认证信息
            this.clearAuthToken();
            
            // 跳转到登录页面
            window.location.href = '/auth';
        }
    },

    /**
     * 显示消息
     */
    showMessage(text, type = 'info', options = {}) {
        const messageContainer = document.getElementById('message-container');
        const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const messageDiv = document.createElement('div');
        messageDiv.className = `message-toast message-${type}`;
        messageDiv.id = messageId;

        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };

        let messageHTML = `
            <div style="display: flex; align-items: flex-start; gap: 0.75rem;">
                <span style="font-size: 1.1rem;">${icons[type]}</span>
                <div style="flex: 1;">
                    <div>${text}</div>
        `;

        if (options.actions && options.actions.length > 0) {
            messageHTML += '<div style="margin-top: 0.5rem; display: flex; gap: 0.5rem;">';
            options.actions.forEach((action, index) => {
                messageHTML += `<button onclick="QANoteBlock.handleMessageAction('${messageId}', ${index})" style="padding: 0.25rem 0.75rem; border: 1px solid currentColor; background: transparent; color: inherit; border-radius: 4px; cursor: pointer; font-size: 0.875rem;">${action.text}</button>`;
            });
            messageHTML += '</div>';
        }

        messageHTML += `
                </div>
                <button onclick="QANoteBlock.removeMessage('${messageId}')" style="background: none; border: none; color: inherit; cursor: pointer; font-size: 1.2rem; opacity: 0.7;">&times;</button>
            </div>
        `;

        messageDiv.innerHTML = messageHTML;
        messageContainer.appendChild(messageDiv);

        // 存储动作回调
        if (options.actions) {
            messageDiv._actions = options.actions;
        }

        // 显示动画
        requestAnimationFrame(() => {
            messageDiv.classList.add('show');
        });

        // 自动关闭
        const duration = options.duration || 3000;
        if (duration > 0) {
            setTimeout(() => {
                this.removeMessage(messageId);
            }, duration);
        }
    },

    /**
     * 处理消息动作
     */
    handleMessageAction(messageId, actionIndex) {
        const messageDiv = document.getElementById(messageId);
        if (messageDiv && messageDiv._actions && messageDiv._actions[actionIndex]) {
            const action = messageDiv._actions[actionIndex];
            if (action.callback) {
                action.callback();
            }
        }
        this.removeMessage(messageId);
    },

    /**
     * 移除消息
     */
    removeMessage(messageId) {
        const messageDiv = document.getElementById(messageId);
        if (messageDiv) {
            messageDiv.classList.remove('show');
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.parentNode.removeChild(messageDiv);
                }
            }, 300);
        }
    },

    /**
     * 显示加载状态
     */
    showLoading(text = '处理中...') {
        const overlay = document.getElementById('loading-overlay');
        const loadingText = document.querySelector('.loading-text');
        if (loadingText) {
            loadingText.textContent = text;
        }
        overlay.style.display = 'flex';
    },

    /**
     * 隐藏加载状态
     */
    hideLoading() {
        const overlay = document.getElementById('loading-overlay');
        overlay.style.display = 'none';
    },

    /**
     * 保存失败时的手动兜底操作
     */
    handleSaveSuccess(result) {
        console.log('保存成功:', result);
    },

    handleSaveError(error) {
        console.error('保存失败:', error);
    },

    /**
     * 初始化人员选择功能
     */
    initPeopleSelection() {
        this.selectedPeople = new Set();
        
        // 人员选择按钮事件
        const peopleMenuBtn = document.getElementById('people-menu');
        if (peopleMenuBtn) {
            peopleMenuBtn.addEventListener('click', () => this.togglePeopleSidebar());
        }
        
        // 关闭按钮事件
        const closePeopleBtn = document.getElementById('close-people-sidebar');
        if (closePeopleBtn) {
            closePeopleBtn.addEventListener('click', () => this.closePeopleSidebar());
        }
        
        // 分组选择事件
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('group-label') || e.target.closest('.group-label')) {
                const groupHeader = e.target.closest('.group-header');
                const groupItem = groupHeader.closest('.group-item');
                this.toggleGroupExpansion(groupItem);
            }
        });
        
        // 分组复选框事件
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('group-checkbox')) {
                this.handleGroupSelection(e.target);
            } else if (e.target.classList.contains('member-checkbox')) {
                this.handleMemberSelection(e.target);
            }
        });
        
        // 选择操作按钮事件
        const clearSelectionBtn = document.getElementById('clear-selection');
        if (clearSelectionBtn) {
            clearSelectionBtn.addEventListener('click', () => this.clearPeopleSelection());
        }
        
        const applySelectionBtn = document.getElementById('apply-selection');
        if (applySelectionBtn) {
            applySelectionBtn.addEventListener('click', () => this.applyPeopleSelection());
        }
    },

    /**
     * 切换人员侧边栏
     */
    togglePeopleSidebar() {
        const sidebar = document.getElementById('right-sidebar');
        const backdrop = document.getElementById('backdrop');
        
        if (sidebar && backdrop) {
            sidebar.classList.toggle('active');
            backdrop.classList.toggle('active');
            
            // 关闭左侧栏（如果开着）
            const leftSidebar = document.getElementById('left-sidebar');
            if (leftSidebar && leftSidebar.classList.contains('active')) {
                leftSidebar.classList.remove('active');
            }
        }
    },

    /**
     * 关闭人员侧边栏
     */
    closePeopleSidebar() {
        const sidebar = document.getElementById('right-sidebar');
        const backdrop = document.getElementById('backdrop');
        
        if (sidebar) sidebar.classList.remove('active');
        if (backdrop) backdrop.classList.remove('active');
    },

    /**
     * 切换分组展开/收起
     */
    toggleGroupExpansion(groupItem) {
        if (groupItem) {
            groupItem.classList.toggle('expanded');
        }
    },

    /**
     * 处理分组选择
     */
    handleGroupSelection(checkbox) {
        const groupName = checkbox.id.replace('group-', '');
        const groupData = checkbox.closest('.group-item').dataset.group || groupName;
        const memberCheckboxes = document.querySelectorAll(`.member-checkbox[data-group="${groupData}"]`);
        
        // 全选/取消全选该分组的成员
        memberCheckboxes.forEach(memberCheckbox => {
            memberCheckbox.checked = checkbox.checked;
            if (checkbox.checked) {
                this.selectedPeople.add(memberCheckbox.dataset.member);
            } else {
                this.selectedPeople.delete(memberCheckbox.dataset.member);
            }
        });
        
        this.updateSelectedPeopleDisplay();
    },

    /**
     * 处理成员选择
     */
    handleMemberSelection(checkbox) {
        const memberName = checkbox.dataset.member;
        const groupName = checkbox.dataset.group;
        
        if (checkbox.checked) {
            this.selectedPeople.add(memberName);
        } else {
            this.selectedPeople.delete(memberName);
            
            // 如果取消选择成员，同时取消分组选择
            const groupCheckbox = document.querySelector(`#group-${groupName.replace('-team', '')}`);
            if (groupCheckbox) {
                groupCheckbox.checked = false;
            }
        }
        
        // 检查是否所有成员都被选中，更新分组复选框状态
        const allMembersInGroup = document.querySelectorAll(`.member-checkbox[data-group="${groupName}"]`);
        const selectedMembersInGroup = document.querySelectorAll(`.member-checkbox[data-group="${groupName}"]:checked`);
        const groupCheckbox = document.querySelector(`#group-${groupName.replace('-team', '')}`);
        
        if (groupCheckbox) {
            groupCheckbox.checked = (allMembersInGroup.length === selectedMembersInGroup.length && allMembersInGroup.length > 0);
        }
        
        this.updateSelectedPeopleDisplay();
    },

    /**
     * 更新已选人员显示
     */
    updateSelectedPeopleDisplay() {
        const container = document.getElementById('selected-people-list');
        if (!container) return;
        
        if (this.selectedPeople.size === 0) {
            container.innerHTML = '<span class="empty-state">暂未选择人员</span>';
        } else {
            const tags = Array.from(this.selectedPeople).map(person => `
                <span class="selected-person-tag">
                    ${person}
                    <button class="remove-btn" onclick="QANoteBlock.removePerson('${person}')">&times;</button>
                </span>
            `).join('');
            container.innerHTML = tags;
        }
    },

    /**
     * 移除已选人员
     */
    removePerson(personName) {
        this.selectedPeople.delete(personName);
        
        // 取消对应的复选框选择
        const memberCheckbox = document.querySelector(`.member-checkbox[data-member="${personName}"]`);
        if (memberCheckbox) {
            memberCheckbox.checked = false;
            // 触发change事件更新分组状态
            memberCheckbox.dispatchEvent(new Event('change'));
        }
        
        this.updateSelectedPeopleDisplay();
    },

    /**
     * 清空人员选择
     */
    clearPeopleSelection() {
        this.selectedPeople.clear();
        
        // 取消所有复选框选择
        document.querySelectorAll('.group-checkbox, .member-checkbox').forEach(checkbox => {
            checkbox.checked = false;
        });
        
        this.updateSelectedPeopleDisplay();
        this.showMessage('已清空人员选择', 'info');
    },

    /**
     * 应用人员选择到输入框
     */
    applyPeopleSelection() {
        if (this.selectedPeople.size === 0) {
            this.showMessage('请先选择人员', 'warning');
            return;
        }
        
        const titleInput = document.getElementById('title-input');
        const contentInput = document.getElementById('content-input');
        
        const peopleList = Array.from(this.selectedPeople).map(name => `@${name}`).join(' ');
        const prefix = `发送给: ${peopleList}\n\n`;
        
        if (titleInput && contentInput) {
            // 在内容前添加人员信息
            const currentContent = contentInput.value;
            if (currentContent && !currentContent.startsWith('发送给:')) {
                contentInput.value = prefix + currentContent;
            } else if (!currentContent) {
                contentInput.value = prefix;
            }
            
            // 如果标题为空，自动设置为私信标题
            if (!titleInput.value.trim()) {
                titleInput.value = `私信 - ${Array.from(this.selectedPeople).join(', ')}`;
            }
        }
        
        this.closePeopleSidebar();
        this.showMessage(`已添加 ${this.selectedPeople.size} 位收件人`, 'success');
    },

    /**
     * 处理文件上传
     */
    handleFileUpload(event) {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        const file = files[0];
        const maxSize = 10 * 1024 * 1024; // 10MB

        // 检查文件大小
        if (file.size > maxSize) {
            this.showMessage('文件大小不能超过10MB', 'error');
            return;
        }

        // 检查文件类型
        const allowedTypes = ['.txt', '.md', '.pdf', '.doc', '.docx'];
        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
        
        if (!allowedTypes.includes(fileExtension)) {
            this.showMessage('仅支持 TXT、MD、PDF、DOC、DOCX 格式的文件', 'error');
            return;
        }

        // 读取文件内容
        const reader = new FileReader();
        reader.onload = (e) => {
            this.addAttachment({
                name: file.name,
                size: file.size,
                type: file.type,
                content: e.target.result
            });
        };

        // 根据文件类型选择读取方式
        if (fileExtension === '.txt' || fileExtension === '.md') {
            reader.readAsText(file);
        } else {
            reader.readAsDataURL(file);
        }

        // 清空input，允许重复选择同一文件
        event.target.value = '';
    },

    /**
     * 添加附件到问答中
     */
    addAttachment(attachment) {
        if (!this.attachments) {
            this.attachments = [];
        }

        this.attachments.push(attachment);
        
        // 更新内容输入框，添加附件信息
        const contentInput = document.getElementById('content-input');
        const currentContent = contentInput.value;
        
        let attachmentText = '';
        if (attachment.type.startsWith('text/') || attachment.name.endsWith('.md')) {
            // 文本文件直接显示内容
            attachmentText = `\n\n📎 附件《${attachment.name}》内容：\n${attachment.content}\n`;
        } else {
            // 其他文件显示文件信息
            attachmentText = `\n\n📎 附件：${attachment.name} (${this.formatFileSize(attachment.size)})\n`;
        }
        
        contentInput.value = currentContent + attachmentText;
        
        this.showMessage(`已添加附件：${attachment.name}`, 'success');
        this.validateInputs();
    },

    /**
     * 格式化文件大小
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    /**
     * 设置选中的智能体
     */
    setSelectedAgent(agentId) {
        this.selectedAgent = agentId;
        this.showMessage(`已切换到${this.getAgentDisplayName(agentId)}`, 'info');
    }
};

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', () => {
    QANoteBlock.init();
}); 