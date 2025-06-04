/**
 * API客户端 - 共享模块
 */
class APIClient {
    static BASE_URL = 'http://localhost:8000/api/v1';
    
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
                throw new Error(data.message || '请求失败');
            }
            
            return data;
        } catch (error) {
            console.error('API请求失败:', error);
            throw error;
        }
    }
    
    static async sendQuestion(questionData) {
        return this.request('/content', {
            method: 'POST',
            body: JSON.stringify({
                title: questionData.title,
                content: questionData.content,
                content_type: 'qa',
                tags: questionData.tags || [],
                agent_id: questionData.agent_id
            })
        });
    }
}

window.APIClient = APIClient; 