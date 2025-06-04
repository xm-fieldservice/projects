const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3001; // 使用3001端口避免冲突

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务
app.use('/auth-block', express.static(path.join(__dirname, 'auth-block')));
app.use('/qa-note-block', express.static(path.join(__dirname, 'qa-note-block')));
app.use('/ui-block', express.static(path.join(__dirname, 'ui-block')));
app.use('/deploy-block', express.static(path.join(__dirname, 'deploy-block')));
app.use('/shared', express.static(path.join(__dirname, 'shared')));

// 根路径重定向到主界面
app.get('/', (req, res) => {
    res.redirect('/ui-block/index.html');
});

// 健康检查
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        port: PORT,
        timestamp: new Date().toISOString(),
        service: 'QA System v3.0 - 完整集成版',
        modules: {
            'auth-block': '认证模块',
            'qa-note-block': '问答笔记模块',
            'ui-block': '界面协调模块',
            'deploy-block': '部署管理模块'
        }
    });
});

// 简单的认证API模拟
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    
    // 简单的模拟用户数据
    const users = {
        'admin': { password: 'admin123', role: 'admin', name: '管理员' },
        'user': { password: 'user123', role: 'user', name: '普通用户' },
        'demo': { password: 'demo123', role: 'demo', name: '演示用户' }
    };
    
    const user = users[username];
    if (user && user.password === password) {
        res.json({
            success: true,
            token: 'mock-jwt-token-' + Date.now(),
            user: {
                username: username,
                name: user.name,
                role: user.role
            }
        });
    } else {
        res.status(401).json({
            success: false,
            message: '用户名或密码错误'
        });
    }
});

app.get('/api/auth/user', (req, res) => {
    res.json({
        success: true,
        user: {
            username: 'demo',
            name: '演示用户',
            role: 'user'
        }
    });
});

app.post('/api/auth/logout', (req, res) => {
    res.json({ success: true, message: '退出成功' });
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║               智能问答系统 v3.0 - 完整集成版                   ║
╠══════════════════════════════════════════════════════════════╣
║  🌍 主界面: http://localhost:${PORT}                          ║
║  🔐 认证模块: http://localhost:${PORT}/auth-block/auth.html    ║
║  🤖 问答模块: http://localhost:${PORT}/qa-note-block/qa-note.html ║
║  📊 健康检查: http://localhost:${PORT}/health                 ║
║  ⚙️ 管理界面: http://localhost:${PORT}/deploy-block/admin.html ║
╠══════════════════════════════════════════════════════════════╣
║  📝 测试账户:                                                 ║
║     admin / admin123 (管理员)                                ║
║     user / user123 (普通用户)                                ║
║     demo / demo123 (演示用户)                                ║
╚══════════════════════════════════════════════════════════════╝
    `);
});

process.on('SIGTERM', () => {
    console.log('Server shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('\nServer shutting down gracefully...');
    process.exit(0);
}); 