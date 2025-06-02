# 笔记块工具包 v3.0 📝

个人智能问答系统的笔记块处理核心工具包，实现"底座+插拔"架构，支持动态符号规则切换。

## 🚀 特性亮点

- **🔌 插拔式架构**：一行代码切换笔记格式策略
- **🤖 智能生成**：从样例自动生成格式策略
- **🔄 热切换**：运行时动态切换格式规则
- **📋 向后兼容**：支持多版本笔记格式
- **⚡ 极简接口**：函数式和类式双重接口

## 📁 项目结构

```
note-block-toolkit/
├── core/                          # 核心组件
│   ├── pluggable-note-generator.js    # 可插拔笔记生成器（底座架构）
│   ├── auto-strategy-generator.js     # 自动策略生成器（样例→策略）
│   ├── note-compatibility-adapter.js  # 兼容性适配器（版本管理）
│   └── note-symbol-rule-engine.js     # 符号规则引擎（规则解析）
├── tools/                         # 工具包
│   ├── note-toolkit.js               # 一体化工具包（简化接口）
│   └── note-block-formatter.js       # 块格式化工具包
├── examples/                      # 示例演示
│   ├── integration-example.html      # 完整集成示例
│   ├── content-formatter-demo.html   # 格式化演示
│   ├── quick-start.html             # 快速开始示例
│   └── advanced-usage.html          # 高级用法示例
├── docs/                          # 文档
│   ├── API.md                        # API 文档
│   ├── ARCHITECTURE.md              # 架构说明
│   └── MIGRATION.md                 # 迁移指南
├── tests/                         # 测试
│   └── test-suite.html              # 测试套件
├── package.json                   # 项目配置
├── DEPLOY.md                      # 部署指南
└── README.md                      # 项目说明
```

## ⚡ 快速开始

### 1. 超简单函数接口

```javascript
// 引入核心文件
<script src="core/pluggable-note-generator.js"></script>
<script src="core/auto-strategy-generator.js"></script>
<script src="tools/note-toolkit.js"></script>

// 一行代码：样例 → 策略 → 使用
useNoteStrategy(`
【问题】什么是AI？
└─【答案】人工智能的简称
  ├─定义：模拟人类智能
  └─应用：机器学习、深度学习
`, 'myStrategy');

// 直接生成笔记
const note = generateNote({
    question: "什么是机器学习？",
    answer: "机器学习是AI的一个分支",
    details: ["监督学习", "无监督学习", "强化学习"]
});
```

### 2. 类接口（高级控制）

```javascript
const toolkit = new NoteToolkit({
    debugMode: true,
    defaultStrategy: 'standard'
});

// 从样例生成策略
const result = toolkit.generateFromSample(sample, 'customStrategy');
if (result.success) {
    toolkit.switchStrategy('customStrategy');
    const note = toolkit.generate(data);
}
```

### 3. 快速原型验证

```javascript
// 一键：分析 → 生成 → 验证 → 测试
const prototype = quickPrototype(sample, testData);
console.log('原型验证结果:', prototype);
```

## 🔧 核心组件说明

### PluggableNoteGenerator（可插拔生成器）
- **作用**：提供统一的笔记生成接口，支持策略热切换
- **特点**：底座不变，策略可插拔
- **接口**：`generate()`, `parse()`, `switchStrategy()`

### AutoStrategyGenerator（自动策略生成器）
- **作用**：从样例自动生成格式策略
- **特点**：智能分析符号模式，生成解析规则
- **接口**：`generateFromSample()`, `validateWithSample()`

### NoteCompatibilityAdapter（兼容性适配器）
- **作用**：处理不同版本的笔记格式
- **特点**：自动检测版本，提供转换机制
- **接口**：`detectVersion()`, `convert()`, `makeCompatible()`

### NoteToolkit（一体化工具包）
- **作用**：提供简化的函数式和类式接口
- **特点**：封装复杂性，一行代码解决问题
- **接口**：`useStrategy()`, `generateNote()`, `quickPrototype()`

## 🎯 使用场景

### 场景1：符号规则变更
```javascript
// 原有格式
const oldFormat = `
问：什么是AI？
答：人工智能
  - 定义：模拟人类智能
  - 应用：机器学习
`;

// 新格式要求
const newFormat = `
【问题】什么是AI？
└─【答案】人工智能
  ├─定义：模拟人类智能
  └─应用：机器学习
`;

// 一行代码适应新格式
useNoteStrategy(newFormat, 'newFormat');
```

### 场景2：批量格式转换
```javascript
const samples = [
    { name: '标准格式', content: sample1 },
    { name: '简化格式', content: sample2 },
    { name: '详细格式', content: sample3 }
];

const results = batchProcessSamples(samples);
console.log('批量处理结果:', results);
```

### 场景3：策略对比测试
```javascript
const testData = { question: '测试问题', answer: '测试答案' };
const comparison = compareStrategies(testData, ['standard', 'minimal', 'rich']);
console.log('策略对比:', comparison);
```

## 🔄 部署方式

### 方式1：直接引入
```html
<script src="note-block-system/tools/note-toolkit.js"></script>
<script>
    useNoteStrategy(sample, 'myStrategy');
</script>
```

### 方式2：模块化
```javascript
import { NoteToolkit } from './note-block-system/tools/note-toolkit.js';
const toolkit = new NoteToolkit();
```

### 方式3：CDN引入
```html
<script src="https://your-cdn.com/note-block-system/tools/note-toolkit.js"></script>
```

## 📚 更多文档

- [API 详细文档](docs/API.md)
- [架构设计说明](docs/ARCHITECTURE.md)
- [部署详细指南](DEPLOY.md)
- [迁移升级指南](docs/MIGRATION.md)

## 🧪 测试

打开 `tests/test-suite.html` 运行完整测试套件。

## 📄 许可证

MIT License - 个人智能问答系统专用

## 🆙 版本历史

- **v3.0** - 插拔式架构，样例自动生成
- **v2.0** - 符号规则引擎
- **v1.0** - 基础笔记生成器

---

🔥 **核心优势**：让笔记格式变更从"痛苦重构"变成"一行代码"！ 