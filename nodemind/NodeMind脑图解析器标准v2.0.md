# NodeMind脑图解析器标准 v2.0

## 🎯 设计目标

基于NodeMind实际数据结构分析，制定一个能够**完美复现脑图**的解析器标准。

### 核心要求
1. **完整保持父子关系** - 确保脑图层次结构100%复原
2. **双数据源融合** - 同时支持jsMind格式和nodeDatabase格式
3. **向下兼容** - 兼容现有的多种数据结构
4. **元数据完整** - 保持所有标签、时间、作者等信息

## 📊 当前数据结构分析

### 1. jsMind标准格式（node_tree）
```javascript
{
    "meta": {
        "name": "项目名称",
        "author": "NodeMind",
        "version": "1.0.0"
    },
    "format": "node_tree",
    "data": {
        "id": "root_id",
        "topic": "中心节点",
        "expanded": true,
        "direction": "right",
        "customData": {
            "content": "节点内容",
            "tags": { /* 标签结构 */ },
            "metadata": {},
            "author": "用户"
        },
        "children": [
            {
                "id": "child_id",
                "topic": "子节点",
                "expanded": true,
                "direction": "right",
                "customData": { /* 同上 */ },
                "children": [ /* 递归结构 */ ]
            }
        ]
    }
}
```

### 2. NodeDatabase增强格式
```javascript
{
    "nodeId": {
        // 基础标识
        "id": "nodeId",
        "title": "节点标题",        // 主显示字段
        "topic": "节点标题",       // jsMind兼容字段
        
        // 内容数据
        "content": "节点详细内容",
        
        // 标签系统（统一结构）
        "tags": {
            "status": ["项目", "进行中"],      // 状态标签
            "categories": ["开发", "设计"],    // 分类标签
            "technical": ["React", "Node.js"], // 技术标签
            "custom": ["重要"],               // 自定义标签
            "future": ["规划"]               // 未来标签
        },
        
        // 时间信息（ISO格式）
        "time": {
            "created": "2024-01-01T10:00:00.000Z",
            "modified": "2024-01-02T15:30:00.000Z"
        },
        
        // 作者信息
        "author": "用户名",
        
        // 关系信息（关键：用于复原层次结构）
        "relations": {
            "parent": "parentNodeId",    // 父节点ID
            "children": ["child1", "child2"] // 子节点ID数组
        },
        
        // 会话数据
        "sessions": [],
        
        // 元数据
        "metadata": {
            "schemaVersion": "2.0",
            "source": "nodemind",
            "lastUnified": "2024-01-01T10:00:00.000Z"
        }
    }
}
```

## 🔧 新解析器标准规范

### 1. MD文档结构标准

#### 文档头部格式
```markdown
# 项目名称

> **NodeMind标准MD文档** - v2.0解析器兼容，支持完整脑图复原

## 项目元信息

- **项目名称**: 项目名称
- **项目描述**: 项目描述
- **作者**: 作者名称
- **版本**: 1.0.0
- **导出时间**: 2024-01-01 10:00:00
- **数据格式**: NodeMind双数据源融合
- **解析器版本**: v2.0
- **总节点数**: 156

---
```

#### 脑图分区格式
```markdown
## 脑图: 项目管理

> **根节点路径**: `project_root`
> **子节点数量**: 25
> **最大层级**: 4

### 🚀 项目管理 (根节点)

**节点元数据**:
- **节点ID**: `project_root`
- **节点路径**: `project_root`
- **父节点**: null
- **子节点**: [pj_1, pj_2, pj_3, pj_4]
- **层级**: 1
- **方向**: center

**扩展信息**:
- **作者**: NodeMind
- **创建时间**: 2024-01-01T10:00:00.000Z
- **修改时间**: 2024-01-02T15:30:00.000Z
- **状态标签**: #项目 #管理
- **技术标签**: #React #Node.js
- **自定义标签**: #重要

**节点内容**:
```text
这是项目管理的详细内容...
可以包含多行文本
支持各种格式
```

---

#### 需求分析 (子节点)

**节点元数据**:
- **节点ID**: `pj_1`
- **节点路径**: `project_root/pj_1`
- **父节点**: project_root
- **子节点**: []
- **层级**: 2
- **方向**: right

**扩展信息**:
- **作者**: 张三
- **创建时间**: 2024-01-01T11:00:00.000Z
- **修改时间**: 2024-01-01T11:30:00.000Z
- **状态标签**: #需求 #分析
- **分类标签**: #开发

**节点内容**:
```text
需求分析的具体内容...
```

---
```

### 2. 解析算法标准

#### 节点识别规则
```javascript
const NODE_PATTERNS = {
    // 节点标题识别
    title: /^(#{1,6})\s+(.+?)(?:\s+\((.*?)\))?$/,
    
    // 节点元数据块识别
    metadata: /\*\*节点元数据\*\*:/,
    metadataField: /^-\s+\*\*(.*?)\*\*:\s+(.+)$/,
    
    // 扩展信息块识别
    extended: /\*\*扩展信息\*\*:/,
    
    // 节点内容块识别
    content: /\*\*节点内容\*\*:/,
    contentBlock: /^```text\n([\s\S]*?)\n```$/,
    
    // 分隔符识别
    separator: /^---\s*$/
};
```

#### 父子关系重建算法
```javascript
class NodeMindParser {
    parseDocument(mdContent) {
        const sections = this.splitIntoSections(mdContent);
        const nodes = {};
        const hierarchy = {};
        
        // 第一轮：解析所有节点
        sections.forEach(section => {
            const node = this.parseNode(section);
            if (node) {
                nodes[node.id] = node;
            }
        });
        
        // 第二轮：重建层次关系
        Object.values(nodes).forEach(node => {
            this.buildHierarchy(node, nodes, hierarchy);
        });
        
        // 第三轮：生成jsMind格式
        const jsMindData = this.buildJsMindTree(hierarchy);
        
        // 第四轮：生成nodeDatabase格式
        const nodeDatabase = this.buildNodeDatabase(nodes);
        
        return {
            jsMindData,
            nodeDatabase,
            metadata: this.extractMetadata(mdContent)
        };
    }
    
    buildHierarchy(node, allNodes, hierarchy) {
        const parentPath = this.getParentPath(node.path);
        
        if (parentPath && allNodes[parentPath]) {
            // 建立父子关系
            node.parent = parentPath;
            if (!allNodes[parentPath].children) {
                allNodes[parentPath].children = [];
            }
            allNodes[parentPath].children.push(node.id);
        } else {
            // 根节点
            hierarchy.root = node.id;
        }
    }
    
    getParentPath(nodePath) {
        const parts = nodePath.split('/');
        if (parts.length <= 1) return null;
        return parts.slice(0, -1).join('/');
    }
}
```

### 3. 数据映射标准

#### jsMind ↔ NodeDatabase 映射
```javascript
const FIELD_MAPPING = {
    // 基础字段映射
    'id': 'id',                    // 双向一致
    'topic': 'title',              // jsMind.topic ↔ nodeDB.title
    'title': 'topic',              // 保持同步
    
    // 内容映射
    'customData.content': 'content',  // jsMind自定义数据 ↔ nodeDB内容
    
    // 标签映射
    'customData.tags': 'tags',     // 标签结构直接映射
    
    // 时间映射
    'customData.metadata.created': 'time.created',
    'customData.metadata.modified': 'time.modified',
    
    // 作者映射
    'customData.author': 'author',
    
    // 层次关系映射（关键）
    'parent.id': 'relations.parent',
    'children[].id': 'relations.children'
};
```

#### 标签规范化
```javascript
const TAG_NORMALIZATION = {
    // 状态标签标准化
    status: {
        patterns: [/项目/, /进行中/, /完成/, /计划/, /暂停/],
        colors: {
            '项目': '#2196F3',      // 蓝色
            '进行中': '#FF9800',    // 橙色
            '完成': '#4CAF50',      // 绿色
            '计划': '#9C27B0',      // 紫色
            '暂停': '#757575'       // 灰色
        }
    },
    
    // 分类标签
    categories: {
        patterns: [/开发/, /设计/, /测试/, /部署/, /文档/],
        prefix: '分类'
    },
    
    // 技术标签
    technical: {
        patterns: [/React/, /Vue/, /Node\.js/, /Python/, /JavaScript/],
        prefix: '技术'
    }
};
```

### 4. 复原验证标准

#### 完整性检查
```javascript
class IntegrityChecker {
    validateRestoration(original, restored) {
        const results = {
            nodeCount: this.checkNodeCount(original, restored),
            hierarchy: this.checkHierarchy(original, restored),
            content: this.checkContent(original, restored),
            metadata: this.checkMetadata(original, restored),
            relations: this.checkRelations(original, restored)
        };
        
        return {
            passed: Object.values(results).every(check => check.passed),
            details: results,
            score: this.calculateScore(results)
        };
    }
    
    checkHierarchy(original, restored) {
        // 检查父子关系完整性
        const originalPaths = this.extractAllPaths(original);
        const restoredPaths = this.extractAllPaths(restored);
        
        return {
            passed: this.arraysEqual(originalPaths, restoredPaths),
            missing: originalPaths.filter(p => !restoredPaths.includes(p)),
            extra: restoredPaths.filter(p => !originalPaths.includes(p))
        };
    }
}
```

## 🚀 实现指南

### 1. 保存标准实现
```javascript
function generateStandardMD(mindmapData, nodeDatabase) {
    const builder = new NodeMindMDBuilder();
    
    // 添加文档头部
    builder.addHeader(projectInfo);
    
    // 添加项目元信息
    builder.addProjectMetadata(projectInfo, statistics);
    
    // 遍历所有脑图
    Object.entries(mindmapData).forEach(([mapType, mapData]) => {
        builder.addMindmapSection(mapType, mapData.data, nodeDatabase);
    });
    
    // 添加复原指南
    builder.addRestorationGuide();
    
    return builder.build();
}

class NodeMindMDBuilder {
    addMindmapSection(mapType, rootNode, nodeDatabase) {
        this.addLine(`## 脑图: ${this.getMapTypeName(mapType)}`);
        this.addLine('');
        this.addRootNodeInfo(rootNode);
        this.addLine('');
        
        // 递归处理节点
        this.processNodeRecursively(rootNode, nodeDatabase, 3);
    }
    
    processNodeRecursively(node, nodeDatabase, level) {
        const nodeData = nodeDatabase[node.id] || {};
        const path = this.buildNodePath(node);
        
        // 节点标题
        this.addLine(`${'#'.repeat(level)} ${node.topic}`);
        this.addLine('');
        
        // 节点元数据
        this.addNodeMetadata(node, nodeData, path);
        
        // 扩展信息
        this.addExtendedInfo(nodeData);
        
        // 节点内容
        this.addNodeContent(nodeData);
        
        // 分隔符
        this.addLine('---');
        this.addLine('');
        
        // 递归处理子节点
        if (node.children) {
            node.children.forEach(child => {
                this.processNodeRecursively(child, nodeDatabase, level + 1);
            });
        }
    }
}
```

### 2. 解析标准实现
```javascript
function parseStandardMD(mdContent) {
    const parser = new NodeMindMDParser();
    
    // 解析文档结构
    const document = parser.parseDocument(mdContent);
    
    // 重建数据结构
    const jsMindData = parser.buildJsMindData(document);
    const nodeDatabase = parser.buildNodeDatabase(document);
    
    // 验证完整性
    const validation = parser.validateIntegrity(document);
    
    return {
        jsMindData,
        nodeDatabase,
        validation,
        metadata: document.metadata
    };
}
```

## ✅ 标准特性

### 1. 完整性保证
- ✅ **节点数量**: 100%保持原有节点数量
- ✅ **层次结构**: 完整保持父子关系和层级
- ✅ **节点内容**: 所有文本内容完整保留
- ✅ **元数据**: 标签、时间、作者信息完整
- ✅ **关系信息**: 节点路径和关系完整

### 2. 兼容性保证
- ✅ **向下兼容**: 支持现有多种数据结构
- ✅ **双格式**: 同时生成jsMind和nodeDatabase格式
- ✅ **标准遵循**: 符合Markdown标准语法
- ✅ **工具兼容**: 可被标准MD编辑器查看

### 3. 可扩展性
- ✅ **版本控制**: 支持解析器版本升级
- ✅ **自定义字段**: 支持添加新的元数据字段
- ✅ **插件机制**: 支持自定义解析扩展
- ✅ **验证机制**: 内置完整性验证和修复

## 🔧 部署要求

### 必要依赖
- NodeMind v3.0+
- 现代浏览器（支持File System Access API）
- jsMind库
- NodeDatabase架构

### 配置设置
```javascript
const PARSER_CONFIG = {
    version: '2.0',
    strict: true,              // 严格模式，确保完整性
    autoFix: true,             // 自动修复数据结构问题
    validation: true,          // 启用验证机制
    backupOnParse: true,       // 解析前自动备份
    logLevel: 'info'           // 日志级别
};
```

---

**此标准确保NodeMind脑图的完美保存与复原，支持所有现有功能并为未来扩展奠定基础。** 