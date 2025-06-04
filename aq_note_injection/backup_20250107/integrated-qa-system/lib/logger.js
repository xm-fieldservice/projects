const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const fs = require('fs');

// 确保日志目录存在
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

// 自定义日志格式
const logFormat = winston.format.combine(
    winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
        let log = `${timestamp} [${level.toUpperCase()}] ${message}`;
        
        // 添加元数据
        if (Object.keys(meta).length > 0) {
            log += ` ${JSON.stringify(meta)}`;
        }
        
        // 添加错误堆栈
        if (stack) {
            log += `\n${stack}`;
        }
        
        return log;
    })
);

// 控制台格式（带颜色）
const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({
        format: 'HH:mm:ss'
    }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let log = `${timestamp} [${level}] ${message}`;
        
        if (Object.keys(meta).length > 0) {
            log += ` ${JSON.stringify(meta, null, 2)}`;
        }
        
        return log;
    })
);

// 日志传输器配置
const transports = [];

// 控制台输出
transports.push(
    new winston.transports.Console({
        level: process.env.LOG_LEVEL || 'info',
        format: consoleFormat,
        handleExceptions: true,
        handleRejections: true
    })
);

// 文件输出 - 综合日志
transports.push(
    new DailyRotateFile({
        filename: path.join(logDir, 'authblock-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        level: 'info',
        format: logFormat,
        maxSize: '10m',
        maxFiles: '7d',
        handleExceptions: true,
        handleRejections: true
    })
);

// 文件输出 - 错误日志
transports.push(
    new DailyRotateFile({
        filename: path.join(logDir, 'error-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        level: 'error',
        format: logFormat,
        maxSize: '10m',
        maxFiles: '30d'
    })
);

// 创建logger实例
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    transports: transports,
    exitOnError: false
});

// 添加自定义方法
logger.request = (req, res, duration) => {
    logger.info('HTTP Request', {
        method: req.method,
        url: req.originalUrl,
        status: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent')
    });
};

logger.auth = (action, username, success, details = {}) => {
    const level = success ? 'info' : 'warn';
    logger[level](`Auth ${action}`, {
        username,
        success,
        ...details
    });
};

logger.security = (event, details = {}) => {
    logger.warn(`Security Event: ${event}`, details);
};

logger.performance = (operation, duration, details = {}) => {
    logger.info(`Performance: ${operation}`, {
        duration: `${duration}ms`,
        ...details
    });
};

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection:', {
        reason: reason,
        promise: promise
    });
});

// 优雅关闭时清理
process.on('SIGINT', () => {
    logger.info('收到SIGINT信号，正在关闭日志系统...');
    logger.end(() => {
        console.log('日志系统已关闭');
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    logger.info('收到SIGTERM信号，正在关闭日志系统...');
    logger.end(() => {
        console.log('日志系统已关闭');
        process.exit(0);
    });
});

module.exports = logger; 