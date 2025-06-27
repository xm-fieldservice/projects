# 关系知识管理系统

一个基于Neo4j图数据库的关系知识管理和项目管理系统，支持动态标签管理、文档关系图谱可视化、时间轴管理等功能。

## 🎯 核心功能

### ✅ 关系管理
- **图数据库存储**：使用Neo4j存储复杂的实体关系网络
- **动态关系建立**：支持人员、项目、任务、文档、组织等多种实体关系
- **关系可视化**：基于AntV G6的交互式图谱展示
- **关系查询**：支持复杂的图查询和路径分析

### ✅ 知识管理
- **智能文档处理**：使用spaCy进行中文NLP处理，自动提取实体和关系
- **知识图谱构建**：从文档内容自动构建知识图谱
- **知识搜索**：支持全文搜索和语义搜索
- **动态标签系统**：基于内容和行为的智能标签生成

### ✅ 时间和议题可视化分配管理
- **项目时间轴**：甘特图风格的项目和任务时间轴展示
- **任务依赖关系**：可视化任务间的依赖关系
- **进度追踪**：实时追踪项目和任务进度
- **资源分配**：人员和资源的时间分配可视化

### ✅ 项目管理
- **项目全生命周期管理**：从规划到完成的完整项目管理
- **任务分解和分配**：支持多级任务分解和人员分配
- **状态跟踪**：实时跟踪项目和任务状态
- **团队协作**：支持多人协作和权限管理

## 🛠️ 技术架构

```
前端 (HTML + JavaScript)
├── AntV G6 (图谱可视化)
├── 响应式UI设计
└── 实时数据更新

后端 (Python Flask)
├── Flask Web框架
├── spaCy NLP处理
├── Neo4j图数据库驱动
├── 定时任务调度
└── RESTful API

数据库 (Neo4j)
├── 图数据存储
├── 动态标签支持
├── 索引和约束
└── Cypher查询优化
```

## 📦 依赖组件

### 核心组件
- **Neo4j 5.15**: 图数据库，存储实体关系和动态标签
- **Python Flask**: 轻量级Web框架，提供RESTful API
- **spaCy**: 中文NLP处理，实体识别和关系抽取
- **AntV G6**: 前端图谱可视化组件

### 辅助组件
- **APScheduler**: 定时任务调度，实现动态标签更新
- **python-dotenv**: 环境变量管理
- **Flask-CORS**: 跨域请求支持

## 🚀 快速开始

### 1. 环境准备

确保您的系统已安装：
- Docker 和 Docker Compose
- Python 3.10+
- Git

### 2. 克隆项目

```bash
git clone <项目地址>
cd label-relation
```

### 3. 启动服务

#### 方式一：Docker Compose（推荐）

```bash
# 启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

#### 方式二：本地开发

```bash
# 1. 启动Neo4j数据库
docker-compose up -d neo4j

# 2. 安装Python依赖
pip install -r requirements.txt

# 3. 下载spaCy中文模型
python -m spacy download zh_core_web_sm

# 4. 初始化数据库
python init_db.py

# 5. 启动Flask应用
python app.py
```

### 4. 访问系统

- **主应用**: http://localhost:5000
- **Neo4j Browser**: http://localhost:7474 (用户名: neo4j, 密码: password)

### 5. 初始化数据

```bash
# 初始化数据库和示例数据
python init_db.py
```

## 📱 使用指南

### 关系图谱管理

1. **查看图谱**
   - 打开主页面，默认显示关系图谱
   - 使用鼠标拖拽、缩放和点击节点
   - 通过左侧面板筛选节点类型和布局

2. **创建实体**
   - 点击左侧"创建实体"按钮
   - 选择实体类型（人员、项目、文档等）
   - 填写实体属性信息

3. **建立关系**
   - 点击左侧"创建关系"按钮
   - 选择源节点和目标节点
   - 定义关系类型和属性

### 知识管理

1. **文档处理**
   - 切换到"知识管理"标签页
   - 输入文档内容和标题
   - 选择文档类型并点击"处理文档"
   - 系统自动提取实体和关系

2. **知识搜索**
   - 在搜索框中输入关键词
   - 查看搜索结果和相关文档
   - 点击结果查看详细信息

### 项目管理

1. **创建项目**
   - 切换到"项目管理"标签页
   - 填写项目基本信息
   - 设置时间范围和优先级

2. **任务管理**
   - 选择项目后创建任务
   - 分配负责人和设置进度
   - 跟踪任务状态

3. **时间轴视图**
   - 切换到"时间轴视图"标签页
   - 选择项目查看甘特图
   - 可视化项目进度和任务依赖

## 🔧 配置说明

### 环境变量配置 (config.env)

```bash
# Neo4j数据库配置
NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=password

# Flask应用配置
FLASK_ENV=development
FLASK_DEBUG=True
```

### Neo4j配置优化

在生产环境中，建议调整以下Neo4j配置：

```bash
# 内存配置
NEO4J_dbms_memory_heap_max__size=1G
NEO4J_dbms_memory_pagecache_size=512M

# 性能优化
NEO4J_dbms_query_cache_size=50
NEO4J_dbms_query_cache_keep_alive=true
```

## 📊 数据模型

### 节点类型
- **Person**: 人员实体（姓名、角色、联系方式等）
- **Project**: 项目实体（名称、描述、时间、状态等）
- **Task**: 任务实体（名称、负责人、进度、依赖等）
- **Document**: 文档实体（内容、元数据、类型等）
- **Entity**: 从文档提取的实体（名称、类型、置信度等）
- **Organization**: 组织实体（名称、类型、描述等）
- **Event**: 事件实体（名称、时间、地点、参与者等）

### 关系类型
- **HAS_MEMBER**: 组织-人员关系
- **MANAGES**: 管理关系
- **PARTICIPATES**: 参与关系
- **HAS_TASK**: 项目-任务关系
- **CONTAINS**: 包含关系
- **DEPENDS_ON**: 依赖关系
- **HAS_EVENT**: 项目-事件关系

### 动态标签示例
- **HighRisk**: 高风险标签（基于风险评分自动生成）
- **Important**: 重要标签（基于任务数量自动生成）
- **VIP**: VIP客户标签（基于业务规则生成）
- **Overdue**: 逾期标签（基于时间自动生成）

## 🧪 API接口

### 图谱相关
- `GET /api/graph/data` - 获取图谱数据
- `POST /api/entities` - 创建实体
- `POST /api/relationships` - 创建关系

### 知识管理
- `POST /api/documents` - 处理文档
- `GET /api/search?q=keyword` - 搜索知识

### 项目管理
- `POST /api/projects` - 创建项目
- `POST /api/projects/{id}/tasks` - 创建任务
- `GET /api/projects/{id}/timeline` - 获取项目时间轴

## 🔍 性能优化

### 数据库优化
1. **索引策略**
   ```cypher
   CREATE INDEX FOR (p:Person) ON (p.name)
   CREATE INDEX FOR (d:Document) ON (d.content)
   ```

2. **查询优化**
   - 使用参数化查询避免Cypher注入
   - 合理使用LIMIT限制结果集大小
   - 使用PROFILE分析查询性能

### 前端优化
1. **图谱渲染**
   - 启用WebWorker处理大规模图谱
   - 实现节点虚拟化减少DOM操作
   - 使用防抖处理用户交互

2. **数据传输**
   - 实现增量数据更新
   - 使用WebSocket推送实时变更
   - 启用GZIP压缩响应数据

## 🛡️ 安全考虑

### 认证授权
- 实现JWT Token认证
- 基于角色的权限控制（RBAC）
- API接口访问限流

### 数据安全
- 敏感数据加密存储
- 数据库连接加密
- 定期数据备份

### 网络安全
- HTTPS传输加密
- CORS策略配置
- XSS和CSRF防护

## 📈 扩展方向

### 智能化增强
1. **AI集成**
   - 接入GPT等大语言模型
   - 实现智能问答和推理
   - 自动生成文档摘要

2. **机器学习**
   - 图神经网络（GNN）节点聚类
   - 异常检测和风险预警
   - 推荐系统和智能匹配

### 功能扩展
1. **协作功能**
   - 实时协作编辑
   - 评论和讨论系统
   - 工作流审批

2. **数据分析**
   - 业务报表和仪表盘
   - 趋势分析和预测
   - 数据导入导出

## 🐛 故障排除

### 常见问题

1. **Neo4j连接失败**
   ```bash
   # 检查Neo4j服务状态
   docker-compose ps neo4j
   
   # 查看Neo4j日志
   docker-compose logs neo4j
   
   # 重启Neo4j服务
   docker-compose restart neo4j
   ```

2. **spaCy模型加载失败**
   ```bash
   # 下载中文模型
   python -m spacy download zh_core_web_sm
   
   # 验证模型安装
   python -c "import spacy; nlp = spacy.load('zh_core_web_sm'); print('模型加载成功')"
   ```

3. **前端图谱不显示**
   - 检查浏览器控制台错误
   - 确认API接口返回数据
   - 验证G6版本兼容性

### 日志分析
```bash
# 查看应用日志
docker-compose logs -f app

# 查看Neo4j查询日志
docker-compose exec neo4j tail -f /logs/query.log
```

## 📄 开源协议

本项目采用MIT开源协议，详见 [LICENSE](LICENSE) 文件。

## 🤝 贡献指南

欢迎提交Issue和Pull Request！

1. Fork本项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开Pull Request

## 📞 联系我们

如有问题或建议，请通过以下方式联系：
- 提交GitHub Issue
- 发送邮件至项目维护者

---

**🚀 立即开始您的关系知识管理之旅！** 