让我先确认一下您提到的项目内容，然后为您提供详细的解耦重写设计文档。
Search files...
Ran tool
Ran tool
现在我明白了！您指的是`d:\AI-Projects\nodemind`项目。看起来您已经有一个独立的NodeMind项目。让我先检查一下这个项目的结构和内容。
Ran tool
让我检查一下项目结构，看看是否需要从injection项目角度来理解：
Read file: NodeMind使用指南.md
现在我理解了！您提到的NodeMind项目是基于jsMind的思维导图系统。让我为NodeMind项目的解耦重写设计文档。
Search files...
基于对NodeMind项目的分析，我为您提供完整的解耦重写设计文档：

# NodeMind 项目解耦重写设计文档

## 📋 项目背景分析

### 当前架构问题
通过代码分析，发现NodeMind项目存在以下架构问题：
1. **单一文件过大**：`jsmind-local.html` 超过4500行，包含所有逻辑
2. **职责混乱**：数据处理、UI控制、业务逻辑、存储管理混在一起
3. **全局变量泛滥**：`nodeDatabase`、`mindmaps`、`tagDatabase`等全局变量
4. **函数耦合严重**：函数间直接调用，难以独立测试
5. **数据结构不统一**：存在`nodeDatabase`和`node.data`两套数据结构

### 核心功能识别
```javascript
// 当前混合架构示例
function processMindmapData(fileData, fileName, originalFileName) {
    // 文件处理 + 数据验证 + 业务逻辑 + UI更新 混在一起
    var mind = null;
    // ... 200行混合逻辑
}

function initNodeDatabase() {
    // 数据初始化 + 遍历逻辑 + 存储操作 混在一起
    Object.keys(mindmaps).forEach(function(tabName) {
        // ... 50行混合逻辑
    });
}
```

## 🎯 解耦重写架构设计

### 1. 分层架构设计

```
┌─────────────────────────────────────┐
│           UI Layer (表现层)           │
├─────────────────────────────────────┤
│        Service Layer (服务层)        │
├─────────────────────────────────────┤
│       Domain Layer (领域层)          │
├─────────────────────────────────────┤
│    Infrastructure Layer (基础设施层)  │
└─────────────────────────────────────┘
```

### 2. 核心模块设计

#### 2.1 数据模型层 (Domain Models)
```javascript
// models/Node.js
class Node {
    constructor(id, topic, parentId = null) {
        this.id = id;
        this.topic = topic;
        this.parentId = parentId;
        this.children = [];
        this.metadata = new NodeMetadata();
        this.visualization = new NodeVisualization();
    }
    
    // 纯粹的业务逻辑方法
    addChild(node) { /* 纯逻辑 */ }
    removeChild(nodeId) { /* 纯逻辑 */ }
    updateTopic(newTopic) { /* 纯逻辑 */ }
    getPath() { /* 纯逻辑 */ }
}

// models/NodeMetadata.js
class NodeMetadata {
    constructor() {
        this.content = '';
        this.author = '';
        this.tags = new TagCollection();
        this.timestamps = new Timestamps();
        this.flags = new NodeFlags();
    }
}

// models/TagCollection.js
class TagCollection {
    constructor() {
        this.categories = [];
        this.technical = [];
        this.status = [];
        this.custom = [];
    }
    
    addTag(type, tag) { /* 纯逻辑 */ }
    removeTag(type, tag) { /* 纯逻辑 */ }
    getTagsByType(type) { /* 纯逻辑 */ }
}

// models/Mindmap.js
class Mindmap {
    constructor(meta) {
        this.meta = meta;
        this.rootNode = null;
        this.nodeIndex = new Map(); // 节点索引
    }
    
    addNode(parentId, nodeData) { /* 纯逻辑 */ }
    removeNode(nodeId) { /* 纯逻辑 */ }
    findNode(nodeId) { /* 纯逻辑 */ }
    traverseNodes(callback) { /* 纯逻辑 */ }
}
```

#### 2.2 数据访问层 (Data Access)
```javascript
// repositories/NodeRepository.js
class NodeRepository {
    constructor(storage) {
        this.storage = storage;
    }
    
    async save(node) {
        return await this.storage.save('nodes', node.id, node.toJSON());
    }
    
    async findById(nodeId) {
        const data = await this.storage.get('nodes', nodeId);
        return data ? Node.fromJSON(data) : null;
    }
    
    async findByParentId(parentId) {
        return await this.storage.query('nodes', { parentId });
    }
}

// repositories/MindmapRepository.js
class MindmapRepository {
    constructor(storage) {
        this.storage = storage;
    }
    
    async save(mindmap) {
        return await this.storage.save('mindmaps', mindmap.id, mindmap.toJSON());
    }
    
    async loadFromFile(file) {
        const parser = FileParserFactory.create(file.extension);
        return parser.parse(file.content);
    }
}

// infrastructure/Storage.js
class LocalStorage {
    async save(collection, id, data) {
        localStorage.setItem(`${collection}_${id}`, JSON.stringify(data));
    }
    
    async get(collection, id) {
        const data = localStorage.getItem(`${collection}_${id}`);
        return data ? JSON.parse(data) : null;
    }
    
    async query(collection, criteria) {
        // 实现查询逻辑
    }
}
```

#### 2.3 业务服务层 (Business Services)
```javascript
// services/MindmapService.js
class MindmapService {
    constructor(mindmapRepo, nodeRepo, eventBus) {
        this.mindmapRepo = mindmapRepo;
        this.nodeRepo = nodeRepo;
        this.eventBus = eventBus;
    }
    
    async createMindmap(meta) {
        const mindmap = new Mindmap(meta);
        await this.mindmapRepo.save(mindmap);
        this.eventBus.emit('mindmap.created', mindmap);
        return mindmap;
    }
    
    async addNode(mindmapId, parentId, nodeData) {
        const mindmap = await this.mindmapRepo.findById(mindmapId);
        const node = mindmap.addNode(parentId, nodeData);
        
        await this.nodeRepo.save(node);
        await this.mindmapRepo.save(mindmap);
        
        this.eventBus.emit('node.added', { mindmapId, node });
        return node;
    }
    
    async moveNode(nodeId, newParentId) {
        // 原子性操作：移动节点
        const node = await this.nodeRepo.findById(nodeId);
        const oldParent = await this.nodeRepo.findById(node.parentId);
        const newParent = await this.nodeRepo.findById(newParentId);
        
        // 业务规则验证
        if (this.wouldCreateCycle(node, newParent)) {
            throw new Error('不能创建循环引用');
        }
        
        // 执行移动
        oldParent.removeChild(nodeId);
        newParent.addChild(node);
        node.parentId = newParentId;
        
        // 保存变更
        await Promise.all([
            this.nodeRepo.save(node),
            this.nodeRepo.save(oldParent),
            this.nodeRepo.save(newParent)
        ]);
        
        this.eventBus.emit('node.moved', { nodeId, oldParentId: oldParent.id, newParentId });
    }
}

// services/TagService.js
class TagService {
    constructor(nodeRepo, tagRepo) {
        this.nodeRepo = nodeRepo;
        this.tagRepo = tagRepo;
    }
    
    async addTagToNode(nodeId, tagType, tagValue) {
        const node = await this.nodeRepo.findById(nodeId);
        node.metadata.tags.addTag(tagType, tagValue);
        await this.nodeRepo.save(node);
        
        // 更新标签统计
        await this.tagRepo.incrementTagUsage(tagType, tagValue);
    }
    
    async getTagSuggestions(tagType, prefix) {
        return await this.tagRepo.searchTags(tagType, prefix);
    }
}

// services/FileService.js
class FileService {
    constructor(mindmapRepo) {
        this.mindmapRepo = mindmapRepo;
    }
    
    async importFile(file) {
        const parser = FileParserFactory.create(file.type);
        const mindmapData = await parser.parse(file.content);
        
        // 数据验证
        const validator = new MindmapValidator();
        const validationResult = validator.validate(mindmapData);
        
        if (!validationResult.isValid) {
            throw new ValidationError(validationResult.errors);
        }
        
        // 创建思维导图
        const mindmap = Mindmap.fromImportData(mindmapData);
        await this.mindmapRepo.save(mindmap);
        
        return mindmap;
    }
}
```

#### 2.4 视图控制层 (View Controllers)
```javascript
// controllers/MindmapController.js
class MindmapController {
    constructor(mindmapService, viewRenderer) {
        this.mindmapService = mindmapService;
        this.viewRenderer = viewRenderer;
        this.bindEvents();
    }
    
    bindEvents() {
        // 绑定UI事件到业务逻辑
        this.viewRenderer.on('node.select', (nodeId) => {
            this.handleNodeSelect(nodeId);
        });
        
        this.viewRenderer.on('node.edit', (nodeId, newTopic) => {
            this.handleNodeEdit(nodeId, newTopic);
        });
        
        this.viewRenderer.on('node.drag', (nodeId, targetId) => {
            this.handleNodeMove(nodeId, targetId);
        });
    }
    
    async handleNodeSelect(nodeId) {
        try {
            const node = await this.mindmapService.getNodeDetails(nodeId);
            this.viewRenderer.showNodeDetails(node);
        } catch (error) {
            this.viewRenderer.showError(error.message);
        }
    }
    
    async handleNodeMove(nodeId, targetId) {
        try {
            await this.mindmapService.moveNode(nodeId, targetId);
            this.viewRenderer.refreshLayout();
            this.viewRenderer.showSuccess('节点移动成功');
        } catch (error) {
            this.viewRenderer.showError(error.message);
        }
    }
}

// views/MindmapRenderer.js
class MindmapRenderer extends EventEmitter {
    constructor(jsMindInstance) {
        super();
        this.jsMind = jsMindInstance;
        this.selectedNodeId = null;
    }
    
    render(mindmapData) {
        // 纯粹的渲染逻辑
        this.jsMind.show(mindmapData);
        this.bindJsMindEvents();
    }
    
    bindJsMindEvents() {
        this.jsMind.add_event_listener((type, data) => {
            switch (type) {
                case 'select_node':
                    this.emit('node.select', data.node.id);
                    break;
                case 'edit_node':
                    this.emit('node.edit', data.node.id, data.node.topic);
                    break;
            }
        });
    }
    
    showNodeDetails(node) {
        // 更新详情面板
        const detailsPanel = document.getElementById('node-details');
        detailsPanel.innerHTML = this.renderNodeDetails(node);
    }
    
    showError(message) {
        // 显示错误消息
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);
        
        setTimeout(() => errorDiv.remove(), 3000);
    }
}
```

#### 2.5 工具类和辅助模块
```javascript
// utils/FileParserFactory.js
class FileParserFactory {
    static create(fileType) {
        switch (fileType) {
            case 'json':
                return new JsonParser();
            case 'mm':
                return new FreeMindParser();
            case 'xmind':
                return new XMindParser();
            default:
                throw new Error(`不支持的文件类型: ${fileType}`);
        }
    }
}

// utils/parsers/JsonParser.js
class JsonParser {
    async parse(content) {
        try {
            const data = JSON.parse(content);
            return this.normalizeData(data);
        } catch (error) {
            throw new ParseError(`JSON解析失败: ${error.message}`);
        }
    }
    
    normalizeData(data) {
        // 标准化数据格式
        return {
            meta: data.meta || { name: '未命名', version: '1.0' },
            nodes: this.flattenNodes(data.data)
        };
    }
}

// utils/validators/MindmapValidator.js
class MindmapValidator {
    validate(mindmapData) {
        const errors = [];
        
        if (!mindmapData.meta) {
            errors.push('缺少meta信息');
        }
        
        if (!mindmapData.nodes || !Array.isArray(mindmapData.nodes)) {
            errors.push('缺少或无效的节点数据');
        }
        
        // 验证节点结构
        mindmapData.nodes?.forEach((node, index) => {
            if (!node.id) {
                errors.push(`节点${index}缺少ID`);
            }
            if (!node.topic) {
                errors.push(`节点${index}缺少主题`);
            }
        });
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

// utils/EventBus.js
class EventBus {
    constructor() {
        this.listeners = new Map();
    }
    
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }
    
    emit(event, data) {
        const callbacks = this.listeners.get(event) || [];
        callbacks.forEach(callback => callback(data));
    }
    
    off(event, callback) {
        const callbacks = this.listeners.get(event) || [];
        const index = callbacks.indexOf(callback);
        if (index > -1) {
            callbacks.splice(index, 1);
        }
    }
}
```

### 3. 应用入口和依赖注入

```javascript
// main.js - 应用启动入口
class NodeMindApplication {
    constructor() {
        this.container = new DIContainer();
        this.setupDependencies();
    }
    
    setupDependencies() {
        // 基础设施层
        this.container.register('storage', () => new LocalStorage());
        this.container.register('eventBus', () => new EventBus());
        
        // 数据访问层
        this.container.register('nodeRepository', (c) => 
            new NodeRepository(c.get('storage')));
        this.container.register('mindmapRepository', (c) => 
            new MindmapRepository(c.get('storage')));
        this.container.register('tagRepository', (c) => 
            new TagRepository(c.get('storage')));
        
        // 业务服务层
        this.container.register('mindmapService', (c) => 
            new MindmapService(
                c.get('mindmapRepository'),
                c.get('nodeRepository'),
                c.get('eventBus')
            ));
        this.container.register('tagService', (c) => 
            new TagService(
                c.get('nodeRepository'),
                c.get('tagRepository')
            ));
        this.container.register('fileService', (c) => 
            new FileService(c.get('mindmapRepository')));
        
        // 视图层
        this.container.register('mindmapRenderer', () => 
            new MindmapRenderer(jsMind));
        this.container.register('mindmapController', (c) => 
            new MindmapController(
                c.get('mindmapService'),
                c.get('mindmapRenderer')
            ));
    }
    
    async initialize() {
        // 初始化应用
        const controller = this.container.get('mindmapController');
        const mindmapService = this.container.get('mindmapService');
        
        // 加载默认思维导图或恢复保存的数据
        try {
            const savedData = await mindmapService.loadSavedData();
            if (savedData) {
                controller.loadMindmap(savedData);
            } else {
                controller.createDefaultMindmap();
            }
        } catch (error) {
            console.error('应用初始化失败:', error);
            controller.createDefaultMindmap();
        }
    }
}

// 依赖注入容器
class DIContainer {
    constructor() {
        this.dependencies = new Map();
        this.instances = new Map();
    }
    
    register(name, factory) {
        this.dependencies.set(name, factory);
    }
    
    get(name) {
        if (this.instances.has(name)) {
            return this.instances.get(name);
        }
        
        const factory = this.dependencies.get(name);
        if (!factory) {
            throw new Error(`未注册的依赖: ${name}`);
        }
        
        const instance = factory(this);
        this.instances.set(name, instance);
        return instance;
    }
}

// 启动应用
document.addEventListener('DOMContentLoaded', async () => {
    const app = new NodeMindApplication();
    await app.initialize();
});
```

## 🔄 迁移策略

### 阶段1: 数据模型提取 (1-2周)
1. 提取`Node`、`Mindmap`等核心模型
2. 统一数据结构，废弃`nodeDatabase`全局变量
3. 创建基础的Repository层

### 阶段2: 服务层重构 (2-3周)
1. 提取业务逻辑到Service层
2. 实现事件驱动架构
3. 添加数据验证和错误处理

### 阶段3: 视图层解耦 (2-3周)
1. 分离UI控制逻辑
2. 实现MVC模式
3. 优化渲染性能

### 阶段4: 工具类和优化 (1-2周)
1. 完善工具类和辅助函数
2. 性能优化和内存管理
3. 全面测试和文档

## 🎯 重写的优势

### 1. 可维护性提升
- **单一职责**：每个类只负责一个功能
- **依赖注入**：便于测试和替换实现
- **清晰边界**：模块间接口明确

### 2. 可扩展性提升
- **插件化架构**：可以轻松添加新的文件解析器
- **事件驱动**：便于添加新功能而不影响现有代码
- **模块化设计**：可以独立升级各个模块

### 3. 质量保证
- **类型安全**：使用现代JS特性和类型检查
- **单元测试**：每个模块都可以独立测试
- **错误处理**：统一的错误处理机制

### 4. 开发效率
- **代码复用**：通用逻辑可以在多处使用
- **团队协作**：清晰的模块划分便于多人开发
- **调试便利**：问题定位更加精确

这种解耦重写方案将把现有的4500行混乱代码重新组织成结构清晰、职责明确的模块化架构，大大提升代码质量和可维护性。