const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const AuthBlockAPI = require('./auth-api');
const config = require('../config/server-config');
const logger = require('./utils/logger');

const app = express();
const authAPI = new AuthBlockAPI(config.auth);

// 安全中间件
app.use(helmet());
app.use(cors({
    origin: config.cors.origin,
    credentials: true
}));

// 速率限制
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 100, // 限制每个IP 100个请求
    message: {
        error: 'Too many requests from this IP, please try again later.',
        code: 'RATE_LIMIT_EXCEEDED'
    }
});
app.use('/api/', limiter);

// 请求解析
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 请求日志
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
    });
    next();
});

// 健康检查
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: require('../package.json').version
    });
});

// API路由
app.use('/api/auth', require('./routes/auth'));
app.use('/api/user', require('./routes/user'));
app.use('/api/permission', require('./routes/permission'));

// 静态文件（演示页面）
app.use('/demo', express.static('demo'));

// 404处理
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'API endpoint not found',
        code: 'NOT_FOUND',
        path: req.originalUrl
    });
});

// 错误处理中间件
app.use((err, req, res, next) => {
    logger.error('Server error:', {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method
    });

    const status = err.status || 500;
    const message = config.nodeEnv === 'production' 
        ? 'Internal server error' 
        : err.message;

    res.status(status).json({
        error: message,
        code: err.code || 'INTERNAL_ERROR',
        ...(config.nodeEnv !== 'production' && { stack: err.stack })
    });
});

// 启动服务器
const PORT = config.port || 3000;
const server = app.listen(PORT, () => {
    logger.info(`🚀 AuthBlock服务启动成功`);
    logger.info(`📍 监听端口: ${PORT}`);
    logger.info(`🌍 环境: ${config.nodeEnv}`);
    logger.info(`📊 健康检查: http://localhost:${PORT}/health`);
    logger.info(`🎯 API文档: http://localhost:${PORT}/demo`);
});

// 优雅关闭
process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    server.close(() => {
        logger.info('Process terminated');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully');
    server.close(() => {
        logger.info('Process terminated');
        process.exit(0);
    });
});

module.exports = app; 