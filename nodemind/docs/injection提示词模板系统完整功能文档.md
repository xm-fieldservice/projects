# 提示词模板系统完整功能文档

## 📋 系统概述

提示词模板系统是injection项目的核心功能之一，提供了完整的模板管理、应用和版本控制机制。系统支持多场景、多版本的模板配置，并具有智能默认模板功能。

## 🏗️ 系统架构

### 核心组件
- **TemplateManager** - 模板管理器，负责模板的增删改查
- **TemplateDialog** - 模板管理界面，提供可视化操作
- **TemplateService** - 模板服务层，处理底层数据操作
- **主窗口集成** - 在主界面中集成模板选择和应用功能

### 数据结构
```json
{
  "场景名称": {
    "versions": [
      {
        "name": "版本名称",
        "prefix": "前缀内容",
        "suffix": "后缀内容"
      }
    ]
  }
}
```

## 📝 现有模板内容详览

### 1. 自然模式
**默认模板**
- **前缀**: `"日志"一般是指{项目名称}-log.md文档`
- **后缀**: 无
- **用途**: 常规对话模式，指向项目日志文档

### 2. 代码自查
**默认模板**
- **前缀**: 
```
主要功能点，是否有重复的实现逻辑
是否有一代码试图引用一个不存在的函数：
是否路径错误，是否有多个方法实现同一个功能，
是否没有加载修改的代码
是否没有启动有修改的代码
```
- **后缀**: 无
- **用途**: 代码质量检查和问题排查

### 3. # 修改代码
**默认模板**
- **前缀**: `"日志"一般是指{项目名称}-log.md文档`
- **后缀**: 包含完整的代码外科手术协议，具体内容：
```
【代码修改外科手术协议】⚡️ 你作为严谨的代码外科医生，必须遵守：

🛑 ​**绝对禁令**  
1. 禁止创建新函数/类/逻辑块，除非同时满足：
   - 现有结构无法通过修改实现需求（需证明）
   - 提供旧代码删除位置列表（文件+行号）
2. 禁止任何未声明的逻辑增删（含被注释的旧代码）

⚡️ ​**操作规范**  
1. ​**变更报告模板**​（每次输出前必须包含）：
   ```diff
   # 变更报告
   ## 修改位置：{文件名}.{起始行}-{结束行}
   - 删除逻辑：[原代码片段] 
   + 新增逻辑：[新代码片段]（<10行）
   ## 关联影响：{受影响的函数/变量}
2. 对于命令中有明确"恢复"代码或者功能指示的，一定要先找原有代码就行维修和恢复功能，绝对不允许在没有确认的情况下，使用新方法，新代码实现指示中的功能。在确定原有代码完全不能满足需求的情况下，才能使用新方法。

【用注释块在代码文档后面记录修改履历，记录的时候采用下面的格式和动词表描述修改动作和内容】

✅ 1. 动作词汇表：【修改】【新增】【删除】...

✅ 2. 极简注释模板：
# [动作] 日期: 动作描述 (文件:行号范围)
# [Ref] Commit: 哈希值

📝 代码修改动作词汇规范：

🔧 核心动作类：
- 【修改】：在现有代码基础上改动（推荐优先）
- 【删除】：移除不需要的代码
- 【新增】：添加新的代码行（谨慎使用）

⚠️ 重构动作类：
- 【新生成】：创建新函数/类/模块（需证明必要性）
- 【重构】：大幅改变代码结构（需用户确认）
- 【迁移】：移动代码位置（需说明理由）

🧹 清理动作类：
- 【清理】：删除废弃代码
- 【合并】：合并重复逻辑
- 【分离】：拆分过长函数（需确认）

💼 维护动作类：
- 【格式化】：仅调整代码格式
- 【注释】：添加或修改注释
- 【优化】：性能优化（逻辑不变）
```

### 4. # 不生效
**默认模板**
- **前缀**: 无
- **后缀**: 
```
修改代码没有生效
1. 修改的代码没有加载成功
2. 路径配置错误
3. 有多个对象，你代码修改的和加载的不是一个。
4. 没有成功调用修改的新方法。
5. 代码中有多个实现逻辑，相互影响造成你修改的"一处"代码没有发生作用。
6. 原来的代码是硬编码，路径等都写死了；新的代码无法替代
备注：
7. "日志"一般指{项目名称}-log.md文档
```

### 5. 日志-修改代码
**默认模板**
- **前缀**: 无
- **后缀**: 结合了代码外科手术协议和工作日志记录功能，包含完整的修改规范和日志格式要求

### 6. 日志-不生效
**默认模板**
- **前缀**: 无
- **后缀**: 结合了代码不生效诊断和工作日志记录功能

### 7. 日志-新功能
**默认模板**
- **前缀**: `认真回答问题`
- **后缀**: `遵循最小化代码实现原则。不得任意增加指令以外的功能和效果。`
  
### 8. # 新功能
**默认模板**
- **前缀**: `遵循最小化代码实现原则。不得任意增加指令以外的功能和效果。"日志"一般是指{项目名称}-log.md文档`
- **后缀**: 无

## 🎯 核心功能详解

### 1. 模板管理功能

#### 1.1 场景管理
- **新建场景**: 创建新的模板分类
- **重命名场景**: 修改场景名称
- **删除场景**: 移除整个场景及其所有版本
- **复制场景**: 复制场景及其所有版本到新场景

#### 1.2 版本管理
- **新建版本**: 在现有场景下创建新版本
- **编辑版本**: 修改前缀和后缀内容
- **删除版本**: 移除指定版本（保留至少一个版本）
- **复制版本**: 复制版本到同场景或其他场景

#### 1.3 内容编辑
- **前缀模板**: 在用户输入前添加的内容
- **后缀模板**: 在用户输入后添加的内容
- **变量替换**: 支持 `{项目名称}` 等动态变量

### 2. 默认模板机制

#### 2.1 默认模板设置
- **设置方式**: 选择场景和版本后点击"设为默认"
- **视觉标识**: 默认场景前显示"★"星号
- **状态提示**: 按钮显示"已设为默认 ✓"或"设为默认"
- **配置保存**: 自动保存到 `config.json` 文件

#### 2.2 默认模板应用
- **自动加载**: 程序启动时自动加载默认模板
- **强制使用**: 命令注入时强制使用默认模板，不受当前选择影响
- **持久化**: 配置重启后依然有效

#### 2.3 用户体验优化
- **按钮状态**: 根据当前选择智能更新按钮状态
- **提示信息**: 鼠标悬停显示默认模板详细信息
- **即时反馈**: 设置成功后显示通知消息

### 3. 模板应用机制

#### 3.1 模板组合
```
完整命令 = 前缀模板 + 用户输入 + 后缀模板
```

#### 3.2 变量替换
- `{项目名称}`: 自动替换为当前检测到的项目名称
- 支持扩展更多系统变量

#### 3.3 注入流程
1. 获取默认模板内容
2. 应用变量替换
3. 组合前缀 + 用户输入 + 后缀
4. 复制到剪贴板
5. 模拟鼠标点击和键盘操作完成注入

## 🔧 技术实现细节

### 1. 文件结构
```
templates.json          # 主模板配置文件
config/templates.json   # 备用模板配置
shared/config/templates.json  # 共享模板配置
```

### 2. 关键方法

#### TemplateManager 核心方法
- `load_templates()`: 加载模板配置
- `save_templates()`: 保存模板配置
- `get_scenes()`: 获取所有场景名称
- `get_scene_versions()`: 获取场景的所有版本
- `get_template()`: 获取指定模板内容
- `add_scene()`: 添加新场景
- `add_version()`: 添加新版本
- `update_version()`: 更新版本内容
- `delete_scene()`: 删除场景
- `delete_version()`: 删除版本

#### 主窗口集成方法
- `load_scenes()`: 加载场景到界面
- `load_versions()`: 加载版本到下拉框
- `set_default_template()`: 设置默认模板
- `update_default_button_state()`: 更新按钮状态
- `show_template_dialog()`: 显示模板管理对话框

### 3. 界面组件
- **场景列表**: QListWidget，显示所有场景
- **版本选择**: QComboBox，选择当前场景的版本
- **设为默认按钮**: QPushButton，设置默认模板
- **模板管理按钮**: QPushButton，打开管理界面

## 📊 配置文件格式

### config.json 中的默认模板配置
```json
{
  "default_scene": "场景名称",
  "default_version": "版本名称"
}
```

### templates.json 模板数据格式
```json
{
  "场景名称": {
    "versions": [
      {
        "name": "版本名称",
        "prefix": "前缀内容",
        "suffix": "后缀内容"
      }
    ]
  }
}
```

## 🎮 使用指南

### 1. 基础使用流程
1. **选择场景**: 在左侧列表中点击场景
2. **选择版本**: 在下拉框中选择版本
3. **设为默认**: 点击"设为默认"按钮（可选）
4. **输入命令**: 在文本框中输入要注入的内容
5. **执行注入**: 点击注入按钮完成操作

### 2. 模板管理流程
1. **打开管理**: 点击"模板管理"按钮
2. **创建场景**: 使用"新建场景"添加分类
3. **编辑模板**: 修改前缀和后缀内容
4. **保存配置**: 点击"保存修改"确认更改

### 3. 高级功能
- **批量操作**: 支持场景和版本的复制功能
- **备份恢复**: 自动备份模板配置
- **热重载**: 支持配置文件的热重载

## 🔍 故障排除

### 常见问题
1. **模板不生效**: 检查是否正确设置了默认模板
2. **按钮状态异常**: 重启程序或点击刷新
3. **配置丢失**: 检查 config.json 文件是否存在
4. **编码问题**: 确保文件使用 UTF-8 编码

### 修复方法
1. **重置配置**: 删除 config.json 让程序重新生成
2. **恢复默认**: 使用内置的默认模板配置
3. **手动修复**: 直接编辑 templates.json 文件

## 📈 系统优势

1. **灵活性**: 支持多场景、多版本的复杂模板体系
2. **易用性**: 直观的界面操作和智能默认机制
3. **扩展性**: 模块化设计，易于添加新功能
4. **稳定性**: 完善的错误处理和配置备份机制
5. **智能性**: 自动变量替换和上下文感知

## 🚀 未来发展方向

1. **云端同步**: 支持模板配置的云端备份和同步
2. **智能推荐**: 基于使用频率的模板推荐
3. **协作功能**: 团队模板分享和协作编辑
4. **AI集成**: 智能模板生成和优化建议
5. **插件系统**: 支持第三方模板插件

---

**文档版本**: v1.0  
**最后更新**: 2024年12月5日  
**维护者**: injection项目团队 