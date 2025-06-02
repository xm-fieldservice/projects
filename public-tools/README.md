# 🛠️ Public Tools - 公共工具仓库

一个统一的工具仓库，包含所有已封装的工具包，便于项目间复用和AI快速理解。

## 📦 工具包清单

### 🤖 AI & 问答工具
- **[QA Note Toolkit v3.0.1](./ai-tools/qa-note-toolkit/)** - 智能笔记问答工具包
  - 多智能体支持 (通用、RAG、代码、写作助手)
  - 双模式设计 (问答/笔记)
  - 响应式设计，高度可配置
  - **状态**: ✅ 最新优化版

### 📝 笔记处理工具
- **[Note Block Toolkit v3.0](./note-tools/note-block-toolkit/)** - 笔记块处理工具包
  - "底座+插拔"架构
  - 动态符号规则切换
  - 一体化工具包接口
  - **状态**: ✅ 完整交付版

### 💾 文件存储工具
- **[Local Note Saver Toolkit v1.0](./storage-tools/local-note-saver-toolkit/)** - 本地文件保存工具包
  - 三版本支持 (JS高级版、浏览器原生版、Python版)
  - 支持图片粘贴、离线运行
  - 跨平台兼容
  - **状态**: ✅ 稳定部署版

## 🎯 使用指南

### 🚀 快速选择工具

#### 需要智能问答系统？
```bash
cd public-tools/ai-tools/qa-note-toolkit/
# 查看: README.md 和 demo/index.html
```

#### 需要笔记格式化？
```bash
cd public-tools/note-tools/note-block-toolkit/
# 查看: README.md 和 tools/note-toolkit.js
```

#### 需要本地文件保存？
```bash
cd public-tools/storage-tools/local-note-saver-toolkit/
# 查看: README.md 和 examples/web-demo.html
```

### 🔍 AI集成建议

当AI需要选择合适的工具时，可以参考以下决策树：

```
项目需求 → 推荐工具包
├── 智能对话/问答 → QA Note Toolkit
├── 笔记处理/格式化 → Note Block Toolkit  
├── 文件保存/管理 → Local Note Saver Toolkit
└── 复合需求 → 多工具包组合使用
```

## 📋 目录结构

```
public-tools/
├── README.md                     # 本文件 - 工具仓库总览
├── TOOLKIT_INDEX.md              # 详细工具索引和对比
├── INTEGRATION_GUIDE.md          # 集成指南和最佳实践
│
├── ai-tools/                     # AI & 问答相关工具
│   └── qa-note-toolkit/          # QA Note Toolkit v3.0.1
│       ├── src/                  # 源代码
│       ├── demo/                 # 演示页面
│       ├── docs/                 # 文档
│       └── README.md            # 工具说明
│
├── note-tools/                   # 笔记处理工具
│   └── note-block-toolkit/       # Note Block Toolkit v3.0
│       ├── tools/                # 核心工具
│       ├── examples/             # 使用示例
│       └── README.md            # 工具说明
│
├── storage-tools/                # 存储相关工具
│   └── local-note-saver-toolkit/ # Local Note Saver Toolkit v1.0
│       ├── src/                  # 多版本源码
│       ├── examples/             # 演示文件
│       └── README.md            # 工具说明
│
└── shared/                       # 共享资源
    ├── common-styles.css         # 通用样式
    ├── common-utils.js           # 通用工具函数
    └── integration-helpers.js    # 集成辅助函数
```

## ⚡ 快速开始

### 1. 浏览工具清单
```bash
# 查看所有可用工具
cat public-tools/TOOLKIT_INDEX.md
```

### 2. 选择合适工具
```bash
# 根据需求选择对应的工具包目录
cd public-tools/[category]/[toolkit-name]/
```

### 3. 阅读文档
```bash
# 每个工具包都有详细的README
cat README.md
```

### 4. 运行演示
```bash
# 大多数工具包都有演示页面
# 打开对应的demo/index.html或examples/web-demo.html
```

## 🏗️ 为开发者

### 添加新工具包

1. 选择合适的分类目录 (`ai-tools/`, `note-tools/`, `storage-tools/`)
2. 创建工具包目录，遵循命名规范: `[tool-name]-toolkit`
3. 必需文件: `README.md`, `package.json`
4. 推荐结构: `src/`, `demo/`, `docs/`, `examples/`
5. 更新本README和TOOLKIT_INDEX.md

### 工具包标准

- **命名规范**: 使用kebab-case，以"-toolkit"结尾
- **版本管理**: 采用语义化版本 (semantic versioning)
- **文档完整**: 包含README、API文档、使用示例
- **演示可用**: 提供可运行的演示页面
- **兼容性说明**: 明确支持的浏览器和环境

## 📊 工具包对比

| 工具包 | 功能领域 | 复杂度 | 大小 | 依赖 | 最佳场景 |
|--------|----------|--------|------|------|----------|
| QA Note Toolkit | AI问答 | 高 | ~300KB | AI服务 | 智能问答系统 |
| Note Block Toolkit | 格式化 | 中 | ~45KB | 无 | 笔记处理应用 |
| Local Note Saver | 文件操作 | 低 | ~127KB | 无 | 文件保存功能 |

## 🤝 贡献指南

1. **Fork** 这个仓库
2. **创建** 功能分支 (`git checkout -b feature/new-toolkit`)
3. **提交** 您的修改 (`git commit -am 'Add new toolkit'`)
4. **推送** 到分支 (`git push origin feature/new-toolkit`)
5. **创建** Pull Request

## 📄 许可证

本仓库中的工具包采用MIT许可证，可自由用于商业和非商业项目。

## 🆘 支持与反馈

- 🐛 **问题反馈**: 请在对应工具包目录下创建issue
- 💡 **功能建议**: 欢迎提出新工具包的建议
- 📧 **技术支持**: 查看各工具包的README获取具体联系方式

---

**🎯 目标**: 让每个项目都能快速找到合适的工具，让AI能准确理解和推荐最佳解决方案！ 