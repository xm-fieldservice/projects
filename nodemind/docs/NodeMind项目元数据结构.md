让我仔细分析NodeMind项目的index.html，提取完整的脑图和元数据结构：
Read file: index.html
Ran tool
Read file: index.html
Read file: index.html
现在让我查找核心数据结构的定义：
Ran tool
Read file: index.html
Read file: index.html
Ran tool
现在让我查看会话数据库的详细结构：
Ran tool
Read file: index.html
让我继续查看四组件数据结构：
Ran tool
Read file: index.html
现在让我查看四组件数据结构的具体定义：
Read file: index.html
现在让我查看四组件状态管理器的定义：
Ran tool
Read file: index.html
现在我已经对NodeMind的脑图和元数据结构有了全面的了解。让我为你提供一个非常详细的结构分析：

# 📊 NodeMind 脑图和元数据结构详细分析

## 🎯 **核心数据架构**

NodeMind采用**多层数据架构**，包含以下主要数据结构：

### 1. **mindmapData** - 脑图基础数据
```javascript
var mindmapData = {
    // 标签管理脑图
    workspace: {
        meta: { name: "标签管理", author: "NodeMind", version: "1.0.0" },
        format: "node_tree",
        data: {
            id: "workspace_root",
            topic: "🏷️ 标签管理",
            children: [
                {
                    id: "tag_group_normal", 
                    topic: "常规组", 
                    direction: "right",
                    children: [
                        { id: "tag_project", topic: "项目", isTag: true, tagGroup: "常规" },
                        { id: "tag_milestone", topic: "里程碑", isTag: true, tagGroup: "常规" },
                        // ... 更多标签节点
                    ]
                },
                // ... 更多标签组
            ]
        }
    },
    
    // 临时工作区脑图
    knowledge: {
        meta: { name: "临时工作区B", author: "NodeMind", version: "1.0.0" },
        format: "node_tree",
        data: {
            id: "knowledge_root",
            topic: "📋 临时工作区B",
            children: []
        }
    },
    
    // 项目管理脑图
    project: {
        meta: { name: "项目管理", author: "NodeMind", version: "1.0.0" },
        format: "node_tree",
        data: {
            id: "project_root",
            topic: "🚀 项目管理",
            children: [
                { id: "pj_1", topic: "需求分析", direction: "right" },
                { id: "pj_2", topic: "设计阶段", direction: "right" },
                { id: "pj_3", topic: "开发实施", direction: "left" },
                { id: "pj_4", topic: "测试部署", direction: "left" }
            ]
        }
    }
};
```

### 2. **nodeDatabase** - 节点详细信息数据库
```javascript
var nodeDatabase = {
    "nodeId": {
        // 基础标识
        id: "nodeId",
        title: "节点标题",        // 主显示字段
        topic: "节点标题",       // jsMind兼容字段
        
        // 内容数据
        content: "节点详细内容",
        
        // 会话数据（新增）
        sessions: [],           // 节点的会话列表
        
        // 作者和时间信息
        author: "NodeMind",
        created: "2024-01-01T10:00:00.000Z",
        modified: "2024-01-01T10:00:00.000Z",
        
        // 标签系统
        tags: {
            categories: [],      // 分类标签
            technical: [],       // 技术标签
            status: []          // 状态标签
        }
    }
};
```

### 3. **sessionDatabase** - 会话管理数据库
```javascript
let sessionDatabase = {
    "nodeId": {
        nodeId: "nodeId",
        sessions: [
            {
                id: "session_timestamp_randomId",
                type: "note",                    // 'note' | 'interaction'
                title: "会话标题",
                content: "会话具体内容",
                timestamp: "2024-01-01T10:00:00.000Z",
                modified: "2024-01-01T10:00:00.000Z",
                tags: ["标签1", "标签2"],
                isFavorited: false,
                nodeId: "nodeId",
                metadata: {
                    author: "NodeMind",
                    wordCount: 150,
                    version: "1.0.0"
                }
            }
        ],
        activeSessionId: "session_timestamp_randomId",
        lastModified: "2024-01-01T10:00:00.000Z"
    }
};
```

### 4. **fourComponentNodeState** - 四组件状态管理
```javascript
class NodeStateManager {
    constructor() {
        this.currentNode = null;        // 当前选中的节点ID
        this.nodeData = {               // 四组件专用节点数据
            "nodeId": {
                id: "nodeId",
                title: "节点标题",
                content: "节点内容",
                createTime: "2024-01-01 10:00:00",
                updateTime: "2024-01-01 15:30:00"
            }
        };
        this.sessionData = {            // 四组件专用会话数据
            "nodeId": [
                {
                    id: "sessionId",
                    title: "会话标题",
                    content: "会话内容",
                    timestamp: "2024-01-01T10:00:00.000Z"
                }
            ]
        };
    }
}

const fourComponentNodeState = new NodeStateManager();
```

## 🔗 **数据关系映射**

### 节点层次关系
```javascript
// jsMind格式的层次关系
{
    id: "parent_id",
    topic: "父节点",
    children: [
        {
            id: "child_id_1",
            topic: "子节点1",
            direction: "right",
            children: []
        },
        {
            id: "child_id_2", 
            topic: "子节点2",
            direction: "left",
            children: []
        }
    ]
}

// nodeDatabase中的关系信息（通过数据融合维护）
nodeDatabase["parent_id"] = {
    // ... 其他字段
    relations: {
        parent: null,
        children: ["child_id_1", "child_id_2"]
    }
};
nodeDatabase["child_id_1"] = {
    // ... 其他字段
    relations: {
        parent: "parent_id",
        children: []
    }
};
```

### 会话关联关系
```javascript
// 节点与会话的关联
sessionDatabase["nodeId"].sessions.forEach(session => {
    // session.nodeId 指向所属节点
    // nodeDatabase[nodeId].sessions 包含会话ID列表（可选）
});
```

## 💾 **数据持久化结构**

### localStorage存储键
```javascript
var STORAGE_KEYS = {
    MINDMAP_DATA: 'nodemind_mindmap_data',                    // 脑图数据
    NODE_DATABASE: 'nodemind_node_database',                  // 节点数据库
    SESSION_DATABASE: 'nodemind_session_database',            // 会话数据库
    FOUR_COMPONENT_DATA: 'nodemind_four_component_data',      // 四组件数据
    FOUR_COMPONENT_GLOBAL_STATE: 'nodemind_four_component_global_state',
    PROJECT_INFO: 'nodemind_project_info',                    // 项目信息
    CURRENT_THEME: 'nodemind_current_theme',                  // 主题设置
    SELECTED_NODE: 'nodemind_selected_node',                  // 选中节点
    VIEW_DATA: 'nodemind_view_data'                          // 视图数据
};
```

### 数据同步机制
```javascript
// 数据融合函数：确保jsMind与nodeDatabase同步
function syncMindmapDataWithNodeDatabase() {
    // 遍历所有思维导图中的节点
    Object.keys(mindmaps).forEach(mapId => {
        const mapData = mindmaps[mapId].get_data();
        traverseAndSyncNode(mapData.data);
    });
    
    function traverseAndSyncNode(nodeData) {
        const nodeId = nodeData.id;
        
        // 确保nodeDatabase中存在对应记录
        if (!nodeDatabase[nodeId]) {
            nodeDatabase[nodeId] = {
                id: nodeId,
                title: nodeData.topic,
                content: '',
                sessions: [],
                author: 'NodeMind',
                created: new Date().toISOString(),
                modified: new Date().toISOString(),
                tags: { categories: [], technical: [], status: [] }
            };
        }
        
        // 递归处理子节点
        if (nodeData.children) {
            nodeData.children.forEach(traverseAndSyncNode);
        }
    }
}
```

## 🎨 **UI组件数据绑定**

### 四组件布局结构
```javascript
// 组件A: 内容编辑器
<textarea id="content-editor" class="content-editor">
// 绑定到: fourComponentNodeState.nodeData[currentNode].content

// 组件B: 三标签页组件
<div class="inner-tab-content-container">
    // 标签组件页面 - 绑定到标签管理脑图
    <div id="inner-tab-tags">
    
    // 会话列表页面 - 绑定到sessionDatabase
    <div id="inner-tab-sessions">
    
    // 模板列表页面 - 绑定到templateData
    <div id="inner-tab-templates">
</div>

// 组件C: 项目信息面板
<div id="project-info-content">
// 绑定到: projectInfo全局变量

// 组件D: 节点详情面板  
<div id="node-details">
// 绑定到: nodeDatabase[selectedNodeId]
```

## 📋 **总结：我的解析器需要处理的结构**

基于以上分析，我的解析器需要完整支持以下数据结构：

### ✅ **已支持的结构**
1. **mindmapData** - jsMind脑图层次结构
2. **nodeDatabase** - 节点详细信息和元数据
3. **节点关系** - 父子关系和路径信息

### ❌ **缺失的结构（需要补充）**
1. **sessionDatabase** - 会话管理数据
2. **fourComponentNodeState** - 四组件状态数据  
3. **会话与节点的关联关系**
4. **活动会话状态管理**

### 🔧 **解析器需要增强的功能**
1. **会话数据保存** - 每个节点的会话列表和活动会话
2. **四组件数据保存** - UI组件的状态和数据
3. **会话关系复原** - 解析时重建节点-会话关联
4. **完整状态恢复** - 包括UI状态和用户操作状态

这就是NodeMind的完整数据架构分析。