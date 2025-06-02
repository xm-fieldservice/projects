module.exports = {
    // 服务器配置
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    
    // CORS配置
    cors: {
        origin: process.env.CORS_ORIGIN || '*',
        credentials: true
    },
    
    // JWT配置
    jwt: {
        secret: process.env.JWT_SECRET || 'your-super-secret-key-change-in-production',
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
        issuer: 'AuthBlock',
        audience: 'AuthBlock-Users'
    },
    
    // 认证配置
    auth: {
        sessionTimeout: parseInt(process.env.SESSION_TIMEOUT) || 7200000, // 2小时
        maxLoginAttempts: 5,
        lockoutTime: 15 * 60 * 1000, // 15分钟
        passwordMinLength: 6,
        passwordMaxLength: 128,
        
        // 存储配置
        storage: {
            type: process.env.STORAGE_TYPE || 'file', // 'file' | 'redis' | 'memory'
            filePath: process.env.DATA_PATH || './data',
            redis: {
                host: process.env.REDIS_HOST || 'redis',
                port: process.env.REDIS_PORT || 6379,
                password: process.env.REDIS_PASSWORD || null,
                db: process.env.REDIS_DB || 0
            }
        },
        
        // 默认管理员账户
        defaultAdmin: {
            username: process.env.ADMIN_USERNAME || 'admin',
            password: process.env.ADMIN_PASSWORD || 'admin123',
            name: process.env.ADMIN_NAME || '系统管理员',
            email: process.env.ADMIN_EMAIL || 'admin@authblock.local'
        },
        
        // 演示用户（仅开发环境）
        demoUsers: [
            {
                id: 1,
                username: 'demo',
                password: 'demo123',
                name: '演示用户',
                role: 'user',
                email: 'demo@authblock.local'
            },
            {
                id: 2,
                username: 'test',
                password: 'test123',
                name: '测试用户',
                role: 'user',
                email: 'test@authblock.local'
            }
        ]
    },
    
    // 日志配置
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        format: process.env.LOG_FORMAT || 'json',
        file: {
            enabled: process.env.LOG_FILE_ENABLED === 'true',
            path: process.env.LOG_FILE_PATH || './logs/authblock.log',
            maxSize: process.env.LOG_MAX_SIZE || '10m',
            maxFiles: process.env.LOG_MAX_FILES || '5'
        }
    },
    
    // 安全配置
    security: {
        helmet: {
            contentSecurityPolicy: false, // 允许演示页面
            crossOriginEmbedderPolicy: false
        },
        rateLimit: {
            windowMs: 15 * 60 * 1000, // 15分钟
            max: 100, // 每个IP最多100请求
            standardHeaders: true,
            legacyHeaders: false
        }
    },
    
    // 健康检查配置
    healthCheck: {
        timeout: 5000,
        checks: {
            storage: true,
            memory: true,
            uptime: true
        }
    }
}; 