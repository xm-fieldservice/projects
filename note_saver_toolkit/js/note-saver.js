/**
 * FILE: note-saver.js
 * REQ: 独立的笔记保存工具包,供任意页面调用
 * CHECK: 路径选择,内容保存,图片处理,格式定义,API接口
 * HIST: 2025-01-31-AI生成
 */

class NoteSaver {
    constructor(options = {}) {
        this.config = {
            apiBase: options.apiBase || 'http://localhost:5000/api',
            defaultFormat: options.defaultFormat || 'markdown',
            autoTimestamp: options.autoTimestamp !== false,
            ...options
        };
        
        this.currentFilePath = '';
        this.pastedImages = [];
        this.selectedFileHandle = null; // 用于存储文件句柄
        
        // 初始化
        this.init();
    }

    /**
     * 初始化工具包
     */
    async init() {
        try {
            // 健康检查
            await this.apiRequest('/health');
            console.log('📝 NoteSaver 工具包已初始化');
        } catch (error) {
            console.error('❌ NoteSaver 初始化失败:', error);
        }
    }

    /**
     * 1. 路径选择接口 - 选择或创建本地文件
     * @param {Function} callback - 选择完成后的回调函数
     */
    async selectFilePath(callback) {
        try {
            // 检查是否支持文件系统访问API
            if ('showSaveFilePicker' in window) {
                // 使用现代文件系统访问API（Chrome 86+）
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
                    suggestedName: '我的笔记.md'
                });
                
                this.selectedFileHandle = fileHandle;
                this.currentFilePath = fileHandle.name;
                
                if (callback) callback(fileHandle.name);
                return fileHandle.name;
                
            } else {
                // 降级方案：使用传统文件选择器
                return this.selectFilePathFallback(callback);
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('用户取消了文件选择');
            } else {
                console.error('文件选择失败:', error);
                // 尝试降级方案
                return this.selectFilePathFallback(callback);
            }
        }
    }

    /**
     * 降级方案：传统文件选择器
     */
    selectFilePathFallback(callback) {
        return new Promise((resolve, reject) => {
            // 提示用户输入文件路径
            const defaultPath = prompt(
                '请输入保存文件的路径和名称\n' +
                '例如: notes/my_notes.md\n' +
                '注意：由于浏览器安全限制，文件将保存在项目目录下',
                'notes/my_notes.md'
            );
            
            if (defaultPath && defaultPath.trim()) {
                this.currentFilePath = defaultPath.trim();
                
                // 设置后端保存路径
                this.setBackendPath(this.currentFilePath);
                
                if (callback) callback(this.currentFilePath);
                resolve(this.currentFilePath);
            } else {
                reject('未提供文件路径');
            }
        });
    }

    /**
     * 2. 内容保存接口 - 保存笔记内容
     * @param {string} content - 笔记内容
     * @param {Object} options - 保存选项
     */
    async saveNote(content, options = {}) {
        const saveOptions = {
            appName: options.appName || '笔记工具',
            format: options.format || this.config.defaultFormat,
            timestamp: options.timestamp !== false,
            images: options.images || this.pastedImages,
            ...options
        };

        if (!content && saveOptions.images.length === 0) {
            throw new Error('请提供笔记内容或图片');
        }

        if (!this.currentFilePath) {
            throw new Error('请先选择保存路径');
        }

        try {
            // 如果有文件句柄，直接写入本地文件
            if (this.selectedFileHandle && 'createWritable' in this.selectedFileHandle) {
                return await this.saveToLocalFile(content, saveOptions);
            } else {
                // 否则通过后端API保存
                return await this.saveViaBackend(content, saveOptions);
            }
        } catch (error) {
            throw new Error(`保存失败: ${error.message}`);
        }
    }

    /**
     * 直接保存到本地文件（使用文件系统访问API）
     */
    async saveToLocalFile(content, saveOptions) {
        try {
            // 生成时间戳
            const timestamp = new Date().toLocaleString('zh-CN');
            
            // 构建完整内容
            let fullContent = `\n## ${timestamp} - ${saveOptions.appName}\n\n`;
            
            if (content.trim()) {
                fullContent += `${content}\n`;
            }
            
            // 处理图片
            if (saveOptions.images.length > 0) {
                fullContent += '\n### 图片\n';
                saveOptions.images.forEach((image, index) => {
                    // image 已经是完整的 data URL，不需要再添加前缀
                    fullContent += `![图片${index + 1}](${image})\n`;
                });
            }
            
            fullContent += '\n---\n';
            
            // 读取现有内容
            let existingContent = '';
            try {
                const file = await this.selectedFileHandle.getFile();
                existingContent = await file.text();
                console.log('读取到现有内容长度:', existingContent.length);
            } catch (e) {
                console.log('文件不存在或读取失败，创建新文件');
                // 文件不存在或读取失败，使用空内容
            }
            
            // 写入文件 - 使用 keepExistingData: true 避免清空文件
            const writable = await this.selectedFileHandle.createWritable({ 
                keepExistingData: true 
            });
            
            // 移动到文件末尾然后写入新内容
            if (existingContent.length > 0) {
                await writable.seek(existingContent.length);
                await writable.write(fullContent);
            } else {
                // 新文件直接写入
                await writable.write(fullContent);
            }
            
            await writable.close();
            
            // 清空已保存的图片
            this.pastedImages = [];
            
            return {
                success: true,
                message: '笔记保存成功（本地文件）',
                filePath: this.currentFilePath
            };
            
        } catch (error) {
            console.error('本地文件保存失败:', error);
            // 降级到后端保存
            return await this.saveViaBackend(content, saveOptions);
        }
    }

    /**
     * 通过后端API保存
     */
    async saveViaBackend(content, saveOptions) {
        const result = await this.apiRequest('/save_note', {
            method: 'POST',
            body: JSON.stringify({
                content: content,
                app_name: saveOptions.appName,
                images: saveOptions.images
            })
        });

        if (result.success) {
            // 清空已保存的图片
            this.pastedImages = [];
            return {
                success: true,
                message: '笔记保存成功（服务器端）',
                filePath: this.currentFilePath
            };
        } else {
            throw new Error(result.message || '保存失败');
        }
    }

    /**
     * 3. 格式定义接口 - 设置保存格式
     * @param {string} format - 格式类型 ('markdown', 'text', 'json')
     * @param {Object} customFormat - 自定义格式选项
     */
    setFormat(format, customFormat = {}) {
        this.config.defaultFormat = format;
        this.config.customFormat = customFormat;
        return this;
    }

    /**
     * 4. 图片处理接口 - 添加图片到待保存列表
     * @param {string|File|Blob} imageData - 图片数据
     */
    addImage(imageData) {
        return new Promise((resolve, reject) => {
            if (typeof imageData === 'string') {
                // Base64 数据
                this.pastedImages.push(imageData);
                resolve(imageData);
            } else if (imageData instanceof File || imageData instanceof Blob) {
                // 文件或Blob对象
                const reader = new FileReader();
                reader.onload = (event) => {
                    const base64Data = event.target.result;
                    this.pastedImages.push(base64Data);
                    resolve(base64Data);
                };
                reader.onerror = () => reject('图片读取失败');
                reader.readAsDataURL(imageData);
            } else {
                reject('不支持的图片格式');
            }
        });
    }

    /**
     * 5. 剪贴板图片监听接口 - 监听粘贴事件
     * @param {HTMLElement} element - 要监听的DOM元素
     * @param {Function} callback - 粘贴成功回调
     */
    listenPaste(element, callback) {
        element.addEventListener('paste', async (event) => {
            const items = event.clipboardData.items;
            
            for (let item of items) {
                if (item.type.startsWith('image/')) {
                    event.preventDefault();
                    
                    const file = item.getAsFile();
                    if (file) {
                        try {
                            const imageData = await this.addImage(file);
                            if (callback) callback(imageData, this.pastedImages.length);
                        } catch (error) {
                            console.error('图片粘贴失败:', error);
                        }
                    }
                }
            }
        });
    }

    /**
     * 6. 配置管理接口
     */
    async getConfig() {
        try {
            return await this.apiRequest('/get_config');
        } catch (error) {
            console.error('获取配置失败:', error);
            return null;
        }
    }

    async updateConfig(newConfig) {
        try {
            return await this.apiRequest('/update_config', {
                method: 'POST',
                body: JSON.stringify(newConfig)
            });
        } catch (error) {
            console.error('更新配置失败:', error);
            return null;
        }
    }

    /**
     * 7. 最近笔记查询接口
     */
    async getRecentNotes(count = 5) {
        try {
            return await this.apiRequest(`/get_recent_notes?count=${count}`);
        } catch (error) {
            console.error('获取最近笔记失败:', error);
            return null;
        }
    }

    /**
     * 8. 工具方法 - 设置后端保存路径
     */
    async setBackendPath(filePath) {
        try {
            await this.apiRequest('/set_log_file', {
                method: 'POST',
                body: JSON.stringify({
                    log_file_path: filePath
                })
            });
        } catch (error) {
            console.error('设置后端路径失败:', error);
        }
    }

    /**
     * 9. 工具方法 - API请求
     */
    async apiRequest(endpoint, options = {}) {
        try {
            const response = await fetch(`${this.config.apiBase}${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API请求失败:', error);
            throw error;
        }
    }

    /**
     * 10. 销毁方法 - 清理资源
     */
    destroy() {
        this.pastedImages = [];
        this.currentFilePath = '';
        this.selectedFileHandle = null;
        console.log('📝 NoteSaver 工具包已销毁');
    }
}

// ==== 全局API接口 ====

/**
 * 全局便捷接口 - 创建NoteSaver实例
 */
window.createNoteSaver = function(options = {}) {
    return new NoteSaver(options);
};

/**
 * 全局便捷接口 - 快速保存笔记
 */
window.quickSaveNote = async function(content, options = {}) {
    const noteSaver = new NoteSaver(options);
    
    // 如果没有设置路径，先选择路径
    if (!noteSaver.currentFilePath) {
        await noteSaver.selectFilePath();
    }
    
    return await noteSaver.saveNote(content, options);
};

/**
 * 全局便捷接口 - 快速路径选择
 */
window.quickSelectPath = function(callback) {
    const noteSaver = new NoteSaver();
    return noteSaver.selectFilePath(callback);
};

// 导出类（用于模块化环境）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NoteSaver;
}

console.log('📝 NoteSaver 工具包已加载'); 