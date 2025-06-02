# API 文档 📚

笔记块系统 v3.0 完整API参考手册

## 📋 目录

- [快速开始](#快速开始)
- [函数式接口](#函数式接口)
- [类接口](#类接口)
- [核心组件API](#核心组件api)
- [工具函数](#工具函数)
- [错误处理](#错误处理)
- [最佳实践](#最佳实践)

## 🚀 快速开始

### 引入方式

```html
<!-- 引入核心组件 -->
<script src="note-block-system/core/pluggable-note-generator.js"></script>
<script src="note-block-system/core/auto-strategy-generator.js"></script>
<script src="note-block-system/tools/note-toolkit.js"></script>
```

### 最简使用

```javascript
// 一行代码生成策略并使用
useNoteStrategy(sample, 'myStrategy');
const note = generateNote(data);
```

## ⚡ 函数式接口

### useNoteStrategy()

从样例生成策略并立即使用。

```javascript
useNoteStrategy(sampleOrName, strategyName = null)
```

**参数**：
- `sampleOrName` (string): 样例内容或已有策略名
- `strategyName` (string, 可选): 新策略名称

**返回值**：
```javascript
{
    success: boolean,     // 操作是否成功
    currentStrategy: string,  // 当前策略名
    error?: string        // 错误信息（如果失败）
}
```

**示例**：
```javascript
// 从样例生成策略
const result = useNoteStrategy(`
【问题】什么是AI？
└─【答案】人工智能
  ├─机器学习
  └─深度学习
`, 'ai_format');

// 切换到已有策略
useNoteStrategy('ai_format');
```

### generateNote()

使用当前策略生成笔记块。

```javascript
generateNote(data)
```

**参数**：
- `data` (object): 笔记数据

**返回值**：
- `string`: 生成的笔记内容

**示例**：
```javascript
const note = generateNote({
    question: "什么是JavaScript？",
    answer: "编程语言",
    details: ["前端开发", "后端开发", "移动开发"]
});
```

### parseNote()

解析笔记块内容。

```javascript
parseNote(content, strategyName = null)
```

**参数**：
- `content` (string): 笔记内容
- `strategyName` (string, 可选): 指定策略名

**返回值**：
```javascript
{
    question: string,
    answer: string,
    details: array,
    metadata: object
}
```

### generateStrategyFromSample()

从样例生成策略（不自动切换）。

```javascript
generateStrategyFromSample(sample, strategyName)
```

**参数**：
- `sample` (string): 样例内容
- `strategyName` (string): 策略名称

**返回值**：
```javascript
{
    success: boolean,
    strategyName: string,
    analysis: object,
    error?: string
}
```

### switchToStrategy()

切换到指定策略。

```javascript
switchToStrategy(strategyName)
```

**参数**：
- `strategyName` (string): 策略名称

**返回值**：
```javascript
{
    success: boolean,
    currentStrategy: string,
    error?: string
}
```

### quickPrototype()

快速原型验证：分析→生成→验证→测试。

```javascript
quickPrototype(sample, testData)
```

**参数**：
- `sample` (string): 样例内容
- `testData` (object): 测试数据

**返回值**：
```javascript
{
    success: boolean,
    strategyName: string,
    validation: object,
    testOutput: string,
    analysis: object,
    error?: string
}
```

### 查询函数

```javascript
// 获取所有策略
getAllStrategies()

// 获取系统状态
getToolkitStatus()

// 验证样例
validateSample(sample, strategyName)

// 预览策略效果
previewStrategy(data, strategyName)
```

## 🏗️ 类接口

### NoteToolkit

主工具包类，提供完整功能。

```javascript
const toolkit = new NoteToolkit(config = {})
```

**配置选项**：
```javascript
{
    debugMode: false,           // 调试模式
    defaultStrategy: 'standard', // 默认策略
    autoSave: true,             // 自动保存
    cacheEnabled: true          // 启用缓存
}
```

#### 方法

##### useStrategy()

统一策略操作方法。

```javascript
toolkit.useStrategy(sampleOrName, strategyName = null)
```

##### generateFromSample()

从样例生成策略。

```javascript
toolkit.generateFromSample(sample, strategyName, switchImmediately = false)
```

##### switchStrategy()

切换策略。

```javascript
toolkit.switchStrategy(strategyName)
```

##### generate()

生成笔记块。

```javascript
toolkit.generate(data)
```

##### parse()

解析笔记块。

```javascript
toolkit.parse(content, strategyName = null)
```

##### getStrategies()

获取所有可用策略。

```javascript
toolkit.getStrategies()
```

##### preview()

预览策略效果。

```javascript
toolkit.preview(data, strategyName)
```

##### validate()

验证样例。

```javascript
toolkit.validate(sample, strategyName)
```

##### getStatus()

获取工具包状态。

```javascript
toolkit.getStatus()
```

## 🔧 核心组件API

### PluggableNoteGenerator

可插拔笔记生成器核心类。

```javascript
const generator = new PluggableNoteGenerator(config)
```

#### 配置选项

```javascript
{
    defaultStrategy: 'standard',  // 默认策略
    debugMode: false,             // 调试模式
    enableCache: true,            // 启用缓存
    maxCacheSize: 100            // 最大缓存数量
}
```

#### 主要方法

##### addStrategy()

添加策略。

```javascript
generator.addStrategy(name, strategy)
```

**参数**：
- `name` (string): 策略名称
- `strategy` (object): 策略对象

**策略对象结构**：
```javascript
{
    name: string,
    version: string,
    patterns: object,
    generate: function(data),
    parse: function(content),
    validate: function(data)
}
```

##### switchStrategy()

切换策略。

```javascript
generator.switchStrategy(strategyName)
```

##### generate()

生成笔记。

```javascript
generator.generate(data)
```

##### parse()

解析笔记。

```javascript
generator.parse(content, strategyName = null)
```

##### removeStrategy()

移除策略。

```javascript
generator.removeStrategy(strategyName)
```

##### getAvailableStrategies()

获取可用策略列表。

```javascript
generator.getAvailableStrategies()
```

##### getCurrentStrategy()

获取当前策略名。

```javascript
generator.getCurrentStrategy()
```

##### compare()

策略对比。

```javascript
generator.compare(data, strategyNames = null)
```

### AutoStrategyGenerator

自动策略生成器。

```javascript
const autoGen = new AutoStrategyGenerator(config)
```

#### 主要方法

##### generateFromSample()

从样例生成策略。

```javascript
autoGen.generateFromSample(sample, strategyName)
```

##### analyzeSample()

分析样例。

```javascript
autoGen.analyzeSample(sample)
```

**返回值**：
```javascript
{
    patterns: array,      // 检测到的模式
    structure: object,    // 结构信息
    symbols: object,      // 符号规则
    confidence: number    // 置信度
}
```

##### validateWithSample()

用样例验证策略。

```javascript
autoGen.validateWithSample(sample, strategyName)
```

##### setPluggableGenerator()

设置插拔生成器。

```javascript
autoGen.setPluggableGenerator(generator)
```

### NoteCompatibilityAdapter

兼容性适配器。

```javascript
const adapter = new NoteCompatibilityAdapter()
```

#### 主要方法

##### detectVersion()

检测笔记版本。

```javascript
adapter.detectVersion(content)
```

##### convert()

格式转换。

```javascript
adapter.convert(content, fromVersion, toVersion)
```

##### makeCompatible()

创建兼容包装器。

```javascript
adapter.makeCompatible(strategy, targetVersion)
```

##### isCompatible()

检查兼容性。

```javascript
adapter.isCompatible(content, strategyName)
```

## 🛠️ 工具函数

### 批量处理

#### batchProcessSamples()

批量处理样例。

```javascript
batchProcessSamples(samples)
```

**参数**：
```javascript
samples = [
    { name: '格式1', content: 'sample content' },
    { name: '格式2', content: 'sample content' }
]
```

**返回值**：
```javascript
[
    {
        index: number,
        name: string,
        success: boolean,
        strategy: string,
        error?: string
    }
]
```

### 策略对比

#### compareStrategies()

对比多个策略的生成效果。

```javascript
compareStrategies(data, strategyNames = null)
```

**返回值**：
```javascript
{
    'strategy1': 'generated content 1',
    'strategy2': 'generated content 2'
}
```

### 工厂方法

#### createNoteToolkit()

创建新的工具包实例。

```javascript
createNoteToolkit(config = {})
```

#### getNoteToolkit()

获取全局工具包实例。

```javascript
getNoteToolkit()
```

## 🚨 错误处理

### 错误类型

#### StrategyError

策略相关错误。

```javascript
{
    name: 'StrategyError',
    message: '策略不存在',
    code: 'STRATEGY_NOT_FOUND',
    strategyName: 'invalid_strategy'
}
```

#### SampleError

样例分析错误。

```javascript
{
    name: 'SampleError',
    message: '样例格式无效',
    code: 'INVALID_SAMPLE_FORMAT',
    sample: 'invalid content'
}
```

#### GenerationError

生成错误。

```javascript
{
    name: 'GenerationError',
    message: '数据不完整',
    code: 'INCOMPLETE_DATA',
    missingFields: ['question', 'answer']
}
```

### 错误处理模式

```javascript
try {
    const result = useNoteStrategy(sample, 'test');
    if (!result.success) {
        console.error('操作失败:', result.error);
        return;
    }
    // 成功处理
} catch (error) {
    console.error('系统错误:', error.message);
    // 错误处理
}
```

## 📝 最佳实践

### 1. 策略命名

使用有意义的策略名称：

```javascript
// ✅ 好的命名
useNoteStrategy(sample, 'qa_tree_format');
useNoteStrategy(sample, 'markdown_style');
useNoteStrategy(sample, 'bullet_points');

// ❌ 避免的命名
useNoteStrategy(sample, 'strategy1');
useNoteStrategy(sample, 'temp');
```

### 2. 错误处理

总是检查操作结果：

```javascript
// ✅ 推荐方式
const result = generateStrategyFromSample(sample, 'my_strategy');
if (result.success) {
    switchToStrategy('my_strategy');
    const note = generateNote(data);
} else {
    console.error('策略生成失败:', result.error);
}

// ❌ 不推荐
generateStrategyFromSample(sample, 'my_strategy');
const note = generateNote(data); // 可能失败
```

### 3. 性能优化

批量操作时使用专门的函数：

```javascript
// ✅ 高效方式
const results = batchProcessSamples(samples);

// ❌ 低效方式
samples.forEach(sample => {
    generateStrategyFromSample(sample.content, sample.name);
});
```

### 4. 策略管理

定期清理不需要的策略：

```javascript
// 获取所有策略
const strategies = getAllStrategies();

// 清理临时策略
strategies.forEach(name => {
    if (name.startsWith('temp_')) {
        // 清理逻辑
    }
});
```

### 5. 调试模式

开发时启用调试模式：

```javascript
const toolkit = new NoteToolkit({
    debugMode: true,  // 开发时启用
    defaultStrategy: 'standard'
});
```

### 6. 样例质量

提供高质量的样例：

```javascript
// ✅ 好的样例：结构清晰，模式明显
const goodSample = `
【问题】什么是Vue.js？
└─【答案】渐进式JavaScript框架
  ├─【特点】组件化开发
  │  ├─可复用性强
  │  └─维护性好
  └─【应用】前端开发
     ├─单页应用
     └─组件库开发
`;

// ❌ 差的样例：结构混乱，模式不明
const badSample = `
问题Vue.js
答案框架
特点组件化
应用前端
`;
```

---

## 🔗 相关链接

- [架构设计文档](ARCHITECTURE.md)
- [部署指南](../DEPLOY.md)
- [示例集合](../examples/)
- [测试套件](../tests/test-suite.html)

---

**💡 提示**：更多使用示例请参考 `examples/` 目录中的演示文件。 