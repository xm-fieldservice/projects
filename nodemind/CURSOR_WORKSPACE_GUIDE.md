# Cursor工作区管理指南

## 🎯 **当前策略：混合开发模式**

### **推荐方案：保持在nodemind项目中开发**

**优势**：
- ✅ 保持所有项目历史和背景知识
- ✅ 保持.cursor/rules等配置
- ✅ 可以随时参考原代码和文档
- ✅ 通过相对路径操作V4项目

### **操作方式**：
```bash
# 当前工作目录：D:\AI-Projects\nodemind
# V4项目路径：../nodemind-v4/

# 创建V4文件：
edit_file ../nodemind-v4/src/core/DataStore.js

# 运行V4命令：
cd ../nodemind-v4 && npm start

# 查看V4目录：
ls ../nodemind-v4/src/
```

## 🔄 **如需切换到V4项目**

### **步骤1：复制重要配置**
```bash
# 复制Cursor配置
cp -r .cursor/ ../nodemind-v4/
cp .cursorrules ../nodemind-v4/
```

### **步骤2：创建V4的知识库**
- 已创建：`../nodemind-v4/docs/PROJECT_KNOWLEDGE_TRANSFER.md`
- 包含所有核心设计理念和技术规范

### **步骤3：在V4中创建项目说明**
```markdown
# 在V4项目根目录创建README.md
- 项目背景和目标
- 技术栈说明
- 开发指南
- 与原项目的关系
```

## 📋 **两个项目的关系**

### **nodemind项目（原项目）**
- 路径：`D:\AI-Projects\nodemind`
- 状态：稳定版本，继续维护
- 作用：参考和对比基准

### **nodemind-v4项目（新项目）**
- 路径：`D:\AI-Projects\nodemind-v4`
- 状态：全新开发
- 作用：下一代版本

## 🛠️ **开发工作流**

### **当前推荐流程**：
1. **保持Cursor在nodemind项目**
2. **通过相对路径操作V4文件**
3. **随时参考原项目代码和文档**
4. **V4项目成熟后再考虑切换工作区**

### **文件操作示例**：
```bash
# 在当前nodemind项目中，操作V4文件
edit_file ../nodemind-v4/src/core/DataStore.js
edit_file ../nodemind-v4/index.html
edit_file ../nodemind-v4/package.json

# 运行V4项目的命令
cd ../nodemind-v4
npm install
npm start
cd ../nodemind  # 返回原项目
```

## 🎯 **知识传承策略**

### **已完成**：
- ✅ 创建项目知识迁移文档
- ✅ 复制到V4项目docs目录
- ✅ 包含所有核心设计理念

### **持续进行**：
- 🔄 在开发过程中补充技术细节
- 🔄 记录重要的设计决策
- 🔄 更新架构文档

## 📚 **V4项目必读文档**

### **核心文档**：
1. `../nodemind-v4/docs/PROJECT_KNOWLEDGE_TRANSFER.md` - 项目知识传承
2. `../nodemind-v4/TECH_STACK.md` - 技术栈说明（待创建）
3. `../nodemind-v4/README.md` - 项目说明（待创建）

### **原项目参考文档**：
1. `NodeMind项目元数据结构.md` - 数据结构标准
2. `NodeMind脑图解析器标准v2.0.md` - 解析器规范
3. `injection项目模块化解耦技术方案.md` - 模块化设计
4. `NodeMind使用指南.md` - 功能说明

## ⚡ **快速切换命令**

### **查看V4项目结构**：
```bash
tree ../nodemind-v4/
```

### **进入V4项目**：
```bash
cd ../nodemind-v4
```

### **返回原项目**：
```bash
cd ../nodemind
```

### **同时查看两个项目**：
```bash
# 在新终端窗口中打开V4项目
start ../nodemind-v4/
```

---

**总结**：当前策略是在nodemind项目中保持Cursor工作区，通过相对路径操作V4项目，这样既能保持项目知识，又能高效开发新版本。 