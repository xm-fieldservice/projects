# 🔧 工具包集成指南

详细的集成步骤、最佳实践和常见问题解决方案。

## 🎯 集成策略

### 选择合适的集成方式

#### 1. 单一工具包集成
**适用场景**: 功能需求单一，项目规模较小
```javascript
// 示例：只需要文件保存功能
import LocalNoteSaver from './public-tools/storage-tools/local-note-saver-toolkit/local-note-saver.js';

const saver = new LocalNoteSaver();
await saver.saveNote(noteData);
```

#### 2. 多工具包组合
**适用场景**: 功能需求复杂，需要多种能力
```javascript
// 示例：智能问答 + 文件保存
import QANoteToolkit from './public-tools/ai-tools/qa-note-toolkit/src/qa-note-toolkit.js';
import LocalNoteSaver from './public-tools/storage-tools/local-note-saver-toolkit/local-note-saver.js';

const qaToolkit = new QANoteToolkit(config);
const noteSaver = new LocalNoteSaver();

// 组合使用
qaToolkit.on('noteSaved', async (data) => {
    await noteSaver.saveNote(data);
});
```

#### 3. 渐进式集成
**适用场景**: 大型项目，分阶段实施
```javascript
// 阶段1：基础功能
const noteSaver = new LocalNoteSaver();

// 阶段2：增加笔记处理
const noteToolkit = new NoteToolkit();

// 阶段3：增加AI功能
const qaToolkit = new QANoteToolkit();
```

## 🚀 快速集成模板

### 模板1: 基础笔记应用
```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>我的笔记应用</title>
    <link rel="stylesheet" href="public-tools/shared/common-styles.css">
</head>
<body>
    <div id="app">
        <div class="note-editor">
            <input type="text" id="title" placeholder="笔记标题">
            <textarea id="content" placeholder="开始写笔记..."></textarea>
            <div class="actions">
                <button onclick="saveNote()">保存笔记</button>
                <button onclick="processNote()">格式化</button>
            </div>
        </div>
    </div>

    <!-- 引入工具包 -->
    <script src="public-tools/note-tools/note-block-toolkit/tools/note-toolkit.js"></script>
    <script src="public-tools/storage-tools/local-note-saver-toolkit/local-note-saver.js"></script>
    
    <script>
        // 初始化工具包
        const noteToolkit = new NoteToolkit();
        const noteSaver = new LocalNoteSaver();
        
        // 处理笔记
        async function processNote() {
            const content = document.getElementById('content').value;
            const processed = noteToolkit.process(content);
            document.getElementById('content').value = processed;
        }
        
        // 保存笔记
        async function saveNote() {
            const title = document.getElementById('title').value;
            const content = document.getElementById('content').value;
            
            await noteSaver.saveNote({
                title: title,
                content: content,
                timestamp: new Date().toISOString()
            });
        }
    </script>
</body>
</html>
```

### 模板2: 智能问答系统
```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>智能问答系统</title>
    <link rel="stylesheet" href="public-tools/ai-tools/qa-note-toolkit/src/qa-note-toolkit.css">
</head>
<body>
    <div id="qa-container">
        <!-- QA Note Toolkit 将在这里初始化 -->
    </div>

    <!-- 引入工具包 -->
    <script src="public-tools/shared/common-utils.js"></script>
    <script src="public-tools/ai-tools/qa-note-toolkit/src/qa-note-toolkit.js"></script>
    <script src="public-tools/storage-tools/local-note-saver-toolkit/local-note-saver.js"></script>
    
    <script>
        // 配置选项
        const config = {
            container: '#qa-container',
            agents: {
                default: 'general',
                apiUrl: 'http://localhost:8001'
            },
            ui: {
                theme: 'modern',
                responsive: true
            },
            features: {
                fileUpload: true,
                imageCapture: true
            }
        };
        
        // 初始化系统
        async function initializeSystem() {
            const qaToolkit = new QANoteToolkit(config);
            const noteSaver = new LocalNoteSaver();
            
            // 初始化QA工具包
            await qaToolkit.init();
            
            // 绑定保存事件
            qaToolkit.on('noteSaved', async (data) => {
                await noteSaver.saveNote(data);
                console.log('笔记已保存到本地');
            });
            
            qaToolkit.on('questionAnswered', (data) => {
                console.log('问答完成:', data);
            });
        }
        
        // 启动系统
        initializeSystem().catch(console.error);
    </script>
</body>
</html>
```

### 模板3: 全功能应用
```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>全功能笔记系统</title>
    
    <!-- 引入所有样式 -->
    <link rel="stylesheet" href="public-tools/shared/common-styles.css">
    <link rel="stylesheet" href="public-tools/ai-tools/qa-note-toolkit/src/qa-note-toolkit.css">
    
    <style>
        .app-container {
            display: flex;
            height: 100vh;
        }
        .sidebar {
            width: 200px;
            background: #f5f5f5;
            padding: 1rem;
        }
        .main-content {
            flex: 1;
            padding: 1rem;
        }
        .tool-section {
            margin-bottom: 2rem;
            padding: 1rem;
            border: 1px solid #ddd;
            border-radius: 6px;
        }
    </style>
</head>
<body>
    <div class="app-container">
        <!-- 侧边栏 -->
        <div class="sidebar">
            <h3>工具面板</h3>
            <div class="tool-controls">
                <button onclick="switchTool('qa')">智能问答</button>
                <button onclick="switchTool('note')">笔记处理</button>
                <button onclick="switchTool('save')">文件保存</button>
            </div>
            
            <div class="status-panel">
                <h4>系统状态</h4>
                <div id="status-display">
                    <div>QA工具包: <span id="qa-status">未初始化</span></div>
                    <div>笔记工具: <span id="note-status">就绪</span></div>
                    <div>保存工具: <span id="save-status">就绪</span></div>
                </div>
            </div>
        </div>
        
        <!-- 主内容区 -->
        <div class="main-content">
            <!-- QA工具包区域 -->
            <div id="qa-section" class="tool-section">
                <h3>智能问答</h3>
                <div id="qa-container"></div>
            </div>
            
            <!-- 笔记处理区域 -->
            <div id="note-section" class="tool-section">
                <h3>笔记处理</h3>
                <textarea id="note-input" placeholder="输入笔记内容..."></textarea>
                <div class="note-actions">
                    <button onclick="processNote()">格式化笔记</button>
                    <button onclick="saveProcessedNote()">保存处理结果</button>
                </div>
                <div id="note-output"></div>
            </div>
            
            <!-- 文件保存区域 -->
            <div id="save-section" class="tool-section">
                <h3>文件管理</h3>
                <div class="save-controls">
                    <input type="text" id="filename" placeholder="文件名">
                    <button onclick="saveCurrentNote()">保存文件</button>
                    <button onclick="exportAllNotes()">导出所有</button>
                </div>
                <div id="save-history"></div>
            </div>
        </div>
    </div>

    <!-- 引入所有工具包 -->
    <script src="public-tools/shared/common-utils.js"></script>
    <script src="public-tools/shared/integration-helpers.js"></script>
    <script src="public-tools/ai-tools/qa-note-toolkit/src/qa-note-toolkit.js"></script>
    <script src="public-tools/note-tools/note-block-toolkit/tools/note-toolkit.js"></script>
    <script src="public-tools/storage-tools/local-note-saver-toolkit/local-note-saver.js"></script>
    
    <script>
        // 全局工具包实例
        let qaToolkit = null;
        let noteToolkit = null;
        let noteSaver = null;
        
        // 应用状态
        let currentTool = 'qa';
        let noteHistory = [];
        
        // 初始化所有工具包
        async function initializeAllTools() {
            try {
                // 1. 初始化QA工具包
                qaToolkit = new QANoteToolkit({
                    container: '#qa-container',
                    agents: { default: 'general' },
                    ui: { theme: 'modern' }
                });
                await qaToolkit.init();
                updateStatus('qa-status', '已初始化');
                
                // 2. 初始化笔记工具包
                noteToolkit = new NoteToolkit();
                updateStatus('note-status', '已就绪');
                
                // 3. 初始化保存工具包
                noteSaver = new LocalNoteSaver({
                    mode: 'auto',
                    autoSave: true
                });
                updateStatus('save-status', '已就绪');
                
                // 4. 绑定工具包间的协作
                setupToolkitIntegration();
                
                console.log('所有工具包初始化完成');
                
            } catch (error) {
                console.error('工具包初始化失败:', error);
            }
        }
        
        // 设置工具包间的集成
        function setupToolkitIntegration() {
            // QA工具包事件
            qaToolkit.on('questionAnswered', async (data) => {
                noteHistory.push({
                    type: 'qa',
                    data: data,
                    timestamp: new Date().toISOString()
                });
                
                // 自动保存问答结果
                await noteSaver.saveNote({
                    title: `问答记录 - ${new Date().toLocaleString()}`,
                    content: `**问题**: ${data.question}\n\n**回答**: ${data.answer}`,
                    type: 'qa-record'
                });
            });
            
            qaToolkit.on('noteSaved', async (data) => {
                // 同步保存到本地
                await noteSaver.saveNote(data);
            });
        }
        
        // 切换工具
        function switchTool(toolName) {
            currentTool = toolName;
            
            // 隐藏所有工具区域
            document.querySelectorAll('.tool-section').forEach(section => {
                section.style.display = 'none';
            });
            
            // 显示选中的工具区域
            document.getElementById(`${toolName}-section`).style.display = 'block';
        }
        
        // 处理笔记
        function processNote() {
            const input = document.getElementById('note-input').value;
            if (!input.trim()) return;
            
            const processed = noteToolkit.process(input);
            document.getElementById('note-output').innerHTML = `
                <h4>处理结果:</h4>
                <pre>${processed}</pre>
            `;
        }
        
        // 保存处理后的笔记
        async function saveProcessedNote() {
            const processed = document.getElementById('note-output').textContent;
            if (!processed) return;
            
            await noteSaver.saveNote({
                title: `处理笔记 - ${new Date().toLocaleString()}`,
                content: processed,
                type: 'processed-note'
            });
            
            updateSaveHistory();
        }
        
        // 保存当前笔记
        async function saveCurrentNote() {
            const filename = document.getElementById('filename').value || 'untitled';
            const content = document.getElementById('note-input').value;
            
            await noteSaver.saveToFile(content, `${filename}.md`);
            updateSaveHistory();
        }
        
        // 导出所有笔记
        async function exportAllNotes() {
            const allNotes = noteHistory.map(item => {
                return `## ${item.type.toUpperCase()} - ${item.timestamp}\n\n${JSON.stringify(item.data, null, 2)}\n\n---\n\n`;
            }).join('');
            
            await noteSaver.saveToFile(allNotes, 'all-notes-export.md');
        }
        
        // 更新状态显示
        function updateStatus(elementId, status) {
            document.getElementById(elementId).textContent = status;
        }
        
        // 更新保存历史
        function updateSaveHistory() {
            const historyDiv = document.getElementById('save-history');
            historyDiv.innerHTML = `
                <h4>保存历史 (${noteHistory.length} 条记录)</h4>
                <div class="history-list">
                    ${noteHistory.slice(-5).map(item => `
                        <div class="history-item">
                            <strong>${item.type}</strong> - ${new Date(item.timestamp).toLocaleString()}
                        </div>
                    `).join('')}
                </div>
            `;
        }
        
        // 页面加载完成后初始化
        document.addEventListener('DOMContentLoaded', () => {
            initializeAllTools();
            switchTool('qa'); // 默认显示QA工具
        });
    </script>
</body>
</html>
```

## 🔧 框架集成指南

### React集成
```jsx
// hooks/usePublicTools.js
import { useState, useEffect } from 'react';
import QANoteToolkit from '../public-tools/ai-tools/qa-note-toolkit/src/qa-note-toolkit.js';
import LocalNoteSaver from '../public-tools/storage-tools/local-note-saver-toolkit/local-note-saver.js';

export const usePublicTools = (config = {}) => {
    const [qaToolkit, setQaToolkit] = useState(null);
    const [noteSaver, setNoteSaver] = useState(null);
    const [isInitialized, setIsInitialized] = useState(false);
    
    useEffect(() => {
        const initTools = async () => {
            try {
                const qa = new QANoteToolkit(config.qa || {});
                const saver = new LocalNoteSaver(config.storage || {});
                
                await qa.init();
                
                setQaToolkit(qa);
                setNoteSaver(saver);
                setIsInitialized(true);
            } catch (error) {
                console.error('工具包初始化失败:', error);
            }
        };
        
        initTools();
    }, []);
    
    return {
        qaToolkit,
        noteSaver,
        isInitialized
    };
};

// components/NoteApp.jsx
import React from 'react';
import { usePublicTools } from '../hooks/usePublicTools';

const NoteApp = () => {
    const { qaToolkit, noteSaver, isInitialized } = usePublicTools({
        qa: {
            container: '#qa-container',
            agents: { default: 'general' }
        }
    });
    
    const handleSaveNote = async (noteData) => {
        if (noteSaver) {
            await noteSaver.saveNote(noteData);
        }
    };
    
    if (!isInitialized) {
        return <div>初始化工具包中...</div>;
    }
    
    return (
        <div className="note-app">
            <div id="qa-container"></div>
            <button onClick={() => handleSaveNote({
                title: '测试笔记',
                content: '这是一个测试笔记'
            })}>
                保存测试笔记
            </button>
        </div>
    );
};

export default NoteApp;
```

### Vue集成
```vue
<!-- components/ToolkitProvider.vue -->
<template>
    <div class="toolkit-provider">
        <slot v-if="isReady" :tools="tools" />
        <div v-else class="loading">
            初始化工具包中...
        </div>
    </div>
</template>

<script>
import QANoteToolkit from '../public-tools/ai-tools/qa-note-toolkit/src/qa-note-toolkit.js';
import LocalNoteSaver from '../public-tools/storage-tools/local-note-saver-toolkit/local-note-saver.js';

export default {
    name: 'ToolkitProvider',
    props: {
        config: {
            type: Object,
            default: () => ({})
        }
    },
    data() {
        return {
            tools: {
                qa: null,
                saver: null
            },
            isReady: false
        };
    },
    async mounted() {
        await this.initializeTools();
    },
    methods: {
        async initializeTools() {
            try {
                this.tools.qa = new QANoteToolkit(this.config.qa || {});
                this.tools.saver = new LocalNoteSaver(this.config.storage || {});
                
                await this.tools.qa.init();
                
                this.isReady = true;
                this.$emit('ready', this.tools);
            } catch (error) {
                console.error('工具包初始化失败:', error);
                this.$emit('error', error);
            }
        }
    }
};
</script>

<!-- App.vue -->
<template>
    <div id="app">
        <ToolkitProvider 
            :config="toolkitConfig"
            @ready="onToolsReady"
            @error="onToolsError"
        >
            <template #default="{ tools }">
                <div id="qa-container"></div>
                <button @click="saveTestNote(tools.saver)">
                    保存测试笔记
                </button>
            </template>
        </ToolkitProvider>
    </div>
</template>

<script>
import ToolkitProvider from './components/ToolkitProvider.vue';

export default {
    name: 'App',
    components: {
        ToolkitProvider
    },
    data() {
        return {
            toolkitConfig: {
                qa: {
                    container: '#qa-container',
                    agents: { default: 'general' }
                },
                storage: {
                    mode: 'auto'
                }
            }
        };
    },
    methods: {
        onToolsReady(tools) {
            console.log('工具包就绪:', tools);
        },
        onToolsError(error) {
            console.error('工具包错误:', error);
        },
        async saveTestNote(saver) {
            await saver.saveNote({
                title: '测试笔记',
                content: '这是Vue集成的测试笔记'
            });
        }
    }
};
</script>
```

## 📋 最佳实践

### 1. 性能优化
```javascript
// 延迟加载工具包
const loadToolkitLazy = async (toolkitName) => {
    switch (toolkitName) {
        case 'qa':
            const { default: QANoteToolkit } = await import('./public-tools/ai-tools/qa-note-toolkit/src/qa-note-toolkit.js');
            return QANoteToolkit;
        case 'note':
            const { default: NoteToolkit } = await import('./public-tools/note-tools/note-block-toolkit/tools/note-toolkit.js');
            return NoteToolkit;
        case 'saver':
            const { default: LocalNoteSaver } = await import('./public-tools/storage-tools/local-note-saver-toolkit/local-note-saver.js');
            return LocalNoteSaver;
    }
};

// 使用示例
const qaToolkitClass = await loadToolkitLazy('qa');
const qaToolkit = new qaToolkitClass(config);
```

### 2. 错误处理
```javascript
// 统一错误处理
class ToolkitManager {
    constructor() {
        this.tools = new Map();
        this.errorHandlers = new Map();
    }
    
    async initTool(name, ToolkitClass, config) {
        try {
            const tool = new ToolkitClass(config);
            if (tool.init) {
                await tool.init();
            }
            this.tools.set(name, tool);
            return tool;
        } catch (error) {
            console.error(`${name} 初始化失败:`, error);
            const handler = this.errorHandlers.get(name);
            if (handler) {
                handler(error);
            }
            throw error;
        }
    }
    
    onError(toolName, handler) {
        this.errorHandlers.set(toolName, handler);
    }
    
    getTool(name) {
        return this.tools.get(name);
    }
}

// 使用示例
const manager = new ToolkitManager();

manager.onError('qa', (error) => {
    console.log('QA工具包降级处理');
    // 实现降级逻辑
});

await manager.initTool('qa', QANoteToolkit, qaConfig);
```

### 3. 配置管理
```javascript
// 配置管理器
class ConfigManager {
    constructor() {
        this.configs = new Map();
        this.loadConfigFromStorage();
    }
    
    setConfig(toolName, config) {
        this.configs.set(toolName, config);
        this.saveConfigToStorage();
    }
    
    getConfig(toolName, defaultConfig = {}) {
        return this.configs.get(toolName) || defaultConfig;
    }
    
    loadConfigFromStorage() {
        try {
            const stored = localStorage.getItem('public-tools-config');
            if (stored) {
                const configs = JSON.parse(stored);
                Object.entries(configs).forEach(([key, value]) => {
                    this.configs.set(key, value);
                });
            }
        } catch (error) {
            console.warn('配置加载失败:', error);
        }
    }
    
    saveConfigToStorage() {
        try {
            const configs = Object.fromEntries(this.configs);
            localStorage.setItem('public-tools-config', JSON.stringify(configs));
        } catch (error) {
            console.warn('配置保存失败:', error);
        }
    }
}

// 使用示例
const configManager = new ConfigManager();

// 设置工具包配置
configManager.setConfig('qa', {
    agents: { default: 'general' },
    ui: { theme: 'dark' }
});

// 获取配置并初始化
const qaConfig = configManager.getConfig('qa');
const qaToolkit = new QANoteToolkit(qaConfig);
```

## 🔍 故障排除

### 常见问题和解决方案

#### 1. 工具包加载失败
```javascript
// 问题：模块加载路径错误
// 解决方案：使用绝对路径或配置基础路径
const BASE_PATH = '/public-tools';

const loadToolkit = async (category, name, file) => {
    try {
        const path = `${BASE_PATH}/${category}/${name}/${file}`;
        const module = await import(path);
        return module.default || module;
    } catch (error) {
        console.error(`加载工具包失败: ${path}`, error);
        throw error;
    }
};
```

#### 2. 工具包冲突
```javascript
// 问题：多个工具包使用相同的全局变量
// 解决方案：使用命名空间
window.PublicTools = {
    qa: null,
    note: null,
    saver: null
};

// 或使用模块模式
const ToolkitNamespace = (() => {
    let tools = {};
    
    return {
        register: (name, toolkit) => {
            tools[name] = toolkit;
        },
        get: (name) => tools[name],
        list: () => Object.keys(tools)
    };
})();
```

#### 3. 版本兼容性问题
```javascript
// 检查工具包版本兼容性
const checkCompatibility = (toolkit) => {
    const version = toolkit.version || '1.0.0';
    const [major, minor, patch] = version.split('.').map(Number);
    
    // 检查最低版本要求
    if (major < 3) {
        console.warn(`工具包版本过低: ${version}，建议升级到3.0+`);
        return false;
    }
    
    return true;
};

// 使用示例
const qaToolkit = new QANoteToolkit();
if (checkCompatibility(qaToolkit)) {
    await qaToolkit.init();
} else {
    // 降级处理或提示用户升级
}
```

## 📊 监控和分析

### 使用统计
```javascript
// 工具包使用统计
class ToolkitAnalytics {
    constructor() {
        this.stats = {
            qa: { usage: 0, errors: 0 },
            note: { usage: 0, errors: 0 },
            saver: { usage: 0, errors: 0 }
        };
    }
    
    trackUsage(toolName, action) {
        if (this.stats[toolName]) {
            this.stats[toolName].usage++;
            console.log(`${toolName} 使用统计:`, this.stats[toolName]);
        }
    }
    
    trackError(toolName, error) {
        if (this.stats[toolName]) {
            this.stats[toolName].errors++;
            console.error(`${toolName} 错误统计:`, error);
        }
    }
    
    getReport() {
        return this.stats;
    }
}

// 使用示例
const analytics = new ToolkitAnalytics();

qaToolkit.on('questionAnswered', () => {
    analytics.trackUsage('qa', 'questionAnswered');
});

qaToolkit.on('error', (error) => {
    analytics.trackError('qa', error);
});
```

---

**🎯 集成目标**: 通过标准化的集成方式，让工具包在任何项目中都能快速、稳定地工作！ 