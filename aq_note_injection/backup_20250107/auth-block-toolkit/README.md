# AuthBlock 用户认证工具包

[![npm version](https://badge.fury.io/js/%40qa-system%2Fauth-block.svg)](https://badge.fury.io/js/%40qa-system%2Fauth-block)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

🔐 **功能强大、高度可配置的用户认证工具包**

## ✨ 核心特性

- 🔐 **完整认证系统**：登录、登出、会话管理
- 👤 **用户状态管理**：持久化存储、自动恢复
- 🔑 **权限控制系统**：基于角色的访问控制
- 💾 **灵活存储选项**：localStorage / sessionStorage / 内存存储
- 🎯 **事件驱动架构**：完整的事件通知机制
- ⚙️ **高度可配置**：支持API对接或本地演示模式
- 📱 **多环境支持**：浏览器、Node.js、移动端
- 🎨 **UI可选**：可选的内置UI或仅提供API

## 🚀 快速开始

### 安装

```bash
npm install @qa-system/auth-block
```

### 基础使用

```javascript
// ES6模块导入
import AuthBlock from '@qa-system/auth-block';

// 或者 CommonJS
const AuthBlock = require('@qa-system/auth-block');

// 创建认证实例
const auth = new AuthBlock({
    apiUrl: 'https://api.yourapp.com',  // 可选：API端点
    storagePrefix: 'myapp_',           // 存储前缀
    sessionTimeout: 7200000,           // 2小时会话超时
    debug: true                        // 开启调试日志
});

// 用户登录
const result = await auth.login('username', 'password', true);
if (result.success) {
    console.log('登录成功:', result.data.user);
} else {
    console.error('登录失败:', result.error);
}

// 检查登录状态
if (auth.isLoggedIn()) {
    const user = auth.getCurrentUser();
    console.log('当前用户:', user.name);
}

// 检查权限
if (auth.hasPermission('admin')) {
    console.log('用户具有管理员权限');
}

// 退出登录
const logoutResult = auth.logout();
```

### 快速演示（无需后端）

```javascript
// 使用内置演示用户，无需配置API
const auth = new AuthBlock({
    debug: true
});

// 使用预设的演示账号登录
await auth.login('demo', 'demo123');  // 普通用户
await auth.login('admin', 'admin123'); // 管理员
```

## 📚 详细配置

### 配置选项

```javascript
const auth = new AuthBlock({
    // 🌐 API配置
    apiUrl: null,                    // API端点，null时使用演示模式
    apiTimeout: 10000,              // API超时时间（毫秒）
    
    // 💾 存储配置
    storagePrefix: 'auth_',         // 存储键前缀
    storageType: 'localStorage',    // 'localStorage' | 'sessionStorage' | 'memory'
    
    // ⏰ 会话配置
    sessionTimeout: 7200000,        // 会话超时时间（毫秒，默认2小时）
    autoRefresh: true,             // 自动刷新会话
    
    // 🎨 UI配置
    autoBindEvents: true,          // 自动绑定DOM事件
    containerSelector: '#auth-container', // UI容器选择器（可选）
    theme: 'default',              // 主题：'default' | 'dark' | 'light'
    
    // 👥 演示用户（仅当apiUrl为null时使用）
    demoUsers: [
        {
            id: 1,
            username: 'demo',
            password: 'demo123',
            name: '演示用户',
            role: 'user',
            avatar: '👤',
            email: 'demo@example.com'
        }
    ],
    
    // 📞 事件回调
    onLoginSuccess: (user) => console.log('登录成功:', user),
    onLoginFailure: (error) => console.error('登录失败:', error),
    onLogout: (user) => console.log('用户退出:', user),
    onSessionExpired: (user) => console.log('会话过期:', user),
    
    // 🐛 调试
    debug: false
});
```

## 🔄 事件系统

### 监听事件

```javascript
// 监听登录成功事件
auth.on('auth:login_success', (data) => {
    console.log('用户登录:', data.user);
    // 重定向到首页
    window.location.href = '/dashboard';
});

// 监听登录失败事件
auth.on('auth:login_failure', (data) => {
    console.error('登录失败:', data.error);
    // 显示错误消息
    showToast('登录失败：' + data.error, 'error');
});

// 监听会话过期事件
auth.on('auth:session_expired', (data) => {
    console.warn('会话已过期');
    // 重定向到登录页
    window.location.href = '/login';
});

// 监听自动登录事件
auth.on('auth:auto_login', (data) => {
    console.log('自动登录成功:', data.user.name);
});
```

### 可用事件

| 事件名 | 触发时机 | 数据 |
|--------|----------|------|
| `auth:initialized` | 初始化完成 | `{ config }` |
| `auth:login_success` | 登录成功 | `{ user }` |
| `auth:logout` | 退出登录 | `{ user }` |
| `auth:session_refreshed` | 会话刷新 | `{ user }` |
| `auth:session_expired` | 会话过期 | `{ user }` |
| `auth:auto_login` | 自动登录 | `{ user }` |

## 🔌 API对接

### 后端API要求

当配置`apiUrl`时，AuthBlock会向以下端点发送请求：

```javascript
// 登录请求
POST /auth/login
Content-Type: application/json

{
    "username": "string",
    "password": "string"
}

// 期望响应
{
    "success": true,
    "user": {
        "id": "string|number",
        "username": "string",
        "name": "string",
        "role": "admin|user",
        "avatar": "string",
        "email": "string"
    }
}
```

### 自定义API端点

```javascript
const auth = new AuthBlock({
    apiUrl: 'https://your-api.com',
    // 可以通过继承来自定义API调用
});

// 自定义认证逻辑
class CustomAuthBlock extends AuthBlock {
    async authenticateWithAPI(username, password) {
        // 自定义API调用逻辑
        const response = await fetch(`${this.config.apiUrl}/custom-login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': 'your-api-key'
            },
            body: JSON.stringify({
                login: username,
                pwd: password,
                remember: true
            })
        });
        
        const data = await response.json();
        return data.userInfo;
    }
}
```

## 🎨 UI集成

### 自动UI创建

```javascript
const auth = new AuthBlock({
    containerSelector: '#login-container',
    autoBindEvents: true
});

// HTML中只需要容器
// <div id="login-container"></div>
// AuthBlock会自动创建登录表单
```

### 手动UI绑定

```html
<!-- 自定义登录表单 -->
<form id="login-form">
    <input type="text" id="username" placeholder="用户名" required>
    <input type="password" id="password" placeholder="密码" required>
    <label>
        <input type="checkbox" id="remember-me"> 记住我
    </label>
    <button type="submit">登录</button>
</form>
<button id="demo-login-btn">演示登录</button>
```

```javascript
const auth = new AuthBlock({
    autoBindEvents: true  // 自动绑定到上述ID的元素
});

// 或者手动处理
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('remember-me').checked;
    
    const result = await auth.login(username, password, rememberMe);
    // 处理结果...
});
```

## 🛡️ 权限管理

### 内置权限级别

```javascript
// 检查具体权限
auth.hasPermission('admin');   // 仅管理员
auth.hasPermission('user');    // 用户和管理员
auth.hasPermission('read');    // 所有登录用户
auth.hasPermission('write');   // 用户和管理员
auth.hasPermission('delete');  // 仅管理员

// 获取用户角色
const user = auth.getCurrentUser();
console.log('用户角色:', user.role); // 'admin' | 'user'
```

### 权限保护组件

```javascript
// React示例
function ProtectedComponent({ permission, children }) {
    const auth = useAuthBlock(); // 假设的Hook
    
    if (!auth.hasPermission(permission)) {
        return <div>权限不足</div>;
    }
    
    return children;
}

// 使用
<ProtectedComponent permission="admin">
    <AdminPanel />
</ProtectedComponent>
```

## 🔧 高级用法

### 多实例支持

```javascript
// 主应用认证
const mainAuth = new AuthBlock({
    storagePrefix: 'main_',
    apiUrl: 'https://main-api.com'
});

// 子系统认证
const subAuth = new AuthBlock({
    storagePrefix: 'sub_',
    apiUrl: 'https://sub-api.com'
});
```

### 自定义存储

```javascript
// 使用Redis等外部存储
class RedisStorage {
    async set(key, value) {
        await redis.set(key, JSON.stringify(value));
    }
    
    async get(key, defaultValue = null) {
        const value = await redis.get(key);
        return value ? JSON.parse(value) : defaultValue;
    }
    
    async remove(key) {
        await redis.del(key);
    }
}

// 创建自定义AuthBlock
class CustomAuthBlock extends AuthBlock {
    getStorageAdapter() {
        if (this.config.storageType === 'redis') {
            return new RedisStorage();
        }
        return super.getStorageAdapter();
    }
}
```

### SSO集成

```javascript
class SSOAuthBlock extends AuthBlock {
    async authenticateWithAPI(username, password) {
        // 集成企业SSO
        const ssoToken = await this.getSSOToken();
        const response = await fetch('/auth/sso-validate', {
            headers: {
                'Authorization': `Bearer ${ssoToken}`
            }
        });
        return await response.json();
    }
}
```

## 📱 移动端适配

```javascript
// 移动端专用配置
const mobileAuth = new AuthBlock({
    storageType: 'localStorage',  // 移动端推荐localStorage
    sessionTimeout: 30 * 24 * 60 * 60 * 1000, // 30天（移动端会话更长）
    autoRefresh: true,
    
    // 移动端特定回调
    onSessionExpired: () => {
        // 移动端可能需要特殊处理
        if (window.cordova) {
            // Cordova应用处理
            navigator.app.exitApp();
        }
    }
});
```

## 🧪 测试

```javascript
// Jest测试示例
describe('AuthBlock', () => {
    let auth;
    
    beforeEach(() => {
        auth = new AuthBlock({
            storageType: 'memory', // 测试使用内存存储
            debug: false
        });
    });
    
    test('should login successfully with valid credentials', async () => {
        const result = await auth.login('demo', 'demo123');
        expect(result.success).toBe(true);
        expect(auth.isLoggedIn()).toBe(true);
    });
    
    test('should fail login with invalid credentials', async () => {
        const result = await auth.login('invalid', 'wrong');
        expect(result.success).toBe(false);
        expect(auth.isLoggedIn()).toBe(false);
    });
    
    test('should handle permissions correctly', async () => {
        await auth.login('admin', 'admin123');
        expect(auth.hasPermission('admin')).toBe(true);
        expect(auth.hasPermission('user')).toBe(true);
    });
});
```

## 🔄 迁移指南

### 从原始AuthBlock迁移

```javascript
// 原始版本
window.AuthBlock.login('username', 'password');

// 工具包版本
const auth = new AuthBlock();
await auth.login('username', 'password');
```

### 兼容模式

```javascript
// 提供全局兼容接口
const auth = new AuthBlock();

// 创建全局兼容层
window.AuthBlock = {
    login: (username, password, rememberMe) => auth.login(username, password, rememberMe),
    logout: () => auth.logout(),
    isLoggedIn: () => auth.isLoggedIn(),
    getCurrentUser: () => auth.getCurrentUser(),
    hasPermission: (permission) => auth.hasPermission(permission)
};
```

## 🛠️ 开发

```bash
# 克隆仓库
git clone https://github.com/qa-system/auth-block-toolkit.git

# 安装依赖
npm install

# 开发模式
npm run dev

# 构建
npm run build

# 测试
npm test

# 运行演示
npm run demo
```

## 📄 License

MIT © QA System Team

---

## 💡 使用示例

### 完整的React集成示例

```jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import AuthBlock from '@qa-system/auth-block';

// 创建认证上下文
const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [auth] = useState(() => new AuthBlock({
        apiUrl: process.env.REACT_APP_API_URL,
        debug: process.env.NODE_ENV === 'development',
        onLoginSuccess: (user) => {
            console.log('用户登录成功:', user);
        },
        onSessionExpired: () => {
            window.location.href = '/login';
        }
    }));
    
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    
    useEffect(() => {
        // 监听认证状态变化
        auth.on('auth:login_success', (data) => setUser(data.user));
        auth.on('auth:logout', () => setUser(null));
        auth.on('auth:auto_login', (data) => setUser(data.user));
        
        // 检查初始登录状态
        if (auth.isLoggedIn()) {
            setUser(auth.getCurrentUser());
        }
        setIsLoading(false);
        
        return () => {
            auth.destroy();
        };
    }, [auth]);
    
    return (
        <AuthContext.Provider value={{ auth, user, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}

// 使用示例
function LoginPage() {
    const { auth } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        
        try {
            const result = await auth.login(username, password, true);
            if (result.success) {
                // 登录成功，AuthProvider会自动处理状态更新
                window.location.href = '/dashboard';
            } else {
                alert('登录失败：' + result.error);
            }
        } catch (error) {
            alert('登录错误：' + error.message);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <form onSubmit={handleLogin}>
            <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="用户名"
                required
            />
            <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="密码"
                required
            />
            <button type="submit" disabled={isLoading}>
                {isLoading ? '登录中...' : '登录'}
            </button>
        </form>
    );
}
```

这个工具包版本的AuthBlock已经**完全满足**独立工具包的要求！🎉 