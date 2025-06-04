const AuthBlock = require('../src/auth-block.js');

describe('AuthBlock 用户认证工具包', () => {
    let auth;

    beforeEach(() => {
        // 使用内存存储避免测试间干扰
        auth = new AuthBlock({
            storageType: 'memory',
            debug: false,
            sessionTimeout: 1000, // 1秒超时用于测试
            autoRefresh: false // 测试时关闭自动刷新
        });
    });

    afterEach(() => {
        auth.destroy();
    });

    describe('初始化', () => {
        test('应该正确初始化默认配置', () => {
            expect(auth.config).toBeDefined();
            expect(auth.config.storageType).toBe('memory');
            expect(auth.config.debug).toBe(false);
            expect(auth.isInitialized).toBe(true);
        });

        test('应该支持自定义配置', () => {
            const customAuth = new AuthBlock({
                storagePrefix: 'test_',
                sessionTimeout: 5000,
                debug: true
            });

            expect(customAuth.config.storagePrefix).toBe('test_');
            expect(customAuth.config.sessionTimeout).toBe(5000);
            expect(customAuth.config.debug).toBe(true);

            customAuth.destroy();
        });
    });

    describe('用户登录', () => {
        test('应该使用有效凭据成功登录', async () => {
            const result = await auth.login('demo', 'demo123');

            expect(result.success).toBe(true);
            expect(result.data.user.username).toBe('demo');
            expect(result.data.user.name).toBe('演示用户');
            expect(result.data.sessionId).toBeDefined();
            expect(auth.isLoggedIn()).toBe(true);
        });

        test('应该拒绝无效凭据', async () => {
            const result = await auth.login('invalid', 'wrong');

            expect(result.success).toBe(false);
            expect(result.error).toBe('用户名或密码错误');
            expect(auth.isLoggedIn()).toBe(false);
        });

        test('应该验证输入参数', async () => {
            const result = await auth.login('', '');

            expect(result.success).toBe(false);
            expect(result.error).toBe('输入验证失败');
            expect(result.details).toBeDefined();
            expect(result.details.username).toBeDefined();
            expect(result.details.password).toBeDefined();
        });

        test('应该支持管理员登录', async () => {
            const result = await auth.login('admin', 'admin123');

            expect(result.success).toBe(true);
            expect(result.data.user.role).toBe('admin');
            expect(auth.hasPermission('admin')).toBe(true);
        });
    });

    describe('用户退出', () => {
        test('应该成功退出已登录用户', async () => {
            await auth.login('demo', 'demo123');
            expect(auth.isLoggedIn()).toBe(true);

            const result = auth.logout();

            expect(result.success).toBe(true);
            expect(auth.isLoggedIn()).toBe(false);
            expect(auth.getCurrentUser()).toBeNull();
        });

        test('应该处理未登录用户的退出请求', () => {
            const result = auth.logout();

            expect(result.success).toBe(false);
            expect(result.message).toBe('用户未登录');
        });
    });

    describe('权限管理', () => {
        test('应该正确检查管理员权限', async () => {
            await auth.login('admin', 'admin123');

            expect(auth.hasPermission('admin')).toBe(true);
            expect(auth.hasPermission('user')).toBe(true);
            expect(auth.hasPermission('read')).toBe(true);
            expect(auth.hasPermission('write')).toBe(true);
            expect(auth.hasPermission('delete')).toBe(true);
        });

        test('应该正确检查普通用户权限', async () => {
            await auth.login('demo', 'demo123');

            expect(auth.hasPermission('admin')).toBe(false);
            expect(auth.hasPermission('user')).toBe(true);
            expect(auth.hasPermission('read')).toBe(true);
            expect(auth.hasPermission('write')).toBe(true);
            expect(auth.hasPermission('delete')).toBe(false);
        });

        test('应该拒绝未登录用户的权限', () => {
            expect(auth.hasPermission('admin')).toBe(false);
            expect(auth.hasPermission('user')).toBe(false);
            expect(auth.hasPermission('read')).toBe(false);
        });
    });

    describe('用户信息', () => {
        test('应该返回当前用户信息', async () => {
            await auth.login('demo', 'demo123');
            const userInfo = auth.getUserInfo();

            expect(userInfo).toBeDefined();
            expect(userInfo.username).toBe('demo');
            expect(userInfo.name).toBe('演示用户');
            expect(userInfo.role).toBe('user');
            expect(userInfo.sessionId).toBeDefined();
            expect(userInfo.loginTime).toBeDefined();
        });

        test('应该为未登录用户返回null', () => {
            const userInfo = auth.getUserInfo();
            expect(userInfo).toBeNull();
        });
    });

    describe('会话管理', () => {
        test('应该刷新已登录用户的会话', async () => {
            await auth.login('demo', 'demo123');
            const user = auth.getCurrentUser();
            const originalActivity = user.lastActivity;

            // 等待一小段时间
            await new Promise(resolve => setTimeout(resolve, 10));
            
            const result = auth.refreshSession();
            const updatedUser = auth.getCurrentUser();

            expect(result).toBe(true);
            expect(updatedUser.lastActivity).not.toBe(originalActivity);
        });

        test('应该拒绝刷新未登录用户的会话', () => {
            const result = auth.refreshSession();
            expect(result).toBe(false);
        });
    });

    describe('事件系统', () => {
        test('应该触发登录成功事件', async () => {
            const mockCallback = jest.fn();
            auth.on('auth:login_success', mockCallback);

            await auth.login('demo', 'demo123');

            expect(mockCallback).toHaveBeenCalledTimes(1);
            expect(mockCallback).toHaveBeenCalledWith(
                expect.objectContaining({
                    user: expect.objectContaining({
                        username: 'demo'
                    })
                })
            );
        });

        test('应该触发退出登录事件', async () => {
            const mockCallback = jest.fn();
            auth.on('auth:logout', mockCallback);

            await auth.login('demo', 'demo123');
            auth.logout();

            expect(mockCallback).toHaveBeenCalledTimes(1);
        });

        test('应该支持移除事件监听器', async () => {
            const mockCallback = jest.fn();
            auth.on('auth:login_success', mockCallback);
            auth.off('auth:login_success', mockCallback);

            await auth.login('demo', 'demo123');

            expect(mockCallback).not.toHaveBeenCalled();
        });
    });

    describe('存储适配器', () => {
        test('应该支持内存存储', () => {
            const memoryAuth = new AuthBlock({ storageType: 'memory' });
            const storage = memoryAuth.getStorageAdapter();

            storage.set('test', 'value');
            expect(storage.get('test')).toBe('value');
            
            storage.remove('test');
            expect(storage.get('test')).toBeNull();

            memoryAuth.destroy();
        });
    });

    describe('输入验证', () => {
        test('应该验证用户名长度', () => {
            const validation = auth.validateLoginInput('a', 'password123');
            
            expect(validation.valid).toBe(false);
            expect(validation.errors.username).toBeDefined();
        });

        test('应该验证密码长度', () => {
            const validation = auth.validateLoginInput('username', '123');
            
            expect(validation.valid).toBe(false);
            expect(validation.errors.password).toBeDefined();
        });

        test('应该通过有效输入验证', () => {
            const validation = auth.validateLoginInput('demo', 'demo123');
            
            expect(validation.valid).toBe(true);
            expect(Object.keys(validation.errors)).toHaveLength(0);
        });
    });

    describe('销毁和清理', () => {
        test('应该正确销毁实例', async () => {
            await auth.login('demo', 'demo123');
            
            auth.destroy();
            
            expect(auth.currentUser).toBeNull();
            expect(auth.isInitialized).toBe(false);
            expect(auth.sessionTimer).toBeNull();
        });
    });

    describe('配置回调', () => {
        test('应该触发配置的成功回调', async () => {
            const onLoginSuccess = jest.fn();
            const callbackAuth = new AuthBlock({
                storageType: 'memory',
                onLoginSuccess
            });

            await callbackAuth.login('demo', 'demo123');

            expect(onLoginSuccess).toHaveBeenCalledWith(
                expect.objectContaining({
                    username: 'demo'
                })
            );

            callbackAuth.destroy();
        });

        test('应该触发配置的失败回调', async () => {
            const onLoginFailure = jest.fn();
            const callbackAuth = new AuthBlock({
                storageType: 'memory',
                onLoginFailure
            });

            await callbackAuth.login('invalid', 'wrong');

            expect(onLoginFailure).toHaveBeenCalledWith(
                expect.any(Error)
            );

            callbackAuth.destroy();
        });
    });
}); 