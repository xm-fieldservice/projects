/**
 * QANoteSaver - 智能问答系统专用笔记保存器
 * 支持三种存储模式：纯本地、服务器、混合存储
 * 
 * 使用方法：
 * 1. 引入：<script src="qa-note-saver.js"></script>
 * 2. 初始化：const qaSaver = new QANoteSaver({ mode: 'hybrid', apiUrl: 'http://localhost:8000' });
 * 3. 使用：await qaSaver.saveContent(data);
 */

class QANoteSaver {
    constructor(options = {}) {
        this.config = {
            // 存储模式：'local' | 'server' | 'hybrid'
            mode: options.mode || 'local',
            
            // 服务器配置
            apiUrl: options.apiUrl || 'http://localhost:8000/api/v1',
            apiKey: options.apiKey || null,
            
            // 应用配置
            appName: options.appName || '智能问答系统',
            debugMode: options.debugMode || false,
            
            // 离线策略
            offlineMode: options.offlineMode || 'auto', // 'auto' | 'force' | 'disabled'
            
            // 同步策略
            syncStrategy: options.syncStrategy || 'immediate', // 'immediate' | 'batch' | 'manual'
            
            // 缓存配置
            localCacheEnabled: options.localCacheEnabled !== false,
            maxCacheSize: options.maxCacheSize || 100,
            
            ...options
        };
        
        // 核心状态
        this.isOnline = navigator.onLine;
        this.pendingQueue = []; // 离线时的待处理队列
        this.localCache = new Map(); // 本地缓存
        this.authToken = this.getAuthToken();
        
        // 事件回调
        this.onSaveSuccess = options.onSaveSuccess || null;
        this.onSaveError = options.onSaveError || null;
        this.onModeSwitch = options.onModeSwitch || null;
        this.onSyncComplete = options.onSyncComplete || null;
        
        this.init();
    }
    
    /**
     * 初始化
     */
    init() {
        this.log('🔧 QANoteSaver 初始化中...');
        this.log(`📊 存储模式: ${this.config.mode}`);
        
        // 设置网络状态监听
        this.setupNetworkListeners();
        
        // 加载本地缓存
        if (this.config.localCacheEnabled) {
            this.loadLocalCache();
        }
        
        // 自动检测最佳模式
        if (this.config.mode === 'auto') {
            this.detectOptimalMode();
        }
        
        this.log('✅ QANoteSaver 初始化完成');
    }
    
    /**
     * 核心方法：保存内容
     * @param {Object} data - 保存的数据
     * @param {string} data.title - 标题
     * @param {string} data.content - 内容
     * @param {string} data.type - 类型：'note' | 'qa'
     * @param {Array} data.tags - 标签数组
     * @param {string} data.agentId - 智能体ID（仅问答模式）
     */
    async saveContent(data) {
        try {
            this.log('💾 开始保存内容...', data);
            
            // 数据验证
            if (!this.validateData(data)) {
                throw new Error('数据格式无效');
            }
            
            // 根据模式选择保存策略
            let result;
            switch (this.config.mode) {
                case 'local':
                    result = await this.saveToLocal(data);
                    break;
                case 'server':
                    result = await this.saveToServer(data);
                    break;
                case 'hybrid':
                    result = await this.saveToHybrid(data);
                    break;
                default:
                    throw new Error(`未知的存储模式: ${this.config.mode}`);
            }
            
            // 成功回调
            if (this.onSaveSuccess) {
                this.onSaveSuccess(result);
            }
            
            this.log('✅ 内容保存成功', result);
            return result;
            
        } catch (error) {
            // 错误回调
            if (this.onSaveError) {
                this.onSaveError(error);
            }
            
            this.log('❌ 内容保存失败:', error.message);
            throw error;
        }
    }
    
    /**
     * 保存到本地（模式1：纯本地存储）
     */
    async saveToLocal(data) {
        this.log('📂 使用本地存储模式');
        
        // 格式化数据
        const formattedData = this.formatForLocal(data);
        
        // 尝试使用File System API
        if ('showSaveFilePicker' in window && this.selectedFileHandle) {
            return await this.saveToLocalFile(formattedData);
        }
        
        // 降级：使用localStorage + 下载
        return await this.saveToLocalStorage(formattedData);
    }
    
    /**
     * 保存到服务器（模式2：服务器存储）
     */
    async saveToServer(data) {
        this.log('🌐 使用服务器存储模式');
        
        // 检查网络状态
        if (!this.isOnline) {
            if (this.config.offlineMode === 'force') {
                throw new Error('网络不可用，且禁用了离线模式');
            }
            
            // 添加到离线队列
            this.addToOfflineQueue(data);
            throw new Error('网络不可用，已添加到离线队列');
        }
        
        // 发送到服务器
        const response = await this.sendToAPI(data);
        
        // 可选：保存到本地缓存
        if (this.config.localCacheEnabled) {
            this.saveToCache(data, response);
        }
        
        return response;
    }
    
    /**
     * 混合存储（模式3：本地缓存 + 服务器同步）
     */
    async saveToHybrid(data) {
        this.log('🔄 使用混合存储模式');
        
        const results = { local: null, server: null, mode: 'hybrid' };
        
        // 立即保存到本地缓存
        results.local = await this.saveToLocalCache(data);
        
        // 尝试同步到服务器
        if (this.isOnline) {
            try {
                results.server = await this.sendToAPI(data);
                results.synced = true;
            } catch (error) {
                this.log('⚠️ 服务器同步失败，仅保存到本地:', error.message);
                this.addToOfflineQueue(data);
                results.synced = false;
                results.error = error.message;
            }
        } else {
            this.log('📱 离线状态，仅保存到本地缓存');
            this.addToOfflineQueue(data);
            results.synced = false;
        }
        
        return results;
    }
    
    /**
     * 发送到API服务器
     */
    async sendToAPI(data) {
        const endpoint = data.type === 'qa' ? '/content' : '/content';
        const url = `${this.config.apiUrl}${endpoint}`;
        
        const payload = {
            title: data.title,
            content: data.content,
            content_type: data.type || 'note',
            tags: data.tags || [],
            ...(data.agentId && { agent_id: data.agentId })
        };
        
        const headers = {
            'Content-Type': 'application/json',
            ...(this.authToken && { 'Authorization': `Bearer ${this.authToken}` })
        };
        
        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP ${response.status}`);
        }
        
        return await response.json();
    }
    
    /**
     * 保存到本地缓存
     */
    async saveToLocalCache(data) {
        const timestamp = new Date().toISOString();
        const cacheEntry = {
            id: this.generateId(),
            timestamp,
            data,
            synced: false
        };
        
        // 添加到内存缓存
        this.localCache.set(cacheEntry.id, cacheEntry);
        
        // 持久化到localStorage
        this.persistCache();
        
        return {
            id: cacheEntry.id,
            timestamp,
            mode: 'local_cache',
            cached: true
        };
    }
    
    /**
     * 保存到localStorage（降级方案）
     */
    async saveToLocalStorage(data) {
        const timestamp = new Date().toISOString();
        const storageKey = 'qa_notes';
        
        // 获取现有数据
        const existing = localStorage.getItem(storageKey) || '';
        
        // 格式化新内容
        const newEntry = `\n## ${timestamp}\n### ${data.title}\n\n${data.content}\n`;
        if (data.tags && data.tags.length > 0) {
            newEntry += `\n**标签:** ${data.tags.map(tag => `#${tag}`).join(' ')}\n`;
        }
        newEntry += '\n---\n';
        
        // 追加保存
        localStorage.setItem(storageKey, existing + newEntry);
        
        // 自动下载备份
        this.downloadBackup(existing + newEntry);
        
        return {
            timestamp,
            mode: 'local_storage',
            size: (existing + newEntry).length
        };
    }
    
    /**
     * 离线队列管理
     */
    addToOfflineQueue(data) {
        this.pendingQueue.push({
            id: this.generateId(),
            data,
            timestamp: new Date().toISOString(),
            retryCount: 0
        });
        
        this.log(`📋 已添加到离线队列，待处理: ${this.pendingQueue.length} 项`);
        this.persistOfflineQueue();
    }
    
    /**
     * 同步离线队列
     */
    async syncOfflineQueue() {
        if (this.pendingQueue.length === 0 || !this.isOnline) {
            return { synced: 0, failed: 0 };
        }
        
        this.log(`🔄 开始同步离线队列: ${this.pendingQueue.length} 项`);
        
        const results = { synced: 0, failed: 0, errors: [] };
        const failedItems = [];
        
        for (const item of this.pendingQueue) {
            try {
                await this.sendToAPI(item.data);
                results.synced++;
                this.log(`✅ 同步成功: ${item.data.title}`);
            } catch (error) {
                item.retryCount++;
                if (item.retryCount < 3) {
                    failedItems.push(item);
                }
                results.failed++;
                results.errors.push({ id: item.id, error: error.message });
                this.log(`❌ 同步失败: ${item.data.title} - ${error.message}`);
            }
        }
        
        // 更新队列（只保留需要重试的项）
        this.pendingQueue = failedItems;
        this.persistOfflineQueue();
        
        // 触发同步完成回调
        if (this.onSyncComplete) {
            this.onSyncComplete(results);
        }
        
        this.log(`🎯 同步完成: 成功 ${results.synced}, 失败 ${results.failed}`);
        return results;
    }
    
    /**
     * 数据验证
     */
    validateData(data) {
        if (!data || typeof data !== 'object') return false;
        if (!data.title && !data.content) return false;
        if (data.type && !['note', 'qa'].includes(data.type)) return false;
        return true;
    }
    
    /**
     * 格式化本地存储数据
     */
    formatForLocal(data) {
        const timestamp = new Date().toLocaleString('zh-CN');
        let content = `## ${timestamp}\n\n`;
        
        if (data.title) {
            content += `### ${data.title}\n\n`;
        }
        
        if (data.content) {
            content += `${data.content}\n\n`;
        }
        
        if (data.type) {
            content += `**类型:** ${data.type === 'qa' ? '问答' : '笔记'}\n\n`;
        }
        
        if (data.agentId) {
            content += `**智能体:** ${data.agentId}\n\n`;
        }
        
        if (data.tags && data.tags.length > 0) {
            content += `**标签:** ${data.tags.map(tag => `#${tag}`).join(' ')}\n\n`;
        }
        
        content += '---\n\n';
        return content;
    }
    
    /**
     * 网络状态监听
     */
    setupNetworkListeners() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.log('🌐 网络已连接');
            
            // 自动同步离线队列
            if (this.config.syncStrategy === 'immediate') {
                this.syncOfflineQueue();
            }
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.log('📱 网络已断开');
        });
    }
    
    /**
     * 模式切换
     */
    switchMode(newMode) {
        const oldMode = this.config.mode;
        this.config.mode = newMode;
        
        this.log(`🔄 存储模式切换: ${oldMode} → ${newMode}`);
        
        if (this.onModeSwitch) {
            this.onModeSwitch(oldMode, newMode);
        }
    }
    
    /**
     * 自动检测最佳模式
     */
    async detectOptimalMode() {
        try {
            // 测试服务器连接
            const testResponse = await fetch(`${this.config.apiUrl}/health`, {
                method: 'GET',
                timeout: 5000
            });
            
            if (testResponse.ok) {
                this.switchMode('hybrid');
                this.log('🎯 自动检测: 使用混合存储模式');
            } else {
                this.switchMode('local');
                this.log('🎯 自动检测: 服务器不可用，使用本地模式');
            }
        } catch (error) {
            this.switchMode('local');
            this.log('🎯 自动检测: 网络不可用，使用本地模式');
        }
    }
    
    /**
     * 获取认证令牌
     */
    getAuthToken() {
        return localStorage.getItem('qa_auth_token') || 
               localStorage.getItem('auth_token') || 
               this.config.apiKey;
    }
    
    /**
     * 工具方法
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    downloadBackup(content) {
        const blob = new Blob([content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `qa-notes-${new Date().toLocaleDateString()}.md`;
        a.click();
        URL.revokeObjectURL(url);
    }
    
    persistCache() {
        try {
            const cacheData = Array.from(this.localCache.entries());
            localStorage.setItem('qa_cache', JSON.stringify(cacheData));
        } catch (error) {
            this.log('⚠️ 缓存持久化失败:', error.message);
        }
    }
    
    loadLocalCache() {
        try {
            const cacheData = localStorage.getItem('qa_cache');
            if (cacheData) {
                const entries = JSON.parse(cacheData);
                this.localCache = new Map(entries);
                this.log(`📦 已加载本地缓存: ${this.localCache.size} 项`);
            }
        } catch (error) {
            this.log('⚠️ 缓存加载失败:', error.message);
            this.localCache = new Map();
        }
    }
    
    persistOfflineQueue() {
        try {
            localStorage.setItem('qa_offline_queue', JSON.stringify(this.pendingQueue));
        } catch (error) {
            this.log('⚠️ 离线队列持久化失败:', error.message);
        }
    }
    
    log(...args) {
        if (this.config.debugMode) {
            console.log('[QANoteSaver]', ...args);
        }
    }
    
    /**
     * 公共API方法
     */
    
    // 获取状态信息
    getStatus() {
        return {
            mode: this.config.mode,
            online: this.isOnline,
            cacheSize: this.localCache.size,
            pendingQueue: this.pendingQueue.length,
            lastSync: localStorage.getItem('qa_last_sync')
        };
    }
    
    // 手动同步
    async manualSync() {
        return await this.syncOfflineQueue();
    }
    
    // 清空缓存
    clearCache() {
        this.localCache.clear();
        localStorage.removeItem('qa_cache');
        this.log('🧹 本地缓存已清空');
    }
    
    // 导出数据
    exportData() {
        const data = {
            cache: Array.from(this.localCache.entries()),
            offlineQueue: this.pendingQueue,
            config: this.config
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `qa-data-export-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
}

// 简化的集成接口
class QANoteSaverSimple {
    constructor(apiUrl = 'http://localhost:8000/api/v1') {
        this.saver = new QANoteSaver({
            mode: 'hybrid',
            apiUrl: apiUrl,
            debugMode: false
        });
    }
    
    // 保存笔记
    async saveNote(title, content, tags = []) {
        return await this.saver.saveContent({
            title,
            content,
            type: 'note',
            tags
        });
    }
    
    // 保存问答
    async saveQA(title, content, agentId, tags = []) {
        return await this.saver.saveContent({
            title,
            content,
            type: 'qa',
            agentId,
            tags
        });
    }
    
    // 获取状态
    getStatus() {
        return this.saver.getStatus();
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { QANoteSaver, QANoteSaverSimple };
} else {
    window.QANoteSaver = QANoteSaver;
    window.QANoteSaverSimple = QANoteSaverSimple;
} 