/**
 * 笔记本管理器 - 共享模块
 */
class NotebookManager {
    static STORAGE_KEY = 'qa_notebook_content';
    
    static getNotebookContent() {
        return localStorage.getItem(this.STORAGE_KEY) || '';
    }
    
    static saveNote(title, content, tags = []) {
        const timestamp = new Date().toLocaleString('zh-CN');
        let noteText = `\n# ${timestamp}\n\n`;
        if (title.trim()) {
            noteText += `## ${title.trim()}\n\n`;
        }
        noteText += `${content.trim()}\n`;
        if (tags.length > 0) {
            noteText += `\n**标签：** ${tags.map(tag => `#${tag}`).join(' ')}\n`;
        }
        noteText += '\n---\n';
        
        const existingContent = this.getNotebookContent();
        const fullContent = existingContent + noteText;
        localStorage.setItem(this.STORAGE_KEY, fullContent);
        return true;
    }
}

window.NotebookManager = NotebookManager; 