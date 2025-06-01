/**
 * 笔记本管理器 - 本地存储和文件操作
 * 提供笔记保存、导出、搜索等功能
 */
class NotebookManager {
    static STORAGE_KEY = 'qa_notebook_content';
    static DEFAULT_FILENAME = '我的笔记本.md';
    static MAX_STORAGE_SIZE = 50 * 1024 * 1024; // 50MB限制
    
    /**
     * 保存笔记到本地存储
     */
    static async saveNote(title, content, tags = [], type = 'note') {
        try {
            const timestamp = new Date().toLocaleString('zh-CN');
            const noteId = `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            // 构建笔记内容
            let noteText = `\n## ${timestamp}\n\n`;
            if (title.trim()) {
                noteText += `### ${title.trim()}\n\n`;
            }
            noteText += `${content.trim()}\n\n`;
            if (tags.length > 0) {
                noteText += `**标签：** ${tags.map(tag => `#${tag}`).join(' ')}\n\n`;
            }
            noteText += `**类型：** ${type}\n`;
            noteText += `**ID：** ${noteId}\n`;
            noteText += '\n---\n';
            
            // 获取现有内容
            const existingContent = this.getNotebookContent();
            const fullContent = existingContent + noteText;
            
            // 检查存储大小
            if (fullContent.length * 2 > this.MAX_STORAGE_SIZE) {
                throw new Error('存储空间不足，请清理旧笔记或导出备份');
            }
            
            // 保存到localStorage
            localStorage.setItem(this.STORAGE_KEY, fullContent);
            
            // 自动下载备份
            this.downloadNotebook(fullContent);
            
            return {
                success: true,
                data: {
                    noteId: noteId,
                    savedAt: timestamp,
                    fileDownloaded: true,
                    totalSize: fullContent.length
                }
            };
        } catch (error) {
            console.error('保存笔记失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    /**
     * 获取笔记本内容
     */
    static getNotebookContent() {
        return localStorage.getItem(this.STORAGE_KEY) || '';
    }
    
    /**
     * 搜索笔记内容
     */
    static searchNotes(keyword, options = {}) {
        try {
            const content = this.getNotebookContent();
            const { caseSensitive = false, maxResults = 10 } = options;
            
            if (!keyword.trim()) {
                return {
                    success: true,
                    data: {
                        results: [],
                        total: 0,
                        keyword: keyword
                    }
                };
            }
            
            const searchTerm = caseSensitive ? keyword : keyword.toLowerCase();
            const searchContent = caseSensitive ? content : content.toLowerCase();
            
            const lines = content.split('\n');
            const results = [];
            
            for (let i = 0; i < lines.length && results.length < maxResults; i++) {
                const line = lines[i];
                const searchLine = caseSensitive ? line : line.toLowerCase();
                
                if (searchLine.includes(searchTerm)) {
                    // 获取上下文
                    const context = {
                        before: lines[i - 1] || '',
                        current: line,
                        after: lines[i + 1] || ''
                    };
                    
                    results.push({
                        lineNumber: i + 1,
                        content: line,
                        context: context,
                        highlight: this.highlightKeyword(line, keyword, caseSensitive)
                    });
                }
            }
            
            return {
                success: true,
                data: {
                    results: results,
                    total: results.length,
                    keyword: keyword,
                    options: options
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    /**
     * 高亮关键词
     */
    static highlightKeyword(text, keyword, caseSensitive = false) {
        if (!keyword.trim()) return text;
        
        const flags = caseSensitive ? 'g' : 'gi';
        const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, flags);
        
        return text.replace(regex, '<mark>$1</mark>');
    }
    
    /**
     * 获取笔记统计信息
     */
    static getNotebookStats() {
        try {
            const content = this.getNotebookContent();
            const lines = content.split('\n');
            
            // 统计不同类型的内容
            let noteCount = 0;
            let qaCount = 0;
            let tagCount = 0;
            const tags = new Set();
            
            lines.forEach(line => {
                if (line.includes('**类型：** note')) noteCount++;
                if (line.includes('**类型：** qa')) qaCount++;
                if (line.includes('**标签：**')) {
                    tagCount++;
                    // 提取标签
                    const tagMatch = line.match(/#(\w+)/g);
                    if (tagMatch) {
                        tagMatch.forEach(tag => tags.add(tag.substring(1)));
                    }
                }
            });
            
            return {
                success: true,
                data: {
                    totalSize: content.length,
                    totalLines: lines.length,
                    noteCount: noteCount,
                    qaCount: qaCount,
                    totalTags: tags.size,
                    uniqueTags: Array.from(tags),
                    lastModified: localStorage.getItem(`${this.STORAGE_KEY}_lastModified`) || '未知'
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    /**
     * 下载笔记本文件
     */
    static downloadNotebook(content = null, filename = null) {
        try {
            const noteContent = content || this.getNotebookContent();
            const fileName = filename || this.DEFAULT_FILENAME;
            
            if (!noteContent.trim()) {
                throw new Error('笔记本为空，无法下载');
            }
            
            // 添加文件头信息
            const fileHeader = `# 个人智能问答系统笔记本\n\n> 导出时间：${new Date().toLocaleString('zh-CN')}\n> 总大小：${noteContent.length} 字符\n\n---\n\n`;
            const fullContent = fileHeader + noteContent;
            
            const blob = new Blob([fullContent], { type: 'text/markdown;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            
            a.href = url;
            a.download = fileName;
            a.style.display = 'none';
            
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            // 清理URL对象
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            
            // 更新最后修改时间
            localStorage.setItem(`${this.STORAGE_KEY}_lastModified`, new Date().toISOString());
            
            return {
                success: true,
                data: {
                    filename: fileName,
                    size: fullContent.length,
                    downloadedAt: new Date().toISOString()
                }
            };
        } catch (error) {
            console.error('下载笔记本失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    /**
     * 导入笔记本文件
     */
    static async importNotebook(file) {
        try {
            if (!file || file.type !== 'text/markdown' && !file.name.endsWith('.md')) {
                throw new Error('请选择Markdown格式的文件(.md)');
            }
            
            if (file.size > this.MAX_STORAGE_SIZE) {
                throw new Error('文件过大，请选择小于50MB的文件');
            }
            
            const content = await this.readFileAsText(file);
            
            // 合并到现有内容
            const existingContent = this.getNotebookContent();
            const mergedContent = existingContent + '\n\n# 导入内容\n\n' + content;
            
            localStorage.setItem(this.STORAGE_KEY, mergedContent);
            localStorage.setItem(`${this.STORAGE_KEY}_lastModified`, new Date().toISOString());
            
            return {
                success: true,
                data: {
                    filename: file.name,
                    size: file.size,
                    importedAt: new Date().toISOString(),
                    totalSize: mergedContent.length
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    /**
     * 读取文件内容
     */
    static readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error('文件读取失败'));
            reader.readAsText(file, 'utf-8');
        });
    }
    
    /**
     * 清空笔记本
     */
    static clearNotebook(confirm = false) {
        if (!confirm) {
            return {
                success: false,
                error: '请确认清空操作，这将删除所有本地笔记'
            };
        }
        
        try {
            // 先备份
            const content = this.getNotebookContent();
            if (content.trim()) {
                this.downloadNotebook(content, `备份_${new Date().toISOString().split('T')[0]}_${this.DEFAULT_FILENAME}`);
            }
            
            // 清空存储
            localStorage.removeItem(this.STORAGE_KEY);
            localStorage.removeItem(`${this.STORAGE_KEY}_lastModified`);
            
            return {
                success: true,
                data: {
                    clearedAt: new Date().toISOString(),
                    backupCreated: content.trim().length > 0
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    /**
     * 导出为不同格式
     */
    static exportAs(format = 'md', options = {}) {
        try {
            const content = this.getNotebookContent();
            const { includeStats = true, filename = null } = options;
            
            let exportContent = content;
            let mimeType = 'text/plain';
            let extension = 'txt';
            
            switch (format.toLowerCase()) {
                case 'md':
                case 'markdown':
                    mimeType = 'text/markdown';
                    extension = 'md';
                    break;
                case 'txt':
                case 'text':
                    // 移除Markdown格式
                    exportContent = content.replace(/[#*`]/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
                    mimeType = 'text/plain';
                    extension = 'txt';
                    break;
                case 'html':
                    // 简单的Markdown到HTML转换
                    exportContent = this.markdownToHtml(content);
                    mimeType = 'text/html';
                    extension = 'html';
                    break;
                default:
                    throw new Error(`不支持的导出格式: ${format}`);
            }
            
            const fileName = filename || `笔记本_${new Date().toISOString().split('T')[0]}.${extension}`;
            
            const blob = new Blob([exportContent], { type: `${mimeType};charset=utf-8` });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            
            a.href = url;
            a.download = fileName;
            a.click();
            
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            
            return {
                success: true,
                data: {
                    format: format,
                    filename: fileName,
                    size: exportContent.length
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    /**
     * 简单的Markdown转HTML
     */
    static markdownToHtml(markdown) {
        return markdown
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
            .replace(/\*(.*)\*/gim, '<em>$1</em>')
            .replace(/\n/gim, '<br>');
    }
}

// 导出到全局
window.NotebookManager = NotebookManager; 