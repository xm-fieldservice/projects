/**
 * Teams 智能体团队协作系统 - 后端服务器
 * 支持多种智能体类型，包括 rag_team (主要)
 * 端口: 8001
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

const app = express();
const PORT = 8001;
const HOST = '0.0.0.0';

// 智能体团队配置
const TEAMS_CONFIG = {
    dev_team: [
        { name: '张开发', role: 'lead', status: 'online', expertise: ['架构设计', '后端开发'] },
        { name: '李程序', role: 'backend', status: 'offline', expertise: ['API开发', '数据库'] },
        { name: '王前端', role: 'frontend', status: 'online', expertise: ['前端开发', 'UI交互'] }
    ],
    design_team: [
        { name: '刘设计', role: 'ui', status: 'online', expertise: ['UI设计', '用户体验'] },
        { name: '陈UI', role: 'visual', status: 'online', expertise: ['视觉设计', '品牌'] }
    ],
    product_team: [
        { name: '赵产品', role: 'manager', status: 'online', expertise: ['产品规划', '需求分析'] },
        { name: '孙运营', role: 'operation', status: 'offline', expertise: ['运营策略', '数据分析'] }
    ]
};

// 智能体配置
const AGENT_CONFIGS = {
    rag_team: {
        name: 'RAG团队协作',
        type: 'rag_team',
        description: '多智能体协作的专业团队',
        capabilities: ['团队协作', '深度分析', '多角度回答'],
        teams: TEAMS_CONFIG,
        status: 'active'
    },
    general: {
        name: '通用助手',
        type: 'single',
        description: '通用AI助手，适合日常问答',
        capabilities: ['问答', '对话', '文本生成'],
        status: 'active'
    },
    rag_single: {
        name: 'RAG知识助手',
        type: 'rag_single', 
        description: '具备知识检索能力的专业助手',
        capabilities: ['知识检索', '专业问答', '文档理解'],
        status: 'active'
    },
    code_assistant: {
        name: '代码助手',
        type: 'single',
        description: '专业的编程和技术助手',
        capabilities: ['代码生成', '技术问答', '调试建议'],
        status: 'active'
    },
    writing_assistant: {
        name: '写作助手',
        type: 'single',
        description: '专业的文档和写作助手',
        capabilities: ['文档写作', '内容优化', '格式调整'],
        status: 'active'
    }
};

// 会话存储
const sessions = new Map();

// 中间件配置
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));

app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Session-ID', 'X-Agent-Type']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 请求日志中间件
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path} - ${req.ip}`);
    next();
});

// 健康检查端点
app.get('/api/health', (req, res) => {
    const healthData = {
        status: 'healthy',
        service: 'Teams智能体协作系统',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '1.0.0',
        agents: {
            total: Object.keys(AGENT_CONFIGS).length,
            active: Object.values(AGENT_CONFIGS).filter(a => a.status === 'active').length,
            primary: 'rag_team'
        },
        teams: {
            total_teams: Object.keys(TEAMS_CONFIG).length,
            total_members: Object.values(TEAMS_CONFIG).reduce((sum, team) => sum + team.length, 0),
            online_members: Object.values(TEAMS_CONFIG)
                .flat()
                .filter(member => member.status === 'online').length
        }
    };
    
    res.json(healthData);
});

// RAG团队协作智能体端点 (主要智能体)
app.post('/api/rag/team', async (req, res) => {
    try {
        const { session_id, question, title, context = {}, options = {} } = req.body;
        
        if (!question || !question.trim()) {
            return res.status(400).json({
                error: '问题不能为空',
                code: 'EMPTY_QUESTION'
            });
        }

        // 获取或创建会话
        if (!sessions.has(session_id)) {
            sessions.set(session_id, {
                id: session_id,
                created_at: new Date(),
                agent_type: 'rag_team',
                conversation_history: [],
                team_context: TEAMS_CONFIG
            });
        }

        const session = sessions.get(session_id);

        // 模拟团队协作分析
        const teamAnalysis = await simulateTeamCollaboration(question, context, TEAMS_CONFIG);
        
        // 构造团队回答
        const teamResponse = {
            answer: teamAnalysis.finalAnswer,
            team_perspectives: teamAnalysis.perspectives,
            contributing_members: teamAnalysis.contributors,
            confidence_score: teamAnalysis.confidence,
            reasoning: teamAnalysis.reasoning
        };

        // 保存到会话历史
        session.conversation_history.push({
            timestamp: new Date(),
            question: question,
            title: title,
            context: context,
            response: teamResponse
        });

        // 响应数据
        const responseData = {
            success: true,
            session_id: session_id,
            agent_type: 'rag_team',
            question: question,
            ...teamResponse,
            metadata: {
                timestamp: new Date().toISOString(),
                processing_time: teamAnalysis.processingTime,
                session_length: session.conversation_history.length,
                active_teams: Object.keys(TEAMS_CONFIG).length,
                online_members: Object.values(TEAMS_CONFIG)
                    .flat()
                    .filter(m => m.status === 'online').length
            }
        };

        res.json(responseData);

    } catch (error) {
        console.error('RAG团队处理错误:', error);
        res.status(500).json({
            error: '团队协作处理失败',
            code: 'TEAM_PROCESSING_ERROR',
            message: error.message
        });
    }
});

// 其他智能体端点
app.post('/api/general', async (req, res) => {
    const response = await processGeneralAgent(req.body);
    res.json(response);
});

app.post('/api/rag/single', async (req, res) => {
    const response = await processRagSingleAgent(req.body);
    res.json(response);
});

app.post('/api/code', async (req, res) => {
    const response = await processCodeAgent(req.body);
    res.json(response);
});

app.post('/api/writing', async (req, res) => {
    const response = await processWritingAgent(req.body);
    res.json(response);
});

// 团队状态查询端点
app.get('/api/teams/status', (req, res) => {
    res.json({
        teams: TEAMS_CONFIG,
        summary: {
            total_teams: Object.keys(TEAMS_CONFIG).length,
            total_members: Object.values(TEAMS_CONFIG).reduce((sum, team) => sum + team.length, 0),
            online_count: Object.values(TEAMS_CONFIG)
                .flat()
                .filter(member => member.status === 'online').length,
            offline_count: Object.values(TEAMS_CONFIG)
                .flat()
                .filter(member => member.status === 'offline').length
        }
    });
});

// 智能体配置查询端点
app.get('/api/agents/config', (req, res) => {
    res.json({
        agents: AGENT_CONFIGS,
        primary_agent: 'rag_team'
    });
});

// 会话历史查询
app.get('/api/sessions/:sessionId/history', (req, res) => {
    const sessionId = req.params.sessionId;
    const session = sessions.get(sessionId);
    
    if (!session) {
        return res.status(404).json({
            error: '会话未找到',
            code: 'SESSION_NOT_FOUND'
        });
    }
    
    res.json({
        session_id: sessionId,
        conversation_history: session.conversation_history,
        agent_type: session.agent_type,
        created_at: session.created_at
    });
});

// 模拟团队协作函数
async function simulateTeamCollaboration(question, context, teams) {
    const startTime = Date.now();
    
    // 根据问题类型分配相关团队成员
    const relevantMembers = [];
    const perspectives = [];
    
    // 开发团队视角
    if (question.toLowerCase().includes('技术') || question.toLowerCase().includes('开发') || 
        question.toLowerCase().includes('代码') || question.toLowerCase().includes('架构')) {
        const devTeam = teams.dev_team.filter(m => m.status === 'online');
        relevantMembers.push(...devTeam);
        perspectives.push({
            team: '开发团队',
            members: devTeam.map(m => m.name),
            perspective: `从技术实现角度分析: ${question}`,
            insights: [
                '技术可行性评估',
                '架构设计建议', 
                '开发难度分析',
                '性能优化建议'
            ]
        });
    }
    
    // 设计团队视角
    if (question.toLowerCase().includes('设计') || question.toLowerCase().includes('用户') || 
        question.toLowerCase().includes('界面') || question.toLowerCase().includes('体验')) {
        const designTeam = teams.design_team.filter(m => m.status === 'online');
        relevantMembers.push(...designTeam);
        perspectives.push({
            team: '设计团队',
            members: designTeam.map(m => m.name),
            perspective: `从用户体验角度分析: ${question}`,
            insights: [
                '用户界面设计',
                '交互体验优化',
                '视觉设计建议',
                '可用性评估'
            ]
        });
    }
    
    // 产品团队视角
    if (question.toLowerCase().includes('产品') || question.toLowerCase().includes('需求') || 
        question.toLowerCase().includes('运营') || question.toLowerCase().includes('市场')) {
        const productTeam = teams.product_team.filter(m => m.status === 'online');
        relevantMembers.push(...productTeam);
        perspectives.push({
            team: '产品团队',
            members: productTeam.map(m => m.name),
            perspective: `从产品战略角度分析: ${question}`,
            insights: [
                '市场需求分析',
                '产品功能规划',
                '用户价值评估',
                '商业模式建议'
            ]
        });
    }
    
    // 如果没有明确的团队匹配，使用所有在线成员
    if (perspectives.length === 0) {
        const allOnlineMembers = Object.values(teams).flat().filter(m => m.status === 'online');
        relevantMembers.push(...allOnlineMembers);
        perspectives.push({
            team: '全体团队',
            members: allOnlineMembers.map(m => m.name),
            perspective: `多角度综合分析: ${question}`,
            insights: [
                '跨团队协作分析',
                '综合解决方案',
                '风险评估',
                '实施建议'
            ]
        });
    }
    
    // 生成团队协作回答
    const finalAnswer = generateTeamAnswer(question, perspectives);
    
    const processingTime = Date.now() - startTime;
    
    return {
        finalAnswer,
        perspectives,
        contributors: relevantMembers,
        confidence: 0.85 + Math.random() * 0.1, // 85-95%
        reasoning: '基于团队成员专业知识和协作分析',
        processingTime: `${processingTime}ms`
    };
}

// 生成团队协作回答
function generateTeamAnswer(question, perspectives) {
    let answer = `## 团队协作回答\n\n`;
    answer += `### 问题分析\n${question}\n\n`;
    
    perspectives.forEach((p, index) => {
        answer += `### ${p.team}观点\n`;
        answer += `**参与成员**: ${p.members.join(', ')}\n\n`;
        answer += `**分析角度**: ${p.perspective}\n\n`;
        answer += `**关键洞察**:\n`;
        p.insights.forEach(insight => {
            answer += `- ${insight}\n`;
        });
        answer += `\n`;
    });
    
    answer += `### 团队共识\n`;
    answer += `经过各团队深入讨论和协作分析，我们建议采用多维度解决方案，充分发挥各团队专业优势，确保项目成功实施。\n\n`;
    answer += `### 下一步行动\n`;
    answer += `1. 各团队根据专业领域制定详细方案\n`;
    answer += `2. 定期进行跨团队沟通和进度同步\n`;
    answer += `3. 建立反馈机制，持续优化解决方案\n`;
    
    return answer;
}

// 其他智能体处理函数
async function processGeneralAgent(data) {
    return {
        success: true,
        agent_type: 'general',
        session_id: data.session_id,
        question: data.question,
        answer: `通用助手回答: ${data.question}`,
        metadata: {
            timestamp: new Date().toISOString(),
            processing_time: '150ms'
        }
    };
}

async function processRagSingleAgent(data) {
    return {
        success: true,
        agent_type: 'rag_single',
        session_id: data.session_id,
        question: data.question,
        answer: `RAG知识助手回答: ${data.question}`,
        knowledge_sources: ['内部文档', '技术手册', '最佳实践'],
        metadata: {
            timestamp: new Date().toISOString(),
            processing_time: '280ms'
        }
    };
}

async function processCodeAgent(data) {
    return {
        success: true,
        agent_type: 'code_assistant',
        session_id: data.session_id,
        question: data.question,
        answer: `代码助手回答: ${data.question}`,
        code_suggestions: ['// 代码建议', 'function example() {}'],
        metadata: {
            timestamp: new Date().toISOString(),
            processing_time: '320ms'
        }
    };
}

async function processWritingAgent(data) {
    return {
        success: true,
        agent_type: 'writing_assistant',
        session_id: data.session_id,
        question: data.question,
        answer: `写作助手回答: ${data.question}`,
        writing_tips: ['结构清晰', '逻辑连贯', '表达准确'],
        metadata: {
            timestamp: new Date().toISOString(),
            processing_time: '200ms'
        }
    };
}

// 404处理
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'API 端点未找到',
        code: 'NOT_FOUND',
        path: req.originalUrl,
        available_endpoints: [
            'GET /api/health',
            'POST /api/rag/team (主要)',
            'POST /api/general',
            'POST /api/rag/single',
            'POST /api/code',
            'POST /api/writing',
            'GET /api/teams/status',
            'GET /api/agents/config'
        ]
    });
});

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error('服务器错误:', err);
    res.status(500).json({
        error: '内部服务器错误',
        code: 'INTERNAL_ERROR',
        message: err.message,
        timestamp: new Date().toISOString()
    });
});

// 启动服务器
const server = app.listen(PORT, HOST, () => {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║                Teams 智能体团队协作系统                       ║
║               从 qa_note_injection 提取的团队协作功能          ║
╠══════════════════════════════════════════════════════════════╣
║  🚀 服务地址: http://${HOST}:${PORT}                         ║
║  ❤️  健康检查: http://${HOST}:${PORT}/api/health              ║
║  🤖 主要智能体: http://${HOST}:${PORT}/api/rag/team           ║
║  👥 团队状态: http://${HOST}:${PORT}/api/teams/status          ║
║  ⚙️  智能体配置: http://${HOST}:${PORT}/api/agents/config      ║
║                                                              ║
║  📊 团队配置: 3个团队, 7名成员                                ║
║  🧠 主要智能体: rag_team (团队协作)                           ║
║  🟢 在线成员: 5人                                            ║
║  🔴 离线成员: 2人                                            ║
╚══════════════════════════════════════════════════════════════╝
    `);
});

// 优雅关闭处理
const gracefulShutdown = (signal) => {
    console.log(`\n收到 ${signal} 信号，正在优雅关闭服务器...`);
    
    server.close((err) => {
        if (err) {
            console.error('关闭服务器时出错:', err);
            process.exit(1);
        }
        console.log('🛑 Teams 智能体服务器已关闭');
        process.exit(0);
    });
    
    // 30秒后强制退出
    setTimeout(() => {
        console.error('强制关闭服务器...');
        process.exit(1);
    }, 30000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// 导出供测试使用
module.exports = app; 