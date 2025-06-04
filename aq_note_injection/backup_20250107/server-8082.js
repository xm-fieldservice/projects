const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 8082;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// 静态文件服务
app.use('/qa-note-block', express.static(path.join(__dirname, 'qa-note-block')));
app.use('/shared', express.static(path.join(__dirname, 'shared')));

// 主页重定向到qa-note-block
app.get('/', (req, res) => {
    res.redirect('/qa-note-block/qa-note.html');
});

// 健康检查
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        port: PORT,
        timestamp: new Date().toISOString(),
        service: 'QA Note Block Server'
    });
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    QA Note Block 服务器                       ║
╠══════════════════════════════════════════════════════════════╣
║  🌍 服务地址: http://localhost:${PORT}                        ║
║  📝 问答页面: http://localhost:${PORT}/qa-note-block/qa-note.html ║
║  📊 健康检查: http://localhost:${PORT}/health                 ║
╚══════════════════════════════════════════════════════════════╝
    `);
});

process.on('SIGTERM', () => {
    console.log('Server shutting down gracefully...');
    process.exit(0);
}); 