/**
 * 会话管理服务
 * 负责管理节点的会话数据、会话切换、内容生成等功能
 */

// 会话管理数据存储
let sessionDatabase = {};

export class SessionService {
    /**
     * 初始化节点的会话数据
     */
    static initialize(nodeId) {
        if (!sessionDatabase[nodeId]) {
            sessionDatabase[nodeId] = {
                sessions: [],
                activeSessionId: null
            };
        }
    }

    /**
     * 生成完整的MD文档内容
     */
    static generateMarkdown(nodeId) {
        this.initialize(nodeId);
        const nodeData = sessionDatabase[nodeId];
        
        if (nodeData.sessions.length === 0) {
            return '';
        }

        let fullContent = '';
        nodeData.sessions.forEach((session, index) => {
            // 添加标题
            fullContent += `# ${session.title}\n\n`;
            // 添加内容
            if (session.content && session.content.trim()) {
                fullContent += `${session.content.trim()}\n\n`;
            } else {
                fullContent += '(无内容)\n\n';
            }
        });
        
        return fullContent.trim();
    }

    /**
     * 更新节点的完整内容
     */
    static updateFullContent(nodeId) {
        const fullContent = this.generateMarkdown(nodeId);
        
        // 更新内容编辑器
        const contentEditor = document.getElementById(`node-content-${nodeId}`);
        if (contentEditor) {
            // *** 关键修复：如果生成的内容为空，保持原有内容不变 ***
            if (fullContent.trim() !== '') {
                contentEditor.value = fullContent;
                // 只有当生成的内容不为空时才更新数据库
                if (window.nodeDatabase && window.nodeDatabase[nodeId]) {
                    window.nodeDatabase[nodeId].content = fullContent;
                }
            } else {
                // 如果生成的内容为空，但nodeDatabase中有内容，保持显示
                console.log(`[SessionService] 🔄 会话内容为空，保持现有内容: ${nodeId}`);
            }
        }
    }

    /**
     * 添加新会话
     */
    static addSession(nodeId) {
        this.initialize(nodeId);
        
        // 获取当前节点标题作为会话名称
        const titleInput = document.getElementById(`node-title-${nodeId}`);
        let sessionTitle = '会话一';
        
        if (titleInput && titleInput.value.trim()) {
            sessionTitle = titleInput.value.trim();
        }
        
        // 如果已经有会话，自动递增编号
        const existingSessions = sessionDatabase[nodeId].sessions;
        if (existingSessions.length > 0) {
            sessionTitle = `会话${existingSessions.length + 1}`;
        }
        
        // 获取当前AI输入框内容
        const aiInput = document.getElementById(`ai-input-${nodeId}`);
        const currentContent = aiInput ? aiInput.value : '';
        
        // 创建新会话
        const newSession = {
            id: `session-${nodeId}-${Date.now()}`,
            title: sessionTitle,
            content: currentContent,
            createdAt: new Date().toISOString(),
            lastModified: new Date().toISOString()
        };
        
        // 添加到数据库
        sessionDatabase[nodeId].sessions.push(newSession);
        sessionDatabase[nodeId].activeSessionId = newSession.id;
        
        // *** 新建会话后的内容编辑器处理 ***
        const contentEditor = document.getElementById(`node-content-${nodeId}`);
        const qaSwitch = document.getElementById(`qa-mode-${nodeId}`);
        
        if (contentEditor) {
            // 检查问答模式状态
            const isQAMode = qaSwitch && qaSwitch.checked;
            
            if (isQAMode) {
                // 问答模式：显示虚化提示
                const qaPrompt = `# ${sessionTitle}\n\n进入问答模式，请选择必要的提示词模板`;
                contentEditor.value = qaPrompt;
                contentEditor.style.fontSize = "16px";
                contentEditor.style.color = "#999";
                contentEditor.style.fontStyle = "italic";
                console.log(`[SessionService] 🤖 问答模式新会话：显示提示信息`);
            } else {
                // 普通模式：显示新会话标题
                const sessionContent = `# ${sessionTitle}\n\n`;
                contentEditor.value = sessionContent;
                contentEditor.style.fontSize = "";
                contentEditor.style.color = "";
                contentEditor.style.fontStyle = "";
                console.log(`[SessionService] ✨ 普通模式新会话：显示空会话 "${sessionTitle}"`);
            }
            
            // 光标定位到内容区域（标题后的空行）
            contentEditor.focus();
            const titleLength = sessionTitle.length + 4; // "# " + title + "\n\n"
            contentEditor.setSelectionRange(titleLength, titleLength);
            contentEditor.scrollTop = 0;
            
            // 🔒 重要：更新节点内容，但确保不会触发会话清空
            // 因为我们刚刚创建了新会话，不应该被parseContentToSessions清除
            if (window.nodeDatabase && window.nodeDatabase[nodeId]) {
                window.nodeDatabase[nodeId].content = contentEditor.value;
            }
        }
        
        // 重新渲染会话列表
        this.renderList(nodeId);
        
        // 清空AI输入框
        if (aiInput) {
            aiInput.value = '';
        }
        
        if (window.showMessage) {
            window.showMessage(`✅ 已创建 "${sessionTitle}"`, 1500, 'success');
        }
        
        // 保存到本地存储
        this.save();
    }

    /**
     * 渲染会话列表
     */
    static renderList(nodeId) {
        const sessionListContainer = document.getElementById(`session-list-${nodeId}`);
        if (!sessionListContainer) {
            console.error('[SessionService] 找不到会话列表容器');
            return;
        }
        
        this.initialize(nodeId);
        const nodeData = sessionDatabase[nodeId];
        
        // 清空现有内容
        sessionListContainer.innerHTML = '';
        
        // 添加现有会话
        nodeData.sessions.forEach((session, index) => {
            const sessionItem = document.createElement('div');
            sessionItem.className = `session-item conversation ${session.id === nodeData.activeSessionId ? 'active' : ''}`;
            sessionItem.onclick = () => this.selectSession(nodeId, session.id);
            
            sessionItem.innerHTML = `
                <div class="session-title">${session.title}</div>
            `;
            
            sessionListContainer.appendChild(sessionItem);
        });
        
        // 添加新增会话按钮到末尾
        const newSessionBtn = document.createElement('div');
        newSessionBtn.className = 'session-item new-session-btn';
        newSessionBtn.onclick = () => this.addSession(nodeId);
        newSessionBtn.innerHTML = `
            <span class="new-session-icon">➕</span>
            <span class="new-session-text">新增会话</span>
        `;
        sessionListContainer.appendChild(newSessionBtn);
    }

    /**
     * 选择会话
     */
    static selectSession(nodeId, sessionId) {
        this.initialize(nodeId);
        
        const session = sessionDatabase[nodeId].sessions.find(s => s.id === sessionId);
        if (!session) {
            if (window.showMessage) {
                window.showMessage('❌ 找不到指定会话', 2000, 'error');
            }
            return;
        }
        
        // 设置新的活动会话
        sessionDatabase[nodeId].activeSessionId = sessionId;
        
        // *** 聚焦模式：点击会话时只显示该会话内容 ***
        const contentEditor = document.getElementById(`node-content-${nodeId}`);
        if (contentEditor) {
            // 显示选中会话的内容（聚焦模式）
            const sessionContent = `# ${session.title}\n\n${session.content || '(无内容)'}`;
            contentEditor.value = sessionContent;
            
            // 光标定位到开头
            contentEditor.focus();
            contentEditor.setSelectionRange(0, 0);
            contentEditor.scrollTop = 0;
            
            console.log(`[SessionService] 📄 聚焦模式：显示会话 "${session.title}"`);
        }
        
        // 重新渲染会话列表以更新活动状态
        this.renderList(nodeId);
        
        if (window.showMessage) {
            window.showMessage(`📄 已切换到 "${session.title}"`, 1500, 'info');
        }
        
        // 保存到本地存储
        this.save();
    }

    /**
     * 清空所有会话
     */
    static clearAll(nodeId) {
        if (!sessionDatabase[nodeId] || sessionDatabase[nodeId].sessions.length === 0) {
            if (window.showMessage) {
                window.showMessage('❌ 没有会话需要清空', 1500, 'info');
            }
            return;
        }
        
        const sessionCount = sessionDatabase[nodeId].sessions.length;
        if (confirm(`⚠️ 确定要清空所有 ${sessionCount} 个会话吗？\n\n此操作不可撤销！`)) {
            // 清空会话数据
            sessionDatabase[nodeId].sessions = [];
            sessionDatabase[nodeId].activeSessionId = null;
            
            // 清空内容编辑器
            const contentEditor = document.getElementById(`node-content-${nodeId}`);
            if (contentEditor) {
                contentEditor.value = '';
            }
            
            // 重新渲染会话列表
            const sessionListContainer = document.getElementById(`session-list-${nodeId}`);
            if (sessionListContainer) {
                this.renderList(nodeId);
            }
            
            // 保存到本地存储
            this.save();
            
            if (window.showMessage) {
                window.showMessage(`🗑️ 已清空所有 ${sessionCount} 个会话`, 2000, 'success');
            }
            console.log(`[SessionService] 🗑️ 用户主动清空所有会话: ${nodeId}`);
        }
    }

    /**
     * 查看所有会话（完整模式）
     */
    static viewAll(nodeId) {
        this.initialize(nodeId);
        
        const contentEditor = document.getElementById(`node-content-${nodeId}`);
        if (contentEditor) {
            // 生成并显示完整的MD文档
            const fullContent = this.generateMarkdown(nodeId);
            if (fullContent.trim() !== '') {
                contentEditor.value = fullContent;
                // 同步到nodeDatabase
                if (window.nodeDatabase && window.nodeDatabase[nodeId]) {
                    window.nodeDatabase[nodeId].content = fullContent;
                }
            } else {
                contentEditor.value = '暂无会话内容';
            }
            
            // 光标定位到开头
            contentEditor.focus();
            contentEditor.setSelectionRange(0, 0);
            contentEditor.scrollTop = 0;
            
            console.log(`[SessionService] 📖 完整模式：显示所有会话内容`);
        }
        
        // 清除活动会话状态（因为现在显示的是全部内容）
        sessionDatabase[nodeId].activeSessionId = null;
        
        // 重新渲染会话列表以更新状态
        this.renderList(nodeId);
        
        if (window.showMessage) {
            window.showMessage(`📖 已切换到完整文档模式`, 1500, 'info');
        }
        
        // 保存到本地存储
        this.save();
    }

    /**
     * 保存会话数据到本地存储
     */
    static save() {
        try {
            localStorage.setItem('nodemind_sessions', JSON.stringify(sessionDatabase));
        } catch (error) {
            console.error('[SessionService] 保存会话数据失败:', error);
        }
    }

    /**
     * 从本地存储加载会话数据
     */
    static load() {
        try {
            const saved = localStorage.getItem('nodemind_sessions');
            if (saved) {
                sessionDatabase = JSON.parse(saved);
            }
        } catch (error) {
            console.error('[SessionService] 加载会话数据失败:', error);
            sessionDatabase = {};
        }
    }

    /**
     * 解析内容为会话
     */
    static parseContent(nodeId, content) {
        this.initialize(nodeId);
        
        if (!content || content.trim() === '') {
            return;
        }
        
        // 按照一级标题分割内容为会话
        const sections = content.split(/^# /m).filter(section => section.trim() !== '');
        
        // 清空现有会话
        sessionDatabase[nodeId].sessions = [];
        sessionDatabase[nodeId].activeSessionId = null;
        
        sections.forEach((section, index) => {
            const lines = section.split('\n');
            const title = lines[0].trim();
            const content = lines.slice(1).join('\n').trim();
            
            const session = {
                id: `session-${nodeId}-${Date.now()}-${index}`,
                title: title || `会话${index + 1}`,
                content: content,
                createdAt: new Date().toISOString(),
                lastModified: new Date().toISOString()
            };
            
            sessionDatabase[nodeId].sessions.push(session);
        });
        
        // 保存到本地存储
        this.save();
        
        // 重新渲染会话列表
        this.renderList(nodeId);
        
        console.log(`[SessionService] 📝 解析内容为 ${sections.length} 个会话`);
    }

    /**
     * 切换问答模式
     */
    static toggleQAMode(nodeId) {
        const qaSwitch = document.getElementById(`qa-mode-${nodeId}`);
        const contentEditor = document.getElementById(`node-content-${nodeId}`);
        
        if (!qaSwitch || !contentEditor) {
            return;
        }
        
        const isQAMode = qaSwitch.checked;
        
        if (isQAMode) {
            // 进入问答模式
            contentEditor.style.fontSize = "16px";
            contentEditor.style.color = "#999";
            contentEditor.style.fontStyle = "italic";
            contentEditor.value = "进入问答模式，请选择必要的提示词模板";
            console.log(`[SessionService] 🤖 切换到问答模式: ${nodeId}`);
        } else {
            // 退出问答模式
            contentEditor.style.fontSize = "";
            contentEditor.style.color = "";
            contentEditor.style.fontStyle = "";
            
            // 恢复正常内容
            this.updateFullContent(nodeId);
            console.log(`[SessionService] 📝 切换到普通模式: ${nodeId}`);
        }
    }

    /**
     * 从编辑器复制内容
     */
    static copyFromEditor(nodeId) {
        const contentEditor = document.getElementById(`node-content-${nodeId}`);
        if (!contentEditor) {
            return;
        }
        
        const content = contentEditor.value;
        if (content.trim() === '') {
            if (window.showMessage) {
                window.showMessage('❌ 没有内容可复制', 1500, 'error');
            }
            return;
        }
        
        // 复制到剪贴板
        navigator.clipboard.writeText(content).then(() => {
            if (window.showMessage) {
                window.showMessage('✅ 内容已复制到剪贴板', 1500, 'success');
            }
        }).catch(err => {
            console.error('[SessionService] 复制失败:', err);
            if (window.showMessage) {
                window.showMessage('❌ 复制失败', 1500, 'error');
            }
        });
    }

    /**
     * 粘贴内容到编辑器
     */
    static pasteToEditor(nodeId) {
        const contentEditor = document.getElementById(`node-content-${nodeId}`);
        if (!contentEditor) {
            return;
        }
        
        // 从剪贴板粘贴
        navigator.clipboard.readText().then(text => {
            if (text.trim() === '') {
                if (window.showMessage) {
                    window.showMessage('❌ 剪贴板为空', 1500, 'error');
                }
                return;
            }
            
            contentEditor.value = text;
            contentEditor.focus();
            
            // 更新节点内容
            if (window.nodeDatabase && window.nodeDatabase[nodeId]) {
                window.nodeDatabase[nodeId].content = text;
            }
            
            if (window.showMessage) {
                window.showMessage('✅ 内容已粘贴', 1500, 'success');
            }
        }).catch(err => {
            console.error('[SessionService] 粘贴失败:', err);
            if (window.showMessage) {
                window.showMessage('❌ 粘贴失败', 1500, 'error');
            }
        });
    }

    /**
     * 获取会话数据库（用于调试）
     */
    static getDatabase() {
        return sessionDatabase;
    }
}

// 页面加载时初始化会话数据
document.addEventListener('DOMContentLoaded', function() {
    SessionService.load();
});

// 导出给全局使用
window.SessionService = SessionService;

export default SessionService; 