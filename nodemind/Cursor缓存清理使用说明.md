# Cursor缓存清理工具使用说明

## 概述

当Cursor编辑器响应缓慢、占用内存过高或出现异常行为时，清理缓存通常能有效解决问题。本工具提供了两个版本的清理脚本：

- `clear-cursor-cache.ps1` - PowerShell版本（推荐）
- `clear-cursor-cache.bat` - 批处理版本（兼容性更好）

## 使用方法

### 方法一：PowerShell脚本（推荐）

1. **右键点击** `clear-cursor-cache.ps1` 文件
2. **选择** "使用PowerShell运行"
3. 如果提示执行策略限制，请：
   - 按 `Win + X`，选择"Windows PowerShell (管理员)"
   - 执行：`Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`
   - 再重新运行脚本

### 方法二：批处理脚本

1. **双击** `clear-cursor-cache.bat` 文件直接运行
2. 按照提示操作

## 清理内容

脚本将清理以下位置的缓存数据：

### 主要目录
- `%APPDATA%\Cursor` - 用户配置和缓存
- `%LOCALAPPDATA%\Cursor` - 本地应用数据
- `%LOCALAPPDATA%\cursor-updater` - 更新程序缓存
- `%USERPROFILE%\.cursor` - 用户配置文件
- `%TEMP%\cursor*` - 临时文件

### 具体清理的缓存类型
- **CachedData** - 缓存的应用数据
- **logs** - 日志文件
- **workspaceStorage** - 工作区存储
- **globalStorage** - 全局存储
- **History** - 历史记录
- **crashDumps** - 崩溃转储文件
- **GPUCache** - GPU缓存
- **ShaderCache** - 着色器缓存
- **Code Cache** - 代码缓存
- **CachedExtensions** - 扩展缓存

## 安全特性

### 自动检测
- 脚本会自动检测Cursor是否正在运行
- 如果检测到运行中的进程，会提示用户选择是否终止

### 错误处理
- 对无法删除的文件/目录进行跳过处理
- 显示详细的清理进度和结果
- 统计清理的空间大小和项目数量

### 注册表清理（PowerShell版本）
- 清理Cursor相关的注册表项
- 如果没有管理员权限会自动跳过

## 使用建议

### 清理前
1. **保存所有工作** - 清理前请保存所有未保存的文件
2. **关闭Cursor** - 建议手动关闭Cursor后再运行脚本
3. **备份重要设置** - 如有重要的自定义配置，建议先备份

### 清理后
1. **重启计算机** - 推荐重启以完全释放资源
2. **重新配置** - 首次启动Cursor可能需要重新登录或配置
3. **重装扩展** - 某些扩展可能需要重新安装或配置

## 故障排除

### 权限问题
```
错误：拒绝访问
解决：以管理员身份运行脚本
```

### 文件占用
```
错误：文件正在使用中
解决：确保完全关闭Cursor进程，包括后台进程
```

### PowerShell执行策略
```
错误：无法执行，因为在此系统上禁止运行脚本
解决：
1. 以管理员身份打开PowerShell
2. 执行：Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
3. 重新运行脚本
```

## 预期效果

清理后，您应该看到：

### 性能提升
- **启动速度** - Cursor启动更快
- **响应速度** - 界面操作更流畅
- **内存使用** - 内存占用降低
- **稳定性** - 减少崩溃和异常

### 空间释放
- 通常可以释放几百MB到几GB的磁盘空间
- 具体大小取决于使用时长和工作区数量

## 注意事项

⚠️ **重要提醒**：
- 清理会删除所有缓存数据，包括最近打开的文件列表
- 某些个人设置和偏好可能需要重新配置
- 建议在重要工作完成后进行清理
- 如果清理后问题依然存在，考虑重新安装Cursor

## 联系支持

如果清理后问题仍未解决，建议：
1. 访问Cursor官方文档
2. 联系Cursor技术支持
3. 考虑完全重新安装Cursor

---

**版本**: 1.0  
**更新时间**: 2025-01-14  
**兼容性**: Windows 10/11  
**测试环境**: Windows 10 Build 26100 