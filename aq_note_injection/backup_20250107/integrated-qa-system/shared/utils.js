/**
 * 工具函数 - 共享模块
 */
window.Utils = {
    formatDate: (date) => {
        return new Date(date).toLocaleString('zh-CN');
    },
    
    generateId: () => {
        return `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    },
    
    delay: (ms) => {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}; 