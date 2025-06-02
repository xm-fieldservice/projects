const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const AuthBlock = require('./lib/auth-block');
const config = require('./config/server.json');
const logger = require('./lib/logger');

// 初始化Express应用
const app = express();

// 创建AuthBlock实例
const authBlock = new AuthBlock({
    ...config.auth,
    debug: config.nodeEnv !== 'production'
});

// 确保数据目录存在
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// 安全中间件
app.use(helmet({
    contentSecurityPolicy: false, // 允许演示页面
    crossOriginEmbedderPolicy: false
}));

// CORS配置
app.use(cors({
    origin: config.cors.origin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// 速率限制
const limiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    message: {
        error: 'Too many requests from this IP, please try again later.',
        code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false
});
app.use('/api/', limiter);

// 请求解析
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 请求日志中间件
app.use((req, res, next) => {
    const startTime = Date.now();
    
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        logger.info('HTTP Request', {
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip,
            userAgent: req.get('User-Agent')
        });
    });
    
    next();
});

// 健康检查端点
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: require('./package.json').version,
        node: process.version,
        environment: config.nodeEnv
    });
});

// API路由
app.use('/api', require('./routes/api')(authBlock));

// 静态文件服务（演示页面）
app.use('/demo', express.static(path.join(__dirname, 'demo')));

// 根路径重定向到演示页面
app.get('/', (req, res) => {
    res.redirect('/demo');
});

// 404处理
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'API endpoint not found',
        code: 'NOT_FOUND',
        path: req.originalUrl,
        availableEndpoints: [
            'GET /health',
            'GET /demo',
            'POST /api/auth/login',
            'POST /api/auth/logout',
            'GET /api/auth/user',
            'POST /api/auth/refresh'
        ]
    });
});

// 错误处理中间件
app.use((err, req, res, next) => {
    logger.error('Server error:', {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        body: req.body
    });

    const status = err.status || 500;
    const message = config.nodeEnv === 'production' 
        ? 'Internal server error' 
        : err.message;

    res.status(status).json({
        error: message,
        code: err.code || 'INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
        ...(config.nodeEnv !== 'production' && { 
            stack: err.stack,
            details: err.details 
        })
    });
});

// 启动服务器
const PORT = config.port || 3000;
const HOST = config.host || '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
    logger.info('🚀 AuthBlock服务器启动成功', {
        port: PORT,
        host: HOST,
        environment: config.nodeEnv,
        pid: process.pid
    });
    
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║                   AuthBlock 权限系统服务器                    ║
╠══════════════════════════════════════════════════════════════╣
║  🌍 服务地址: http://${HOST}:${PORT}                          ║
║  📊 健康检查: http://${HOST}:${PORT}/health                   ║
║  🎯 演示页面: http://${HOST}:${PORT}/demo                     ║
║  📝 API文档:  http://${HOST}:${PORT}/api                      ║
║  🌟 环境模式: ${config.nodeEnv}                               ║
║  📁 数据目录: ${dataDir}                        ║
╚══════════════════════════════════════════════════════════════╝
    `);
});

// 优雅关闭处理
const gracefulShutdown = (signal) => {
    logger.info(`${signal} received, shutting down gracefully`);
    
    server.close((err) => {
        if (err) {
            logger.error('Error during server shutdown:', err);
            process.exit(1);
        }
        
        logger.info('Server closed successfully');
        process.exit(0);
    });
    
    // 强制退出（30秒后）
    setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 30000);
};

// 注册信号处理
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// 未捕获异常处理
process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception:', {
        error: err.message,
        stack: err.stack
    });
    gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection:', {
        reason: reason,
        promise: promise
    });
    gracefulShutdown('UNHANDLED_REJECTION');
});

module.exports = app; 