# ESLint 使用指南

## 📋 概述

ESLint已为NodeMind项目配置完成，可以帮助您：
- 发现代码中的潜在问题
- 保持代码风格一致性
- 提高代码质量

## 🚀 快速开始

### 基本命令

```bash
# 检查主要HTML文件
npm run lint:check

# 检查所有文件
npm run lint

# 自动修复可修复的问题
npm run lint:fix

# 只检查JavaScript文件
npm run lint:js

# 只检查HTML文件
npm run lint:html
```

## ⚙️ 配置说明

### 当前配置特点
- **宽松设置**：适合现有代码库，不会产生过多警告
- **HTML支持**：可以检查HTML文件中的JavaScript代码
- **项目特定**：已配置项目中使用的全局变量

### 规则设置
- ✅ **允许**：`console.log`、`alert`、`var`声明、混合引号
- ⚠️ **警告**：未使用变量、`==`使用、调试语句
- ❌ **错误**：`eval`使用、不可达代码、重复声明

## 📁 文件结构

```
.
├── eslint.config.js     # ESLint配置文件（新版本格式）
├── .eslintrc.js         # ESLint配置文件（旧版本格式，备用）
├── .eslintignore        # 忽略文件列表
└── package.json         # 包含ESLint脚本
```

## 🔧 常用操作

### 1. 检查特定文件
```bash
npx eslint jsmind-project.html
npx eslint src/template_manager.js
```

### 2. 自动修复
```bash
# 修复所有可修复的问题
npm run lint:fix

# 修复特定文件
npx eslint jsmind-project.html --fix
```

### 3. 忽略特定问题
在代码中添加注释：
```javascript
// eslint-disable-next-line no-unused-vars
var unusedVariable = 'test';

/* eslint-disable no-console */
console.log('这段代码允许使用console');
/* eslint-enable no-console */
```

## 📊 输出解读

### 错误级别
- **error** (❌): 必须修复的问题
- **warning** (⚠️): 建议修复的问题

### 常见问题及解决方案

#### 1. 重复声明
```
error: Identifier 'functionName' has already been declared
```
**解决**：检查是否有重复的函数或变量声明

#### 2. 未使用变量
```
warning: 'variableName' is assigned a value but never used
```
**解决**：删除未使用的变量或在变量名前加下划线 `_variableName`

#### 3. 不可达代码
```
error: Unreachable code
```
**解决**：删除return语句后的代码

## 🎯 最佳实践

### 1. 定期检查
```bash
# 在提交代码前运行
npm run lint:check
```

### 2. 渐进式修复
```bash
# 先修复错误，再处理警告
npm run lint:check | grep "error"
```

### 3. 配置编辑器
- **VS Code**: 安装ESLint扩展
- **Cursor**: 内置ESLint支持
- 实时显示问题和建议

## 🔄 自定义配置

### 修改规则严格程度
编辑 `eslint.config.js`：
```javascript
rules: {
    'no-unused-vars': 'error', // 将警告改为错误
    'no-console': 'warn',      // 禁用console.log
    'quotes': ['error', 'single'] // 强制单引号
}
```

### 添加新的全局变量
```javascript
globals: {
    myGlobalVar: 'readonly',
    myWritableGlobal: 'writable'
}
```

## 🚫 忽略文件

当前忽略的文件/目录：
- `node_modules/`
- `backups/`
- `src/jsmind/`
- `*.min.js`
- 配置文件目录

## 💡 提示

1. **首次运行**可能会发现很多问题，这是正常的
2. **逐步修复**，不要一次性修复所有问题
3. **关注错误**优先于警告
4. **保持配置简单**，根据需要调整

## 🆘 故障排除

### 问题：ESLint无法识别全局变量
**解决**：在 `eslint.config.js` 的 `globals` 中添加变量

### 问题：HTML文件检查失败
**解决**：确保安装了 `eslint-plugin-html`

### 问题：配置文件错误
**解决**：检查 `package.json` 中的 `"type": "module"` 设置

---

**记住**：ESLint是帮助工具，不是限制工具。根据项目需要调整配置！ 