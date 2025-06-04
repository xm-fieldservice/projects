const express = require('express');
const logger = require('../lib/logger');

module.exports = function(authBlock) {
    const router = express.Router();

    // 中间件：提取Bearer令牌
    const extractToken = (req, res, next) => {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            req.token = authHeader.substring(7);
        }
        next();
    };

    // 中间件：验证令牌
    const verifyToken = async (req, res, next) => {
        if (!req.token) {
            return res.status(401).json({
                error: 'Missing authentication token',
                code: 'MISSING_TOKEN'
            });
        }

        const result = await authBlock.verifyToken(req.token);
        if (!result.success) {
            return res.status(401).json({
                error: result.error,
                code: 'INVALID_TOKEN'
            });
        }

        req.user = result.user;
        req.session = result.session;
        next();
    };

    // 中间件：检查管理员权限
    const requireAdmin = (req, res, next) => {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                error: 'Admin access required',
                code: 'INSUFFICIENT_PERMISSIONS'
            });
        }
        next();
    };

    // API文档根路径
    router.get('/', (req, res) => {
        res.json({
            name: 'AuthBlock API',
            version: '1.0.0',
            description: 'AuthBlock 权限系统 API 接口',
            endpoints: {
                auth: {
                    'POST /auth/login': '用户登录',
                    'POST /auth/logout': '用户登出',
                    'GET /auth/user': '获取当前用户信息',
                    'POST /auth/refresh': '刷新令牌'
                },
                admin: {
                    'GET /admin/stats': '获取系统统计',
                    'GET /admin/users': '获取用户列表',
                    'GET /admin/sessions': '获取会话列表'
                }
            },
            authentication: {
                type: 'Bearer Token',
                header: 'Authorization: Bearer <token>'
            }
        });
    });

    // ============ 认证相关接口 ============

    // 用户登录
    router.post('/auth/login', async (req, res) => {
        try {
            const { username, password } = req.body;

            if (!username || !password) {
                return res.status(400).json({
                    error: 'Username and password are required',
                    code: 'MISSING_CREDENTIALS'
                });
            }

            const result = await authBlock.login(username, password);

            if (result.success) {
                res.json({
                    success: true,
                    message: '登录成功',
                    data: {
                        token: result.token,
                        user: result.user,
                        expiresAt: result.expiresAt
                    }
                });

                logger.auth('login', username, true, {
                    ip: req.ip,
                    userAgent: req.get('User-Agent')
                });
            } else {
                res.status(401).json({
                    error: result.error,
                    code: 'LOGIN_FAILED'
                });

                logger.auth('login', username, false, {
                    error: result.error,
                    ip: req.ip
                });
            }

        } catch (error) {
            logger.error('Login error:', error);
            res.status(500).json({
                error: 'Internal server error',
                code: 'SERVER_ERROR'
            });
        }
    });

    // 用户登出
    router.post('/auth/logout', extractToken, async (req, res) => {
        try {
            if (req.token) {
                const result = await authBlock.logout(req.token);
                
                if (result.success) {
                    logger.auth('logout', req.user?.username || 'unknown', true);
                }
            }

            res.json({
                success: true,
                message: '登出成功'
            });

        } catch (error) {
            logger.error('Logout error:', error);
            res.status(500).json({
                error: 'Internal server error',
                code: 'SERVER_ERROR'
            });
        }
    });

    // 获取当前用户信息
    router.get('/auth/user', extractToken, verifyToken, (req, res) => {
        res.json({
            success: true,
            data: {
                user: req.user,
                session: {
                    id: req.session.id,
                    createdAt: req.session.createdAt,
                    expiresAt: req.session.expiresAt,
                    lastAccess: req.session.lastAccess
                }
            }
        });
    });

    // 刷新令牌
    router.post('/auth/refresh', extractToken, verifyToken, async (req, res) => {
        try {
            // 先登出当前会话
            await authBlock.logout(req.token);
            
            // 重新登录生成新令牌
            const user = authBlock.getUser(req.user.username);
            if (!user) {
                return res.status(401).json({
                    error: 'User not found',
                    code: 'USER_NOT_FOUND'
                });
            }

            // 这里简化处理，实际应该有更安全的刷新机制
            res.json({
                success: true,
                message: '请重新登录以获取新令牌',
                code: 'RELOGIN_REQUIRED'
            });

        } catch (error) {
            logger.error('Token refresh error:', error);
            res.status(500).json({
                error: 'Internal server error',
                code: 'SERVER_ERROR'
            });
        }
    });

    // ============ 管理员接口 ============

    // 获取系统统计
    router.get('/admin/stats', extractToken, verifyToken, requireAdmin, (req, res) => {
        try {
            const stats = authBlock.getStats();
            
            res.json({
                success: true,
                data: stats
            });

        } catch (error) {
            logger.error('Stats error:', error);
            res.status(500).json({
                error: 'Internal server error',
                code: 'SERVER_ERROR'
            });
        }
    });

    // 获取用户列表
    router.get('/admin/users', extractToken, verifyToken, requireAdmin, (req, res) => {
        try {
            const users = [];
            for (const [username, user] of authBlock.users) {
                const { password, ...userInfo } = user;
                users.push(userInfo);
            }

            res.json({
                success: true,
                data: {
                    users: users,
                    total: users.length
                }
            });

        } catch (error) {
            logger.error('Users list error:', error);
            res.status(500).json({
                error: 'Internal server error',
                code: 'SERVER_ERROR'
            });
        }
    });

    // 获取会话列表
    router.get('/admin/sessions', extractToken, verifyToken, requireAdmin, (req, res) => {
        try {
            const sessions = [...authBlock.sessions.values()];
            const now = new Date();
            
            const sessionList = sessions.map(session => ({
                ...session,
                isActive: now <= new Date(session.expiresAt),
                token: '***' // 隐藏令牌
            }));

            res.json({
                success: true,
                data: {
                    sessions: sessionList,
                    total: sessionList.length,
                    active: sessionList.filter(s => s.isActive).length
                }
            });

        } catch (error) {
            logger.error('Sessions list error:', error);
            res.status(500).json({
                error: 'Internal server error',
                code: 'SERVER_ERROR'
            });
        }
    });

    // ============ 测试接口 ============

    // 测试接口（无需认证）
    router.get('/test', (req, res) => {
        res.json({
            success: true,
            message: 'API is working',
            timestamp: new Date().toISOString(),
            version: require('../package.json').version
        });
    });

    // 认证测试接口
    router.get('/test/auth', extractToken, verifyToken, (req, res) => {
        res.json({
            success: true,
            message: 'Authentication successful',
            user: req.user,
            timestamp: new Date().toISOString()
        });
    });

    // 管理员测试接口
    router.get('/test/admin', extractToken, verifyToken, requireAdmin, (req, res) => {
        res.json({
            success: true,
            message: 'Admin access successful',
            user: req.user,
            timestamp: new Date().toISOString()
        });
    });

    return router;
}; 