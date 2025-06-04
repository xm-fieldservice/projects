/**
 * LocalNoteSaver - 本地笔记保存工具包
 * 可集成到任何页面，实现本地笔记的更新保存功能
 * 
 * 使用方法：
 * 1. 引入：<script src="local-note-saver.js"></script>
 * 2. 初始化：const noteSaver = new LocalNoteSaver();
 * 3. 绑定按钮：noteSaver.bindSelectButton('#select-btn');
 * 4. 绑定输入：noteSaver.bindInput('#content-input');
 * 5. 绑定保存：noteSaver.bindSaveButton('#save-btn');
 */

class LocalNoteSaver {
    constructor(options = {}) {
        this.config = {
            appName: options.appName || '第三方应用',
            timestampFormat: options.timestampFormat || 'zh-CN',
            debugMode: options.debugMode || false,
            ...options
        };
        
        // 核心状态
        this.selectedFileHandle = null;  // 选中的文件句柄
        this.currentFileName = '';       // 当前文件名
        this.inputElement = null;        // 绑定的输入框
        this.images = [];               // 录入的图片
        
        // 初始化
        this.init();
    }
    
    /**
     * 初始化工具包
     */
    init() {
        this.log('🔧 LocalNoteSaver 工具包初始化...');
        
        // 检查浏览器支持
        if ('showSaveFilePicker' in window) {
            this.log('✅ 支持 File System Access API');
        } else {
            this.log('⚠️ 不支持 File System Access API，将使用下载保存');
        }
        
        // 设置图片粘贴监听
        this.setupPasteListener();
        
        this.log('✅ LocalNoteSaver 工具包初始化完成');
    }
    
    /**
     * 核心功能1：绑定文件选择按钮
     * @param {string|HTMLElement} selector - 按钮选择器或DOM元素
     */
    bindSelectButton(selector) {
        const button = typeof selector === 'string' ? document.querySelector(selector) : selector;
        if (!button) {
            this.log('❌ 找不到文件选择按钮:', selector);
            return;
        }
        
        button.addEventListener('click', async () => {
            try {
                await this.selectFile();
            } catch (error) {
                this.log('❌ 文件选择失败:', error.message);
            }
        });
        
        this.log('✅ 文件选择按钮已绑定:', selector);
    }
    
    /**
     * 核心功能2：绑定内容输入框
     * @param {string|HTMLElement} selector - 输入框选择器或DOM元素
     */
    bindInput(selector) {
        const input = typeof selector === 'string' ? document.querySelector(selector) : selector;
        if (!input) {
            this.log('❌ 找不到输入框:', selector);
            return;
        }
        
        this.inputElement = input;
        
        // 绑定图片粘贴监听
        input.addEventListener('paste', (event) => {
            this.handlePaste(event);
        });
        
        this.log('✅ 内容输入框已绑定:', selector);
    }
    
    /**
     * 核心功能3：绑定保存按钮
     * @param {string|HTMLElement} selector - 保存按钮选择器或DOM元素
     */
    bindSaveButton(selector) {
        const button = typeof selector === 'string' ? document.querySelector(selector) : selector;
        if (!button) {
            this.log('❌ 找不到保存按钮:', selector);
            return;
        }
        
        button.addEventListener('click', async () => {
            try {
                await this.saveNote();
            } catch (error) {
                this.log('❌ 保存失败:', error.message);
                alert('保存失败: ' + error.message);
            }
        });
        
        this.log('✅ 保存按钮已绑定:', selector);
    }
    
    /**
     * 选择本地文件
     */
    async selectFile() {
        if ('showOpenFilePicker' in window) {
            try {
                // 使用 showOpenFilePicker 选择现有文件，不会清空内容
                const [fileHandle] = await window.showOpenFilePicker({
                    types: [{
                        description: 'Markdown文件',
                        accept: {
                            'text/markdown': ['.md'],
                        },
                    }, {
                        description: '文本文件',
                        accept: {
                            'text/plain': ['.txt'],
                        },
                    }],
                    multiple: false
                });
                
                // 请求读写权限
                const permission = await fileHandle.requestPermission({ mode: 'readwrite' });
                if (permission !== 'granted') {
                    throw new Error('没有文件写入权限');
                }
                
                this.selectedFileHandle = fileHandle;
                this.currentFileName = fileHandle.name;
                
                // 验证文件内容是否被保留
                try {
                    const file = await fileHandle.getFile();
                    const existingContent = await file.text();
                    this.log(`✅ 文件选择成功，现有内容: ${existingContent.length} 字符`);
                } catch (e) {
                    this.log('⚠️ 无法读取文件内容');
                }
                
                this.log('✅ 文件选择成功:', this.currentFileName);
                this.showStatus(`已选择文件: ${this.currentFileName}`, 'success');
                
                return this.currentFileName;
                
            } catch (error) {
                if (error.name === 'AbortError') {
                    this.log('用户取消了文件选择');
                    return null;
                }
                throw error;
            }
        } else if ('showSaveFilePicker' in window) {
            // 降级方案：使用 showSaveFilePicker 创建新文件
            try {
                this.log('⚠️ 降级使用 showSaveFilePicker，将创建新文件');
                
                const fileHandle = await window.showSaveFilePicker({
                    types: [{
                        description: 'Markdown文件',
                        accept: {
                            'text/markdown': ['.md'],
                        },
                    }, {
                        description: '文本文件',
                        accept: {
                            'text/plain': ['.txt'],
                        },
                    }],
                    suggestedName: `笔记-${new Date().toLocaleDateString()}.md`
                });
                
                // 请求读写权限
                const permission = await fileHandle.requestPermission({ mode: 'readwrite' });
                if (permission !== 'granted') {
                    throw new Error('没有文件写入权限');
                }
                
                this.selectedFileHandle = fileHandle;
                this.currentFileName = fileHandle.name;
                
                this.log('✅ 新文件创建成功:', this.currentFileName);
                this.showStatus(`已创建文件: ${this.currentFileName}`, 'success');
                
                return this.currentFileName;
                
            } catch (error) {
                if (error.name === 'AbortError') {
                    this.log('用户取消了文件选择');
                    return null;
                }
                throw error;
            }
        } else {
            // 降级方案：提示用户
            const fileName = prompt('请输入笔记文件名（将保存到下载目录）:', '我的笔记.md');
            if (fileName) {
                this.currentFileName = fileName;
                this.log('✅ 文件名设置:', this.currentFileName);
                this.showStatus(`将保存为: ${this.currentFileName}`, 'info');
                return this.currentFileName;
            }
            return null;
        }
    }
    
    /**
     * 更新保存笔记（追加内容，不删除原内容）
     */
    async saveNote() {
        if (!this.currentFileName) {
            throw new Error('请先选择文件');
        }
        
        const content = this.getInputContent();
        if (!content && this.images.length === 0) {
            throw new Error('请输入内容或添加图片');
        }
        
        if (this.selectedFileHandle && 'createWritable' in this.selectedFileHandle) {
            return await this.saveToLocalFile(content);
        } else {
            return await this.saveAsDownload(content);
        }
    }
    
    /**
     * 直接保存到本地文件（更新保存）
     */
    async saveToLocalFile(content) {
        try {
            this.log('📝 开始更新保存到本地文件...');
            
            // 1. 读取现有内容
            let existingContent = '';
            try {
                const file = await this.selectedFileHandle.getFile();
                existingContent = await file.text();
                this.log(`📖 读取现有内容: ${existingContent.length} 字符`);
            } catch (readError) {
                this.log('📝 文件不存在或为空，将创建新文件');
            }
            
            // 2. 构建新增内容
            const timestamp = new Date().toLocaleString(this.config.timestampFormat);
            let newContent = `\n## ${timestamp} - ${this.config.appName}\n\n`;
            
            if (content.trim()) {
                newContent += `${content}\n`;
            }
            
            // 3. 添加图片
            if (this.images.length > 0) {
                newContent += '\n### 图片\n';
                this.images.forEach((image, index) => {
                    newContent += `![图片${index + 1}](${image})\n`;
                });
            }
            
            newContent += '\n---\n';
            
            // 4. 合并内容（更新保存）
            const finalContent = existingContent + newContent;
            
            // 5. 写入文件
            const writable = await this.selectedFileHandle.createWritable();
            await writable.write(finalContent);
            await writable.close();
            
            this.log('✅ 更新保存成功');
            this.showStatus('内容已追加到笔记文件', 'success');
            
            // 6. 清空输入
            this.clearInput();
            
            return {
                success: true,
                mode: '本地文件',
                fileName: this.currentFileName,
                addedLength: newContent.length
            };
            
        } catch (error) {
            this.log('❌ 本地文件保存失败:', error);
            throw error;
        }
    }
    
    /**
     * 降级方案：下载保存
     */
    async saveAsDownload(content) {
        try {
            this.log('📥 使用下载方式保存...');
            
            // 构建内容
            const timestamp = new Date().toLocaleString(this.config.timestampFormat);
            let fileContent = `## ${timestamp} - ${this.config.appName}\n\n`;
            
            if (content.trim()) {
                fileContent += `${content}\n`;
            }
            
            if (this.images.length > 0) {
                fileContent += '\n### 图片\n';
                this.images.forEach((image, index) => {
                    fileContent += `![图片${index + 1}](${image})\n`;
                });
            }
            
            fileContent += '\n---\n';
            
            // 创建下载
            const blob = new Blob([fileContent], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = this.currentFileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.log('✅ 文件已下载');
            this.showStatus('文件已下载到默认下载目录', 'success');
            
            this.clearInput();
            
            return {
                success: true,
                mode: '下载保存',
                fileName: this.currentFileName
            };
            
        } catch (error) {
            this.log('❌ 下载保存失败:', error);
            throw error;
        }
    }
    
    /**
     * 获取输入内容
     */
    getInputContent() {
        if (!this.inputElement) {
            return '';
        }
        return this.inputElement.value || this.inputElement.textContent || '';
    }
    
    /**
     * 清空输入
     */
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
    
    /**
     * 设置粘贴监听
     */
    setupPasteListener() {
        // 全局粘贴监听，用于图片
        document.addEventListener('paste', (event) => {
            if (document.activeElement === this.inputElement) {
                this.handlePaste(event);
            }
        });
    }
    
    /**
     * 处理粘贴事件（图片）
     */
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
    
    /**
     * 添加图片
     */
    addImage(file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const base64Data = event.target.result;
            this.images.push(base64Data);
            this.log(`📷 添加图片: ${this.images.length}`);
            this.showStatus(`已添加图片 ${this.images.length}`, 'info');
        };
        reader.readAsDataURL(file);
    }
    
    /**
     * 显示状态消息
     */
    showStatus(message, type = 'info') {
        // 尝试找到状态显示元素
        const statusEl = document.querySelector('[data-note-saver-status]') 
                       || document.querySelector('.note-saver-status')
                       || document.querySelector('#note-saver-status');
                       
        if (statusEl) {
            statusEl.textContent = message;
            statusEl.className = `note-saver-status ${type}`;
            
            // 3秒后清空
            setTimeout(() => {
                statusEl.textContent = '';
                statusEl.className = 'note-saver-status';
            }, 3000);
        }
        
        this.log(`📢 状态: ${message}`);
    }
    
    /**
     * 调试日志
     */
    log(...args) {
        if (this.config.debugMode) {
            console.log('[LocalNoteSaver]', ...args);
        }
    }
    
    /**
     * 获取当前状态
     */
    getStatus() {
        return {
            hasFile: !!this.selectedFileHandle,
            fileName: this.currentFileName,
            imageCount: this.images.length,
            hasInput: !!this.inputElement,
            apiSupported: 'showSaveFilePicker' in window
        };
    }
    
    /**
     * 创建新文件
     */
    async createNewFile() {
        if ('showSaveFilePicker' in window) {
            try {
                this.log('📝 创建新文件...');
                
                const fileHandle = await window.showSaveFilePicker({
                    types: [{
                        description: 'Markdown文件',
                        accept: {
                            'text/markdown': ['.md'],
                        },
                    }, {
                        description: '文本文件',
                        accept: {
                            'text/plain': ['.txt'],
                        },
                    }],
                    suggestedName: `笔记-${new Date().toLocaleDateString()}.md`
                });
                
                // 请求读写权限
                const permission = await fileHandle.requestPermission({ mode: 'readwrite' });
                if (permission !== 'granted') {
                    throw new Error('没有文件写入权限');
                }
                
                this.selectedFileHandle = fileHandle;
                this.currentFileName = fileHandle.name;
                
                this.log('✅ 新文件创建成功:', this.currentFileName);
                this.showStatus(`已创建新文件: ${this.currentFileName}`, 'success');
                
                return this.currentFileName;
                
            } catch (error) {
                if (error.name === 'AbortError') {
                    this.log('用户取消了文件创建');
                    return null;
                }
                throw error;
            }
        } else {
            // 降级方案：提示用户
            const fileName = prompt('请输入新笔记文件名（将保存到下载目录）:', `新笔记-${new Date().toLocaleDateString()}.md`);
            if (fileName) {
                this.currentFileName = fileName;
                this.log('✅ 新文件名设置:', this.currentFileName);
                this.showStatus(`将创建新文件: ${this.currentFileName}`, 'info');
                return this.currentFileName;
            }
            return null;
        }
    }

    /**
     * 绑定创建新文件按钮
     * @param {string|HTMLElement} selector - 按钮选择器或DOM元素
     */
    bindCreateButton(selector) {
        const button = typeof selector === 'string' ? document.querySelector(selector) : selector;
        if (!button) {
            this.log('❌ 找不到创建文件按钮:', selector);
            return;
        }
        
        button.addEventListener('click', async () => {
            try {
                await this.createNewFile();
            } catch (error) {
                this.log('❌ 文件创建失败:', error.message);
            }
        });
        
        this.log('✅ 创建文件按钮已绑定:', selector);
    }
}

// 全局便捷方法
window.LocalNoteSaver = LocalNoteSaver;

// 便捷初始化方法
window.createNoteSaver = function(options = {}) {
    return new LocalNoteSaver(options);
};

console.log('📝 LocalNoteSaver 工具包已加载'); 