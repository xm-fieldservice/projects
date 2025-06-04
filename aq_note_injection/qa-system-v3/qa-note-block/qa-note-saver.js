/**
 * QANoteSaver - 智能存储策略实现
 * v3.0 完整解耦版
 */
class QANoteSaver {
    constructor(config = {}) {
        this.config = {
            mode: config.mode || 'hybrid', // local, server, hybrid
            apiUrl: config.apiUrl || 'http://localhost:8000/api/v1',
            debugMode: config.debugMode || false,
            onSaveSuccess: config.onSaveSuccess || null,
            onSaveError: config.onSaveError || null,
            retryAttempts: config.retryAttempts || 3,
            retryDelay: config.retryDelay || 1000
        };

        this.pendingQueue = [];
        this.isOnline = navigator.onLine;
        this.initializeEventListeners();
    }

    /**
     * 初始化事件监听器
     */
    initializeEventListeners() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.processPendingQueue();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
        });
    }

    /**
     * 保存内容（统一入口）
     */
    async saveContent(data) {
        const content = {
            id: this.generateId(),
            title: data.title,
            content: data.content,
            type: data.type || 'note',
            tags: data.tags || [],
            agentId: data.agentId,
            timestamp: new Date().toISOString(),
            ...data
        };

        try {
            const result = await this.executeStorageStrategy(content);
            
            if (this.config.onSaveSuccess) {
                this.config.onSaveSuccess(result);
            }
            
            return result;
            
        } catch (error) {
            console.error('保存失败:', error);
            
            if (this.config.onSaveError) {
                this.config.onSaveError(error);
            }
            
            return {
                success: false,
                error: error.message,
                content: content
            };
        }
    }

    /**
     * 执行存储策略
     */
    async executeStorageStrategy(content) {
        const startTime = Date.now();
        
        switch (this.config.mode) {
            case 'local':
                return await this.saveToLocal(content, startTime);
                
            case 'server':
                return await this.saveToServer(content, startTime);
                
            case 'hybrid':
                return await this.saveToHybrid(content, startTime);
                
            default:
                throw new Error(`不支持的存储模式: ${this.config.mode}`);
        }
    }

    /**
     * 仅本地存储
     */
    async saveToLocal(content, startTime) {
        try {
            // 保存到localStorage
            const localData = this.getLocalData();
            localData.push(content);
            localStorage.setItem('qa_notes_local', JSON.stringify(localData));
            
            // 自动下载到文件
            await this.downloadToFile(content);
            
            const endTime = Date.now();
            
            return {
                success: true,
                id: content.id,
                local: {
                    success: true,
                    cached: true,
                    downloaded: true
                },
                performance: {
                    totalTime: endTime - startTime,
                    mode: 'local'
                },
                timestamp: content.timestamp
            };
            
        } catch (error) {
            throw new Error(`本地保存失败: ${error.message}`);
        }
    }

    /**
     * 仅服务器存储
     */
    async saveToServer(content, startTime) {
        if (!this.isOnline) {
            throw new Error('网络连接不可用，无法保存到服务器');
        }
        
        try {
            const response = await this.sendToServer(content);
            const endTime = Date.now();
            
            return {
                success: true,
                id: response.id || content.id,
                server: {
                    success: true,
                    id: response.id,
                    response: response
                },
                performance: {
                    totalTime: endTime - startTime,
                    mode: 'server'
                },
                timestamp: content.timestamp
            };
            
        } catch (error) {
            throw new Error(`服务器保存失败: ${error.message}`);
        }
    }

    /**
     * 混合存储策略
     */
    async saveToHybrid(content, startTime) {
        const results = {
            success: false,
            id: content.id,
            local: { success: false },
            server: { success: false },
            synced: false,
            cached: false
        };

        // 首先尝试本地保存（保证数据不丢失）
        try {
            const localData = this.getLocalData();
            localData.push(content);
            localStorage.setItem('qa_notes_local', JSON.stringify(localData));
            results.local.success = true;
            results.cached = true;
            
            // 自动下载
            await this.downloadToFile(content);
            results.local.downloaded = true;
            
        } catch (error) {
            results.local.error = error.message;
        }

        // 然后尝试服务器同步
        if (this.isOnline) {
            try {
                const serverResponse = await this.sendToServer(content);
                results.server.success = true;
                results.server.id = serverResponse.id;
                results.server.response = serverResponse;
                results.synced = true;
                results.id = serverResponse.id || content.id;
                
            } catch (error) {
                results.server.error = error.message;
                // 添加到待同步队列
                this.addToPendingQueue(content);
            }
        } else {
            // 离线状态，添加到待同步队列
            this.addToPendingQueue(content);
            results.server.error = '网络连接不可用';
        }

        const endTime = Date.now();
        results.performance = {
            totalTime: endTime - startTime,
            mode: 'hybrid'
        };
        results.timestamp = content.timestamp;
        results.success = results.local.success || results.server.success;

        return results;
    }

    /**
     * 发送到服务器
     */
    async sendToServer(content, attempt = 1) {
        const url = `${this.config.apiUrl}/content`;
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('qa_auth_token')}`
                },
                body: JSON.stringify({
                    title: content.title,
                    content: content.content,
                    content_type: content.type,
                    tags: content.tags,
                    agent_id: content.agentId
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            return result.data || result;
            
        } catch (error) {
            if (attempt < this.config.retryAttempts) {
                await this.delay(this.config.retryDelay * attempt);
                return this.sendToServer(content, attempt + 1);
            }
            throw error;
        }
    }

    /**
     * 下载到文件
     */
    async downloadToFile(content) {
        try {
            const timestamp = new Date(content.timestamp).toLocaleString('zh-CN');
            let noteText = `\n# ${timestamp}\n\n`;
            
            if (content.title && content.title.trim()) {
                noteText += `## ${content.title.trim()}\n\n`;
            }
            
            noteText += `${content.content.trim()}\n`;
            
            if (content.tags && content.tags.length > 0) {
                noteText += `\n**标签：** ${content.tags.map(tag => `#${tag}`).join(' ')}\n`;
            }
            
            if (content.type === 'qa' && content.agentId) {
                noteText += `\n**AI智能体：** ${content.agentId}\n`;
            }
            
            noteText += '\n---\n';
            
            // 获取现有笔记内容
            const existingContent = this.getNotebookContent();
            const fullContent = existingContent + noteText;
            
            // 更新localStorage中的笔记本内容
            localStorage.setItem('qa_notebook_content', fullContent);
            
            // 创建下载
            const blob = new Blob([fullContent], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = '我的笔记本.md';
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            return true;
            
        } catch (error) {
            console.warn('文件下载失败:', error);
            return false;
        }
    }

    /**
     * 获取本地数据
     */
    getLocalData() {
        try {
            const data = localStorage.getItem('qa_notes_local');
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.warn('读取本地数据失败:', error);
            return [];
        }
    }

    /**
     * 获取笔记本内容
     */
    getNotebookContent() {
        return localStorage.getItem('qa_notebook_content') || '';
    }

    /**
     * 添加到待同步队列
     */
    addToPendingQueue(content) {
        this.pendingQueue.push(content);
        // 保存队列到localStorage
        localStorage.setItem('qa_pending_queue', JSON.stringify(this.pendingQueue));
    }

    /**
     * 处理待同步队列
     */
    async processPendingQueue() {
        if (!this.isOnline || this.pendingQueue.length === 0) {
            return;
        }

        const queue = [...this.pendingQueue];
        this.pendingQueue = [];

        let syncedCount = 0;
        let failedCount = 0;

        for (const content of queue) {
            try {
                await this.sendToServer(content);
                syncedCount++;
            } catch (error) {
                console.warn('队列同步失败:', error);
                this.pendingQueue.push(content);
                failedCount++;
            }
        }

        // 更新队列
        localStorage.setItem('qa_pending_queue', JSON.stringify(this.pendingQueue));

        // 通知用户
        if (syncedCount > 0) {
            console.log(`成功同步 ${syncedCount} 条离线数据`);
        }
        if (failedCount > 0) {
            console.warn(`${failedCount} 条数据同步失败`);
        }

        return { syncedCount, failedCount };
    }

    /**
     * 手动同步
     */
    async manualSync() {
        // 从localStorage恢复队列
        const savedQueue = localStorage.getItem('qa_pending_queue');
        if (savedQueue) {
            this.pendingQueue = JSON.parse(savedQueue);
        }

        return await this.processPendingQueue();
    }

    /**
     * 切换存储模式
     */
    switchMode(newMode) {
        const validModes = ['local', 'server', 'hybrid'];
        if (!validModes.includes(newMode)) {
            throw new Error(`无效的存储模式: ${newMode}`);
        }
        
        this.config.mode = newMode;
        return {
            success: true,
            previousMode: this.config.mode,
            newMode: newMode
        };
    }

    /**
     * 获取状态信息
     */
    getStatus() {
        return {
            mode: this.config.mode,
            isOnline: this.isOnline,
            pendingQueueSize: this.pendingQueue.length,
            localDataCount: this.getLocalData().length,
            notebookSize: this.getNotebookContent().length
        };
    }

    /**
     * 生成唯一ID
     */
    generateId() {
        return `qa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * 延迟函数
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 清空笔记本
     */
    clearNotebook() {
        localStorage.removeItem('qa_notebook_content');
        localStorage.removeItem('qa_notes_local');
        return true;
    }

    /**
     * 导出笔记本
     */
    exportNotebook() {
        const content = this.getNotebookContent();
        if (!content.trim()) {
            throw new Error('笔记本为空，无法导出');
        }

        const blob = new Blob([content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `笔记本_${new Date().toISOString().slice(0, 10)}.md`;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        return true;
    }
}

// 导出到全局
window.QANoteSaver = QANoteSaver; 