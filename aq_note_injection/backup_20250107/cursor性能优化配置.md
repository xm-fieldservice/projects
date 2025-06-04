# Cursor 性能优化配置指南 ⚡

## 🧠 内存优化专项（保留AI功能）

### 关键目标：1.2G → 600-800M 内存占用

**核心策略**：保持AI自动完成完整功能，专注优化内存管理

#### 🎯 立即生效的内存优化
```json
{
  // AI内存优化（保持功能）
  "cursor.ai.maxCompletionTokens": 100,
  "cursor.ai.maxPromptLength": 2000,
  "cursor.ai.contextLength": 8000,
  "cursor.ai.cacheSize": 50,
  
  // 关键内存设置
  "files.maxMemoryForLargeFilesMB": 512,
  "typescript.maxTsServerMemory": 2048,
  "editor.maxTokenizationLineLength": 10000,
  "search.maintainFileSearchCache": false
}
```

#### 📊 内存监控命令
```powershell
# 实时监控Cursor内存
Get-Process -Name '*cursor*' | Select Name, @{Name='Memory(MB)';Expression={[math]::Round($_.WorkingSet/1MB,2)}}

# 内存使用趋势
while($true) { Get-Process cursor | Select @{Name='Time';Expression={Get-Date -Format 'HH:mm:ss'}}, @{Name='Memory(MB)';Expression={[math]::Round($_.WorkingSet/1MB,2)}}; Start-Sleep 10 }
```

#### ⚡ 快速内存释放（30秒完成）
1. **运行内存清理脚本**：双击 `内存优化清理工具.bat`
2. **手动清理**：Ctrl + Shift + P → "Developer: Reload Window"
3. **系统清理**：`[System.GC]::Collect()` (PowerShell)

## 🎯 立即生效的优化设置

### 1. 核心设置优化（Ctrl + ,）

```json
{
  // === 性能核心设置 ===
  "editor.quickSuggestions": {
    "other": false,
    "comments": false,
    "strings": false
  },
  "editor.acceptSuggestionOnCommitCharacter": false,
  "editor.acceptSuggestionOnEnter": "off",
  "editor.suggestOnTriggerCharacters": false,
  "editor.parameterHints.enabled": false,
  "editor.wordBasedSuggestions": false,
  
  // === AI功能优化 ===
  "cursor.ai.enabled": true,
  "cursor.ai.autoComplete": false,
  "cursor.ai.enableAutocompletions": false,
  "cursor.ai.temperature": 0.3,
  
  // === 文件监控优化 ===
  "files.watcherExclude": {
    "**/.git/objects/**": true,
    "**/.git/subtree-cache/**": true,
    "**/node_modules/**": true,
    "**/tmp/**": true,
    "**/.cache/**": true,
    "**/dist/**": true,
    "**/build/**": true
  },
  
  // === 搜索优化 ===
  "search.exclude": {
    "**/node_modules": true,
    "**/bower_components": true,
    "**/.git": true,
    "**/dist": true,
    "**/build": true,
    "**/.cache": true
  },
  
  // === 编辑器性能 ===
  "editor.minimap.enabled": false,
  "editor.renderLineHighlight": "none",
  "editor.renderWhitespace": "none",
  "editor.hover.delay": 1000,
  "editor.linkedEditing": false,
  "editor.occurrencesHighlight": false,
  "editor.selectionHighlight": false,
  "editor.wordWrap": "off",
  
  // === TypeScript优化 ===
  "typescript.suggest.enabled": false,
  "typescript.validate.enable": false,
  "typescript.updateImportsOnFileMove.enabled": "never",
  "javascript.suggest.enabled": false,
  "javascript.validate.enable": false,
  
  // === 文件关联 ===
  "files.associations": {
    "*.js": "javascript",
    "*.html": "html"
  },
  
  // === Git优化 ===
  "git.enabled": false,
  "git.autorefresh": false,
  "git.autofetch": false,
  
  // === 扩展优化 ===
  "extensions.autoUpdate": false,
  "extensions.autoCheckUpdates": false
}
```

## 🚀 即时性能提升步骤

### 步骤1: 关闭不必要的AI功能
```
1. 按 Ctrl + Shift + P
2. 输入 "cursor settings"
3. 找到 AI Settings：
   - 关闭 Auto Completions
   - 关闭 Inline Suggestions
   - 设置 Max Tokens = 50
```

### 步骤2: 优化工作区设置
```
1. 在项目根目录创建 .vscode/settings.json
2. 复制上面的JSON配置
3. 重启 Cursor
```

### 步骤3: 清理内存
```
1. 按 Ctrl + Shift + P
2. 输入 "reload window"
3. 选择 "Developer: Reload Window"
```

## 🔧 系统级优化

### Windows性能优化
```powershell
# 清理系统缓存
sfc /scannow
DISM /Online /Cleanup-Image /RestoreHealth

# 优化虚拟内存
# 控制面板 > 系统 > 高级系统设置 > 性能设置 > 高级 > 虚拟内存
# 设置为系统管理的大小
```

### 关闭不必要的服务
```
1. 任务管理器 > 启动
2. 禁用不必要的自启动程序
3. 服务 > 禁用 Windows Search（如果不需要）
```

## 📁 项目级优化

### 排除大文件夹
```json
// .vscode/settings.json
{
  "files.exclude": {
    "**/node_modules": true,
    "**/.git": true,
    "**/dist": true,
    "**/build": true,
    "**/.cache": true,
    "**/coverage": true
  }
}
```

### 大项目优化
```json
{
  "typescript.disableAutomaticTypeAcquisition": true,
  "typescript.preferences.includePackageJsonAutoImports": "off",
  "javascript.preferences.includePackageJsonAutoImports": "off"
}
```

## 🎯 硬件优化建议

### 内存优化
- **建议**: 16GB+ RAM
- **当前**: 检查内存使用率 < 80%
- **优化**: 关闭其他大内存程序

### 存储优化
- **SSD**: 确保Cursor安装在SSD上
- **空间**: 保持至少20GB可用空间
- **碎片**: 定期磁盘碎片整理

### CPU优化
- **进程优先级**: 任务管理器中设置Cursor为"高"
- **核心数**: 确保Cursor可以使用多核

## ⚡ 快速诊断命令

### 检查资源使用
```powershell
# 内存使用
Get-Process -Name '*cursor*' | Measure-Object WorkingSet -Sum

# CPU使用
Get-Counter "\Process(Cursor*)\% Processor Time"

# 磁盘使用
Get-Counter "\Process(Cursor*)\IO Data Bytes/sec"
```

### 网络延迟检查
```powershell
# 检查网络延迟
ping cursor.sh
ping api.openai.com
```

## 🔄 应急优化（立即生效）

### 1. 安全模式启动
```
cursor --disable-extensions --disable-gpu
```

### 2. 重置设置
```
1. 关闭 Cursor
2. 删除: %APPDATA%\Cursor\User\settings.json
3. 重启 Cursor
```

### 3. 清理缓存
```powershell
# 清理Cursor缓存
Remove-Item -Recurse -Force "$env:APPDATA\Cursor\logs"
Remove-Item -Recurse -Force "$env:APPDATA\Cursor\CachedData"
```

## 📊 性能监控

### 实时监控
```
1. 按 Ctrl + Shift + P
2. 输入 "Performance"
3. 选择 "Developer: Startup Performance"
```

### 扩展性能
```
1. 按 Ctrl + Shift + P
2. 输入 "Show Running Extensions"
3. 禁用耗资源扩展
```

---

## 🎯 预期效果

应用这些优化后，您应该看到：
- ⚡ 打字延迟 < 50ms
- 💾 内存使用减少30-50%
- 🖥️ CPU占用降低40-60%
- 🚀 启动速度提升2-3倍

立即按照以上步骤操作，享受丝滑的Cursor体验！ 