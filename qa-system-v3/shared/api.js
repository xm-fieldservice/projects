/**
 * API客户端 - 统一的HTTP请求接口
 * 提供认证、问答、笔记等API调用功能
 */
class APIClient {
    static BASE_URL = 'http://localhost:8000/api/v1';
    
    /**
     * 统一请求方法
     */
    static async request(endpoint, options = {}) {
        const token = localStorage.getItem('qa_auth_token');
        const url = `${this.BASE_URL}${endpoint}`;
        
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` }),
                ...options.headers
            },
            ...options
        };
        
        try {
            const response = await fetch(url, config);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || `HTTP ${response.status}: 请求失败`);
            }
            
            return {
                success: true,
                data: data,
                status: response.status
            };
        } catch (error) {
            console.error('API请求失败:', error);
            return {
                success: false,
                error: error.message,
                status: error.status || 500
            };
        }
    }
    
    /**
     * 用户认证相关API
     */
    static async login(username, password) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
    }
    
    static async logout() {
        const result = await this.request('/auth/logout', {
            method: 'POST'
        });
        
        // 清除本地token
        localStorage.removeItem('qa_auth_token');
        localStorage.removeItem('qa_current_user');
        
        return result;
    }
    
    static async getCurrentUser() {
        return this.request('/auth/user');
    }
    
    /**
     * 问答相关API
     */
    static async sendQuestion(questionData) {
        return this.request('/content', {
            method: 'POST',
            body: JSON.stringify({
                title: questionData.title,
                content: questionData.content,
                content_type: 'qa',
                tags: questionData.tags || [],
                agent_id: questionData.agent_id || 'general'
            })
        });
    }
    
    /**
     * 笔记相关API
     */
    static async saveNote(noteData) {
        return this.request('/content', {
            method: 'POST',
            body: JSON.stringify({
                title: noteData.title,
                content: noteData.content,
                content_type: 'note',
                tags: noteData.tags || []
            })
        });
    }
    
    static async getContent(contentType = 'all', limit = 50) {
        const params = new URLSearchParams({
            type: contentType,
            limit: limit.toString()
        });
        return this.request(`/content?${params}`);
    }
    
    static async deleteContent(contentId) {
        return this.request(`/content/${contentId}`, {
            method: 'DELETE'
        });
    }
    
    /**
     * 系统管理相关API
     */
    static async getSystemMetrics() {
        return this.request('/admin/metrics');
    }
    
    static async getServicesStatus() {
        return this.request('/admin/services');
    }
    
    static async restartService(serviceName) {
        return this.request('/admin/services/restart', {
            method: 'POST',
            body: JSON.stringify({ service: serviceName })
        });
    }
    
    static async getUsersList(page = 1, size = 20, role = null) {
        const params = new URLSearchParams({
            page: page.toString(),
            size: size.toString(),
            ...(role && { role })
        });
        return this.request(`/admin/users?${params}`);
    }
    
    /**
     * 网络状态检测
     */
    static async checkNetworkStatus() {
        try {
            const response = await fetch(`${this.BASE_URL}/health`, {
                method: 'HEAD',
                timeout: 3000
            });
            return response.ok;
        } catch (error) {
            return false;
        }
    }
    
    /**
     * 文件上传
     */
    static async uploadFile(file, type = 'attachment') {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);
        
        const token = localStorage.getItem('qa_auth_token');
        
        try {
            const response = await fetch(`${this.BASE_URL}/upload`, {
                method: 'POST',
                headers: {
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: formData
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || '文件上传失败');
            }
            
            return {
                success: true,
                data: data
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// 导出到全局
window.APIClient = APIClient; 