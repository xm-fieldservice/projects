/**
 * AuthBlock 用户认证工具包 v1.0.0
 *
 * 功能特性：
 * - 🔐 用户登录认证
 * - 👤 用户状态管理
 * - 🔑 权限控制系统
 * - 💾 会话持久化
 * - 🎯 事件通知机制
 * - ⚙️ 高度可配置
 *
 * @example
 * // 基础使用
 * import AuthBlock from '@qa-system/auth-block';
 *
 * const auth = new AuthBlock({
 *   apiUrl: 'https://api.example.com',
 *   storagePrefix: 'myapp_',
 *   sessionTimeout: 7200000
 * });
 *
 * // 登录
 * const result = await auth.login('username', 'password');
 * if (result.success) {
 *   console.log('登录成功:', result.data.user);
 * }
 */

// 默认配置
const DEFAULT_CONFIG = {
    // API配置
    apiUrl: null, // 如果为null，使用本地演示模式
    apiTimeout: 10000,

    // 存储配置
    storagePrefix: 'auth_',
    storageType: 'localStorage', // 'localStorage' | 'sessionStorage' | 'memory'

    // 会话配置
    sessionTimeout: 7200000, // 2小时
    autoRefresh: true,

    // UI配置
    autoBindEvents: true,
    containerSelector: null, // 如果提供，会自动创建UI
    theme: 'default', // 'default' | 'dark' | 'light'

    // 演示用户（仅当apiUrl为null时使用）
    demoUsers: [
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
        }
    ],

    // 事件回调
    onLoginSuccess: null,
    onLoginFailure: null,
    onLogout: null,
    onSessionExpired: null,

    // 调试
    debug: false
};

// 简化的Utils依赖（内嵌）
const AuthUtils = {
    storage: {
        local: {
            set(key, value) {
                try {
                    localStorage.setItem(key, JSON.stringify(value));
                    return true;
                } catch (error) {
                    console.error('LocalStorage write error:', error);
                    return false;
                }
            },
            get(key, defaultValue = null) {
                try {
                    const value = localStorage.getItem(key);
                    return value ? JSON.parse(value) : defaultValue;
                } catch (error) {
                    console.error('LocalStorage read error:', error);
                    return defaultValue;
                }
            },
            remove(key) {
                try {
                    localStorage.removeItem(key);
                    return true;
                } catch (error) {
                    console.error('LocalStorage remove error:', error);
                    return false;
                }
            }
        },
        session: {
            set(key, value) {
                try {
                    sessionStorage.setItem(key, JSON.stringify(value));
                    return true;
                } catch (error) {
                    console.error('SessionStorage write error:', error);
                    return false;
                }
            },
            get(key, defaultValue = null) {
                try {
                    const value = sessionStorage.getItem(key);
                    return value ? JSON.parse(value) : defaultValue;
                } catch (error) {
                    console.error('SessionStorage read error:', error);
                    return defaultValue;
                }
            },
            remove(key) {
                try {
                    sessionStorage.removeItem(key);
                    return true;
                } catch (error) {
                    console.error('SessionStorage remove error:', error);
                    return false;
                }
            }
        }
    },

    validate: {
        required(value) {
            return value !== null && value !== undefined && value !== '';
        },
        length(value, min = 0, max = Infinity) {
            if (!value) {return min === 0;}
            return value.length >= min && value.length <= max;
        },
        email(email) {
            const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return re.test(email);
        }
    },

    date: {
        format(date, format = 'YYYY-MM-DD HH:mm:ss') {
            if (!date) {return '';}
            const d = new Date(date);
            if (isNaN(d.getTime())) {return '';}

            const formats = {
                'YYYY': d.getFullYear(),
                'MM': String(d.getMonth() + 1).padStart(2, '0'),
                'DD': String(d.getDate()).padStart(2, '0'),
                'HH': String(d.getHours()).padStart(2, '0'),
                'mm': String(d.getMinutes()).padStart(2, '0'),
                'ss': String(d.getSeconds()).padStart(2, '0')
            };

            return format.replace(/YYYY|MM|DD|HH|mm|ss/g, match => formats[match]);
        }
    },

    string: {
        generateId(prefix = 'id', length = 8) {
            const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
            let result = prefix + '_';
            for (let i = 0; i < length; i++) {
                result += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return result;
        }
    }
};

/**
 * AuthBlock 认证工具包主类
 */
class AuthBlock {
    constructor(options = {}) {
        // 合并配置
        this.config = { ...DEFAULT_CONFIG, ...options };

        // 内部状态
        this.currentUser = null;
        this.isInitialized = false;
        this.sessionTimer = null;
        this.storage = this.getStorageAdapter();

        // 事件系统
        this.eventListeners = new Map();

        // 自动初始化
        this.init();
    }

    /**
     * 初始化认证系统
     */
    async init() {
        if (this.isInitialized) {return;}

        this.log('🔐 AuthBlock 初始化中...', 'info');

        try {
            // 检查已保存的登录状态
            await this.checkSavedLoginState();

            // 自动绑定UI事件（如果配置启用）
            if (this.config.autoBindEvents) {
                this.bindEventListeners();
            }

            // 创建UI容器（如果配置了选择器）
            if (this.config.containerSelector) {
                await this.createUIContainer();
            }

            // 启动会话监控
            if (this.config.autoRefresh) {
                this.startSessionMonitor();
            }

            this.isInitialized = true;
            this.log('✅ AuthBlock 初始化完成', 'success');

            // 触发初始化完成事件
            this.triggerEvent('auth:initialized', { config: this.config });

        } catch (error) {
            this.log('❌ AuthBlock 初始化失败', 'error', error);
            throw error;
        }
    }

    /**
     * 用户登录
     */
    async login(username, password, rememberMe = false, options = {}) {
        this.log(`🔓 尝试登录用户: ${username}`, 'info');

        // 输入验证
        const validation = this.validateLoginInput(username, password);
        if (!validation.valid) {
            const error = new Error('输入验证失败');
            error.details = validation.errors;
            this.triggerCallback('onLoginFailure', error);
            return {
                success: false,
                error: '输入验证失败',
                details: validation.errors
            };
        }

        try {
            // 模拟延迟（可配置）
            if (options.delay !== false) {
                await this.delay(options.delay || 1000);
            }

            let user;

            // API模式 vs 演示模式
            if (this.config.apiUrl) {
                user = await this.authenticateWithAPI(username, password);
            } else {
                user = this.authenticateWithDemo(username, password);
            }

            if (!user) {
                const error = new Error('用户名或密码错误');
                this.triggerCallback('onLoginFailure', error);
                return {
                    success: false,
                    error: '用户名或密码错误'
                };
            }

            // 完成登录流程
            const result = await this.completeLogin(user, rememberMe);

            this.log(`✅ 用户登录成功: ${user.name}`, 'success');
            this.triggerCallback('onLoginSuccess', user);

            return result;

        } catch (error) {
            this.log(`❌ 登录失败: ${error.message}`, 'error', error);
            this.triggerCallback('onLoginFailure', error);

            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 用户退出登录
     */
    logout() {
        try {
            if (!this.isLoggedIn()) {
                return {
                    success: false,
                    message: '用户未登录'
                };
            }

            const user = this.currentUser;

            // 清除用户状态
            this.currentUser = null;

            // 清除存储
            this.storage.remove(`${this.config.storagePrefix}user`);
            this.storage.remove(`${this.config.storagePrefix}remember`);

            // 停止会话监控
            this.stopSessionMonitor();

            // 触发事件
            this.triggerEvent('auth:logout', { user });
            this.triggerCallback('onLogout', user);

            this.log('👋 用户已退出登录', 'info');

            return {
                success: true,
                message: '已成功退出登录'
            };

        } catch (error) {
            this.log('❌ 退出登录失败', 'error', error);
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
     * 刷新会话
     */
    refreshSession() {
        if (!this.isLoggedIn()) {
            return false;
        }

        // 更新会话时间
        this.currentUser.lastActivity = new Date().toISOString();

        // 重新保存到存储
        const rememberMe = this.storage.get(`${this.config.storagePrefix}remember`);
        if (rememberMe) {
            this.storage.set(`${this.config.storagePrefix}user`, this.currentUser);
        }

        // 触发事件
        this.triggerEvent('auth:session_refreshed', { user: this.currentUser });

        return true;
    }

    /**
     * 添加事件监听器
     */
    on(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }

    /**
     * 移除事件监听器
     */
    off(event, callback) {
        if (!this.eventListeners.has(event)) {return;}

        const listeners = this.eventListeners.get(event);
        const index = listeners.indexOf(callback);
        if (index > -1) {
            listeners.splice(index, 1);
        }
    }

    /**
     * 销毁实例
     */
    destroy() {
        this.stopSessionMonitor();
        this.eventListeners.clear();
        this.currentUser = null;
        this.isInitialized = false;

        this.log('🧹 AuthBlock 已销毁', 'info');
    }

    // ===== 内部方法 =====

    /**
     * 获取存储适配器
     */
    getStorageAdapter() {
        switch (this.config.storageType) {
        case 'sessionStorage':
            return AuthUtils.storage.session;
        case 'localStorage':
            return AuthUtils.storage.local;
        case 'memory':
            return this.createMemoryStorage();
        default:
            return AuthUtils.storage.local;
        }
    }

    /**
     * 创建内存存储
     */
    createMemoryStorage() {
        const memory = new Map();
        return {
            set: (key, value) => memory.set(key, value),
            get: (key, defaultValue = null) => memory.get(key) || defaultValue,
            remove: (key) => memory.delete(key)
        };
    }

    /**
     * 检查已保存的登录状态
     */
    async checkSavedLoginState() {
        const savedUser = this.storage.get(`${this.config.storagePrefix}user`);
        const rememberMe = this.storage.get(`${this.config.storagePrefix}remember`);

        if (savedUser && rememberMe) {
            // 检查会话是否过期
            const loginTime = new Date(savedUser.loginTime);
            const now = new Date();
            const elapsed = now - loginTime;

            if (elapsed < this.config.sessionTimeout) {
                this.currentUser = savedUser;
                this.log('🔑 发现有效的已保存登录状态', 'info', savedUser.name);

                // 触发自动登录事件
                this.triggerEvent('auth:auto_login', { user: savedUser });
            } else {
                // 会话已过期，清除存储
                this.storage.remove(`${this.config.storagePrefix}user`);
                this.storage.remove(`${this.config.storagePrefix}remember`);
                this.log('⏰ 已保存的会话已过期', 'warning');
            }
        }
    }

    /**
     * 验证登录输入
     */
    validateLoginInput(username, password) {
        const errors = {};

        if (!AuthUtils.validate.required(username)) {
            errors.username = '请输入用户名';
        } else if (!AuthUtils.validate.length(username, 2, 20)) {
            errors.username = '用户名长度应为2-20个字符';
        }

        if (!AuthUtils.validate.required(password)) {
            errors.password = '请输入密码';
        } else if (!AuthUtils.validate.length(password, 6, 50)) {
            errors.password = '密码长度应为6-50个字符';
        }

        return {
            valid: Object.keys(errors).length === 0,
            errors
        };
    }

    /**
     * API认证
     */
    async authenticateWithAPI(username, password) {
        const response = await fetch(`${this.config.apiUrl}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password }),
            signal: AbortSignal.timeout(this.config.apiTimeout)
        });

        if (!response.ok) {
            throw new Error(`认证失败: ${response.status}`);
        }

        const data = await response.json();
        return data.user;
    }

    /**
     * 演示模式认证
     */
    authenticateWithDemo(username, password) {
        return this.config.demoUsers.find(user =>
            user.username === username && user.password === password
        );
    }

    /**
     * 完成登录流程
     */
    async completeLogin(user, rememberMe) {
        // 添加登录时间和会话ID
        const enrichedUser = {
            ...user,
            loginTime: new Date().toISOString(),
            sessionId: AuthUtils.string.generateId('session', 16),
            lastActivity: new Date().toISOString()
        };

        // 设置当前用户
        this.currentUser = enrichedUser;

        // 保存到存储
        if (rememberMe) {
            this.storage.set(`${this.config.storagePrefix}user`, enrichedUser);
            this.storage.set(`${this.config.storagePrefix}remember`, true);
        }

        // 启动会话监控
        if (this.config.autoRefresh) {
            this.startSessionMonitor();
        }

        // 触发登录成功事件
        this.triggerEvent('auth:login_success', { user: enrichedUser });

        return {
            success: true,
            data: {
                user: this.getUserInfo(),
                sessionId: enrichedUser.sessionId,
                loginTime: enrichedUser.loginTime
            }
        };
    }

    /**
     * 启动会话监控
     */
    startSessionMonitor() {
        this.stopSessionMonitor(); // 先停止现有的

        this.sessionTimer = setInterval(() => {
            if (!this.isLoggedIn()) {
                this.stopSessionMonitor();
                return;
            }

            const user = this.getCurrentUser();
            const lastActivity = new Date(user.lastActivity);
            const now = new Date();
            const elapsed = now - lastActivity;

            if (elapsed >= this.config.sessionTimeout) {
                this.log('⏰ 会话已过期，自动退出', 'warning');
                this.logout();
                this.triggerCallback('onSessionExpired', user);
                this.triggerEvent('auth:session_expired', { user });
            }
        }, 60000); // 每分钟检查一次
    }

    /**
     * 停止会话监控
     */
    stopSessionMonitor() {
        if (this.sessionTimer) {
            clearInterval(this.sessionTimer);
            this.sessionTimer = null;
        }
    }

    /**
     * 绑定UI事件监听器
     */
    bindEventListeners() {
        // 只在浏览器环境中绑定DOM事件
        if (typeof document === 'undefined') {return;}

        // 登录表单提交
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleFormLogin();
            });
        }

        // 演示模式登录
        const demoLoginBtn = document.getElementById('demo-login-btn');
        if (demoLoginBtn) {
            demoLoginBtn.addEventListener('click', () => {
                this.handleDemoLogin();
            });
        }
    }

    /**
     * 处理表单登录
     */
    async handleFormLogin() {
        const username = document.getElementById('username')?.value?.trim();
        const password = document.getElementById('password')?.value;
        const rememberMe = document.getElementById('remember-me')?.checked;

        const result = await this.login(username, password, rememberMe);

        // 可以在这里添加UI反馈逻辑
        if (result.success) {
            this.log('表单登录成功', 'success');
        } else {
            this.log('表单登录失败', 'error', result.error);
        }
    }

    /**
     * 处理演示登录
     */
    async handleDemoLogin() {
        if (this.config.demoUsers.length > 0) {
            const demoUser = this.config.demoUsers[0];
            const result = await this.login(demoUser.username, demoUser.password, false);

            if (result.success) {
                this.log('演示登录成功', 'success');
            } else {
                this.log('演示登录失败', 'error', result.error);
            }
        }
    }

    /**
     * 创建UI容器
     */
    async createUIContainer() {
        if (typeof document === 'undefined') {return;}

        const container = document.querySelector(this.config.containerSelector);
        if (!container) {
            this.log(`未找到UI容器: ${this.config.containerSelector}`, 'warning');
            return;
        }

        // 这里可以动态创建登录界面
        // 暂时只是占位实现
        container.innerHTML = `
            <div class="auth-block-container">
                <h3>AuthBlock 登录</h3>
                <form id="login-form">
                    <input type="text" id="username" placeholder="用户名" required>
                    <input type="password" id="password" placeholder="密码" required>
                    <label>
                        <input type="checkbox" id="remember-me"> 记住我
                    </label>
                    <button type="submit">登录</button>
                </form>
                <button id="demo-login-btn">演示登录</button>
            </div>
        `;

        // 重新绑定事件
        this.bindEventListeners();
    }

    /**
     * 触发事件
     */
    triggerEvent(eventName, data = {}) {
        // 触发自定义事件监听器
        if (this.eventListeners.has(eventName)) {
            this.eventListeners.get(eventName).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    this.log(`事件回调错误 (${eventName})`, 'error', error);
                }
            });
        }

        // 触发DOM事件（如果在浏览器环境）
        if (typeof window !== 'undefined' && window.dispatchEvent) {
            const event = new CustomEvent(eventName, {
                detail: {
                    timestamp: new Date().toISOString(),
                    source: 'AuthBlock',
                    ...data
                }
            });
            window.dispatchEvent(event);
        }
    }

    /**
     * 触发配置回调
     */
    triggerCallback(callbackName, ...args) {
        const callback = this.config[callbackName];
        if (typeof callback === 'function') {
            try {
                callback(...args);
            } catch (error) {
                this.log(`配置回调错误 (${callbackName})`, 'error', error);
            }
        }
    }

    /**
     * 日志记录
     */
    log(message, type = 'info', data = null) {
        if (!this.config.debug) {return;}

        const timestamp = AuthUtils.date.format(new Date(), 'HH:mm:ss');
        const prefix = `[AuthBlock ${timestamp}]`;

        switch (type) {
        case 'error':
            console.error(prefix, message, data);
            break;
        case 'warning':
            console.warn(prefix, message, data);
            break;
        case 'success':
            console.log(prefix, '✅', message, data);
            break;
        default:
            console.log(prefix, message, data);
        }
    }

    /**
     * 延迟函数
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// 支持多种导入方式
if (typeof module !== 'undefined' && module.exports) {
    // Node.js/CommonJS
    module.exports = AuthBlock;
} else if (typeof define === 'function' && define.amd) {
    // AMD
    define([], () => AuthBlock);
} else {
    // 浏览器全局
    window.AuthBlock = AuthBlock;
}

// 默认导出
export default AuthBlock;
