/**
 * UIBlock - 主界面控制器
 * 负责界面交互、标签页切换、基础功能等
 */
window.UIBlock = {
    
    // 当前模式：demo, user, admin
    mode: 'user',
    
    // DOM元素
    elements: {},
    
    // 初始化
    init(mode = 'user') {
        console.log(`🎨 UIBlock 初始化开始... (模式: ${mode})`);
        
        this.mode = mode;
        this.initElements();
        this.bindEvents();
        this.loadUserData();
        this.updateStats();
        
        console.log('✅ UIBlock 初始化完成');
    },
    
    // 初始化DOM元素引用
    initElements() {
        this.elements = {
            // 导航相关
            navItems: document.querySelectorAll('.nav-item'),
            tabContents: document.querySelectorAll('.tab-content'),
            logoutBtn: document.getElementById('logoutBtn'),
            
            // 问答相关
            questionInput: document.getElementById('questionInput'),
            sendBtn: document.getElementById('sendBtn'),
            chatArea: document.getElementById('chatArea'),
            quickBtns: document.querySelectorAll('.quick-btn'),
            
            // 笔记相关
            newNoteBtn: document.getElementById('newNoteBtn'),
            noteSearch: document.getElementById('noteSearch'),
            exportBtn: document.getElementById('exportBtn'),
            importBtn: document.getElementById('importBtn'),
            notesList: document.getElementById('notesList'),
            noteEditor: document.getElementById('noteEditor'),
            noteTitle: document.getElementById('noteTitle'),
            noteContent: document.getElementById('noteContent'),
            noteTags: document.getElementById('noteTags'),
            saveNoteBtn: document.getElementById('saveNoteBtn'),
            cancelEditBtn: document.getElementById('cancelEditBtn'),
            
            // 统计相关
            totalQuestions: document.getElementById('totalQuestions'),
            totalNotes: document.getElementById('totalNotes'),
            totalSize: document.getElementById('totalSize'),
            historyList: document.getElementById('historyList'),
            
            // 设置相关
            themeSelect: document.getElementById('themeSelect'),
            fontSizeSelect: document.getElementById('fontSizeSelect'),
            autoSave: document.getElementById('autoSave'),
            backupBtn: document.getElementById('backupBtn'),
            clearDataBtn: document.getElementById('clearDataBtn'),
            
            // 通用组件
            toastContainer: document.getElementById('toastContainer'),
            modalOverlay: document.getElementById('modalOverlay'),
            modalTitle: document.getElementById('modalTitle'),
            modalBody: document.getElementById('modalBody'),
            modalConfirm: document.getElementById('modalConfirm'),
            modalCancel: document.getElementById('modalCancel'),
            modalClose: document.getElementById('modalClose')
        };
    },
    
    // 绑定事件
    bindEvents() {
        // 导航切换
        this.elements.navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchTab(item.dataset.tab);
            });
        });
        
        // 退出登录
        if (this.elements.logoutBtn) {
            this.elements.logoutBtn.addEventListener('click', () => {
                this.logout();
            });
        }
        
        // 问答功能
        if (this.elements.sendBtn) {
            this.elements.sendBtn.addEventListener('click', () => {
                this.sendQuestion();
            });
        }
        
        if (this.elements.questionInput) {
            this.elements.questionInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                    this.sendQuestion();
                }
            });
        }
        
        // 快速问题按钮
        this.elements.quickBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.elements.questionInput.value = btn.dataset.question;
                this.sendQuestion();
            });
        });
        
        // 笔记功能
        if (this.elements.newNoteBtn) {
            this.elements.newNoteBtn.addEventListener('click', () => {
                this.createNewNote();
            });
        }
        
        if (this.elements.saveNoteBtn) {
            this.elements.saveNoteBtn.addEventListener('click', () => {
                this.saveNote();
            });
        }
        
        if (this.elements.cancelEditBtn) {
            this.elements.cancelEditBtn.addEventListener('click', () => {
                this.cancelEdit();
            });
        }
        
        if (this.elements.exportBtn) {
            this.elements.exportBtn.addEventListener('click', () => {
                this.exportNotes();
            });
        }
        
        // 设置功能
        if (this.elements.backupBtn) {
            this.elements.backupBtn.addEventListener('click', () => {
                this.createBackup();
            });
        }
        
        if (this.elements.clearDataBtn) {
            this.elements.clearDataBtn.addEventListener('click', () => {
                this.confirmClearData();
            });
        }
        
        // 模态框
        if (this.elements.modalClose) {
            this.elements.modalClose.addEventListener('click', () => {
                this.hideModal();
            });
        }
        
        if (this.elements.modalCancel) {
            this.elements.modalCancel.addEventListener('click', () => {
                this.hideModal();
            });
        }
        
        if (this.elements.modalOverlay) {
            this.elements.modalOverlay.addEventListener('click', (e) => {
                if (e.target === this.elements.modalOverlay) {
                    this.hideModal();
                }
            });
        }
    },
    
    // 切换标签页
    switchTab(tabName) {
        // 更新导航状态
        this.elements.navItems.forEach(item => {
            item.classList.toggle('active', item.dataset.tab === tabName);
        });
        
        // 更新内容显示
        this.elements.tabContents.forEach(content => {
            content.classList.toggle('active', content.id === `${tabName}-tab`);
        });
        
        // 特殊处理
        if (tabName === 'notes') {
            this.loadNotesList();
        } else if (tabName === 'history') {
            this.loadHistory();
        }
    },
    
    // 发送问题
    async sendQuestion() {
        const question = this.elements.questionInput.value.trim();
        if (!question) return;
        
        // 添加用户消息到聊天区域
        this.addMessage(question, 'user');
        this.elements.questionInput.value = '';
        
        // 模拟AI回复
        this.addMessage('正在思考中...', 'bot', true);
        
        setTimeout(() => {
            this.removeTypingIndicator();
            const answer = this.generateAnswer(question);
            this.addMessage(answer, 'bot');
            
            // 自动保存到笔记
            if (this.elements.autoSave?.checked) {
                this.autoSaveQA(question, answer);
            }
        }, 1500);
    },
    
    // 添加消息到聊天区域
    addMessage(content, sender, isTyping = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message ${isTyping ? 'typing' : ''}`;
        
        const avatar = document.createElement('div');
        avatar.className = `avatar ${sender}-avatar`;
        avatar.innerHTML = sender === 'user' ? '<i class="fas fa-user"></i>' : '<i class="fas fa-robot"></i>';
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        messageContent.innerHTML = isTyping ? 
            '<div class="typing-dots"><span></span><span></span><span></span></div>' : 
            `<p>${content}</p>`;
        
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(messageContent);
        
        // 移除欢迎消息
        const welcomeMessage = this.elements.chatArea.querySelector('.welcome-message');
        if (welcomeMessage) {
            welcomeMessage.remove();
        }
        
        this.elements.chatArea.appendChild(messageDiv);
        this.elements.chatArea.scrollTop = this.elements.chatArea.scrollHeight;
    },
    
    // 移除输入指示器
    removeTypingIndicator() {
        const typingMessage = this.elements.chatArea.querySelector('.typing');
        if (typingMessage) {
            typingMessage.remove();
        }
    },
    
    // 生成答案（模拟AI回复）
    generateAnswer(question) {
        const answers = [
            "这是一个很好的问题！根据我的理解，我认为...",
            "让我为您详细解答这个问题。首先...",
            "基于您的提问，我建议考虑以下几个方面...",
            "这个问题涉及多个层面，让我逐一分析...",
            "根据最新的研究和实践经验，我的回答是..."
        ];
        
        const randomAnswer = answers[Math.floor(Math.random() * answers.length)];
        return `${randomAnswer}这是一个关于"${question}"的详细回答。在演示模式下，这里会显示模拟的AI回复内容。`;
    },
    
    // 自动保存问答
    autoSaveQA(question, answer) {
        const title = `问答记录 - ${QAUtils.formatDateTime(null, 'short')}`;
        const content = `**问题：** ${question}\n\n**回答：** ${answer}`;
        const tags = ['自动保存', '问答'];
        
        NotebookManager.saveNote(title, content, tags, 'qa');
        this.showToast('问答已自动保存到笔记', 'success');
    },
    
    // 创建新笔记
    createNewNote() {
        this.elements.noteTitle.value = '';
        this.elements.noteContent.value = '';
        this.elements.noteTags.value = '';
        this.elements.noteEditor.style.display = 'flex';
        this.elements.noteTitle.focus();
    },
    
    // 保存笔记
    async saveNote() {
        const title = this.elements.noteTitle.value.trim();
        const content = this.elements.noteContent.value.trim();
        const tagsStr = this.elements.noteTags.value.trim();
        
        if (!title && !content) {
            this.showToast('请输入笔记标题或内容', 'warning');
            return;
        }
        
        const tags = tagsStr ? tagsStr.split(',').map(tag => tag.trim()) : [];
        const result = await NotebookManager.saveNote(title || '无标题', content, tags, 'note');
        
        if (result.success) {
            this.showToast('笔记保存成功', 'success');
            this.cancelEdit();
            this.loadNotesList();
            this.updateStats();
        } else {
            this.showToast('保存失败：' + result.error, 'error');
        }
    },
    
    // 取消编辑
    cancelEdit() {
        this.elements.noteEditor.style.display = 'none';
    },
    
    // 加载笔记列表
    loadNotesList() {
        const stats = NotebookManager.getNotebookStats();
        if (stats.success) {
            // 这里可以解析笔记内容并显示列表
            this.elements.notesList.innerHTML = `
                <div class="notes-summary">
                    <p>共有 ${stats.data.noteCount} 条笔记</p>
                    <p>数据大小：${QAUtils.formatFileSize(stats.data.totalSize)}</p>
                </div>
            `;
        }
    },
    
    // 导出笔记
    exportNotes() {
        const result = NotebookManager.downloadNotebook();
        if (result.success) {
            this.showToast('笔记导出成功', 'success');
        } else {
            this.showToast('导出失败：' + result.error, 'error');
        }
    },
    
    // 加载用户数据
    loadUserData() {
        // 加载设置
        const theme = localStorage.getItem('ui_theme') || 'light';
        const fontSize = localStorage.getItem('ui_font_size') || 'medium';
        const autoSave = localStorage.getItem('ui_auto_save') !== 'false';
        
        if (this.elements.themeSelect) {
            this.elements.themeSelect.value = theme;
        }
        if (this.elements.fontSizeSelect) {
            this.elements.fontSizeSelect.value = fontSize;
        }
        if (this.elements.autoSave) {
            this.elements.autoSave.checked = autoSave;
        }
        
        this.applyTheme(theme);
        this.applyFontSize(fontSize);
    },
    
    // 更新统计信息
    updateStats() {
        const stats = NotebookManager.getNotebookStats();
        if (stats.success) {
            if (this.elements.totalQuestions) {
                this.elements.totalQuestions.textContent = stats.data.qaCount || 0;
            }
            if (this.elements.totalNotes) {
                this.elements.totalNotes.textContent = stats.data.noteCount || 0;
            }
            if (this.elements.totalSize) {
                this.elements.totalSize.textContent = QAUtils.formatFileSize(stats.data.totalSize);
            }
        }
    },
    
    // 加载历史记录
    loadHistory() {
        if (this.elements.historyList) {
            this.elements.historyList.innerHTML = `
                <div class="history-empty">
                    <p>暂无历史记录</p>
                    <p>开始使用问答功能来创建记录吧！</p>
                </div>
            `;
        }
    },
    
    // 应用主题
    applyTheme(theme) {
        document.body.className = theme === 'dark' ? 'dark-theme' : '';
        localStorage.setItem('ui_theme', theme);
    },
    
    // 应用字体大小
    applyFontSize(size) {
        document.body.classList.remove('font-small', 'font-medium', 'font-large');
        document.body.classList.add(`font-${size}`);
        localStorage.setItem('ui_font_size', size);
    },
    
    // 创建备份
    createBackup() {
        const result = NotebookManager.downloadNotebook(null, `备份_${QAUtils.formatDateTime(null, 'date')}_智能问答系统.md`);
        if (result.success) {
            this.showToast('备份创建成功', 'success');
        } else {
            this.showToast('备份失败：' + result.error, 'error');
        }
    },
    
    // 确认清空数据
    confirmClearData() {
        this.showModal(
            '确认清空数据',
            '此操作将删除所有本地数据（包括笔记、设置等），且无法恢复。确定要继续吗？',
            () => {
                const result = NotebookManager.clearNotebook(true);
                if (result.success) {
                    this.showToast('数据已清空', 'success');
                    this.updateStats();
                    this.loadNotesList();
                } else {
                    this.showToast('清空失败：' + result.error, 'error');
                }
            }
        );
    },
    
    // 退出登录
    logout() {
        if (window.AuthBlock) {
            AuthBlock.logout();
        } else {
            window.location.href = '../auth-block/auth.html';
        }
    },
    
    // 显示提示消息
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        this.elements.toastContainer.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    },
    
    // 显示模态框
    showModal(title, body, onConfirm) {
        this.elements.modalTitle.textContent = title;
        this.elements.modalBody.innerHTML = typeof body === 'string' ? `<p>${body}</p>` : body;
        this.elements.modalOverlay.style.display = 'flex';
        
        // 绑定确认事件
        this.elements.modalConfirm.onclick = () => {
            this.hideModal();
            if (onConfirm) onConfirm();
        };
    },
    
    // 隐藏模态框
    hideModal() {
        this.elements.modalOverlay.style.display = 'none';
        this.elements.modalConfirm.onclick = null;
    }
}; 