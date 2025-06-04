// Jest测试环境设置文件

// 模拟浏览器API
Object.defineProperty(window, 'localStorage', {
    value: {
        store: {},
        getItem: function(key) {
            return this.store[key] || null;
        },
        setItem: function(key, value) {
            this.store[key] = value.toString();
        },
        removeItem: function(key) {
            delete this.store[key];
        },
        clear: function() {
            this.store = {};
        }
    },
    writable: true
});

Object.defineProperty(window, 'sessionStorage', {
    value: {
        store: {},
        getItem: function(key) {
            return this.store[key] || null;
        },
        setItem: function(key, value) {
            this.store[key] = value.toString();
        },
        removeItem: function(key) {
            delete this.store[key];
        },
        clear: function() {
            this.store = {};
        }
    },
    writable: true
});

// 模拟fetch API
global.fetch = jest.fn(() =>
    Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
            success: true,
            user: {
                id: 1,
                username: 'testuser',
                name: 'Test User',
                role: 'user',
                email: 'test@example.com'
            }
        })
    })
);

// 模拟CustomEvent
global.CustomEvent = class CustomEvent extends Event {
    constructor(type, options = {}) {
        super(type, options);
        this.detail = options.detail || {};
    }
};

// 模拟AbortSignal.timeout（较新的API）
if (!AbortSignal.timeout) {
    AbortSignal.timeout = function(delay) {
        const controller = new AbortController();
        setTimeout(() => controller.abort(), delay);
        return controller.signal;
    };
}

// 全局测试工具
global.waitFor = (condition, timeout = 5000) => {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        const check = () => {
            if (condition()) {
                resolve();
            } else if (Date.now() - startTime >= timeout) {
                reject(new Error('等待超时'));
            } else {
                setTimeout(check, 10);
            }
        };
        check();
    });
};

// 清理函数
afterEach(() => {
    // 清理localStorage
    window.localStorage.clear();
    window.sessionStorage.clear();
    
    // 重置fetch模拟
    fetch.mockClear();
    
    // 清理定时器
    jest.clearAllTimers();
});

// 在每个测试开始前重置mock状态
beforeEach(() => {
    jest.useFakeTimers();
}); 