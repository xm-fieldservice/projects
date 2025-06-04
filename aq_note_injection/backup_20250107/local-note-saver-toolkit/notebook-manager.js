/**
 * NotebookManager - 浏览器原生笔记管理器
 * 兼容所有现代浏览器，使用 localStorage + 下载保存
 * 
 * 特点：
 * - 零依赖，直接引入即可使用
 * - 兼容所有现代浏览器
 * - 自动下载备份
 * - 简单易用的API
 */

class NotebookManager {
    static STORAGE_KEY = 'qa_notebook_content';
    static DEFAULT_FILENAME = '我的笔记本.md';
    static VERSION = '1.0.0';

    /**
     * 保存笔记（追加模式，不覆盖现有内容）
     * @param {string} title - 笔记标题
     * @param {string} content - 笔记内容
     * @param {Array} tags - 标签数组
     * @returns {Promise<boolean>} 保存是否成功
     */
    static async saveNote(title, content, tags = []) {
        try {
            const timestamp = new Date().toLocaleString('zh-CN');
            let noteText = `\n## ${timestamp}\n\n`;
            
            if (title && title.trim()) {
                noteText += `### ${title.trim()}\n\n`;
            }
            
            if (content && content.trim()) {
                noteText += `${content.trim()}\n`;
            }
            
            if (tags && tags.length > 0) {
                noteText += `\n**标签：** ${tags.map(tag => `#${tag}`).join(' ')}\n`;
            }
            
            noteText += '\n---\n';
            
            // 获取现有内容并追加
            const existingContent = this.getNotebookContent();
            const fullContent = existingContent + noteText;
            
            // 保存到 localStorage
            localStorage.setItem(this.STORAGE_KEY, fullContent);
            
            // 自动下载备份
            this.downloadNotebook(fullContent);
            
            // 触发保存成功事件
            this.dispatchEvent('noteSaved', {
                title,
                content,
                tags,
                timestamp,
                totalLength: fullContent.length
            });
            
            return true;
        } catch (error) {
            console.error('保存笔记失败:', error);
            
            // 触发保存失败事件
            this.dispatchEvent('saveError', {
                error: error.message,
                title,
                content,
                tags
            });
            
            throw new Error('保存笔记失败: ' + error.message);
        }
    }

    /**
     * 快速保存（只需要内容）
     * @param {string} content - 笔记内容
     * @returns {Promise<boolean>} 保存是否成功
     */
    static async quickSave(content) {
        return await this.saveNote('', content, []);
    }

    /**
     * 获取所有笔记内容
     * @returns {string} 笔记内容
     */
    static getNotebookContent() {
        return localStorage.getItem(this.STORAGE_KEY) || '';
    }

    /**
     * 获取笔记统计信息
     * @returns {Object} 统计信息
     */
    static getStats() {
        const content = this.getNotebookContent();
        const lines = content.split('\n');
        const noteCount = (content.match(/^## \d{4}\/\d{1,2}\/\d{1,2}/gm) || []).length;
        
        return {
            totalLength: content.length,
            totalLines: lines.length,
            noteCount: noteCount,
            lastModified: this.getLastModified(),
            size: new Blob([content]).size
        };
    }

    /**
     * 获取最后修改时间
     * @returns {Date|null} 最后修改时间
     */
    static getLastModified() {
        const content = this.getNotebookContent();
        const matches = content.match(/## (\d{4}\/\d{1,2}\/\d{1,2}[^#]+)/g);
        if (matches && matches.length > 0) {
            const lastMatch = matches[matches.length - 1];
            const timeStr = lastMatch.replace('## ', '');
            return new Date(timeStr);
        }
        return null;
    }

    /**
     * 下载笔记本文件
     * @param {string} content - 笔记内容（可选，默认使用当前所有内容）
     * @param {string} filename - 文件名（可选）
     */
    static downloadNotebook(content = null, filename = null) {
        try {
            const noteContent = content || this.getNotebookContent();
            const fileName = filename || this.generateFileName();
            
            const blob = new Blob([noteContent], { type: 'text/markdown;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            link.style.display = 'none';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // 清理URL对象
            URL.revokeObjectURL(url);
            
            // 触发下载完成事件
            this.dispatchEvent('downloadComplete', {
                fileName,
                size: blob.size
            });
            
            return true;
        } catch (error) {
            console.error('下载失败:', error);
            this.dispatchEvent('downloadError', { error: error.message });
            return false;
        }
    }

    /**
     * 生成文件名
     * @returns {string} 生成的文件名
     */
    static generateFileName() {
        const now = new Date();
        const dateStr = now.toLocaleDateString('zh-CN').replace(/\//g, '-');
        const timeStr = now.toLocaleTimeString('zh-CN', { hour12: false }).replace(/:/g, '-');
        return `笔记本_${dateStr}_${timeStr}.md`;
    }

    /**
     * 清空所有笔记
     * @returns {boolean} 操作是否成功
     */
    static clearNotebook() {
        try {
            localStorage.removeItem(this.STORAGE_KEY);
            this.dispatchEvent('notebookCleared', {});
            return true;
        } catch (error) {
            console.error('清空失败:', error);
            this.dispatchEvent('clearError', { error: error.message });
            return false;
        }
    }

    /**
     * 导入笔记内容
     * @param {string} content - 要导入的内容
     * @param {boolean} append - 是否追加到现有内容（默认true）
     * @returns {boolean} 导入是否成功
     */
    static importContent(content, append = true) {
        try {
            let finalContent = content;
            
            if (append) {
                const existingContent = this.getNotebookContent();
                finalContent = existingContent + '\n' + content;
            }
            
            localStorage.setItem(this.STORAGE_KEY, finalContent);
            
            this.dispatchEvent('contentImported', {
                contentLength: content.length,
                append,
                totalLength: finalContent.length
            });
            
            return true;
        } catch (error) {
            console.error('导入失败:', error);
            this.dispatchEvent('importError', { error: error.message });
            return false;
        }
    }

    /**
     * 搜索笔记内容
     * @param {string} keyword - 搜索关键词
     * @param {boolean} caseSensitive - 是否区分大小写
     * @returns {Array} 搜索结果
     */
    static searchNotes(keyword, caseSensitive = false) {
        const content = this.getNotebookContent();
        const lines = content.split('\n');
        const results = [];
        
        const searchTerm = caseSensitive ? keyword : keyword.toLowerCase();
        
        lines.forEach((line, index) => {
            const searchLine = caseSensitive ? line : line.toLowerCase();
            
            if (searchLine.includes(searchTerm)) {
                results.push({
                    lineNumber: index + 1,
                    content: line,
                    context: {
                        before: lines.slice(Math.max(0, index - 2), index),
                        after: lines.slice(index + 1, Math.min(lines.length, index + 3))
                    }
                });
            }
        });
        
        return results;
    }

    /**
     * 获取最近的笔记
     * @param {number} count - 获取数量
     * @returns {Array} 最近的笔记
     */
    static getRecentNotes(count = 5) {
        const content = this.getNotebookContent();
        const noteBlocks = content.split(/^## /m).filter(block => block.trim());
        
        return noteBlocks
            .slice(-count)
            .reverse()
            .map((block, index) => ({
                id: index,
                preview: block.substring(0, 100) + (block.length > 100 ? '...' : ''),
                fullContent: block
            }));
    }

    /**
     * 事件分发
     * @param {string} eventName - 事件名称
     * @param {Object} detail - 事件详情
     */
    static dispatchEvent(eventName, detail) {
        try {
            const event = new CustomEvent(`notebook-${eventName}`, {
                detail: { ...detail, timestamp: new Date() }
            });
            window.dispatchEvent(event);
        } catch (error) {
            console.warn('事件分发失败:', error);
        }
    }

    /**
     * 监听事件的便捷方法
     * @param {string} eventName - 事件名称
     * @param {Function} callback - 回调函数
     */
    static addEventListener(eventName, callback) {
        window.addEventListener(`notebook-${eventName}`, callback);
    }

    /**
     * 移除事件监听
     * @param {string} eventName - 事件名称
     * @param {Function} callback - 回调函数
     */
    static removeEventListener(eventName, callback) {
        window.removeEventListener(`notebook-${eventName}`, callback);
    }

    /**
     * 检查浏览器兼容性
     * @returns {Object} 兼容性信息
     */
    static checkCompatibility() {
        return {
            localStorage: typeof Storage !== 'undefined',
            blob: typeof Blob !== 'undefined',
            url: typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function',
            download: typeof document.createElement === 'function',
            events: typeof CustomEvent !== 'undefined'
        };
    }

    /**
     * 初始化检查
     */
    static init() {
        const compatibility = this.checkCompatibility();
        const unsupported = Object.entries(compatibility)
            .filter(([key, supported]) => !supported)
            .map(([key]) => key);
        
        if (unsupported.length > 0) {
            console.warn('NotebookManager: 部分功能不支持:', unsupported);
        } else {
            console.log('NotebookManager: 所有功能正常');
        }
        
        // 分发初始化完成事件
        this.dispatchEvent('initialized', {
            version: this.VERSION,
            compatibility,
            unsupported
        });
        
        return compatibility;
    }
}

// 自动初始化
if (typeof window !== 'undefined') {
    // 确保在 DOM 加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            NotebookManager.init();
        });
    } else {
        NotebookManager.init();
    }
    
    // 暴露到全局
    window.NotebookManager = NotebookManager;
}

// 导出（支持模块化）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NotebookManager;
}

// 使用示例和文档
/*
使用示例：

1. 基础使用：
   await NotebookManager.saveNote('会议记录', '今天讨论了新功能', ['工作', '会议']);

2. 快速保存：
   await NotebookManager.quickSave('这是一个快速想法');

3. 获取内容：
   const allNotes = NotebookManager.getNotebookContent();

4. 下载备份：
   NotebookManager.downloadNotebook();

5. 搜索笔记：
   const results = NotebookManager.searchNotes('会议');

6. 监听事件：
   NotebookManager.addEventListener('noteSaved', (event) => {
       console.log('笔记已保存:', event.detail);
   });

7. 获取统计：
   const stats = NotebookManager.getStats();
   console.log('总笔记数:', stats.noteCount);
*/ 