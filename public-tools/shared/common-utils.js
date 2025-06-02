/**
 * Public Tools - 通用工具函数库
 * 为所有工具包提供共享的实用函数
 */

// 事件发射器基类
class EventEmitter {
    constructor() {
        this.events = {};
    }
    
    on(event, callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
    }
    
    off(event, callback) {
        if (!this.events[event]) return;
        this.events[event] = this.events[event].filter(cb => cb !== callback);
    }
    
    emit(event, data) {
        if (!this.events[event]) return;
        this.events[event].forEach(callback => callback(data));
    }
}

// 工具包基类
class BaseToolkit extends EventEmitter {
    constructor(config = {}) {
        super();
        this.config = config;
        this.version = '1.0.0';
        this.initialized = false;
    }
    
    async init() {
        this.initialized = true;
        this.emit('initialized', { toolkit: this.constructor.name });
    }
    
    destroy() {
        this.initialized = false;
        this.events = {};
        this.emit('destroyed', { toolkit: this.constructor.name });
    }
}

// 通用工具函数
const Utils = {
    // 生成唯一ID
    generateId: () => {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },
    
    // 深度克隆对象
    deepClone: (obj) => {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => Utils.deepClone(item));
        if (typeof obj === 'object') {
            const cloned = {};
            Object.keys(obj).forEach(key => {
                cloned[key] = Utils.deepClone(obj[key]);
            });
            return cloned;
        }
    },
    
    // 防抖函数
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    // 节流函数
    throttle: (func, limit) => {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },
    
    // 格式化日期
    formatDate: (date, format = 'YYYY-MM-DD HH:mm:ss') => {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        const seconds = String(d.getSeconds()).padStart(2, '0');
        
        return format
            .replace('YYYY', year)
            .replace('MM', month)
            .replace('DD', day)
            .replace('HH', hours)
            .replace('mm', minutes)
            .replace('ss', seconds);
    },
    
    // 文件大小格式化
    formatFileSize: (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },
    
    // 检查浏览器支持
    checkBrowserSupport: () => {
        return {
            fileSystemAPI: 'showSaveFilePicker' in window,
            localStorage: typeof Storage !== 'undefined',
            webWorkers: typeof Worker !== 'undefined',
            canvas: !!document.createElement('canvas').getContext,
            webGL: !!document.createElement('canvas').getContext('webgl'),
            geolocation: 'geolocation' in navigator,
            notifications: 'Notification' in window
        };
    },
    
    // 异步延迟
    sleep: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
    
    // 重试机制
    retry: async (fn, maxAttempts = 3, delay = 1000) => {
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return await fn();
            } catch (error) {
                if (attempt === maxAttempts) throw error;
                await Utils.sleep(delay * attempt);
            }
        }
    },
    
    // 验证邮箱
    isValidEmail: (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },
    
    // 验证URL
    isValidUrl: (url) => {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    },
    
    // 转义HTML
    escapeHtml: (text) => {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },
    
    // 解析HTML
    unescapeHtml: (html) => {
        const div = document.createElement('div');
        div.innerHTML = html;
        return div.textContent || div.innerText || '';
    }
};

// 存储管理器
class StorageManager {
    constructor(prefix = 'public-tools') {
        this.prefix = prefix;
    }
    
    set(key, value) {
        try {
            const data = JSON.stringify(value);
            localStorage.setItem(`${this.prefix}-${key}`, data);
            return true;
        } catch (error) {
            console.error('存储失败:', error);
            return false;
        }
    }
    
    get(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(`${this.prefix}-${key}`);
            return data ? JSON.parse(data) : defaultValue;
        } catch (error) {
            console.error('读取失败:', error);
            return defaultValue;
        }
    }
    
    remove(key) {
        try {
            localStorage.removeItem(`${this.prefix}-${key}`);
            return true;
        } catch (error) {
            console.error('删除失败:', error);
            return false;
        }
    }
    
    clear() {
        try {
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith(`${this.prefix}-`)) {
                    localStorage.removeItem(key);
                }
            });
            return true;
        } catch (error) {
            console.error('清空失败:', error);
            return false;
        }
    }
    
    list() {
        const items = {};
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith(`${this.prefix}-`)) {
                const itemKey = key.replace(`${this.prefix}-`, '');
                items[itemKey] = this.get(itemKey);
            }
        });
        return items;
    }
}

// 通知管理器
class NotificationManager {
    constructor() {
        this.container = null;
        this.init();
    }
    
    init() {
        // 创建通知容器
        this.container = document.createElement('div');
        this.container.id = 'notification-container';
        this.container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            max-width: 300px;
        `;
        document.body.appendChild(this.container);
    }
    
    show(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            margin-bottom: 10px;
            padding: 12px 16px;
            border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            cursor: pointer;
            transition: all 0.3s ease;
        `;
        
        // 点击关闭
        notification.addEventListener('click', () => {
            this.remove(notification);
        });
        
        this.container.appendChild(notification);
        
        // 自动关闭
        if (duration > 0) {
            setTimeout(() => {
                this.remove(notification);
            }, duration);
        }
        
        return notification;
    }
    
    remove(notification) {
        if (notification && notification.parentNode) {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }
    }
    
    success(message, duration) {
        return this.show(message, 'success', duration);
    }
    
    error(message, duration) {
        return this.show(message, 'error', duration);
    }
    
    warning(message, duration) {
        return this.show(message, 'warning', duration);
    }
    
    info(message, duration) {
        return this.show(message, 'info', duration);
    }
}

// 加载管理器
class LoadingManager {
    constructor() {
        this.overlay = null;
        this.activeLoaders = new Set();
    }
    
    show(message = '加载中...', id = 'default') {
        this.activeLoaders.add(id);
        
        if (!this.overlay) {
            this.overlay = document.createElement('div');
            this.overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
                color: white;
                font-size: 16px;
            `;
            
            this.overlay.innerHTML = `
                <div style="text-align: center;">
                    <div class="spinner" style="margin: 0 auto 10px;"></div>
                    <div id="loading-message">${message}</div>
                </div>
            `;
            
            document.body.appendChild(this.overlay);
        } else {
            document.getElementById('loading-message').textContent = message;
        }
    }
    
    hide(id = 'default') {
        this.activeLoaders.delete(id);
        
        if (this.activeLoaders.size === 0 && this.overlay) {
            this.overlay.remove();
            this.overlay = null;
        }
    }
    
    hideAll() {
        this.activeLoaders.clear();
        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
        }
    }
}

// 全局实例
const globalStorage = new StorageManager();
const globalNotification = new NotificationManager();
const globalLoading = new LoadingManager();

// 导出所有工具
if (typeof module !== 'undefined' && module.exports) {
    // Node.js 环境
    module.exports = {
        EventEmitter,
        BaseToolkit,
        Utils,
        StorageManager,
        NotificationManager,
        LoadingManager,
        globalStorage,
        globalNotification,
        globalLoading
    };
} else {
    // 浏览器环境
    window.PublicToolsUtils = {
        EventEmitter,
        BaseToolkit,
        Utils,
        StorageManager,
        NotificationManager,
        LoadingManager,
        globalStorage,
        globalNotification,
        globalLoading
    };
} 