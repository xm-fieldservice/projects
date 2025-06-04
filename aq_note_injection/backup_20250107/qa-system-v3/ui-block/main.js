/**
 * UIBlock 核心控制器 - v3.0完整解耦版
 * 功能：界面协调、消息系统、块切换、网络监控
 */

class UIBlockController {
    constructor() {
        this.currentBlock = null;
        this.messageQueue = [];
        this.messageIdCounter = 1;
        this.networkStatus = {
            online: navigator.onLine,
            lastCheck: Date.now(),
            checkInterval: null
        };
        
        this.init();
    }

    async init() {
        console.log('🎨 UIBlock 初始化中...');
        
        // 初始化网络监控
        this.initNetworkMonitoring();
        
        // 绑定事件监听器
        this.bindEventListeners();
        
        // 创建消息容器
        this.createMessageContainer();
        
        // 初始化键盘快捷键
        this.initKeyboardShortcuts();
        
        // 自动加载默认块
        await this.loadDefaultBlock();
        
        console.log('✅ UIBlock 初始化完成');
    }

    /**
     * 初始化网络监控
     */
    initNetworkMonitoring() {
        const updateNetworkStatus = (online) => {
            this.networkStatus.online = online;
            this.networkStatus.lastCheck = Date.now();
            this.updateNetworkDisplay();
            
            // 网络状态变化时触发事件
            if (online) {
                this.showMessage('网络连接已恢复', 'success', { duration: 2000 });
                this.triggerEvent('network:online');
            } else {
                this.showMessage('网络连接已断开，将自动切换到离线模式', 'warning', { duration: 5000 });
                this.triggerEvent('network:offline');
            }
        };

        // 监听网络状态变化
        window.addEventListener('online', () => updateNetworkStatus(true));
        window.addEventListener('offline', () => updateNetworkStatus(false));
        
        // 定期检查网络状态
        this.networkStatus.checkInterval = setInterval(() => {
            this.updateNetworkDisplay();
        }, 30000); // 30秒检查一次
        
        // 初始显示
        this.updateNetworkDisplay();
    }

    /**
     * 更新网络状态显示
     */
    updateNetworkDisplay() {
        const networkIcon = document.getElementById('network-icon');
        const networkText = document.getElementById('network-text');
        const statusIndicator = document.getElementById('status-indicator');
        const footerConnectionStatus = document.getElementById('footer-connection-status');

        if (!networkIcon || !networkText || !statusIndicator) return;

        const isOnline = this.networkStatus.online;
        
        if (isOnline) {
            networkIcon.textContent = '🌐';
            networkText.textContent = '在线';
            statusIndicator.className = 'status-indicator';
            footerConnectionStatus.textContent = '🌐 在线';
        } else {
            networkIcon.textContent = '❌';
            networkText.textContent = '离线';
            statusIndicator.className = 'status-indicator offline';
            footerConnectionStatus.textContent = '❌ 离线';
        }
    }

    /**
     * 绑定事件监听器
     */
    bindEventListeners() {
        // 汉堡菜单
        const hamburgerMenu = document.getElementById('hamburger-menu');
        if (hamburgerMenu) {
            hamburgerMenu.addEventListener('click', () => this.toggleSidebar());
        }

        // 关闭侧边栏
        const closeSidebar = document.getElementById('close-sidebar');
        if (closeSidebar) {
            closeSidebar.addEventListener('click', () => this.closeSidebar());
        }

        // 侧边栏菜单项
        const menuLinks = document.querySelectorAll('.menu-link');
        menuLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const blockName = link.dataset.block;
                const mode = link.dataset.mode;
                this.switchToBlock(blockName, { mode });
            });
        });

        // 全局搜索
        const searchToggleBtn = document.getElementById('search-toggle-btn');
        if (searchToggleBtn) {
            searchToggleBtn.addEventListener('click', () => this.toggleGlobalSearch());
        }

        const closeSearch = document.getElementById('close-search');
        if (closeSearch) {
            closeSearch.addEventListener('click', () => this.closeGlobalSearch());
        }

        // 用户菜单
        const userMenuBtn = document.getElementById('user-menu-btn');
        if (userMenuBtn) {
            userMenuBtn.addEventListener('click', () => this.toggleUserMenu());
        }

        // 用户菜单项
        const dropdownItems = document.querySelectorAll('.dropdown-item');
        dropdownItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const action = item.dataset.action;
                this.handleUserAction(action);
            });
        });

        // 设置按钮
        const settingsBtn = document.getElementById('settings-menu-btn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => this.showSettings());
        }

        // 通知按钮
        const notificationsBtn = document.getElementById('notifications-btn');
        if (notificationsBtn) {
            notificationsBtn.addEventListener('click', () => this.showNotifications());
        }

        // 背景遮罩点击
        const backdrop = document.getElementById('backdrop');
        if (backdrop) {
            backdrop.addEventListener('click', () => this.closeAllOverlays());
        }

        // 搜索覆盖层点击
        const searchOverlay = document.getElementById('search-overlay');
        if (searchOverlay) {
            searchOverlay.addEventListener('click', (e) => {
                if (e.target === searchOverlay) {
                    this.closeGlobalSearch();
                }
            });
        }
    }

    /**
     * 初始化键盘快捷键
     */
    initKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + K: 全局搜索
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                this.toggleGlobalSearch();
            }
            
            // ESC: 关闭所有覆盖层
            if (e.key === 'Escape') {
                this.closeAllOverlays();
            }
            
            // Ctrl/Cmd + B: 切换侧边栏
            if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
                e.preventDefault();
                this.toggleSidebar();
            }
        });
    }

    /**
     * 创建消息容器
     */
    createMessageContainer() {
        if (!document.getElementById('message-container')) {
            const container = document.createElement('div');
            container.id = 'message-container';
            container.className = 'message-container';
            document.body.appendChild(container);
        }
    }

    /**
     * 加载默认块
     */
    async loadDefaultBlock() {
        // 检查用户登录状态
        if (window.AuthBlock && !window.AuthBlock.isLoggedIn()) {
            await this.switchToBlock('auth');
        } else {
            await this.switchToBlock('qa-note', { mode: 'qa' });
        }
    }

    /**
     * 切换到指定功能块
     */
    async switchToBlock(blockName, options = {}) {
        console.log(`🔄 切换到块: ${blockName}`, options);
        
        try {
            const blockContainer = document.getElementById('block-container');
            if (!blockContainer) {
                throw new Error('块容器未找到');
            }

            // 显示加载状态
            this.showLoadingState(blockContainer);
            
            // 验证块名称
            const validBlocks = ['auth', 'qa-note', 'admin', 'history', 'export', 'settings'];
            if (!validBlocks.includes(blockName)) {
                throw new Error(`无效的块名称: ${blockName}`);
            }

            // 加载块内容
            await this.loadBlockContent(blockName, options);
            
            // 更新当前块状态
            this.currentBlock = blockName;
            this.updateCurrentBlockIndicator(blockName, options.mode);
            
            // 更新菜单状态
            this.updateMenuActiveState(blockName, options.mode);
            
            // 关闭侧边栏（移动端）
            if (window.innerWidth <= 768) {
                this.closeSidebar();
            }
            
            // 触发块切换事件
            this.triggerEvent('block:switched', { blockName, options });
            
            return {
                success: true,
                data: {
                    fromBlock: this.currentBlock,
                    toBlock: blockName,
                    switchTime: new Date().toISOString(),
                    animationDuration: 300
                }
            };
            
        } catch (error) {
            console.error('块切换失败:', error);
            this.showMessage(`切换失败: ${error.message}`, 'error');
            
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 加载块内容
     */
    async loadBlockContent(blockName, options = {}) {
        const blockContainer = document.getElementById('block-container');
        
        switch (blockName) {
            case 'auth':
                await this.loadAuthBlock(blockContainer);
                break;
                
            case 'qa-note':
                await this.loadQANoteBlock(blockContainer, options);
                break;
                
            case 'admin':
                await this.loadAdminBlock(blockContainer);
                break;
                
            case 'history':
                await this.loadHistoryView(blockContainer);
                break;
                
            case 'export':
                await this.loadExportView(blockContainer);
                break;
                
            case 'settings':
                await this.loadSettingsView(blockContainer);
                break;
                
            default:
                throw new Error(`未实现的块: ${blockName}`);
        }
    }

    /**
     * 加载认证块
     */
    async loadAuthBlock(container) {
        try {
            const response = await fetch('../auth-block/auth.html');
            const html = await response.text();
            container.innerHTML = html;
            
            // 加载认证块的样式和脚本
            await this.loadExternalResources([
                '../auth-block/auth.css',
                '../auth-block/auth.js'
            ]);
            
        } catch (error) {
            throw new Error(`加载认证块失败: ${error.message}`);
        }
    }

    /**
     * 加载问答笔记块
     */
    async loadQANoteBlock(container, options = {}) {
        try {
            // 加载现有的qa-note-block内容
            const response = await fetch('../../qa-note-block/qa-note.html');
            const html = await response.text();
            container.innerHTML = html;
            
            // 加载样式和脚本
            await this.loadExternalResources([
                '../../qa-note-block/qa-note.css',
                '../../qa-note-block/qa-note.js',
                '../../qa-note-block/qa-note-saver.js'
            ]);
            
            // 初始化QANoteBlock（如果存在）
            if (window.QANoteBlock && window.QANoteBlock.showQANoteUI) {
                window.QANoteBlock.showQANoteUI(options.mode || 'qa');
            }
            
        } catch (error) {
            throw new Error(`加载问答笔记块失败: ${error.message}`);
        }
    }

    /**
     * 加载管理块
     */
    async loadAdminBlock(container) {
        // 检查管理员权限
        if (window.AuthBlock && window.AuthBlock.getCurrentUser()?.role !== 'admin') {
            throw new Error('权限不足，仅管理员可访问');
        }
        
        try {
            const response = await fetch('../deploy-block/admin.html');
            const html = await response.text();
            container.innerHTML = html;
            
            await this.loadExternalResources([
                '../deploy-block/admin.css',
                '../deploy-block/admin.js',
                '../deploy-block/deploy.js'
            ]);
            
        } catch (error) {
            throw new Error(`加载管理块失败: ${error.message}`);
        }
    }

    /**
     * 加载历史记录视图
     */
    async loadHistoryView(container) {
        container.innerHTML = `
            <div class="history-view">
                <div class="view-header">
                    <h1>📜 历史记录</h1>
                    <p>查看您的问答和笔记历史</p>
                </div>
                <div class="coming-soon">
                    <span class="icon">🚧</span>
                    <h3>功能开发中</h3>
                    <p>历史记录功能即将上线，敬请期待！</p>
                </div>
            </div>
        `;
    }

    /**
     * 加载导出视图
     */
    async loadExportView(container) {
        container.innerHTML = `
            <div class="export-view">
                <div class="view-header">
                    <h1>📤 数据导出</h1>
                    <p>导出您的问答记录和笔记数据</p>
                </div>
                <div class="coming-soon">
                    <span class="icon">🚧</span>
                    <h3>功能开发中</h3>
                    <p>数据导出功能即将上线，敬请期待！</p>
                </div>
            </div>
        `;
    }

    /**
     * 加载设置视图
     */
    async loadSettingsView(container) {
        container.innerHTML = `
            <div class="settings-view">
                <div class="view-header">
                    <h1>⚙️ 系统设置</h1>
                    <p>配置您的系统偏好设置</p>
                </div>
                <div class="coming-soon">
                    <span class="icon">🚧</span>
                    <h3>功能开发中</h3>
                    <p>系统设置功能即将上线，敬请期待！</p>
                </div>
            </div>
        `;
    }

    /**
     * 加载外部资源
     */
    async loadExternalResources(resources) {
        const promises = resources.map(resource => {
            if (resource.endsWith('.css')) {
                return this.loadCSS(resource);
            } else if (resource.endsWith('.js')) {
                return this.loadJS(resource);
            }
        });
        
        await Promise.all(promises);
    }

    /**
     * 加载CSS文件
     */
    loadCSS(href) {
        return new Promise((resolve, reject) => {
            // 检查是否已加载
            if (document.querySelector(`link[href="${href}"]`)) {
                resolve();
                return;
            }
            
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = href;
            link.onload = resolve;
            link.onerror = reject;
            document.head.appendChild(link);
        });
    }

    /**
     * 加载JS文件
     */
    loadJS(src) {
        return new Promise((resolve, reject) => {
            // 检查是否已加载
            if (document.querySelector(`script[src="${src}"]`)) {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.body.appendChild(script);
        });
    }

    /**
     * 显示加载状态
     */
    showLoadingState(container) {
        container.innerHTML = `
            <div class="loading-placeholder">
                <div class="loading-spinner-container">
                    <div class="loading-spinner"></div>
                    <div class="loading-text">正在加载...</div>
                </div>
            </div>
        `;
    }

    /**
     * 显示消息
     */
    showMessage(text, type = 'info', options = {}) {
        const messageOptions = {
            duration: 3000,
            closable: true,
            position: 'top-right',
            icon: true,
            actions: [],
            id: `msg_${this.messageIdCounter++}_${Math.random().toString(36).substr(2, 9)}`,
            ...options
        };

        const validTypes = ['success', 'error', 'warning', 'info'];
        if (!validTypes.includes(type)) {
            console.warn(`无效的消息类型: ${type}，使用默认类型 info`);
            type = 'info';
        }

        try {
            let messageContainer = document.getElementById('message-container');
            if (!messageContainer) {
                this.createMessageContainer();
                messageContainer = document.getElementById('message-container');
            }

            const messageDiv = document.createElement('div');
            messageDiv.className = `message-toast message-${type} position-${messageOptions.position}`;
            messageDiv.id = messageOptions.id;
            messageDiv.setAttribute('data-type', type);

            let messageHTML = '';

            if (messageOptions.icon) {
                const icons = {
                    success: '✅',
                    error: '❌',
                    warning: '⚠️',
                    info: 'ℹ️'
                };
                messageHTML += `<span class="message-icon">${icons[type]}</span>`;
            }

            messageHTML += `<div class="message-content">`;
            messageHTML += `<span class="message-text">${text}</span>`;

            if (messageOptions.actions && messageOptions.actions.length > 0) {
                messageHTML += '<div class="message-actions">';
                messageOptions.actions.forEach((action, index) => {
                    messageHTML += `<button class="message-action-btn" data-action-index="${index}">${action.text}</button>`;
                });
                messageHTML += '</div>';
            }

            messageHTML += '</div>';

            if (messageOptions.closable) {
                messageHTML += '<button class="message-close" aria-label="关闭">&times;</button>';
            }

            // 添加进度条
            if (messageOptions.duration > 0) {
                messageHTML += `<div class="message-progress"><div class="message-progress-bar" style="animation-duration: ${messageOptions.duration}ms;"></div></div>`;
            }

            messageDiv.innerHTML = messageHTML;

            messageContainer.appendChild(messageDiv);

            this.bindMessageEvents(messageDiv, messageOptions);

            // 显示动画
            requestAnimationFrame(() => {
                messageDiv.classList.add('message-show');
            });

            // 自动关闭
            if (messageOptions.duration > 0) {
                setTimeout(() => {
                    this.removeMessage(messageOptions.id);
                }, messageOptions.duration);
            }

            // 添加到消息队列
            this.messageQueue.push({
                id: messageOptions.id,
                text,
                type,
                timestamp: new Date().toISOString(),
                options: messageOptions
            });

            // 限制队列长度
            if (this.messageQueue.length > 50) {
                this.messageQueue = this.messageQueue.slice(-50);
            }

            return {
                success: true,
                data: {
                    messageId: messageOptions.id,
                    displayedAt: new Date().toISOString(),
                    willCloseAt: messageOptions.duration > 0 ? 
                        new Date(Date.now() + messageOptions.duration).toISOString() : null,
                    type: type,
                    text: text
                }
            };

        } catch (error) {
            console.error('显示消息失败:', error);
            return {
                success: false,
                error: `显示消息失败: ${error.message}`
            };
        }
    }

    /**
     * 绑定消息事件
     */
    bindMessageEvents(messageDiv, options) {
        // 关闭按钮
        const closeBtn = messageDiv.querySelector('.message-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.removeMessage(options.id);
            });
        }

        // 操作按钮
        const actionBtns = messageDiv.querySelectorAll('.message-action-btn');
        actionBtns.forEach((btn, index) => {
            btn.addEventListener('click', () => {
                const action = options.actions[index];
                if (action && typeof action.callback === 'function') {
                    action.callback();
                }
                this.removeMessage(options.id);
            });
        });
    }

    /**
     * 移除消息
     */
    removeMessage(messageId) {
        const messageDiv = document.getElementById(messageId);
        if (messageDiv) {
            messageDiv.classList.remove('message-show');
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.parentNode.removeChild(messageDiv);
                }
            }, 300);
        }

        return {
            success: true,
            data: {
                messageId,
                removedAt: new Date().toISOString()
            }
        };
    }

    /**
     * 清除所有消息
     */
    clearAllMessages() {
        const messageContainer = document.getElementById('message-container');
        if (messageContainer) {
            messageContainer.innerHTML = '';
        }
        this.messageQueue = [];

        return {
            success: true,
            data: {
                clearedAt: new Date().toISOString(),
                clearedCount: this.messageQueue.length
            }
        };
    }

    /**
     * 获取消息历史
     */
    getMessageHistory() {
        return {
            success: true,
            data: {
                messages: this.messageQueue,
                totalCount: this.messageQueue.length,
                retrievedAt: new Date().toISOString()
            }
        };
    }

    /**
     * 切换侧边栏
     */
    toggleSidebar() {
        const sidebar = document.getElementById('left-sidebar');
        const hamburger = document.getElementById('hamburger-menu');
        const backdrop = document.getElementById('backdrop');

        if (sidebar && hamburger && backdrop) {
            const isOpen = sidebar.classList.contains('open');
            
            if (isOpen) {
                this.closeSidebar();
            } else {
                sidebar.classList.add('open');
                hamburger.classList.add('active');
                backdrop.classList.add('show');
            }
        }
    }

    /**
     * 关闭侧边栏
     */
    closeSidebar() {
        const sidebar = document.getElementById('left-sidebar');
        const hamburger = document.getElementById('hamburger-menu');
        const backdrop = document.getElementById('backdrop');

        if (sidebar && hamburger && backdrop) {
            sidebar.classList.remove('open');
            hamburger.classList.remove('active');
            backdrop.classList.remove('show');
        }
    }

    /**
     * 切换全局搜索
     */
    toggleGlobalSearch() {
        const searchOverlay = document.getElementById('search-overlay');
        const searchInput = document.getElementById('global-search-input');

        if (searchOverlay && searchInput) {
            const isOpen = searchOverlay.classList.contains('open');
            
            if (isOpen) {
                this.closeGlobalSearch();
            } else {
                searchOverlay.classList.add('open');
                setTimeout(() => searchInput.focus(), 100);
            }
        }
    }

    /**
     * 关闭全局搜索
     */
    closeGlobalSearch() {
        const searchOverlay = document.getElementById('search-overlay');
        if (searchOverlay) {
            searchOverlay.classList.remove('open');
        }
    }

    /**
     * 切换用户菜单
     */
    toggleUserMenu() {
        const userMenu = document.querySelector('.user-menu');
        if (userMenu) {
            userMenu.classList.toggle('open');
        }
    }

    /**
     * 处理用户操作
     */
    handleUserAction(action) {
        const userMenu = document.querySelector('.user-menu');
        if (userMenu) {
            userMenu.classList.remove('open');
        }

        switch (action) {
            case 'profile':
                this.showMessage('个人资料功能开发中', 'info');
                break;
            case 'preferences':
                this.showMessage('偏好设置功能开发中', 'info');
                break;
            case 'help':
                this.showMessage('帮助中心功能开发中', 'info');
                break;
            case 'logout':
                this.handleLogout();
                break;
            default:
                console.warn('未知的用户操作:', action);
        }
    }

    /**
     * 处理退出登录
     */
    handleLogout() {
        if (window.AuthBlock && window.AuthBlock.logout) {
            const result = window.AuthBlock.logout();
            if (result.success) {
                this.showMessage('已成功退出登录', 'success');
                this.switchToBlock('auth');
            } else {
                this.showMessage('退出登录失败', 'error');
            }
        } else {
            this.showMessage('退出登录功能未可用', 'warning');
        }
    }

    /**
     * 显示设置
     */
    showSettings() {
        this.switchToBlock('settings');
    }

    /**
     * 显示通知
     */
    showNotifications() {
        this.showMessage('通知中心功能开发中', 'info');
    }

    /**
     * 关闭所有覆盖层
     */
    closeAllOverlays() {
        this.closeSidebar();
        this.closeGlobalSearch();
        
        const userMenu = document.querySelector('.user-menu');
        if (userMenu) {
            userMenu.classList.remove('open');
        }
    }

    /**
     * 更新当前块指示器
     */
    updateCurrentBlockIndicator(blockName, mode) {
        const indicator = document.getElementById('current-block-indicator');
        if (indicator) {
            const blockNames = {
                'auth': '🔐 登录',
                'qa-note': mode === 'note' ? '📝 笔记模式' : '🤖 问答模式',
                'admin': '⚙️ 管理',
                'history': '📜 历史记录',
                'export': '📤 数据导出',
                'settings': '⚙️ 设置'
            };
            
            indicator.textContent = blockNames[blockName] || blockName;
        }
    }

    /**
     * 更新菜单激活状态
     */
    updateMenuActiveState(blockName, mode) {
        const menuItems = document.querySelectorAll('.menu-item');
        menuItems.forEach(item => {
            const link = item.querySelector('.menu-link');
            if (link) {
                const linkBlock = link.dataset.block;
                const linkMode = link.dataset.mode;
                
                if (linkBlock === blockName && (mode === linkMode || !linkMode)) {
                    item.classList.add('active');
                } else {
                    item.classList.remove('active');
                }
            }
        });
    }

    /**
     * 触发自定义事件
     */
    triggerEvent(eventName, data = {}) {
        const event = new CustomEvent(eventName, {
            detail: {
                timestamp: new Date().toISOString(),
                source: 'UIBlock',
                ...data
            }
        });
        
        window.dispatchEvent(event);
    }

    /**
     * 获取当前块
     */
    getCurrentBlock() {
        return this.currentBlock;
    }

    /**
     * 销毁控制器
     */
    destroy() {
        // 清理定时器
        if (this.networkStatus.checkInterval) {
            clearInterval(this.networkStatus.checkInterval);
        }
        
        // 清理消息
        this.clearAllMessages();
        
        console.log('🧹 UIBlock 已销毁');
    }
}

// 创建全局UIBlock接口
window.UIBlock = {
    controller: null,
    
    // 初始化
    initialize: async (options = {}) => {
        if (!window.UIBlock.controller) {
            window.UIBlock.controller = new UIBlockController();
            return { success: true, data: { initializedAt: new Date().toISOString() } };
        }
        return { success: false, error: 'UIBlock already initialized' };
    },
    
    // 切换功能块
    switchToBlock: (blockName, options = {}) => {
        return window.UIBlock.controller?.switchToBlock(blockName, options) || 
               { success: false, error: 'UIBlock not initialized' };
    },
    
    // 显示消息
    showMessage: (text, type = 'info', options = {}) => {
        return window.UIBlock.controller?.showMessage(text, type, options) || 
               { success: false, error: 'UIBlock not initialized' };
    },
    
    // 移除消息
    removeMessage: (messageId) => {
        return window.UIBlock.controller?.removeMessage(messageId) || 
               { success: false, error: 'UIBlock not initialized' };
    },
    
    // 清除所有消息
    clearAllMessages: () => {
        return window.UIBlock.controller?.clearAllMessages() || 
               { success: false, error: 'UIBlock not initialized' };
    },
    
    // 获取消息历史
    getMessageHistory: () => {
        return window.UIBlock.controller?.getMessageHistory() || 
               { success: false, error: 'UIBlock not initialized' };
    },
    
    // 获取当前块
    getCurrentBlock: () => {
        return window.UIBlock.controller?.getCurrentBlock() || null;
    }
};

// 自动初始化
document.addEventListener('DOMContentLoaded', () => {
    window.UIBlock.initialize();
});

console.log('�� UIBlock 模块已加载'); 