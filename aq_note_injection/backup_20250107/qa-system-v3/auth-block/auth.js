/**
 * AuthBlock 认证控制器 - v3.0完整解耦版
 * 功能：用户认证、登录状态管理、权限控制
 */

class AuthBlockController {
    constructor() {
        this.currentUser = null;
        this.isInitialized = false;
        this.loginTimeout = null;
        
        // 预设用户数据（演示用）
        this.demoUsers = [
            {
                id: 1,
                username: 'demo',
                password: 'demo123',
                name: '演示用户',
                role: 'user',
                avatar: '👤',
                email: 'demo@example.com'
            },
            {
                id: 2,
                username: 'admin',
                password: 'admin123',
                name: '系统管理员',
                role: 'admin',
                avatar: '👨‍💼',
                email: 'admin@example.com'
            },
            {
                id: 3,
                username: 'user',
                password: 'user123',
                name: '普通用户',
                role: 'user',
                avatar: '👥',
                email: 'user@example.com'
            }
        ];
        
        this.init();
    }

    async init() {
        console.log('🔐 AuthBlock 初始化中...');
        
        // 检查已保存的登录状态
        this.checkSavedLoginState();
        
        // 绑定事件监听器
        this.bindEventListeners();
        
        // 设置构建时间
        this.setBuildTime();
        
        this.isInitialized = true;
        console.log('✅ AuthBlock 初始化完成');
    }

    /**
     * 检查已保存的登录状态
     */
    checkSavedLoginState() {
        const savedUser = Utils.storage.local.get('auth_user');
        const rememberMe = Utils.storage.local.get('auth_remember');
        
        if (savedUser && rememberMe) {
            this.currentUser = savedUser;
            console.log('🔑 发现已保存的登录状态:', savedUser.name);
        }
    }

    /**
     * 绑定事件监听器
     */
    bindEventListeners() {
        // 登录表单提交
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });
        }

        // 演示模式登录
        const demoLoginBtn = document.getElementById('demo-login-btn');
        if (demoLoginBtn) {
            demoLoginBtn.addEventListener('click', () => {
                this.handleDemoLogin();
            });
        }

        // 回车键登录
        const inputs = document.querySelectorAll('.form-input');
        inputs.forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleLogin();
                }
            });
        });

        // 输入框焦点事件
        inputs.forEach(input => {
            input.addEventListener('focus', () => {
                this.clearInputErrors(input);
            });
        });
    }

    /**
     * 设置构建时间
     */
    setBuildTime() {
        const buildDateElement = document.getElementById('build-date');
        if (buildDateElement) {
            const buildTime = Utils.date.format(new Date(), 'YYYY-MM-DD HH:mm');
            buildDateElement.textContent = `构建时间：${buildTime}`;
        }
    }

    /**
     * 处理登录
     */
    async handleLogin() {
        const username = document.getElementById('username')?.value?.trim();
        const password = document.getElementById('password')?.value;
        const rememberMe = document.getElementById('remember-me')?.checked;

        // 验证输入
        const validation = this.validateLoginInput(username, password);
        if (!validation.valid) {
            this.showValidationErrors(validation.errors);
            return;
        }

        // 显示登录中状态
        this.setLoginLoading(true);

        try {
            // 模拟网络延迟
            await this.delay(1500);

            // 验证用户凭据
            const user = this.authenticateUser(username, password);
            
            if (user) {
                await this.completeLogin(user, rememberMe);
            } else {
                throw new Error('用户名或密码错误');
            }

        } catch (error) {
            console.error('登录失败:', error);
            this.showLoginError(error.message);
        } finally {
            this.setLoginLoading(false);
        }
    }

    /**
     * 处理演示模式登录
     */
    async handleDemoLogin() {
        this.setDemoLoading(true);

        try {
            await this.delay(800);
            
            const demoUser = this.demoUsers[0]; // 使用第一个演示用户
            await this.completeLogin(demoUser, false);

        } catch (error) {
            console.error('演示登录失败:', error);
            this.showLoginError('演示登录失败，请重试');
        } finally {
            this.setDemoLoading(false);
        }
    }

    /**
     * 验证登录输入
     */
    validateLoginInput(username, password) {
        const errors = {};

        if (!Utils.validate.required(username)) {
            errors.username = '请输入用户名';
        } else if (!Utils.validate.length(username, 2, 20)) {
            errors.username = '用户名长度应为2-20个字符';
        }

        if (!Utils.validate.required(password)) {
            errors.password = '请输入密码';
        } else if (!Utils.validate.length(password, 6, 50)) {
            errors.password = '密码长度应为6-50个字符';
        }

        return {
            valid: Object.keys(errors).length === 0,
            errors
        };
    }

    /**
     * 显示验证错误
     */
    showValidationErrors(errors) {
        Object.entries(errors).forEach(([field, message]) => {
            const input = document.getElementById(field);
            if (input) {
                input.classList.add('error');
                
                // 显示错误消息
                if (window.UIBlock) {
                    window.UIBlock.showMessage(message, 'error', { duration: 3000 });
                }
            }
        });
    }

    /**
     * 清除输入框错误状态
     */
    clearInputErrors(input) {
        input.classList.remove('error');
        input.classList.remove('success');
    }

    /**
     * 认证用户
     */
    authenticateUser(username, password) {
        return this.demoUsers.find(user => 
            user.username === username && user.password === password
        );
    }

    /**
     * 完成登录流程
     */
    async completeLogin(user, rememberMe) {
        // 设置当前用户
        this.currentUser = {
            ...user,
            loginTime: new Date().toISOString(),
            sessionId: Utils.string.generateId('session', 16)
        };

        // 保存登录状态
        if (rememberMe) {
            Utils.storage.local.set('auth_user', this.currentUser);
            Utils.storage.local.set('auth_remember', true);
        } else {
            Utils.storage.session.set('auth_user', this.currentUser);
        }

        // 显示成功消息
        if (window.UIBlock) {
            window.UIBlock.showMessage(
                `欢迎回来，${user.name}！`, 
                'success', 
                { duration: 2000 }
            );
        }

        // 触发登录成功事件
        this.triggerEvent('auth:login:success', {
            user: this.currentUser,
            rememberMe: rememberMe
        });
        
        // 延迟跳转，让用户看到成功消息
        setTimeout(() => {
            this.redirectAfterLogin();
        }, 1500);
    }

    /**
     * 登录后重定向
     */
    redirectAfterLogin() {
        if (window.UIBlock && window.UIBlock.switchToBlock) {
            // 根据用户角色决定默认页面
            const defaultBlock = this.currentUser.role === 'admin' ? 'qa-note' : 'qa-note';
            window.UIBlock.switchToBlock(defaultBlock, { mode: 'qa' });
        }
    }

    /**
     * 显示登录错误
     */
    showLoginError(message) {
        if (window.UIBlock) {
            window.UIBlock.showMessage(message, 'error', {
                duration: 4000,
                actions: [
                    {
                        text: '重试',
                        callback: () => {
                            document.getElementById('password').value = '';
                            document.getElementById('username').focus();
                        }
                    }
                ]
            });
        }
    }

    /**
     * 设置登录按钮加载状态
     */
    setLoginLoading(loading) {
        const loginBtn = document.getElementById('login-btn');
        const btnText = loginBtn?.querySelector('.btn-text');
        const btnLoading = loginBtn?.querySelector('.btn-loading');

        if (loginBtn && btnText && btnLoading) {
            if (loading) {
                loginBtn.classList.add('loading');
                loginBtn.disabled = true;
                btnText.style.display = 'none';
                btnLoading.style.display = 'flex';
            } else {
                loginBtn.classList.remove('loading');
                loginBtn.disabled = false;
                btnText.style.display = 'block';
                btnLoading.style.display = 'none';
            }
        }
    }

    /**
     * 设置演示登录按钮加载状态
     */
    setDemoLoading(loading) {
        const demoBtn = document.getElementById('demo-login-btn');
        const btnText = demoBtn?.querySelector('.btn-text');

        if (demoBtn && btnText) {
            if (loading) {
                demoBtn.disabled = true;
                btnText.textContent = '登录中...';
                demoBtn.style.opacity = '0.7';
            } else {
                demoBtn.disabled = false;
                btnText.textContent = '演示模式登录';
                demoBtn.style.opacity = '1';
            }
        }
    }

    /**
     * 退出登录
     */
    logout() {
        try {
            const wasLoggedIn = this.isLoggedIn();
            
            if (wasLoggedIn) {
                // 清除用户数据
                this.currentUser = null;
                Utils.storage.local.remove('auth_user');
                Utils.storage.local.remove('auth_remember');
                Utils.storage.session.remove('auth_user');

                // 触发退出事件
                this.triggerEvent('auth:logout:success');

                console.log('👋 用户已退出登录');
                
                return {
                    success: true,
                    message: '已成功退出登录'
                };
            }

            return {
                success: false,
                message: '用户未登录'
            };
            
        } catch (error) {
            console.error('退出登录失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 检查是否已登录
     */
    isLoggedIn() {
        return this.currentUser !== null;
    }

    /**
     * 获取当前用户
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * 检查用户权限
     */
    hasPermission(permission) {
        if (!this.isLoggedIn()) {
            return false;
        }
        
        const user = this.getCurrentUser();
        
        switch (permission) {
            case 'admin':
                return user.role === 'admin';
            case 'user':
                return user.role === 'user' || user.role === 'admin';
            case 'read':
                return true; // 所有登录用户都有读权限
            case 'write':
                return user.role === 'user' || user.role === 'admin';
            case 'delete':
                return user.role === 'admin';
            default:
            return false;
        }
    }

    /**
     * 获取用户信息
     */
    getUserInfo() {
        if (!this.isLoggedIn()) {
            return null;
        }

        const user = this.getCurrentUser();
        return {
            id: user.id,
            username: user.username,
            name: user.name,
            role: user.role,
            avatar: user.avatar,
            email: user.email,
            loginTime: user.loginTime,
            sessionId: user.sessionId
        };
    }

    /**
     * 刷新登录状态
     */
    refreshSession() {
        if (!this.isLoggedIn()) {
            return false;
        }
        
        // 更新会话时间
        this.currentUser.lastActivity = new Date().toISOString();
        
        // 重新保存到存储
        const rememberMe = Utils.storage.local.get('auth_remember');
        if (rememberMe) {
            Utils.storage.local.set('auth_user', this.currentUser);
        } else {
            Utils.storage.session.set('auth_user', this.currentUser);
        }

        return true;
    }

    /**
     * 触发自定义事件
     */
    triggerEvent(eventName, data = {}) {
        const event = new CustomEvent(eventName, {
            detail: {
                timestamp: new Date().toISOString(),
                source: 'AuthBlock',
                ...data
            }
        });
        
        window.dispatchEvent(event);
    }

    /**
     * 延迟函数
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 销毁控制器
     */
    destroy() {
        if (this.loginTimeout) {
            clearTimeout(this.loginTimeout);
        }
        
        this.currentUser = null;
        this.isInitialized = false;
        
        console.log('🧹 AuthBlock 已销毁');
    }
}

// 创建全局AuthBlock接口
window.AuthBlock = {
    controller: null,
    
    // 初始化
    initialize: async () => {
        if (!window.AuthBlock.controller) {
            window.AuthBlock.controller = new AuthBlockController();
            return true;
        }
        return false;
    },
    
    // 登录
    login: (username, password, rememberMe = false) => {
        return window.AuthBlock.controller?.handleLogin(username, password, rememberMe) || 
               Promise.reject(new Error('AuthBlock not initialized'));
    },
    
    // 退出登录
    logout: () => {
        return window.AuthBlock.controller?.logout() || 
               { success: false, error: 'AuthBlock not initialized' };
    },
    
    // 检查登录状态
    isLoggedIn: () => {
        return window.AuthBlock.controller?.isLoggedIn() || false;
    },
    
    // 获取当前用户
    getCurrentUser: () => {
        return window.AuthBlock.controller?.getCurrentUser() || null;
    },
    
    // 检查权限
    hasPermission: (permission) => {
        return window.AuthBlock.controller?.hasPermission(permission) || false;
    },
    
    // 获取用户信息
    getUserInfo: () => {
        return window.AuthBlock.controller?.getUserInfo() || null;
    },
    
    // 刷新会话
    refreshSession: () => {
        return window.AuthBlock.controller?.refreshSession() || false;
    }
};

// 自动初始化
document.addEventListener('DOMContentLoaded', () => {
    window.AuthBlock.initialize();
});

console.log('�� AuthBlock 模块已加载'); 