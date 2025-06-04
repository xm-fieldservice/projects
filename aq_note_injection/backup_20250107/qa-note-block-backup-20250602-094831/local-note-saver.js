/**
 * LocalNoteSaver - Local Note Saving Toolkit
 */

class LocalNoteSaver {
    constructor(options = {}) {
        this.config = {
            appName: options.appName || 'App',
            timestampFormat: options.timestampFormat || 'zh-CN',
            debugMode: options.debugMode || false,
            ...options
        };
        
        this.selectedFileHandle = null;
        this.currentFileName = '';
        this.inputElement = null;
        this.images = [];
        
        this.init();
    }
    
    init() {
        this.log('LocalNoteSaver init...');
        this.setupPasteListener();
        this.log('LocalNoteSaver ready');
    }
    
    bindSelectButton(selector) {
        const button = typeof selector === 'string' ? document.querySelector(selector) : selector;
        if (!button) {
            this.log('Button not found:', selector);
            return;
        }
        
        button.addEventListener('click', async () => {
            try {
                await this.selectFile();
            } catch (error) {
                this.log('File selection failed:', error.message);
            }
        });
        
        this.log('Select button bound:', selector);
    }
    
    bindInput(selector) {
        const input = typeof selector === 'string' ? document.querySelector(selector) : selector;
        if (!input) {
            this.log('Input not found:', selector);
            return;
        }
        
        this.inputElement = input;
        this.log('Input bound:', selector);
    }
    
    bindCreateButton(selector) {
        const button = typeof selector === 'string' ? document.querySelector(selector) : selector;
        if (!button) {
            this.log('Create button not found:', selector);
            return;
        }
        
        button.addEventListener('click', async () => {
            try {
                await this.createNewFile();
            } catch (error) {
                this.log('File creation failed:', error.message);
            }
        });
        
        this.log('Create button bound:', selector);
    }
    
    async selectFile() {
        if ('showOpenFilePicker' in window) {
            try {
                const [fileHandle] = await window.showOpenFilePicker({
                    types: [{
                        description: 'Markdown files',
                        accept: {
                            'text/markdown': ['.md'],
                        },
                    }, {
                        description: 'Text files',
                        accept: {
                            'text/plain': ['.txt'],
                        },
                    }],
                    multiple: false
                });
                
                const permission = await fileHandle.requestPermission({ mode: 'readwrite' });
                if (permission !== 'granted') {
                    throw new Error('No file write permission');
                }
                
                this.selectedFileHandle = fileHandle;
                this.currentFileName = fileHandle.name;
                
                this.log('File selected:', this.currentFileName);
                this.showStatus('File selected: ' + this.currentFileName, 'success');
                
                return this.currentFileName;
                
            } catch (error) {
                if (error.name === 'AbortError') {
                    this.log('File selection cancelled');
                    return null;
                }
                throw error;
            }
        } else {
            this.showStatus('File API not supported', 'warning');
            throw new Error('File System Access API not supported');
        }
    }
    
    async createNewFile() {
        if ('showSaveFilePicker' in window) {
            try {
                const fileHandle = await window.showSaveFilePicker({
                    types: [{
                        description: 'Markdown files',
                        accept: {
                            'text/markdown': ['.md'],
                        },
                    }],
                    suggestedName: 'note-' + new Date().toLocaleDateString() + '.md'
                });
                
                const permission = await fileHandle.requestPermission({ mode: 'readwrite' });
                if (permission !== 'granted') {
                    throw new Error('No file write permission');
                }
                
                this.selectedFileHandle = fileHandle;
                this.currentFileName = fileHandle.name;
                
                this.log('New file created:', this.currentFileName);
                this.showStatus('New file created: ' + this.currentFileName, 'success');
                
                return this.currentFileName;
                
            } catch (error) {
                if (error.name === 'AbortError') {
                    this.log('File creation cancelled');
                    return null;
                }
                throw error;
            }
        } else {
            const fileName = prompt('Enter filename:', 'note-' + new Date().toLocaleDateString() + '.md');
            if (fileName) {
                this.currentFileName = fileName;
                this.log('Filename set:', this.currentFileName);
                this.showStatus('Filename set: ' + this.currentFileName, 'info');
                return this.currentFileName;
            }
            return null;
        }
    }
    
    async saveNote() {
        console.log('🔍 [DEBUG] saveNote() called - 开始保存流程');
        
        // 直接从DOM获取完整输入数据
        const titleInput = document.getElementById('title-input');
        const contentInput = document.getElementById('content-input');
        
        const title = titleInput ? titleInput.value.trim() : '';
        const content = contentInput ? contentInput.value.trim() : '';
        
        console.log('🔍 [DEBUG] 标题长度:', title.length, '内容:', title);
        console.log('🔍 [DEBUG] 内容长度:', content.length, '内容:', content);
        
        // 验证：至少要有标题或内容其中之一
        if (!title && !content) {
            console.log('🔍 [DEBUG] 标题和内容都为空，退出保存');
            this.showStatus('Please enter title or content', 'warning');
            return { success: false, error: 'Empty title and content' };
        }
        
        console.log('🔍 [DEBUG] 是否有选中文件:', !!this.selectedFileHandle);
        console.log('🔍 [DEBUG] 当前文件名:', this.currentFileName);
        
        if (this.selectedFileHandle) {
            console.log('🔍 [DEBUG] 调用 saveToLocalFile (更新保存)');
            return await this.saveToLocalFile({ title, content });
        } else {
            console.log('🔍 [DEBUG] 调用 saveAsDownload (新文件下载)');
            return await this.saveAsDownload({ title, content });
        }
    }
    
    async saveToLocalFile(inputData) {
        console.log('🔍 [DEBUG] saveToLocalFile() 开始 - 更新保存模式');
        
        if (!this.selectedFileHandle) {
            throw new Error('No file selected');
        }
        
        try {
            // 先读取文件现有内容
            let existingContent = '';
            console.log('🔍 [DEBUG] 开始读取现有文件内容...');
            
            try {
                const file = await this.selectedFileHandle.getFile();
                existingContent = await file.text();
                console.log('✅ [DEBUG] 成功读取现有内容，长度:', existingContent.length);
                console.log('🔍 [DEBUG] 现有内容预览:', existingContent.substring(0, 100) + (existingContent.length > 100 ? '...' : ''));
            } catch (readError) {
                // 如果文件不存在或读取失败，使用空内容
                console.log('⚠️ [DEBUG] 读取现有内容失败:', readError.message);
                console.log('🔍 [DEBUG] 使用空内容开始新文件');
                existingContent = '';
            }
            
            // 准备新增内容
            const newContent = this.prepareSaveContent(inputData);
            console.log('🔍 [DEBUG] 新内容长度:', newContent.length);
            console.log('🔍 [DEBUG] 新内容预览:', newContent.substring(0, 100) + (newContent.length > 100 ? '...' : ''));
            
            // 合并内容：现有内容 + 新内容（不需要额外分隔符，因为prepareSaveContent已经加了）
            const finalContent = existingContent + newContent;
            
            console.log('🔍 [DEBUG] 最终内容长度:', finalContent.length);
            console.log('🔍 [DEBUG] 现有内容长度:', existingContent.length, '新内容长度:', newContent.length);
            
            console.log('🔍 [DEBUG] 开始写入文件...');
            const writable = await this.selectedFileHandle.createWritable();
            await writable.write(finalContent);
            await writable.close();
            
            console.log('✅ [DEBUG] 文件更新完成!');
            this.log('File updated (appended):', this.currentFileName);
            this.showStatus('Content appended to: ' + this.currentFileName + ' (总长度: ' + finalContent.length + ')', 'success');
            
            return {
                success: true,
                fileName: this.currentFileName,
                method: 'file-system-api-append',
                size: finalContent.length,
                existingSize: existingContent.length,
                newSize: newContent.length
            };
            
        } catch (error) {
            console.error('❌ [DEBUG] saveToLocalFile 失败:', error);
            this.log('File append failed:', error);
            this.showStatus('Append failed: ' + error.message, 'error');
            throw error;
        }
    }
    
    async saveAsDownload(inputData) {
        try {
            const finalContent = this.prepareSaveContent(inputData);
            const fileName = this.currentFileName || 'note-' + new Date().toLocaleDateString() + '.md';
            
            const blob = new Blob([finalContent], { type: 'text/markdown;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.log('File downloaded:', fileName);
            this.showStatus('Downloaded: ' + fileName, 'success');
            
            return {
                success: true,
                fileName: fileName,
                method: 'download',
                size: finalContent.length
            };
            
        } catch (error) {
            this.log('Download failed:', error);
            this.showStatus('Download failed: ' + error.message, 'error');
            throw error;
        }
    }
    
    prepareSaveContent(inputData) {
        // 如果传入的是字符串（兼容旧版本），直接使用
        if (typeof inputData === 'string') {
            const timestamp = new Date().toLocaleString(this.config.timestampFormat);
            return `${inputData}\n\n标记族：\n- 时间戳：${timestamp}\n- 来源：${this.config.appName}\n\n---\n\n`;
        }
        
        // 新版本：从inputData对象获取标题和内容
        const title = inputData.title || '';
        const content = inputData.content || '';
        
        // 如果还需要从DOM获取标签
        const tagsInput = document.getElementById('tags-input');
        const tags = tagsInput ? tagsInput.value.trim() : '';
        
        let finalContent = '';
        const timestamp = new Date().toLocaleString(this.config.timestampFormat);
        
        // 添加标题（如果有）
        if (title) {
            finalContent += `标题：${title}\n`;
        }
        
        // 添加内容（如果有）
        if (content) {
            finalContent += `${content}\n`;
        }
        
        // 添加标记族
        finalContent += '\n标记族：\n';
        
        // 添加时间戳
        finalContent += `- 时间戳：${timestamp}\n`;
        
        // 添加来源
        finalContent += `- 来源：${this.config.appName}\n`;
        
        // 添加标签（如果有）
        if (tags) {
            const tagArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
            if (tagArray.length > 0) {
                finalContent += `- 标签：${tagArray.map(tag => `#${tag}`).join(' ')}\n`;
            }
        }
        
        // 添加图片（如果有）
        if (this.images.length > 0) {
            finalContent += `- 附加图片：${this.images.length}张\n`;
            this.images.forEach((imageData, index) => {
                finalContent += `  ![图片${index + 1}](${imageData})\n`;
            });
        }
        
        // 笔记块结束分隔符
        finalContent += '\n---\n\n';
        
        return finalContent;
    }
    
    getInputContent() {
        if (!this.inputElement) {
            return '';
        }
        return this.inputElement.value || this.inputElement.textContent || '';
    }
    
    clearInput() {
        if (this.inputElement) {
            if (this.inputElement.value !== undefined) {
                this.inputElement.value = '';
            } else {
                this.inputElement.textContent = '';
            }
        }
        this.images = [];
    }
    
    setupPasteListener() {
        document.addEventListener('paste', (event) => {
            if (document.activeElement === this.inputElement) {
                this.handlePaste(event);
            }
        });
    }
    
    handlePaste(event) {
        const items = event.clipboardData.items;
        
        for (let item of items) {
            if (item.type.startsWith('image/')) {
                event.preventDefault();
                
                const file = item.getAsFile();
                if (file) {
                    this.addImage(file);
                }
            }
        }
    }
    
    addImage(file) {
        if (typeof file === 'string') {
            this.images.push(file);
            this.log('Image added: ' + this.images.length);
            this.showStatus('Image added ' + this.images.length, 'info');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (event) => {
            const base64Data = event.target.result;
            this.images.push(base64Data);
            this.log('Image added: ' + this.images.length);
            this.showStatus('Image added ' + this.images.length, 'info');
        };
        reader.readAsDataURL(file);
    }
    
    showStatus(message, type = 'info') {
        const statusEl = document.querySelector('[data-note-saver-status]') 
                       || document.querySelector('.note-saver-status')
                       || document.querySelector('#note-saver-status');
                       
        if (statusEl) {
            statusEl.textContent = message;
            statusEl.className = 'note-saver-status ' + type;
            
            setTimeout(() => {
                statusEl.textContent = '';
                statusEl.className = 'note-saver-status';
            }, 3000);
        }
        
        this.log('Status: ' + message);
    }
    
    log(...args) {
        if (this.config.debugMode) {
            console.log('[LocalNoteSaver]', ...args);
        }
    }
    
    getStatus() {
        return {
            hasFile: !!this.selectedFileHandle,
            fileName: this.currentFileName,
            imageCount: this.images.length,
            hasInput: !!this.inputElement,
            apiSupported: 'showSaveFilePicker' in window
        };
    }
    
    // 添加调试测试方法
    async testFileOperations() {
        console.log('🧪 [TEST] 开始文件操作测试...');
        
        if (!this.selectedFileHandle) {
            console.log('❌ [TEST] 没有选中文件，请先选择文件');
            this.showStatus('请先选择一个文件进行测试', 'warning');
            return;
        }
        
        try {
            // 测试读取
            console.log('🧪 [TEST] 测试读取文件...');
            const file = await this.selectedFileHandle.getFile();
            const content = await file.text();
            console.log('✅ [TEST] 读取成功，文件大小:', content.length);
            console.log('🧪 [TEST] 文件内容预览:', content.substring(0, 200));
            
            // 显示状态
            this.showStatus('测试成功！文件大小: ' + content.length + ' 字符', 'success');
            
            return {
                success: true,
                fileSize: content.length,
                fileName: this.currentFileName,
                preview: content.substring(0, 200)
            };
            
        } catch (error) {
            console.error('❌ [TEST] 文件操作测试失败:', error);
            this.showStatus('测试失败: ' + error.message, 'error');
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// Global methods
window.LocalNoteSaver = LocalNoteSaver;

window.createNoteSaver = function(options = {}) {
    return new LocalNoteSaver(options);
};

// 添加全局调试函数
window.testLocalNoteSaver = function() {
    console.log('🔍 寻找LocalNoteSaver实例...');
    
    // 尝试从QANote获取实例
    if (window.QANote && window.QANote.localNoteSaver) {
        console.log('✅ 找到LocalNoteSaver实例');
        return window.QANote.localNoteSaver.testFileOperations();
    }
    
    // 尝试从全局变量获取
    if (window.localNoteSaver) {
        console.log('✅ 找到全局LocalNoteSaver实例');
        return window.localNoteSaver.testFileOperations();
    }
    
    console.log('❌ 未找到LocalNoteSaver实例');
    console.log('请确保页面已加载完成');
    return null;
};

console.log('LocalNoteSaver toolkit loaded with DEBUG mode');
console.log('💡 使用 testLocalNoteSaver() 来测试文件操作'); 