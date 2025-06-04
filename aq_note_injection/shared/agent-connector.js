/**
 * 智能体连接器 - Agent Connector
 * 连接前端问答系统与后端RAG智能体团队
 * v1.0 - 支持多种智能体类型和API模式
 */
class AgentConnector {
    constructor() {
        this.baseUrl = 'http://localhost:8001'; // 智能体服务端口
        this.agents = new Map();
        this.isConnected = false;
        this.currentAgent = 'general';
        this.sessionId = this.generateSessionId();
        
        // 可用的智能体配置
        this.agentConfigs = {
            general: {
                name: '通用助手',
                description: '通用AI助手，适合日常问答',
                endpoint: '/api/general',
                type: 'single',
                capabilities: ['问答', '对话', '文本生成']
            },
            rag_single: {
                name: 'RAG知识助手',
                description: '具备知识检索能力的专业助手',
                endpoint: '/api/rag/single',
                type: 'rag_single',
                capabilities: ['知识检索', '专业问答', '文档理解']
            },
            rag_team: {
                name: 'RAG团队协作',
                description: '多智能体协作的专业团队',
                endpoint: '/api/rag/team',
                type: 'rag_team',
                capabilities: ['团队协作', '深度分析', '多角度回答']
            },
            code_assistant: {
                name: '代码助手',
                description: '专业的编程和技术助手',
                endpoint: '/api/code',
                type: 'single',
                capabilities: ['代码生成', '技术问答', '调试建议']
            },
            writing_assistant: {
                name: '写作助手',
                description: '专业的文档和写作助手',
                endpoint: '/api/writing',
                type: 'single',
                capabilities: ['文档写作', '内容优化', '格式调整']
            }
        };
        
        // 初始化连接状态检查
        this.checkConnection();
    }

    /**
     * 生成会话ID
     */
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * 检查连接状态
     */
    async checkConnection() {
        try {
            const response = await fetch(`${this.baseUrl}/api/health`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 5000
            });
            
            if (response.ok) {
                const data = await response.json();
                this.isConnected = true;
                this.updateConnectionStatus('online', data.message || '智能体服务已连接');
                return true;
            } else {
                throw new Error(`健康检查失败: ${response.status}`);
            }
        } catch (error) {
            this.isConnected = false;
            this.updateConnectionStatus('offline', `智能体服务离线: ${error.message}`);
            return false;
        }
    }

    /**
     * 更新连接状态显示
     */
    updateConnectionStatus(status, message) {
        // 触发自定义事件通知前端更新状态
        const event = new CustomEvent('agentConnectionChange', {
            detail: {
                status: status,
                message: message,
                timestamp: new Date().toISOString()
            }
        });
        window.dispatchEvent(event);
    }

    /**
     * 获取可用智能体列表
     */
    getAvailableAgents() {
        return Object.entries(this.agentConfigs).map(([id, config]) => ({
            id,
            ...config,
            isAvailable: this.isConnected
        }));
    }

    /**
     * 切换智能体
     */
    switchAgent(agentId) {
        if (!this.agentConfigs[agentId]) {
            throw new Error(`未知的智能体: ${agentId}`);
        }
        
        this.currentAgent = agentId;
        this.sessionId = this.generateSessionId(); // 切换智能体时重新生成会话ID
        
        // 触发智能体切换事件
        const event = new CustomEvent('agentSwitched', {
            detail: {
                agentId: agentId,
                agentConfig: this.agentConfigs[agentId],
                sessionId: this.sessionId
            }
        });
        window.dispatchEvent(event);
        
        return this.agentConfigs[agentId];
    }

    /**
     * 获取当前智能体信息
     */
    getCurrentAgent() {
        return {
            id: this.currentAgent,
            ...this.agentConfigs[this.currentAgent],
            sessionId: this.sessionId
        };
    }

    /**
     * 发送问题到智能体
     */
    async askQuestion(questionData, options = {}) {
        if (!this.isConnected) {
            throw new Error('智能体服务未连接，请检查网络状态');
        }

        const agentConfig = this.agentConfigs[this.currentAgent];
        if (!agentConfig) {
            throw new Error(`无效的智能体: ${this.currentAgent}`);
        }

        const requestData = {
            session_id: this.sessionId,
            agent_type: agentConfig.type,
            question: questionData.content,
            title: questionData.title,
            context: {
                tags: questionData.tags || [],
                attachments: questionData.attachments || [],
                mode: questionData.mode || 'qa',
                user_info: questionData.userInfo || {}
            },
            options: {
                max_tokens: options.maxTokens || 4096,
                temperature: options.temperature || 0.7,
                stream: options.stream || false,
                save_to_memory: options.saveToMemory !== false // 默认保存到记忆
            }
        };

        try {
            const response = await fetch(`${this.baseUrl}${agentConfig.endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Session-ID': this.sessionId,
                    'X-Agent-Type': agentConfig.type
                },
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `智能体请求失败: ${response.status}`);
            }

            const data = await response.json();
            
            // 处理响应数据
            const result = {
                success: true,
                agent_id: this.currentAgent,
                agent_name: agentConfig.name,
                session_id: this.sessionId,
                response: data.response || data.answer || '',
                metadata: {
                    model: data.model_info || {},
                    usage: data.usage || {},
                    reasoning: data.reasoning || '',
                    sources: data.sources || [],
                    timestamp: data.timestamp || new Date().toISOString(),
                    processing_time: data.processing_time || 0
                },
                raw_data: data
            };

            // 触发回答完成事件
            const event = new CustomEvent('agentResponseReceived', {
                detail: result
            });
            window.dispatchEvent(event);

            return result;

        } catch (error) {
            // 处理错误
            const errorResult = {
                success: false,
                agent_id: this.currentAgent,
                agent_name: agentConfig.name,
                session_id: this.sessionId,
                error: error.message,
                metadata: {
                    timestamp: new Date().toISOString()
                }
            };

            // 触发错误事件
            const event = new CustomEvent('agentResponseError', {
                detail: errorResult
            });
            window.dispatchEvent(event);

            throw error;
        }
    }

    /**
     * 获取对话历史
     */
    async getConversationHistory(limit = 50) {
        if (!this.isConnected) {
            return [];
        }

        try {
            const response = await fetch(`${this.baseUrl}/api/conversation/history`, {
                method: 'GET',
                headers: {
                    'X-Session-ID': this.sessionId,
                    'X-Limit': limit.toString()
                }
            });

            if (response.ok) {
                const data = await response.json();
                return data.history || [];
            }
        } catch (error) {
            console.warn('获取对话历史失败:', error);
        }
        
        return [];
    }

    /**
     * 清空对话历史
     */
    async clearConversationHistory() {
        if (!this.isConnected) {
            return false;
        }

        try {
            const response = await fetch(`${this.baseUrl}/api/conversation/clear`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Session-ID': this.sessionId
                }
            });

            return response.ok;
        } catch (error) {
            console.warn('清空对话历史失败:', error);
            return false;
        }
    }

    /**
     * 添加文档到知识库（仅限RAG智能体）
     */
    async addDocumentToKnowledge(content, metadata = {}) {
        if (!this.isConnected) {
            throw new Error('智能体服务未连接');
        }

        const agentConfig = this.agentConfigs[this.currentAgent];
        if (!agentConfig.type.includes('rag')) {
            throw new Error('当前智能体不支持知识库功能');
        }

        try {
            const response = await fetch(`${this.baseUrl}/api/knowledge/add`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Session-ID': this.sessionId,
                    'X-Agent-Type': agentConfig.type
                },
                body: JSON.stringify({
                    content: content,
                    metadata: {
                        ...metadata,
                        timestamp: new Date().toISOString(),
                        session_id: this.sessionId
                    }
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || '添加文档失败');
            }

            const data = await response.json();
            return data;

        } catch (error) {
            throw error;
        }
    }

    /**
     * 搜索知识库（仅限RAG智能体）
     */
    async searchKnowledge(query, options = {}) {
        if (!this.isConnected) {
            throw new Error('智能体服务未连接');
        }

        const agentConfig = this.agentConfigs[this.currentAgent];
        if (!agentConfig.type.includes('rag')) {
            throw new Error('当前智能体不支持知识库功能');
        }

        try {
            const response = await fetch(`${this.baseUrl}/api/knowledge/search`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Session-ID': this.sessionId,
                    'X-Agent-Type': agentConfig.type
                },
                body: JSON.stringify({
                    query: query,
                    limit: options.limit || 5,
                    threshold: options.threshold || 0.3
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || '搜索知识库失败');
            }

            const data = await response.json();
            return data.results || [];

        } catch (error) {
            throw error;
        }
    }

    /**
     * 定期检查连接状态
     */
    startConnectionMonitoring(interval = 30000) {
        this.connectionMonitor = setInterval(() => {
            this.checkConnection();
        }, interval);
    }

    /**
     * 停止连接监控
     */
    stopConnectionMonitoring() {
        if (this.connectionMonitor) {
            clearInterval(this.connectionMonitor);
            this.connectionMonitor = null;
        }
    }

    /**
     * 销毁连接器
     */
    destroy() {
        this.stopConnectionMonitoring();
        this.agents.clear();
        this.isConnected = false;
    }
}

// 创建全局实例
window.AgentConnector = AgentConnector;

// 页面加载时创建实例
document.addEventListener('DOMContentLoaded', () => {
    if (!window.agentConnector) {
        window.agentConnector = new AgentConnector();
        window.agentConnector.startConnectionMonitoring();
    }
}); 