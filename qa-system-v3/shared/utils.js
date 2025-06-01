/**
 * 共享工具函数库
 * 提供通用的辅助功能和实用方法
 */
window.QAUtils = {
    
    /**
     * 格式化日期时间
     */
    formatDateTime: (date = null, format = 'full') => {
        const d = date ? new Date(date) : new Date();
        
        const options = {
            full: {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            },
            short: {
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            },
            date: {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            },
            time: {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            }
        };
        
        return d.toLocaleString('zh-CN', options[format] || options.full);
    },
    
    /**
     * 格式化文件大小
     */
    formatFileSize: (bytes) => {
        if (bytes === 0) return '0 B';
        
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },
    
    /**
     * 防抖函数
     */
    debounce: (func, wait, immediate = false) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func(...args);
            };
            
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            
            if (callNow) func(...args);
        };
    },
    
    /**
     * 节流函数
     */
    throttle: (func, limit) => {
        let inThrottle;
        return function executedFunction(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },
    
    /**
     * 深克隆对象
     */
    deepClone: (obj) => {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }
        
        if (obj instanceof Date) {
            return new Date(obj.getTime());
        }
        
        if (obj instanceof Array) {
            return obj.map(item => QAUtils.deepClone(item));
        }
        
        if (typeof obj === 'object') {
            const cloned = {};
            Object.keys(obj).forEach(key => {
                cloned[key] = QAUtils.deepClone(obj[key]);
            });
            return cloned;
        }
    },
    
    /**
     * 生成唯一ID
     */
    generateId: (prefix = 'id') => {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 9);
        return `${prefix}_${timestamp}_${random}`;
    },
    
    /**
     * 验证字符串是否为空
     */
    isEmpty: (str) => {
        return !str || str.trim().length === 0;
    },
    
    /**
     * 截取字符串
     */
    truncateString: (str, length = 100, suffix = '...') => {
        if (!str || str.length <= length) {
            return str;
        }
        return str.substring(0, length) + suffix;
    },
    
    /**
     * 转义HTML字符
     */
    escapeHtml: (text) => {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    },
    
    /**
     * 验证邮箱格式
     */
    isValidEmail: (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },
    
    /**
     * 验证URL格式
     */
    isValidUrl: (url) => {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    },
    
    /**
     * 从URL获取查询参数
     */
    getUrlParams: (url = window.location.href) => {
        const params = {};
        const urlObj = new URL(url);
        for (const [key, value] of urlObj.searchParams) {
            params[key] = value;
        }
        return params;
    },
    
    /**
     * 设置URL查询参数
     */
    setUrlParam: (key, value, url = window.location.href) => {
        const urlObj = new URL(url);
        urlObj.searchParams.set(key, value);
        return urlObj.toString();
    },
    
    /**
     * Cookie操作
     */
    cookie: {
        set: (name, value, days = 7) => {
            const expires = new Date(Date.now() + days * 864e5).toUTCString();
            document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
        },
        
        get: (name) => {
            return document.cookie.split('; ').reduce((r, v) => {
                const parts = v.split('=');
                return parts[0] === name ? decodeURIComponent(parts[1]) : r;
            }, '');
        },
        
        delete: (name) => {
            QAUtils.cookie.set(name, '', -1);
        }
    },
    
    /**
     * 本地存储操作
     */
    storage: {
        set: (key, value, expiry = null) => {
            const item = {
                value: value,
                expiry: expiry ? Date.now() + expiry : null
            };
            localStorage.setItem(key, JSON.stringify(item));
        },
        
        get: (key) => {
            const itemStr = localStorage.getItem(key);
            if (!itemStr) return null;
            
            try {
                const item = JSON.parse(itemStr);
                
                // 检查是否过期
                if (item.expiry && Date.now() > item.expiry) {
                    localStorage.removeItem(key);
                    return null;
                }
                
                return item.value;
            } catch {
                return null;
            }
        },
        
        remove: (key) => {
            localStorage.removeItem(key);
        },
        
        clear: () => {
            localStorage.clear();
        }
    },
    
    /**
     * 网络状态检测
     */
    network: {
        isOnline: () => navigator.onLine,
        
        checkConnectivity: async (url = 'https://www.baidu.com', timeout = 5000) => {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), timeout);
                
                const response = await fetch(url, {
                    method: 'HEAD',
                    mode: 'no-cors',
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                return true;
            } catch {
                return false;
            }
        }
    },
    
    /**
     * 设备信息检测
     */
    device: {
        isMobile: () => /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
        
        isTablet: () => /iPad|Android(?=.*\bMobile\b)|Windows Phone|IEMobile/i.test(navigator.userAgent),
        
        isDesktop: () => !QAUtils.device.isMobile() && !QAUtils.device.isTablet(),
        
        getBrowser: () => {
            const ua = navigator.userAgent;
            if (ua.includes('Chrome')) return 'Chrome';
            if (ua.includes('Firefox')) return 'Firefox';
            if (ua.includes('Safari')) return 'Safari';
            if (ua.includes('Edge')) return 'Edge';
            return 'Unknown';
        },
        
        getOS: () => {
            const ua = navigator.userAgent;
            if (ua.includes('Windows')) return 'Windows';
            if (ua.includes('Mac')) return 'macOS';
            if (ua.includes('Linux')) return 'Linux';
            if (ua.includes('Android')) return 'Android';
            if (ua.includes('iOS')) return 'iOS';
            return 'Unknown';
        }
    },
    
    /**
     * 颜色工具
     */
    color: {
        hexToRgb: (hex) => {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : null;
        },
        
        rgbToHex: (r, g, b) => {
            return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
        },
        
        randomColor: () => {
            return '#' + Math.floor(Math.random() * 16777215).toString(16);
        }
    },
    
    /**
     * 数组工具
     */
    array: {
        unique: (arr) => [...new Set(arr)],
        
        shuffle: (arr) => {
            const newArr = [...arr];
            for (let i = newArr.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
            }
            return newArr;
        },
        
        chunk: (arr, size) => {
            const chunks = [];
            for (let i = 0; i < arr.length; i += size) {
                chunks.push(arr.slice(i, i + size));
            }
            return chunks;
        },
        
        groupBy: (arr, key) => {
            return arr.reduce((groups, item) => {
                const group = typeof key === 'function' ? key(item) : item[key];
                groups[group] = groups[group] || [];
                groups[group].push(item);
                return groups;
            }, {});
        }
    },
    
    /**
     * 性能监控
     */
    performance: {
        measure: (name, fn) => {
            return async (...args) => {
                const start = performance.now();
                const result = await fn(...args);
                const end = performance.now();
                console.log(`${name} 执行时间: ${(end - start).toFixed(2)}ms`);
                return result;
            };
        },
        
        memory: () => {
            if (performance.memory) {
                return {
                    used: QAUtils.formatFileSize(performance.memory.usedJSHeapSize),
                    total: QAUtils.formatFileSize(performance.memory.totalJSHeapSize),
                    limit: QAUtils.formatFileSize(performance.memory.jsHeapSizeLimit)
                };
            }
            return null;
        }
    },
    
    /**
     * 错误处理
     */
    error: {
        handle: (error, context = '') => {
            const errorInfo = {
                message: error.message,
                stack: error.stack,
                context: context,
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent,
                url: window.location.href
            };
            
            console.error('错误详情:', errorInfo);
            
            // 可以在这里添加错误上报逻辑
            // 例如发送到错误监控服务
            
            return errorInfo;
        },
        
        wrap: (fn, context = '') => {
            return async (...args) => {
                try {
                    return await fn(...args);
                } catch (error) {
                    QAUtils.error.handle(error, context);
                    throw error;
                }
            };
        }
    }
}; 