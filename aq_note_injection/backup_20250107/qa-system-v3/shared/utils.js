/**
 * 共享工具函数模块 - v3.0完整解耦版
 * 提供各功能块通用的工具函数
 */

// 全局工具对象
window.Utils = {
    
    /**
     * 字符串工具
     */
    string: {
        /**
         * 生成随机ID
         */
        generateId(prefix = 'id', length = 8) {
            const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
            let result = prefix + '_';
            for (let i = 0; i < length; i++) {
                result += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return result;
        },

        /**
         * 截断字符串
         */
        truncate(str, length = 100, suffix = '...') {
            if (!str || str.length <= length) return str || '';
            return str.substring(0, length) + suffix;
        },

        /**
         * 转义HTML
         */
        escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        },

        /**
         * 移除HTML标签
         */
        stripHtml(html) {
            const div = document.createElement('div');
            div.innerHTML = html;
            return div.textContent || div.innerText || '';
    },
    
    /**
     * 格式化文件大小
     */
        formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },
    
    /**
         * 计算字符数（包括中文）
         */
        getCharacterCount(text) {
            if (!text) return 0;
            // 中文字符计为2个字符
            return text.replace(/[\u4e00-\u9fa5]/g, 'aa').length;
        }
    },

    /**
     * 日期时间工具
     */
    date: {
        /**
         * 格式化日期
         */
        format(date, format = 'YYYY-MM-DD HH:mm:ss') {
            if (!date) return '';
            
            const d = new Date(date);
            if (isNaN(d.getTime())) return '';

            const formats = {
                'YYYY': d.getFullYear(),
                'MM': String(d.getMonth() + 1).padStart(2, '0'),
                'DD': String(d.getDate()).padStart(2, '0'),
                'HH': String(d.getHours()).padStart(2, '0'),
                'mm': String(d.getMinutes()).padStart(2, '0'),
                'ss': String(d.getSeconds()).padStart(2, '0')
            };

            return format.replace(/YYYY|MM|DD|HH|mm|ss/g, match => formats[match]);
        },

        /**
         * 相对时间
         */
        relative(date) {
            if (!date) return '';
            
            const now = new Date();
            const target = new Date(date);
            const diff = now - target;

            const minute = 60 * 1000;
            const hour = minute * 60;
            const day = hour * 24;
            const week = day * 7;
            const month = day * 30;
            const year = day * 365;

            if (diff < minute) return '刚刚';
            if (diff < hour) return Math.floor(diff / minute) + ' 分钟前';
            if (diff < day) return Math.floor(diff / hour) + ' 小时前';
            if (diff < week) return Math.floor(diff / day) + ' 天前';
            if (diff < month) return Math.floor(diff / week) + ' 周前';
            if (diff < year) return Math.floor(diff / month) + ' 个月前';
            return Math.floor(diff / year) + ' 年前';
        },

        /**
         * 获取今天开始时间
         */
        getTodayStart() {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return today;
        },

        /**
         * 获取今天结束时间
         */
        getTodayEnd() {
            const today = new Date();
            today.setHours(23, 59, 59, 999);
            return today;
        }
    },
    
    /**
     * 数组工具
     */
    array: {
        /**
         * 数组去重
         */
        unique(arr, key = null) {
            if (!Array.isArray(arr)) return [];
            
            if (key) {
                const seen = new Set();
                return arr.filter(item => {
                    const val = item[key];
                    if (seen.has(val)) return false;
                    seen.add(val);
                    return true;
                });
            }
            
            return [...new Set(arr)];
        },

        /**
         * 数组分组
         */
        groupBy(arr, key) {
            if (!Array.isArray(arr)) return {};
            
            return arr.reduce((groups, item) => {
                const group = item[key];
                groups[group] = groups[group] || [];
                groups[group].push(item);
                return groups;
            }, {});
        },

        /**
         * 数组排序
         */
        sortBy(arr, key, desc = false) {
            if (!Array.isArray(arr)) return [];
            
            return arr.sort((a, b) => {
                const valA = a[key];
                const valB = b[key];
                
                if (valA < valB) return desc ? 1 : -1;
                if (valA > valB) return desc ? -1 : 1;
                return 0;
            });
        },

        /**
         * 数组分页
         */
        paginate(arr, page = 1, pageSize = 10) {
            if (!Array.isArray(arr)) return { items: [], total: 0, page: 1, pageSize: 10 };
            
            const startIndex = (page - 1) * pageSize;
            const endIndex = startIndex + pageSize;
            
            return {
                items: arr.slice(startIndex, endIndex),
                total: arr.length,
                page: page,
                pageSize: pageSize,
                totalPages: Math.ceil(arr.length / pageSize)
            };
        }
    },
    
    /**
     * 对象工具
     */
    object: {
        /**
         * 深度克隆
         */
        deepClone(obj) {
            if (obj === null || typeof obj !== 'object') return obj;
            if (obj instanceof Date) return new Date(obj.getTime());
            if (obj instanceof Array) return obj.map(item => this.deepClone(item));
        
        if (typeof obj === 'object') {
            const cloned = {};
                for (const key in obj) {
                    if (obj.hasOwnProperty(key)) {
                        cloned[key] = this.deepClone(obj[key]);
                    }
                }
            return cloned;
        }
    },
    
    /**
         * 对象合并
         */
        merge(target, ...sources) {
            if (!sources.length) return target;
            const source = sources.shift();

            if (this.isObject(target) && this.isObject(source)) {
                for (const key in source) {
                    if (this.isObject(source[key])) {
                        if (!target[key]) Object.assign(target, { [key]: {} });
                        this.merge(target[key], source[key]);
                    } else {
                        Object.assign(target, { [key]: source[key] });
                    }
                }
            }

            return this.merge(target, ...sources);
    },
    
    /**
         * 检查是否为对象
     */
        isObject(item) {
            return item && typeof item === 'object' && !Array.isArray(item);
    },
    
    /**
         * 获取嵌套属性值
         */
        get(obj, path, defaultValue = undefined) {
            const keys = path.split('.');
            let result = obj;
            
            for (const key of keys) {
                result = result?.[key];
                if (result === undefined) return defaultValue;
            }
            
            return result;
    },
    
    /**
         * 设置嵌套属性值
         */
        set(obj, path, value) {
            const keys = path.split('.');
            const lastKey = keys.pop();
            let current = obj;
            
            for (const key of keys) {
                if (!(key in current) || !this.isObject(current[key])) {
                    current[key] = {};
                }
                current = current[key];
            }
            
            current[lastKey] = value;
            return obj;
        }
    },
    
    /**
     * DOM工具
     */
    dom: {
        /**
         * 创建元素
         */
        createElement(tag, attributes = {}, children = []) {
            const element = document.createElement(tag);
            
            // 设置属性
            Object.entries(attributes).forEach(([key, value]) => {
                if (key === 'className') {
                    element.className = value;
                } else if (key === 'innerHTML') {
                    element.innerHTML = value;
                } else if (key === 'textContent') {
                    element.textContent = value;
                } else if (key.startsWith('data-')) {
                    element.setAttribute(key, value);
                } else {
                    element[key] = value;
                }
            });
            
            // 添加子元素
            children.forEach(child => {
                if (typeof child === 'string') {
                    element.appendChild(document.createTextNode(child));
                } else if (child instanceof Element) {
                    element.appendChild(child);
                }
            });
            
            return element;
    },
    
    /**
         * 添加CSS类
         */
        addClass(element, className) {
            if (element && className) {
                element.classList.add(className);
        }
    },
    
    /**
         * 移除CSS类
         */
        removeClass(element, className) {
            if (element && className) {
                element.classList.remove(className);
            }
    },
    
    /**
         * 切换CSS类
         */
        toggleClass(element, className) {
            if (element && className) {
                element.classList.toggle(className);
            }
    },
    
    /**
         * 检查是否包含CSS类
         */
        hasClass(element, className) {
            return element && className && element.classList.contains(className);
        },

        /**
         * 查找父元素
         */
        findParent(element, selector) {
            let parent = element.parentElement;
            while (parent) {
                if (parent.matches(selector)) {
                    return parent;
                }
                parent = parent.parentElement;
            }
            return null;
        }
    },
    
    /**
     * 存储工具
     */
    storage: {
        /**
         * 本地存储
         */
        local: {
            set(key, value) {
                try {
                    localStorage.setItem(key, JSON.stringify(value));
                    return true;
                } catch (e) {
                    console.error('localStorage.setItem failed:', e);
                    return false;
                }
            },

            get(key, defaultValue = null) {
                try {
                    const value = localStorage.getItem(key);
                    return value ? JSON.parse(value) : defaultValue;
                } catch (e) {
                    console.error('localStorage.getItem failed:', e);
                    return defaultValue;
                }
            },

            remove(key) {
                try {
                    localStorage.removeItem(key);
                    return true;
                } catch (e) {
                    console.error('localStorage.removeItem failed:', e);
                    return false;
                }
            },

            clear() {
                try {
                    localStorage.clear();
                    return true;
                } catch (e) {
                    console.error('localStorage.clear failed:', e);
                    return false;
                }
            }
        },

        /**
         * 会话存储
         */
        session: {
            set(key, value) {
                try {
                    sessionStorage.setItem(key, JSON.stringify(value));
                    return true;
                } catch (e) {
                    console.error('sessionStorage.setItem failed:', e);
                    return false;
                }
            },

            get(key, defaultValue = null) {
                try {
                    const value = sessionStorage.getItem(key);
                    return value ? JSON.parse(value) : defaultValue;
                } catch (e) {
                    console.error('sessionStorage.getItem failed:', e);
                    return defaultValue;
                }
            },

            remove(key) {
                try {
                    sessionStorage.removeItem(key);
                    return true;
                } catch (e) {
                    console.error('sessionStorage.removeItem failed:', e);
                    return false;
                }
            },

            clear() {
                try {
                    sessionStorage.clear();
                    return true;
                } catch (e) {
                    console.error('sessionStorage.clear failed:', e);
                    return false;
                }
            }
        }
    },
    
    /**
     * 网络工具
     */
    network: {
        /**
         * 检查网络状态
         */
        isOnline() {
            return navigator.onLine;
        },

        /**
         * 监听网络状态变化
         */
        onNetworkChange(callback) {
            const handleOnline = () => callback(true);
            const handleOffline = () => callback(false);
            
            window.addEventListener('online', handleOnline);
            window.addEventListener('offline', handleOffline);
            
            // 返回清理函数
            return () => {
                window.removeEventListener('online', handleOnline);
                window.removeEventListener('offline', handleOffline);
            };
        },

        /**
         * 简单的fetch封装
         */
        async request(url, options = {}) {
            const defaultOptions = {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                timeout: 10000
            };

            const config = { ...defaultOptions, ...options };

            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), config.timeout);
                
                const response = await fetch(url, {
                    ...config,
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                return await response.json();
            } catch (error) {
                console.error('Network request failed:', error);
                throw error;
            }
        }
    },
    
    /**
     * 文件工具
     */
    file: {
        /**
         * 下载文件
         */
        download(content, filename, type = 'text/plain') {
            const blob = new Blob([content], { type });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
    },
    
    /**
         * 读取文件
         */
        read(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = e => resolve(e.target.result);
                reader.onerror = e => reject(e);
                reader.readAsText(file);
            });
        },

        /**
         * 获取文件扩展名
         */
        getExtension(filename) {
            return filename.split('.').pop().toLowerCase();
        },

        /**
         * 验证文件类型
         */
        validateType(file, allowedTypes) {
            const extension = this.getExtension(file.name);
            return allowedTypes.includes(extension);
        }
    },
    
    /**
     * 验证工具
     */
    validate: {
        /**
         * 验证邮箱
         */
        email(email) {
            const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return regex.test(email);
        },

        /**
         * 验证URL
         */
        url(url) {
            try {
                new URL(url);
                return true;
            } catch {
                return false;
            }
        },

        /**
         * 验证非空
         */
        required(value) {
            return value !== null && value !== undefined && value !== '';
        },

        /**
         * 验证长度
         */
        length(value, min = 0, max = Infinity) {
            const len = value ? value.length : 0;
            return len >= min && len <= max;
        },

        /**
         * 验证数字范围
         */
        range(value, min = -Infinity, max = Infinity) {
            const num = Number(value);
            return !isNaN(num) && num >= min && num <= max;
        }
    },
    
    /**
     * 调试工具
     */
    debug: {
        /**
         * 性能测试
         */
        time(label) {
            console.time(label);
        },

        timeEnd(label) {
            console.timeEnd(label);
        },

        /**
         * 内存使用情况
         */
        memory() {
            if (performance.memory) {
                return {
                    used: Math.round(performance.memory.usedJSHeapSize / 1048576),
                    total: Math.round(performance.memory.totalJSHeapSize / 1048576),
                    limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576)
                };
            }
            return null;
        },

        /**
         * 日志包装器
         */
        log(message, type = 'info', data = null) {
            const timestamp = new Date().toISOString();
            const logMessage = `[${timestamp}] ${message}`;
            
            switch (type) {
                case 'error':
                    console.error(logMessage, data);
                    break;
                case 'warn':
                    console.warn(logMessage, data);
                    break;
                case 'info':
                default:
                    console.log(logMessage, data);
                    break;
            }
        }
    },
    
    /**
     * 事件工具
     */
    event: {
        /**
         * 事件委托
         */
        delegate(container, selector, event, handler) {
            container.addEventListener(event, function(e) {
                if (e.target.matches(selector)) {
                    handler.call(e.target, e);
                }
            });
        },

        /**
         * 防抖
         */
        debounce(func, wait = 300) {
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

        /**
         * 节流
         */
        throttle(func, limit = 300) {
            let inThrottle;
            return function(...args) {
                if (!inThrottle) {
                    func.apply(this, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        }
    }
}; 

// 导出全局工具对象
console.log('🛠️ Utils 工具模块已加载'); 