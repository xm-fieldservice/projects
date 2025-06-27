/**
 * @file four_panel_layout.js
 * @description 节点详情面板四组件布局模块
 * 包含：内容编辑器(节点联动)、标签组件(全局状态)、会话列表(节点联动)、模板列表(全局状态)
 */

// 简化版本：移除外部依赖，使用内置实现
// import state from '../../services/state.js';
// import { showMessage } from '../../utils/utils.js';
// import { SessionService } from '../../services/session_service.js';
// import { TemplateService } from '../../services/template_service.js';

// 内置消息显示函数
function showMessage(message, type = 'info') {
    // 简单的alert实现，可以后续替换为更好的UI
    if (type === 'error') {
        alert('❌ ' + message);
    } else if (type === 'success') {
        alert('✅ ' + message);
    } else if (type === 'warning') {
        alert('⚠️ ' + message);
    } else {
        alert('ℹ️ ' + message);
    }
    console.log(`[showMessage] ${type}: ${message}`);
}

class FourPanelLayout {
    constructor() {
        this.initialized = false;
        this.currentNodeId = null;
        
        // 全局状态（不随节点切换而重置）
        this.globalTagState = [];
        this.globalTemplateState = ['会议记录模板', '任务清单模板'];
        this.qaMode = true;
        
        // 节点数据缓存
        this.nodeDataCache = {};
        this.sessionDataCache = {};
        
        console.log('📱 [FourPanelLayout] 初始化四组件布局');
    }

    /**
     * 初始化四组件布局
     */
    init() {
        if (this.initialized) return;
        
        console.log('🚀 [FourPanelLayout] 开始初始化四组件布局...');
        
        // 确保样式已加载
        this.addStyles();
        
        // 初始化数据存储
        this.initializeDataStore();
        
        // 加载全局状态
        this.loadGlobalState();
        
        this.initialized = true;
        console.log('✅ [FourPanelLayout] 四组件布局初始化完成');
    }

    /**
     * 初始化简化的数据存储
     */
    initializeDataStore() {
        if (!window.nodeDatabase) {
            window.nodeDatabase = {};
        }
        if (!window.globalTemplates) {
            window.globalTemplates = [];
        }
        if (!window.templateSessions) {
            window.templateSessions = {};
        }
    }

    /**
     * 显示节点详情（主入口）
     * @param {Object} node - jsMind节点对象
     */
    showNodeDetails(node) {
        if (!node) {
            console.warn('❌ [FourPanelLayout] 节点为空');
            return;
        }

        console.log(`📝 [FourPanelLayout] 显示节点详情: ${node.topic} (${node.id})`);

        // 保存当前编辑的内容
        this.saveCurrentNodeContent();

        // 更新当前节点ID
        this.currentNodeId = node.id;

        // 确保节点数据存在
        this.ensureNodeData(node);

        // 生成四组件布局HTML
        this.renderLayout(node);

        // 绑定事件
        this.bindEvents(node.id);

        // 加载节点相关数据（节点联动组件）
        this.loadNodeSpecificData(node.id);

        // 恢复全局状态（全局状态组件）
        this.restoreGlobalState();

        console.log('✅ [FourPanelLayout] 节点详情显示完成');
    }

    /**
     * 保存当前编辑的节点内容
     */
    saveCurrentNodeContent() {
        if (!this.currentNodeId) return;

        const contentEditor = document.getElementById(`node-content-${this.currentNodeId}`);
        const titleInput = document.getElementById(`node-title-${this.currentNodeId}`);

        if (contentEditor && titleInput && this.nodeDataCache[this.currentNodeId]) {
            this.nodeDataCache[this.currentNodeId].content = contentEditor.value;
            this.nodeDataCache[this.currentNodeId].title = titleInput.value;
            this.nodeDataCache[this.currentNodeId].updateTime = new Date().toLocaleString('zh-CN');
            console.log(`💾 [FourPanelLayout] 已保存节点内容: ${this.currentNodeId}`);
        }
    }

    /**
     * 确保节点数据存在
     */
    ensureNodeData(node) {
        const cleanTitle = node.topic.replace(' 📄', '');
        
        if (!this.nodeDataCache[node.id]) {
            this.nodeDataCache[node.id] = {
                id: node.id,
                title: cleanTitle,
                content: '',
                createTime: new Date().toLocaleString('zh-CN'),
                updateTime: new Date().toLocaleString('zh-CN')
            };
            console.log(`📂 [FourPanelLayout] 创建节点数据: ${node.id}`);
        } else {
            // 确保标题同步
            this.nodeDataCache[node.id].title = cleanTitle;
        }

        // 确保会话数据存在
        if (!this.sessionDataCache[node.id]) {
            this.sessionDataCache[node.id] = [];
        }
    }

    /**
     * 渲染四组件布局
     */
    renderLayout(node) {
        console.log('🎨 [FourPanelLayout] 开始渲染布局，节点:', node);
        
        const workspaceInfoContent = document.getElementById('workspace-info-content');
        console.log('📦 [FourPanelLayout] 工作区容器:', workspaceInfoContent);
        
        if (!workspaceInfoContent) {
            console.error('❌ [FourPanelLayout] 找不到workspace-info-content容器');
            // 列出所有可能的容器
            console.log('📋 [FourPanelLayout] 可用容器列表:');
            ['detail-info-content', 'workspace-info-content', 'tab-workspace'].forEach(id => {
                const el = document.getElementById(id);
                console.log(`  - ${id}:`, el);
            });
            
            // 尝试使用备用容器
            const fallbackContainer = document.getElementById('tab-workspace');
            if (fallbackContainer) {
                console.log('🔄 [FourPanelLayout] 使用备用容器 tab-workspace');
                // 在tab-workspace内查找或创建workspace-info-content容器
                let workspaceContent = fallbackContainer.querySelector('#workspace-info-content');
                if (!workspaceContent) {
                    // 如果不存在，创建容器
                    fallbackContainer.innerHTML = '<div id="workspace-info-content"></div>';
                    workspaceContent = document.getElementById('workspace-info-content');
                }
                
                if (workspaceContent) {
                    console.log('✅ [FourPanelLayout] 在tab-workspace中找到/创建了workspace-info-content');
                    // 使用找到的容器继续渲染
                    this.renderToContainer(workspaceContent, node);
                    return;
                }
            }
            
            return;
        }

        // 使用正常容器渲染
        this.renderToContainer(workspaceInfoContent, node);
    }

    /**
     * 渲染到指定容器
     */
    renderToContainer(container, node) {
        const nodeData = this.nodeDataCache[node.id];

        container.innerHTML = `
            <div class="four-panel-workspace">
                <!-- 标题区域 -->
                <div class="four-panel-title-area">
                    <div class="qa-toggle">
                        <input type="checkbox" id="qa-mode-toggle" ${this.qaMode ? 'checked' : ''}>
                        <label for="qa-mode-toggle">问答模式</label>
                    </div>
                    <div class="title-content">
                        <h3 class="node-title" id="current-node-title">${nodeData.title}</h3>
                    </div>
                </div>
                
                <!-- 主内容区域 -->
                <div class="four-panel-main-content">
                    <!-- 左侧面板 -->
                    <div class="four-panel-left">
                        <!-- 组件A: 内容编辑器（节点联动） -->
                        <div class="content-editor-section">
                            <div class="section-header">
                                <h4>内容编辑器</h4>
                                <div class="editor-controls">
                                    <button class="btn btn-sm" onclick="window.fourPanelLayout.copyContent()">复制</button>
                                    <button class="btn btn-sm" onclick="window.fourPanelLayout.pasteContent()">粘贴</button>
                                    <button class="btn btn-sm btn-primary" onclick="window.fourPanelLayout.submitContent()">提交</button>
                                </div>
                            </div>
                            <input type="text" class="title-input" id="node-title-${node.id}" 
                                   value="${nodeData.title}" placeholder="节点标题">
                            <textarea class="content-editor" id="node-content-${node.id}" 
                                      placeholder="在这里编辑节点内容...">${nodeData.content}</textarea>
                            <div class="meta-info" id="meta-info-${node.id}">
                                创建时间: ${nodeData.createTime} | 修改时间: ${nodeData.updateTime}
                            </div>
                        </div>
                        
                        <!-- 组件B: 标签组件（全局状态） -->
                        <div class="tags-section">
                            <div class="section-header">
                                <h4>标签组件 (全局状态)</h4>
                            </div>
                            <div class="tag-groups">
                                <div class="tag-group">
                                    <div class="tag-group-title">分类标签</div>
                                    <div class="tag-list" id="category-tags">
                                        <span class="tag" onclick="window.fourPanelLayout.toggleTag(this)">工作</span>
                                        <span class="tag" onclick="window.fourPanelLayout.toggleTag(this)">学习</span>
                                        <span class="tag" onclick="window.fourPanelLayout.toggleTag(this)">生活</span>
                                        <span class="tag" onclick="window.fourPanelLayout.toggleTag(this)">项目</span>
                                        <span class="tag" onclick="window.fourPanelLayout.toggleTag(this)">想法</span>
                                        <span class="tag" onclick="window.fourPanelLayout.toggleTag(this)">任务</span>
                                    </div>
                                </div>
                                <div class="tag-group">
                                    <div class="tag-group-title">技术标签</div>
                                    <div class="tag-list" id="technical-tags">
                                        <span class="tag" onclick="window.fourPanelLayout.toggleTag(this)">JavaScript</span>
                                        <span class="tag" onclick="window.fourPanelLayout.toggleTag(this)">React</span>
                                        <span class="tag" onclick="window.fourPanelLayout.toggleTag(this)">Node.js</span>
                                        <span class="tag" onclick="window.fourPanelLayout.toggleTag(this)">CSS</span>
                                        <span class="tag" onclick="window.fourPanelLayout.toggleTag(this)">HTML</span>
                                        <span class="tag" onclick="window.fourPanelLayout.toggleTag(this)">Python</span>
                                    </div>
                                </div>
                                <div class="tag-group">
                                    <div class="tag-group-title">状态标签</div>
                                    <div class="tag-list" id="status-tags">
                                        <span class="tag" onclick="window.fourPanelLayout.toggleTag(this)">进行中</span>
                                        <span class="tag" onclick="window.fourPanelLayout.toggleTag(this)">已完成</span>
                                        <span class="tag" onclick="window.fourPanelLayout.toggleTag(this)">待处理</span>
                                        <span class="tag" onclick="window.fourPanelLayout.toggleTag(this)">已暂停</span>
                                        <span class="tag" onclick="window.fourPanelLayout.toggleTag(this)">重要</span>
                                        <span class="tag" onclick="window.fourPanelLayout.toggleTag(this)">紧急</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 右侧面板 -->
                    <div class="four-panel-right" id="four-panel-right">
                        <!-- 组件C: 会话列表（节点联动） -->
                        <div class="session-section">
                            <div class="section-header">
                                <h4>会话列表</h4>
                                <div class="session-controls">
                                    <button class="btn btn-sm" onclick="window.fourPanelLayout.addSession('${node.id}')">新增</button>
                                    <button class="btn btn-sm" onclick="window.fourPanelLayout.clearSessions('${node.id}')">清空</button>
                                </div>
                            </div>
                            <div class="session-list" id="session-list-${node.id}">
                                <!-- 会话记录将动态生成 -->
                            </div>
                        </div>
                        
                        <!-- 组件D: 模板列表（全局状态） -->
                        <div class="template-section">
                            <div class="section-header">
                                <h4>模板列表 (全局状态)</h4>
                                <button class="btn btn-sm" onclick="window.fourPanelLayout.openTemplateManager()">⚙️ 管理</button>
                            </div>
                            <div class="template-list" id="global-templates-list">
                                <!-- 模板列表将动态生成 -->
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // 添加样式
        this.addStyles();

        console.log('✅ [FourPanelLayout] 布局HTML已渲染到容器:', container.id || container.className);
    }

    /**
     * 绑定事件监听器
     */
    bindEvents(nodeId) {
        // 问答模式开关
        const qaToggle = document.getElementById('qa-mode-toggle');
        if (qaToggle) {
            qaToggle.addEventListener('change', (e) => {
                this.qaMode = e.target.checked;
                this.toggleQAMode(e.target.checked);
                this.saveGlobalState();
            });
        }

        // 标题输入事件
        const titleInput = document.getElementById(`node-title-${nodeId}`);
        if (titleInput) {
            titleInput.addEventListener('input', (e) => {
                this.updateNodeTitle(nodeId, e.target.value);
            });
        }

        // 内容编辑事件
        const contentEditor = document.getElementById(`node-content-${nodeId}`);
        if (contentEditor) {
            contentEditor.addEventListener('input', (e) => {
                this.updateNodeContent(nodeId, e.target.value);
            });
        }
    }

    /**
     * 加载节点特定数据（节点联动组件）
     */
    loadNodeSpecificData(nodeId) {
        // 加载会话列表
        this.loadSessionList(nodeId);
        
        // 更新标题显示
        const nodeData = this.nodeDataCache[nodeId];
        const currentTitle = document.getElementById('current-node-title');
        if (currentTitle && nodeData) {
            currentTitle.textContent = nodeData.title;
        }

        console.log(`📊 [FourPanelLayout] 已加载节点特定数据: ${nodeId}`);
    }

    /**
     * 恢复全局状态（全局状态组件）
     */
    restoreGlobalState() {
        // 恢复标签选择状态
        this.updateTagDisplay();
        
        // 恢复模板列表
        this.updateTemplateDisplay();
        
        // 恢复问答模式状态
        this.toggleQAMode(this.qaMode);

        console.log('🔄 [FourPanelLayout] 已恢复全局状态');
    }

    /**
     * 切换问答模式
     */
    toggleQAMode(enabled) {
        const rightPanel = document.getElementById('four-panel-right');
        if (rightPanel) {
            if (enabled) {
                rightPanel.style.display = 'flex';
            } else {
                rightPanel.style.display = 'none';
            }
        }
        console.log(`🔄 [FourPanelLayout] 问答模式: ${enabled ? '开启' : '关闭'}`);
    }

    /**
     * 标签切换（全局状态）
     */
    toggleTag(tagText) {
        const index = this.globalTagState.indexOf(tagText);
        if (index > -1) {
            this.globalTagState.splice(index, 1);
            console.log(`❌ [FourPanelLayout] 取消选择标签: ${tagText}`);
        } else {
            this.globalTagState.push(tagText);
            console.log(`✅ [FourPanelLayout] 选择标签: ${tagText}`);
        }

        this.updateTagDisplay();
        this.saveGlobalState();
    }

    /**
     * 更新标签显示
     */
    updateTagDisplay() {
        const tags = document.querySelectorAll('.tag');
        tags.forEach(tag => {
            const tagText = tag.textContent.trim();
            if (this.globalTagState.includes(tagText)) {
                tag.classList.add('selected');
            } else {
                tag.classList.remove('selected');
            }
        });
    }

    /**
     * 更新模板显示
     */
    updateTemplateDisplay() {
        const templateList = document.getElementById('global-templates-list');
        if (templateList) {
            templateList.innerHTML = this.renderTemplateList();
        }
    }

    /**
     * 渲染模板列表
     */
    renderTemplateList() {
        if (this.globalTemplateState.length === 0) {
            return `
                <div class="empty-template-state">
                    <div class="empty-icon">📝</div>
                    <div class="empty-text">暂无选中模板</div>
                    <div class="empty-hint">在模板管理器中选择模板</div>
                </div>
            `;
        }

        return this.globalTemplateState.map(template => `
            <div class="template-item">
                <div class="template-info">
                    <span class="template-name">${template.name || template}</span>
                </div>
                <div class="template-actions">
                    <button class="btn btn-xs" onclick="window.fourPanelLayout.useTemplate('${template.id || template}')">使用</button>
                    <button class="btn btn-xs" onclick="window.fourPanelLayout.removeTemplate('${template.id || template}')">移除</button>
                </div>
            </div>
        `).join('');
    }

    /**
     * 加载会话列表
     */
    loadSessionList(nodeId) {
        const sessionListContainer = document.getElementById(`session-list-${nodeId}`);
        if (!sessionListContainer) return;

        const nodeData = this.nodeDataCache[nodeId];
        const sessions = this.sessionDataCache[nodeId] || [];

        if (sessions.length === 0) {
            sessionListContainer.innerHTML = `
                <div class="empty-session-state">
                    <div class="empty-icon">💬</div>
                    <div class="empty-text">暂无会话记录</div>
                </div>
            `;
            return;
        }

        sessionListContainer.innerHTML = sessions.map((session, index) => `
            <div class="session-item" onclick="window.fourPanelLayout.selectSession('${nodeId}', ${index})">
                <div class="session-time">${this.formatDateTime(session.created || session.createdAt)}</div>
                <div class="session-preview">${session.title || session.content?.substring(0, 50) || '无标题'}${session.content?.length > 50 ? '...' : ''}</div>
            </div>
        `).join('');

        console.log(`📊 [FourPanelLayout] 已加载 ${sessions.length} 个会话记录`);
    }

    /**
     * 内容操作方法
     */
    copyContent() {
        if (!this.currentNodeId) return;
        
        const contentEditor = document.getElementById(`node-content-${this.currentNodeId}`);
        if (contentEditor && contentEditor.value) {
            navigator.clipboard.writeText(contentEditor.value).then(() => {
                showMessage('✅ 内容已复制到剪贴板');
            }).catch(() => {
                showMessage('❌ 复制失败，请手动复制', 'error');
            });
        } else {
            showMessage('❌ 没有内容可复制', 'error');
        }
    }

    pasteContent() {
        if (!this.currentNodeId) return;
        
        navigator.clipboard.readText().then(text => {
            if (text) {
                const contentEditor = document.getElementById(`node-content-${this.currentNodeId}`);
                if (contentEditor) {
                    contentEditor.value = text;
                    this.updateNodeContent(this.currentNodeId, text);
                    showMessage('✅ 内容已粘贴');
                }
            } else {
                showMessage('❌ 剪贴板为空', 'error');
            }
        }).catch(() => {
            showMessage('❌ 粘贴失败，请手动粘贴', 'error');
        });
    }

    submitContent() {
        if (!this.currentNodeId) return;
        
        const titleInput = document.getElementById(`node-title-${this.currentNodeId}`);
        const contentEditor = document.getElementById(`node-content-${this.currentNodeId}`);
        
        if (!titleInput || !contentEditor) return;

        const title = titleInput.value.trim();
        const content = contentEditor.value.trim();

        if (!title && !content) {
            showMessage('❌ 请输入标题或内容后再提交', 'error');
            return;
        }

        // 保存内容
        this.updateNodeTitle(this.currentNodeId, title);
        this.updateNodeContent(this.currentNodeId, content);

        // 添加会话记录
        this.addSessionRecord(this.currentNodeId, content || title);

        showMessage('✅ 内容已提交并创建会话记录');
    }

    /**
     * 会话操作方法
     */
    addSession(nodeId) {
        const content = prompt('请输入会话内容:');
        if (content && content.trim()) {
            this.addSessionRecord(nodeId, content.trim());
        }
    }

    addSessionRecord(nodeId, content) {
        if (!content || !content.trim()) return;

        const nodeData = this.nodeDataCache[nodeId];
        if (!nodeData) return;

        if (!this.sessionDataCache[nodeId]) {
            this.sessionDataCache[nodeId] = [];
        }

        const newSession = {
            id: Date.now().toString(),
            title: content.length > 50 ? content.substring(0, 50) + '...' : content,
            content: content,
            created: new Date().toISOString(),
            modified: new Date().toISOString()
        };

        this.sessionDataCache[nodeId].push(newSession);
        nodeData.updateTime = new Date().toLocaleString('zh-CN');

        // 重新加载会话列表
        this.loadSessionList(nodeId);

        console.log(`✅ [FourPanelLayout] 已添加会话记录: ${nodeId}`);
    }

    selectSession(nodeId, sessionIndex) {
        const nodeData = this.nodeDataCache[nodeId];
        if (!nodeData || !this.sessionDataCache[nodeId] || !this.sessionDataCache[nodeId][sessionIndex]) return;

        const session = this.sessionDataCache[nodeId][sessionIndex];
        const contentEditor = document.getElementById(`node-content-${nodeId}`);
        
        if (contentEditor) {
            const currentContent = contentEditor.value;
            
            let message = `确定要加载这个会话内容吗？\n\n会话内容: ${session.content}`;
            if (currentContent.trim()) {
                message += '\n\n注意：当前编辑内容将被覆盖。';
            }
            
            if (confirm(message)) {
                contentEditor.value = session.content;
                this.updateNodeContent(nodeId, session.content);
                showMessage(`✅ 已加载会话: ${session.title}`);
                
                // 高亮选中的会话
                document.querySelectorAll(`#session-list-${nodeId} .session-item`).forEach((item, index) => {
                    if (index === sessionIndex) {
                        item.classList.add('active');
                    } else {
                        item.classList.remove('active');
                    }
                });
            }
        }
    }

    clearSessions(nodeId) {
        const nodeData = this.nodeDataCache[nodeId];
        if (!nodeData || !this.sessionDataCache[nodeId] || this.sessionDataCache[nodeId].length === 0) {
            showMessage('❌ 当前节点没有会话记录', 'error');
            return;
        }

        if (confirm(`确定要清空当前节点的所有 ${this.sessionDataCache[nodeId].length} 个会话记录吗？`)) {
            this.sessionDataCache[nodeId] = [];
            nodeData.updateTime = new Date().toLocaleString('zh-CN');
            this.loadSessionList(nodeId);
            showMessage('🗑️ 已清空所有会话记录');
        }
    }

    /**
     * 模板操作方法
     */
    useTemplate(templateName) {
        if (!this.currentNodeId) return;
        
        const templateContent = this.getTemplateContent(templateName);
        const contentEditor = document.getElementById(`node-content-${this.currentNodeId}`);
        
        if (!contentEditor) return;
        
        const currentContent = contentEditor.value;
        let message = `确定要使用"${templateName}"吗？`;
        if (currentContent.trim()) {
            message += '\n当前内容将被替换。';
        }

        if (confirm(message)) {
            contentEditor.value = templateContent;
            this.updateNodeContent(this.currentNodeId, templateContent);
            showMessage(`✅ 已使用模板: ${templateName}`);
            console.log('🎨 [FourPanelLayout] 已使用模板:', templateName);
        }
    }

    removeTemplate(templateName) {
        if (confirm(`确定要移除"${templateName}"吗？`)) {
            const index = this.globalTemplateState.indexOf(templateName);
            if (index > -1) {
                this.globalTemplateState.splice(index, 1);
                this.updateTemplateDisplay();
                this.saveGlobalState();
                showMessage(`✅ 已移除模板: ${templateName}`);
                console.log('🗑️ [FourPanelLayout] 已移除模板:', templateName);
            }
        }
    }

    openTemplateManager() {
        showMessage('模板管理器功能待实现\n\n这里可以:\n- 添加新模板\n- 编辑现有模板\n- 导入/导出模板', 'info');
    }

    /**
     * 获取模板内容
     */
    getTemplateContent(templateName) {
        const templates = {
            '会议记录模板': `# 会议记录

**会议时间**: ${new Date().toLocaleString('zh-CN')}
**参与人员**: 
**会议主题**: 

## 讨论要点
1. 
2. 
3. 

## 决议事项
- 
- 

## 后续行动
- [ ] 
- [ ] 

## 备注
`,
            '任务清单模板': `# 任务清单

**创建时间**: ${new Date().toLocaleString('zh-CN')}

## 待办事项
- [ ] 任务1
- [ ] 任务2
- [ ] 任务3

## 进行中
- 

## 已完成
- ✅ 

## 备注
- 优先级: 高/中/低
- 预计完成时间: 
`
        };
        return templates[templateName] || `模板内容: ${templateName}`;
    }

    /**
     * 数据更新方法
     */
    updateNodeTitle(nodeId, title) {
        const nodeData = this.nodeDataCache[nodeId];
        if (!nodeData) return;

        nodeData.title = title;
        nodeData.updateTime = new Date().toLocaleString('zh-CN');

        // 更新标题显示
        const currentTitle = document.getElementById('current-node-title');
        if (currentTitle) {
            currentTitle.textContent = title;
        }

        // 更新元信息
        this.updateMetaInfo(nodeId);

        // 更新思维导图节点标题
        if (window.jm && window.jm.get_node(nodeId)) {
            window.jm.update_node(nodeId, title);
        }
    }

    updateNodeContent(nodeId, content) {
        const nodeData = this.nodeDataCache[nodeId];
        if (!nodeData) return;

        nodeData.content = content;
        nodeData.updateTime = new Date().toLocaleString('zh-CN');

        // 更新元信息
        this.updateMetaInfo(nodeId);
    }

    updateMetaInfo(nodeId) {
        const nodeData = this.nodeDataCache[nodeId];
        const metaInfo = document.getElementById(`meta-info-${nodeId}`);
        
        if (metaInfo && nodeData) {
            metaInfo.textContent = 
                `创建时间: ${nodeData.createTime} | 修改时间: ${nodeData.updateTime}`;
        }
    }

    /**
     * 全局状态管理
     */
    saveGlobalState() {
        const globalState = {
            tagState: this.globalTagState,
            templateState: this.globalTemplateState,
            qaMode: this.qaMode
        };

        try {
            localStorage.setItem('fourPanelLayout_globalState', JSON.stringify(globalState));
            console.log('💾 [FourPanelLayout] 全局状态已保存');
        } catch (error) {
            console.error('❌ [FourPanelLayout] 保存全局状态失败:', error);
        }
    }

    loadGlobalState() {
        try {
            const saved = localStorage.getItem('fourPanelLayout_globalState');
            if (saved) {
                const globalState = JSON.parse(saved);
                this.globalTagState = globalState.tagState || [];
                this.globalTemplateState = globalState.templateState || ['会议记录模板', '任务清单模板'];
                this.qaMode = globalState.qaMode !== undefined ? globalState.qaMode : true;
                console.log('📂 [FourPanelLayout] 全局状态已加载');
            } else {
                // 初始化默认模板
                this.globalTemplateState = ['会议记录模板', '任务清单模板'];
            }
        } catch (error) {
            console.error('❌ [FourPanelLayout] 加载全局状态失败:', error);
        }
    }

    /**
     * 工具方法
     */
    formatDateTime(dateString) {
        if (!dateString) return '未知';
        
        try {
            const date = new Date(dateString);
            return date.toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return '格式错误';
        }
    }

    /**
     * 添加样式
     */
    addStyles() {
        if (document.getElementById('four-panel-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'four-panel-styles';
        styles.textContent = `
            .four-panel-workspace {
                display: flex;
                flex-direction: column;
                height: 100%;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }

            .four-panel-title-area {
                background: #fafafa;
                border-bottom: 1px solid #e5e5e5;
                padding: 15px 20px;
                position: relative;
                display: flex;
                align-items: center;
                gap: 15px;
            }

            .qa-toggle {
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .qa-toggle input[type="checkbox"] {
                width: 16px;
                height: 16px;
            }

            .qa-toggle label {
                font-size: 14px;
                cursor: pointer;
                user-select: none;
            }

            .node-title {
                font-size: 18px;
                font-weight: 600;
                color: #333;
                margin: 0;
            }

            .four-panel-main-content {
                display: flex;
                flex: 1;
                min-height: 600px;
            }

            .four-panel-left {
                flex: 1;
                display: flex;
                flex-direction: column;
                border-right: 1px solid #e5e5e5;
            }

            .four-panel-right {
                width: 400px;
                display: flex;
                flex-direction: column;
                transition: all 0.3s ease;
            }

            .content-editor-section {
                flex: 1;
                padding: 20px;
                border-bottom: 1px solid #e5e5e5;
            }

            .section-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
            }

            .section-header h4 {
                font-size: 16px;
                color: #333;
                margin: 0;
            }

            .editor-controls {
                display: flex;
                gap: 8px;
            }

            .btn {
                padding: 6px 12px;
                border: 1px solid #ddd;
                background: white;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                transition: all 0.2s;
            }

            .btn:hover {
                background: #f0f0f0;
            }

            .btn-primary {
                background: #007bff;
                color: white;
                border-color: #007bff;
            }

            .btn-primary:hover {
                background: #0056b3;
            }

            .btn-sm {
                padding: 4px 8px;
                font-size: 11px;
            }

            .btn-xs {
                padding: 2px 6px;
                font-size: 10px;
            }

            .title-input {
                width: 100%;
                padding: 8px 12px;
                border: 1px solid #ddd;
                border-radius: 4px;
                font-size: 14px;
                margin-bottom: 10px;
            }

            .content-editor {
                width: 100%;
                min-height: 200px;
                padding: 12px;
                border: 1px solid #ddd;
                border-radius: 4px;
                font-size: 14px;
                resize: vertical;
                font-family: inherit;
            }

            .meta-info {
                margin-top: 10px;
                font-size: 12px;
                color: #666;
            }

            .tags-section {
                padding: 20px;
                background: #f9f9f9;
            }

            .tag-group {
                margin-bottom: 15px;
            }

            .tag-group-title {
                font-size: 12px;
                color: #666;
                margin-bottom: 8px;
            }

            .tag-list {
                display: flex;
                flex-wrap: wrap;
                gap: 6px;
            }

            .tag {
                padding: 4px 8px;
                background: #e9ecef;
                border: 1px solid #ddd;
                border-radius: 12px;
                font-size: 12px;
                cursor: pointer;
                transition: all 0.2s;
            }

            .tag.selected {
                background: #007bff;
                color: white;
                border-color: #007bff;
            }

            .tag:hover {
                transform: translateY(-1px);
            }

            .session-section {
                flex: 1;
                padding: 20px;
                border-bottom: 1px solid #e5e5e5;
            }

            .session-controls {
                display: flex;
                gap: 8px;
            }

            .session-list {
                max-height: 300px;
                overflow-y: auto;
            }

            .session-item {
                padding: 10px;
                border: 1px solid #e5e5e5;
                border-radius: 4px;
                margin-bottom: 8px;
                cursor: pointer;
                transition: all 0.2s;
            }

            .session-item:hover {
                background: #f0f0f0;
            }

            .session-item.active {
                background: #e3f2fd;
                border-color: #2196f3;
            }

            .session-time {
                font-size: 11px;
                color: #666;
                margin-bottom: 4px;
            }

            .session-preview {
                font-size: 12px;
                color: #333;
                line-height: 1.4;
            }

            .template-section {
                padding: 20px;
                background: #f9f9f9;
            }

            .template-list {
                max-height: 300px;
                overflow-y: auto;
            }

            .template-item {
                padding: 10px;
                background: white;
                border: 1px solid #e5e5e5;
                border-radius: 4px;
                margin-bottom: 8px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .template-name {
                font-size: 12px;
                color: #333;
            }

            .template-actions {
                display: flex;
                gap: 4px;
            }

            .empty-session-state, .empty-template-state {
                text-align: center;
                padding: 40px 20px;
                color: #666;
            }

            .empty-icon {
                font-size: 32px;
                margin-bottom: 10px;
            }

            .empty-text {
                font-size: 14px;
                margin-bottom: 5px;
            }

            .empty-hint {
                font-size: 12px;
                color: #999;
            }

            @media (max-width: 768px) {
                .four-panel-right {
                    display: none;
                }
                .qa-toggle {
                    display: none;
                }
            }
        `;

        document.head.appendChild(styles);
    }
}

// 创建全局实例
const fourPanelLayout = new FourPanelLayout();

// 导出模块和全局实例
export default fourPanelLayout;

// 全局访问
window.fourPanelLayout = fourPanelLayout; 