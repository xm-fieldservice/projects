/**
 * 命令注入服务
 * 负责管理命令注入功能、校准、模板应用等
 */

export class InjectionService {
    /**
     * 执行校准
     */
    static calibrate() {
        console.log('[InjectionService] 🎯 校准功能已禁用');
        alert('校准功能暂时不可用');
    }

    /**
     * 注入命令
     */
    static inject() {
        console.log('[InjectionService] 💉 命令注入功能已禁用');
        this.updateStatus('错误：校准功能已禁用，命令注入不可用', 'error');
    }

    /**
     * 检查模板可用性
     */
    static checkTemplate() {
        // 检查模板可用性 - 参考文档实现
        if (window.templateManager) {
            const scene = window.templateManager.currentScene;
            const version = window.templateManager.currentVersion;
            
            if (scene && version) {
                const template = window.templateManager.getTemplate(scene, version);
                return template && (template.prefix || template.suffix);
            }
        }
        return false;
    }

    /**
     * 应用模板
     */
    static applyTemplate(command, projectName) {
        // 应用模板到命令 - 完全参考文档实现
        
        // 构建项目标识的命令
        let commandWithProject;
        if (command) {
            commandWithProject = `【项目：${projectName}】\n${command}`;
        } else {
            commandWithProject = `【项目：${projectName}】`;
        }
        
        // 应用默认模板
        if (window.templateManager) {
            const scene = window.templateManager.currentScene;
            const version = window.templateManager.currentVersion;
            
            if (scene && version) {
                const template = window.templateManager.getTemplate(scene, version);
                if (template) {
                    const prefix = template.prefix || '';
                    const suffix = template.suffix || '';
                    return `${prefix}\n\n${commandWithProject}\n\n${suffix}`;
                }
            }
        }
        
        return commandWithProject;
    }

    /**
     * 执行命令注入
     */
    static async performInjection(finalCommand, originalCommand) {
        console.log('[InjectionService] 🎯 执行命令注入操作...');
        
        try {
            // 1. 将命令复制到剪贴板
            await this.copyToClipboard(finalCommand);
            console.log('[InjectionService] 📋 命令已复制到剪贴板');
            
            // 2. 移动鼠标到校准坐标处并点击激活目标输入框
            const injectionSuccess = await this.executeMouseInjection();
            
            // 3. 记录详细日志
            this.logResult(originalCommand, finalCommand, injectionSuccess);
            
            // 4. 清空输入框
            this.clearInput();
            
            // 5. 显示完成状态
            const statusMessage = injectionSuccess ? 
                '✅ 命令注入完成！' : 
                '📋 命令已复制，请手动粘贴到目标位置';
            this.updateStatus(statusMessage, 'success');
            
            console.log('[InjectionService] ✅ 命令注入流程完成');
            
        } catch (error) {
            throw new Error(`注入操作失败: ${error.message}`);
        }
    }

    /**
     * 执行鼠标注入
     */
    static async executeMouseInjection() {
        console.log('[InjectionService] 🖱️ 鼠标注入功能已禁用');
        return false;
    }

    /**
     * 模拟粘贴
     */
    static async simulatePaste(targetElement) {
        try {
            if (targetElement && (
                targetElement.tagName === 'INPUT' || 
                targetElement.tagName === 'TEXTAREA' || 
                targetElement.contentEditable === 'true'
            )) {
                // 模拟Ctrl+V粘贴
                const pasteEvent = new KeyboardEvent('keydown', {
                    key: 'v',
                    code: 'KeyV',
                    keyCode: 86,
                    ctrlKey: true,
                    bubbles: true
                });
                targetElement.dispatchEvent(pasteEvent);
                
                await this.sleep(100);
                
                // 如果支持，直接从剪贴板读取并设置
                if (navigator.clipboard && navigator.clipboard.readText) {
                    try {
                        const clipboardText = await navigator.clipboard.readText();
                        if (targetElement.tagName === 'INPUT' || targetElement.tagName === 'TEXTAREA') {
                            targetElement.value = clipboardText;
                        } else if (targetElement.contentEditable === 'true') {
                            targetElement.textContent = clipboardText;
                        }
                        
                        // 触发输入事件
                        const inputEvent = new Event('input', { bubbles: true });
                        targetElement.dispatchEvent(inputEvent);
                        
                        console.log('[InjectionService] ✅ 粘贴成功');
                        return true;
                    } catch (e) {
                        console.log('[InjectionService] 📋 使用备用粘贴方法');
                    }
                }
            }
            return false;
        } catch (error) {
            console.error('[InjectionService] ❌ 粘贴操作失败:', error);
            return false;
        }
    }

    /**
     * 提供用户指导
     */
    static async provideGuidance() {
        console.log('[InjectionService] 📋 提供用户操作指导...');
        
        // 创建指导提示
        const guidance = document.createElement('div');
        guidance.id = 'injection-guidance';
        guidance.innerHTML = `
            <div style="position: fixed; top: 20px; right: 20px; background: #28a745; color: white; 
                       padding: 15px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); 
                       z-index: 10000; max-width: 300px;">
                <h4 style="margin: 0 0 10px 0;">📋 命令已准备就绪</h4>
                <p style="margin: 0 0 10px 0; font-size: 14px;">
                    命令已复制到剪贴板，请：<br>
                    1. 点击目标输入框<br>
                    2. 按 Ctrl+V 粘贴<br>
                    3. 按 Enter 执行
                </p>
                <button onclick="document.getElementById('injection-guidance').remove()" 
                        style="background: white; color: #28a745; border: none; padding: 5px 10px; 
                               border-radius: 4px; cursor: pointer; float: right;">
                    知道了
                </button>
            </div>
        `;
        
        document.body.appendChild(guidance);
        
        // 5秒后自动移除
        setTimeout(() => {
            const guidanceEl = document.getElementById('injection-guidance');
            if (guidanceEl) guidanceEl.remove();
        }, 5000);
    }

    /**
     * 复制到剪贴板
     */
    static async copyToClipboard(text) {
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                // 使用现代Clipboard API
                await navigator.clipboard.writeText(text);
                console.log('[InjectionService] 📋 已使用Clipboard API复制到剪贴板');
            } else {
                // 降级到传统方法
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.opacity = '0';
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                console.log('[InjectionService] 📋 已使用传统方法复制到剪贴板');
            }
        } catch (error) {
            throw new Error(`剪贴板操作失败: ${error.message}`);
        }
    }

    /**
     * 延时函数
     */
    static sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 记录注入结果
     */
    static logResult(originalCommand, finalCommand, injectionSuccess = false) {
        // 日志记录功能 - 简化版本
        try {
            const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
            const appName = '当前浏览器';
            const projectName = this.getProjectName();
            
            const logEntry = {
                timestamp: timestamp,
                application: appName,
                projectName: projectName,
                originalCommand: originalCommand,
                finalCommand: finalCommand,
                injectionSuccess: injectionSuccess,
                injectionMethod: injectionSuccess ? '自动注入' : '剪贴板复制',
                templateInfo: {
                    scene: window.templateManager?.currentScene,
                    version: window.templateManager?.currentVersion
                },
                userAgent: navigator.userAgent.substring(0, 100) + '...'
            };
            
            // 保存到localStorage作为日志记录
            const existingLogs = JSON.parse(localStorage.getItem('nodemind_injection_logs') || '[]');
            existingLogs.push(logEntry);
            
            // 只保留最近100条记录
            if (existingLogs.length > 100) {
                existingLogs.splice(0, existingLogs.length - 100);
            }
            
            localStorage.setItem('nodemind_injection_logs', JSON.stringify(existingLogs));
            
            // 更新UI显示
            this.updateLogDisplay();
            
            console.log('[InjectionService] 📝 命令注入日志已记录:', logEntry);
            
        } catch (error) {
            console.error('[InjectionService] ❌ 记录日志失败:', error);
        }
    }

    /**
     * 更新日志显示
     */
    static updateLogDisplay() {
        // 更新日志显示 - 完整功能实现
        try {
            const logDisplay = document.getElementById('injection-log-display');
            if (!logDisplay) return;
            
            const logs = JSON.parse(localStorage.getItem('nodemind_injection_logs') || '[]');
            const recentLogs = logs.slice(-5).reverse(); // 显示最近5条，新的在上
            
            if (recentLogs.length === 0) {
                logDisplay.innerHTML = '<div class="empty-log">暂无注入记录</div>';
                return;
            }
            
            let logHtml = '<div class="log-title">最近注入记录</div>';
            recentLogs.forEach((log, index) => {
                const statusIcon = log.injectionSuccess ? '✅' : '📋';
                const statusText = log.injectionSuccess ? '自动注入' : '剪贴板';
                const statusClass = log.injectionSuccess ? 'success' : 'clipboard';
                
                logHtml += `
                    <div class="log-entry ${statusClass}">
                        <div class="log-header">
                            <span class="log-time">${log.timestamp.split(' ')[1]}</span>
                            <span class="log-app">${log.application}</span>
                            <span class="log-status">${statusIcon} ${statusText}</span>
                        </div>
                        <div class="log-command">${log.originalCommand.substring(0, 50)}${log.originalCommand.length > 50 ? '...' : ''}</div>
                    </div>
                `;
            });
            
            // 添加导出按钮
            logHtml += `
                <div class="log-actions">
                    <button onclick="InjectionService.exportLogs()" class="export-btn">导出全部日志</button>
                    <button onclick="InjectionService.clearLogs()" class="clear-btn">清空日志</button>
                </div>
            `;
            
            logDisplay.innerHTML = logHtml;
            
        } catch (error) {
            console.error('[InjectionService] ❌ 更新日志显示失败:', error);
        }
    }

    /**
     * 导出日志
     */
    static exportLogs() {
        try {
            const logs = JSON.parse(localStorage.getItem('nodemind_injection_logs') || '[]');
            if (logs.length === 0) {
                alert('暂无日志记录');
                return;
            }
            
            // 生成Markdown格式的日志
            let markdown = `# NodeMind 命令注入日志\n\n生成时间：${new Date().toLocaleString()}\n\n`;
            
            logs.forEach((log, index) => {
                const statusIcon = log.injectionSuccess ? '✅' : '📋';
                markdown += `## ${log.timestamp} (${log.application}) ${statusIcon}\n\n`;
                markdown += `**项目：** ${log.projectName}\n`;
                markdown += `**注入方式：** ${log.injectionMethod}\n`;
                markdown += `**坐标：** X=${log.coordinates?.x}, Y=${log.coordinates?.y}\n`;
                markdown += `**原始命令：**\n\`\`\`\n${log.originalCommand}\n\`\`\`\n\n`;
                if (log.templateInfo?.scene) {
                    markdown += `**模板场景：** ${log.templateInfo.scene} - ${log.templateInfo.version}\n`;
                }
                markdown += `---\n\n`;
            });
            
            // 下载文件
            const blob = new Blob([markdown], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `nodemind-injection-log-${new Date().toISOString().split('T')[0]}.md`;
            a.click();
            URL.revokeObjectURL(url);
            
            console.log('[InjectionService] 📁 日志导出完成');
            
        } catch (error) {
            console.error('[InjectionService] ❌ 导出日志失败:', error);
            alert('导出失败：' + error.message);
        }
    }

    /**
     * 清空日志
     */
    static clearLogs() {
        if (confirm('确定要清空所有注入日志吗？')) {
            localStorage.removeItem('nodemind_injection_logs');
            this.updateLogDisplay();
            console.log('[InjectionService] 🗑️ 日志已清空');
        }
    }

    /**
     * 清空命令输入
     */
    static clearInput() {
        const commandInput = document.getElementById('command-input');
        if (commandInput) {
            commandInput.value = '';
            console.log('[InjectionService] 🧹 命令输入框已清空');
        }
    }

    /**
     * 更新注入状态
     */
    static updateStatus(message, type = '') {
        const statusElement = document.getElementById('injection-status');
        if (statusElement) {
            const span = statusElement.querySelector('span');
            if (span) {
                span.textContent = message;
            }
            
            // 更新样式类
            statusElement.className = 'injection-status';
            if (type) {
                statusElement.classList.add(type);
            }
            
            console.log(`[InjectionService] 📊 注入状态更新: ${message} (${type})`);
        }
    }

    /**
     * 导出注入日志（别名）
     */
    static exportInjectionLogs() {
        return this.exportLogs();
    }

    /**
     * 获取项目名称
     */
    static getProjectName() {
        // 尝试从项目信息获取项目名称
        if (window.projectInfo && window.projectInfo.name) {
            return window.projectInfo.name;
        }
        
        // 尝试从URL参数获取项目名称
        const urlParams = new URLSearchParams(window.location.search);
        const projectParam = urlParams.get('project');
        if (projectParam) {
            return projectParam;
        }
        
        // 默认项目名称
        return 'NodeMind 项目';
    }
}

// 导出给全局使用
window.InjectionService = InjectionService;

export default InjectionService; 