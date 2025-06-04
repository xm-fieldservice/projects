/**
 * ContentFormatter - 内容格式化工具包 v1.0
 * 专门处理笔记内容的格式化，不涉及笔记块结构
 */

class ContentFormatter {
    constructor(config = {}) {
        this.version = '1.0.0';
        this.config = {
            style: config.style || 'default',
            customRules: config.customRules || {},
            debugMode: config.debugMode || false,
            ...config
        };
        
        // 内容格式化样式
        this.styles = {
            default: {
                name: '默认格式',
                lineSpacing: 1,
                indentSize: 2,
                listStyle: '-',
                codeBlock: '```',
                emphasis: '**',
                quote: '> '
            },
            markdown: {
                name: 'Markdown格式',
                lineSpacing: 2,
                indentSize: 4,
                listStyle: '-',
                codeBlock: '```',
                emphasis: '**',
                quote: '> '
            },
            simple: {
                name: '简化格式',
                lineSpacing: 1,
                indentSize: 0,
                listStyle: '•',
                codeBlock: '',
                emphasis: '',
                quote: ''
            },
            rich: {
                name: '丰富格式',
                lineSpacing: 2,
                indentSize: 4,
                listStyle: '→',
                codeBlock: '```',
                emphasis: '【',
                quote: '📝 '
            }
        };
        
        this.currentStyle = this.styles[this.config.style];
        this.log('ContentFormatter initialized with style:', this.config.style);
    }
    
    /**
     * 格式化内容 - 主要接口
     */
    format(content, options = {}) {
        if (!content) return '';
        
        const formatOptions = {
            addLineNumbers: options.addLineNumbers || false,
            addTimestamp: options.addTimestamp || false,
            wrapCode: options.wrapCode || false,
            highlightKeywords: options.highlightKeywords || false,
            autoList: options.autoList || false,
            ...options
        };
        
        let result = content;
        
        // 应用格式化选项
        if (formatOptions.addTimestamp) {
            result = this.addTimestamp(result);
        }
        
        if (formatOptions.autoList) {
            result = this.autoList(result);
        }
        
        if (formatOptions.wrapCode) {
            result = this.wrapCode(result);
        }
        
        if (formatOptions.highlightKeywords) {
            result = this.highlightKeywords(result);
        }
        
        if (formatOptions.addLineNumbers) {
            result = this.addLineNumbers(result);
        }
        
        this.log('Formatted content, length:', result.length);
        return result;
    }
    
    /**
     * 添加时间戳
     */
    addTimestamp(content) {
        const timestamp = new Date().toLocaleString('zh-CN');
        return `[${timestamp}]\n${content}`;
    }
    
    /**
     * 自动列表格式化
     */
    autoList(content) {
        const lines = content.split('\n');
        return lines.map(line => {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith(this.currentStyle.listStyle) && !trimmed.startsWith('#')) {
                return `${this.currentStyle.listStyle} ${trimmed}`;
            }
            return line;
        }).join('\n');
    }
    
    /**
     * 代码块包装
     */
    wrapCode(content) {
        if (!this.currentStyle.codeBlock) return content;
        
        // 检测代码块（简单的启发式方法）
        const codePatterns = [
            /function\s+\w+\s*\(/,
            /class\s+\w+/,
            /const\s+\w+\s*=/,
            /let\s+\w+\s*=/,
            /var\s+\w+\s*=/,
            /<\w+.*?>/,
            /\{[\s\S]*\}/
        ];
        
        let result = content;
        const lines = result.split('\n');
        let inCodeBlock = false;
        let newLines = [];
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const isCodeLine = codePatterns.some(pattern => pattern.test(line));
            
            if (isCodeLine && !inCodeBlock) {
                newLines.push(this.currentStyle.codeBlock);
                inCodeBlock = true;
            } else if (!isCodeLine && inCodeBlock) {
                newLines.push(this.currentStyle.codeBlock);
                inCodeBlock = false;
            }
            
            newLines.push(line);
        }
        
        if (inCodeBlock) {
            newLines.push(this.currentStyle.codeBlock);
        }
        
        return newLines.join('\n');
    }
    
    /**
     * 关键词高亮
     */
    highlightKeywords(content) {
        const keywords = ['重要', '注意', '错误', '成功', '警告', '提示', 'TODO', 'FIXME', 'NOTE'];
        let result = content;
        
        keywords.forEach(keyword => {
            const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
            result = result.replace(regex, `${this.currentStyle.emphasis}${keyword}${this.currentStyle.emphasis}`);
        });
        
        return result;
    }
    
    /**
     * 添加行号
     */
    addLineNumbers(content) {
        const lines = content.split('\n');
        return lines.map((line, index) => {
            const lineNum = (index + 1).toString().padStart(3, '0');
            return `${lineNum}: ${line}`;
        }).join('\n');
    }
    
    /**
     * 切换格式化样式
     */
    setStyle(styleName) {
        if (!this.styles[styleName]) {
            throw new Error(`Unknown style: ${styleName}`);
        }
        
        this.config.style = styleName;
        this.currentStyle = this.styles[styleName];
        this.log('Style changed to:', styleName);
    }
    
    /**
     * 快速格式化 - 预设组合
     */
    quickFormat(content, preset = 'standard') {
        const presets = {
            standard: {
                addTimestamp: false,
                autoList: false,
                wrapCode: false,
                highlightKeywords: true
            },
            full: {
                addTimestamp: true,
                autoList: true,
                wrapCode: true,
                highlightKeywords: true,
                addLineNumbers: false
            },
            minimal: {
                addTimestamp: false,
                autoList: false,
                wrapCode: false,
                highlightKeywords: false
            },
            code: {
                addTimestamp: false,
                autoList: false,
                wrapCode: true,
                highlightKeywords: false,
                addLineNumbers: true
            }
        };
        
        const options = presets[preset] || presets.standard;
        return this.format(content, options);
    }
    
    /**
     * 预览格式化结果
     */
    preview(content, options = {}) {
        const result = this.format(content, options);
        console.log('=== 内容格式化预览 ===');
        console.log(result);
        console.log('=== 预览结束 ===');
        return result;
    }
    
    /**
     * 获取可用样式列表
     */
    getAvailableStyles() {
        return Object.keys(this.styles).map(key => ({
            id: key,
            name: this.styles[key].name
        }));
    }
    
    /**
     * 调试日志
     */
    log(...args) {
        if (this.config.debugMode) {
            console.log('[ContentFormatter]', ...args);
        }
    }
    
    /**
     * 获取工具包信息
     */
    getInfo() {
        return {
            name: 'ContentFormatter',
            version: this.version,
            currentStyle: this.config.style,
            availableStyles: this.getAvailableStyles().length
        };
    }
}

// 全局导出
window.ContentFormatter = ContentFormatter;

// 便捷创建方法
window.createContentFormatter = function(config = {}) {
    return new ContentFormatter(config);
};

console.log('✨ ContentFormatter toolkit loaded v1.0.0');
console.log('💡 使用示例: const formatter = new ContentFormatter({style: "markdown"});'); 