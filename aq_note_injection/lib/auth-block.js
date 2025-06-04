const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const logger = require('./logger');

class AuthBlock {
    constructor(options = {}) {
        this.config = {
            jwtSecret: options.jwtSecret || 'default-secret',
            sessionTimeout: options.sessionTimeout || 7200000, // 2小时
            storageType: options.storageType || 'file',
            dataPath: options.dataPath || './data',
            bcryptRounds: options.bcryptRounds || 12,
            debug: options.debug || false,
            ...options
        };

        this.users = new Map();
        this.sessions = new Map();
        this.permissions = new Map();
        
        this.eventListeners = {
            'user.login': [],
            'user.logout': [],
            'user.register': [],
            'user.update': [],
            'session.create': [],
            'session.destroy': []
        };

        this.init();
        
        if (this.config.debug) {
            logger.info('AuthBlock初始化完成', this.config);
        }
    }

    // 初始化系统
    init() {
        this.ensureDataDirectory();
        this.loadData();
        this.createDefaultAdmin();
        this.createDemoUsers();
        this.setupCleanupTimer();
    }

    // 确保数据目录存在
    ensureDataDirectory() {
        const dataPath = path.resolve(this.config.dataPath);
        if (!fs.existsSync(dataPath)) {
            fs.mkdirSync(dataPath, { recursive: true });
            logger.info(`创建数据目录: ${dataPath}`);
        }
    }

    // 加载存储的数据
    loadData() {
        try {
            const usersFile = path.join(this.config.dataPath, 'users.json');
            const sessionsFile = path.join(this.config.dataPath, 'sessions.json');
            const permissionsFile = path.join(this.config.dataPath, 'permissions.json');

            if (fs.existsSync(usersFile)) {
                const userData = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
                this.users = new Map(userData);
                logger.info(`加载用户数据: ${this.users.size} 个用户`);
            }

            if (fs.existsSync(sessionsFile)) {
                const sessionData = JSON.parse(fs.readFileSync(sessionsFile, 'utf8'));
                this.sessions = new Map(sessionData);
                logger.info(`加载会话数据: ${this.sessions.size} 个会话`);
            }

            if (fs.existsSync(permissionsFile)) {
                const permissionData = JSON.parse(fs.readFileSync(permissionsFile, 'utf8'));
                this.permissions = new Map(permissionData);
            }
        } catch (error) {
            logger.error('加载数据失败:', error);
        }
    }

    // 保存数据到文件
    saveData() {
        try {
            const usersFile = path.join(this.config.dataPath, 'users.json');
            const sessionsFile = path.join(this.config.dataPath, 'sessions.json');
            const permissionsFile = path.join(this.config.dataPath, 'permissions.json');

            fs.writeFileSync(usersFile, JSON.stringify([...this.users], null, 2));
            fs.writeFileSync(sessionsFile, JSON.stringify([...this.sessions], null, 2));
            fs.writeFileSync(permissionsFile, JSON.stringify([...this.permissions], null, 2));
            
            if (this.config.debug) {
                logger.info('数据保存成功');
            }
        } catch (error) {
            logger.error('保存数据失败:', error);
        }
    }

    // 创建默认管理员
    createDefaultAdmin() {
        const adminConfig = this.config.defaultAdmin;
        if (adminConfig && !this.users.has(adminConfig.username)) {
            const hashedPassword = bcrypt.hashSync(adminConfig.password, this.config.bcryptRounds);
            
            const admin = {
                id: 'admin',
                username: adminConfig.username,
                password: hashedPassword,
                name: adminConfig.name || '系统管理员',
                email: adminConfig.email || 'admin@authblock.local',
                role: 'admin',
                permissions: ['*'],
                createdAt: new Date().toISOString(),
                lastLogin: null,
                active: true
            };

            this.users.set(adminConfig.username, admin);
            this.saveData();
            logger.info(`创建默认管理员: ${adminConfig.username}`);
        }
    }

    // 创建演示用户
    createDemoUsers() {
        const demoUsers = this.config.demoUsers || [];
        demoUsers.forEach(userConfig => {
            if (!this.users.has(userConfig.username)) {
                const hashedPassword = bcrypt.hashSync(userConfig.password, this.config.bcryptRounds);
                
                const user = {
                    id: userConfig.id || userConfig.username,
                    username: userConfig.username,
                    password: hashedPassword,
                    name: userConfig.name,
                    email: userConfig.email,
                    role: userConfig.role || 'user',
                    permissions: userConfig.permissions || [],
                    createdAt: new Date().toISOString(),
                    lastLogin: null,
                    active: true
                };

                this.users.set(userConfig.username, user);
                logger.info(`创建演示用户: ${userConfig.username}`);
            }
        });
        
        if (demoUsers.length > 0) {
            this.saveData();
        }
    }

    // 用户登录
    async login(username, password) {
        try {
            const user = this.users.get(username);
            if (!user) {
                throw new Error('用户不存在');
            }

            if (!user.active) {
                throw new Error('用户已被禁用');
            }

            const isValidPassword = bcrypt.compareSync(password, user.password);
            if (!isValidPassword) {
                throw new Error('密码错误');
            }

            // 生成JWT令牌
            const token = jwt.sign(
                { 
                    userId: user.id,
                    username: user.username,
                    role: user.role 
                },
                this.config.jwtSecret,
                { expiresIn: this.config.sessionTimeout / 1000 }
            );

            // 创建会话
            const sessionId = this.generateSessionId();
            const session = {
                id: sessionId,
                userId: user.id,
                username: user.username,
                token: token,
                createdAt: new Date().toISOString(),
                expiresAt: new Date(Date.now() + this.config.sessionTimeout).toISOString(),
                lastAccess: new Date().toISOString(),
                userAgent: null,
                ip: null
            };

            this.sessions.set(sessionId, session);

            // 更新用户最后登录时间
            user.lastLogin = new Date().toISOString();
            this.users.set(username, user);
            
            this.saveData();

            // 触发事件
            this.emit('user.login', { user, session });
            this.emit('session.create', { session });

            logger.info(`用户登录成功: ${username}`);

            return {
                success: true,
                token: token,
                sessionId: sessionId,
                user: {
                    id: user.id,
                    username: user.username,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    permissions: user.permissions
                },
                expiresAt: session.expiresAt
            };

        } catch (error) {
            logger.warn(`登录失败: ${username} - ${error.message}`);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // 用户登出
    async logout(token) {
        try {
            const decoded = jwt.verify(token, this.config.jwtSecret);
            const session = this.findSessionByToken(token);
            
            if (session) {
                this.sessions.delete(session.id);
                this.saveData();
                
                this.emit('user.logout', { userId: decoded.userId, session });
                this.emit('session.destroy', { session });
                
                logger.info(`用户登出: ${decoded.username}`);
            }

            return { success: true };
        } catch (error) {
            logger.warn(`登出失败: ${error.message}`);
            return { success: false, error: error.message };
        }
    }

    // 验证令牌
    async verifyToken(token) {
        try {
            const decoded = jwt.verify(token, this.config.jwtSecret);
            const session = this.findSessionByToken(token);
            
            if (!session) {
                throw new Error('会话不存在');
            }

            // 检查会话是否过期
            if (new Date() > new Date(session.expiresAt)) {
                this.sessions.delete(session.id);
                this.saveData();
                throw new Error('会话已过期');
            }

            // 更新最后访问时间
            session.lastAccess = new Date().toISOString();
            this.sessions.set(session.id, session);

            const user = this.users.get(decoded.username);
            if (!user || !user.active) {
                throw new Error('用户不可用');
            }

            return {
                success: true,
                user: {
                    id: user.id,
                    username: user.username,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    permissions: user.permissions
                },
                session: session
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // 获取用户信息
    getUser(username) {
        const user = this.users.get(username);
        if (!user) return null;

        const { password, ...userInfo } = user;
        return userInfo;
    }

    // 生成会话ID
    generateSessionId() {
        return require('crypto').randomBytes(32).toString('hex');
    }

    // 通过令牌查找会话
    findSessionByToken(token) {
        for (const [sessionId, session] of this.sessions) {
            if (session.token === token) {
                return session;
            }
        }
        return null;
    }

    // 清理过期会话
    cleanupExpiredSessions() {
        const now = new Date();
        let cleanedCount = 0;

        for (const [sessionId, session] of this.sessions) {
            if (now > new Date(session.expiresAt)) {
                this.sessions.delete(sessionId);
                cleanedCount++;
            }
        }

        if (cleanedCount > 0) {
            this.saveData();
            logger.info(`清理过期会话: ${cleanedCount} 个`);
        }
    }

    // 设置定时清理
    setupCleanupTimer() {
        setInterval(() => {
            this.cleanupExpiredSessions();
        }, 60000); // 每分钟清理一次
    }

    // 事件监听
    on(event, callback) {
        if (this.eventListeners[event]) {
            this.eventListeners[event].push(callback);
        }
    }

    // 触发事件
    emit(event, data) {
        if (this.eventListeners[event]) {
            this.eventListeners[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    logger.error(`事件处理错误 [${event}]:`, error);
                }
            });
        }
    }

    // 获取统计信息
    getStats() {
        const now = new Date();
        const activeSessionsCount = [...this.sessions.values()]
            .filter(session => now <= new Date(session.expiresAt)).length;

        return {
            totalUsers: this.users.size,
            activeSessions: activeSessionsCount,
            totalSessions: this.sessions.size,
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            timestamp: now.toISOString()
        };
    }
}

module.exports = AuthBlock; 