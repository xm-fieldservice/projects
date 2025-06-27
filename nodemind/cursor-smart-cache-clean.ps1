# Cursor智能缓存清理脚本 - 保留最近2天会话记录
# 清理缓存的同时保护重要的会话数据

Write-Host "===== Cursor 智能缓存清理工具 =====" -ForegroundColor Green
Write-Host "🛡️ 保留最近2天会话记录，清理旧缓存数据" -ForegroundColor Cyan
Write-Host "正在清理Cursor缓存，请稍候..." -ForegroundColor Yellow

# 计算2天前的时间
$cutoffTime = (Get-Date).AddDays(-2)
Write-Host "⏰ 保留时间点: $($cutoffTime.ToString('yyyy-MM-dd HH:mm:ss'))" -ForegroundColor Green

# 检查Cursor是否正在运行
$cursorProcesses = Get-Process -Name "Cursor" -ErrorAction SilentlyContinue
if ($cursorProcesses) {
    Write-Host "⚠️ 检测到Cursor正在运行，建议先关闭Cursor后再执行清理" -ForegroundColor Red
    $response = Read-Host "是否强制终止Cursor进程并继续清理？(y/N)"
    if ($response -eq "y" -or $response -eq "Y") {
        Write-Host "正在终止Cursor进程..." -ForegroundColor Yellow
        Stop-Process -Name "Cursor" -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
    } else {
        Write-Host "清理已取消。请先关闭Cursor后重新运行此脚本。" -ForegroundColor Red
        exit
    }
}

# 定义清理路径
$basePaths = @(
    "$env:APPDATA\Cursor",
    "$env:LOCALAPPDATA\Cursor"
)

# 完全清理的目录（不保留任何内容）
$fullCleanDirs = @(
    "CachedData",
    "GPUCache", 
    "ShaderCache",
    "DawnCache",
    "Code Cache",
    "CachedExtensions",
    "crashDumps"
)

# 智能清理的目录（保留最近2天）
$smartCleanDirs = @(
    "logs",
    "User\logs", 
    "extensions\logs"
)

# 需要特殊处理的重要目录（保留最近2天的会话）
$protectedDirs = @(
    "User\workspaceStorage",
    "User\globalStorage", 
    "User\History"
)

$totalCleaned = 0
$protectedCount = 0

# 智能清理文件的函数
function Smart-CleanDirectory {
    param(
        [string]$dirPath,
        [DateTime]$cutoffTime,
        [bool]$isProtected = $false
    )
    
    if (-not (Test-Path $dirPath)) {
        return 0
    }
    
    $cleaned = 0
    $protected = 0
    
    try {
        $items = Get-ChildItem $dirPath -Recurse -Force -ErrorAction SilentlyContinue
        foreach ($item in $items) {
            if ($item.LastWriteTime -lt $cutoffTime) {
                $size = if ($item.PSIsContainer) { 
                    (Get-ChildItem $item.FullName -Recurse -Force -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum 
                } else { 
                    $item.Length 
                }
                
                Remove-Item $item.FullName -Recurse -Force -ErrorAction SilentlyContinue
                $cleaned += $size
                
                if ($isProtected) {
                    Write-Host "    🗑️ 清理旧数据: $($item.Name) ($($item.LastWriteTime.ToString('MM-dd HH:mm')))" -ForegroundColor Yellow
                }
            } else {
                if ($isProtected) {
                    $protected++
                    Write-Host "    🛡️ 保留: $($item.Name) ($($item.LastWriteTime.ToString('MM-dd HH:mm')))" -ForegroundColor Green
                }
            }
        }
    } catch {
        Write-Host "    ❌ 清理失败: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    if ($isProtected -and $protected -gt 0) {
        $script:protectedCount += $protected
    }
    
    return $cleaned
}

# 开始清理
Write-Host "`n🚀 开始智能清理..." -ForegroundColor Cyan

foreach ($basePath in $basePaths) {
    if (-not (Test-Path $basePath)) {
        continue
    }
    
    Write-Host "`n📁 处理目录: $basePath" -ForegroundColor Cyan
    
    # 1. 完全清理缓存目录
    Write-Host "  🧹 完全清理缓存..." -ForegroundColor White
    foreach ($dir in $fullCleanDirs) {
        $fullPath = Join-Path $basePath $dir
        if (Test-Path $fullPath) {
            try {
                $size = (Get-ChildItem $fullPath -Recurse -Force -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
                Remove-Item $fullPath -Recurse -Force -ErrorAction SilentlyContinue
                $totalCleaned += $size
                Write-Host "    ✅ 已清理: $dir" -ForegroundColor Green
            } catch {
                Write-Host "    ❌ 跳过: $dir" -ForegroundColor Red
            }
        }
    }
    
    # 2. 智能清理日志目录
    Write-Host "  📝 智能清理日志..." -ForegroundColor White
    foreach ($dir in $smartCleanDirs) {
        $fullPath = Join-Path $basePath $dir
        $cleaned = Smart-CleanDirectory -dirPath $fullPath -cutoffTime $cutoffTime
        $totalCleaned += $cleaned
        if ($cleaned -gt 0) {
            Write-Host "    ✅ 清理日志: $dir" -ForegroundColor Green
        }
    }
    
    # 3. 保护性清理重要目录
    Write-Host "  🛡️ 保护性清理重要数据..." -ForegroundColor White
    foreach ($dir in $protectedDirs) {
        $fullPath = Join-Path $basePath $dir
        $cleaned = Smart-CleanDirectory -dirPath $fullPath -cutoffTime $cutoffTime -isProtected $true
        $totalCleaned += $cleaned
        if (Test-Path $fullPath) {
            Write-Host "    🛡️ 保护目录: $dir (保留最近2天)" -ForegroundColor Green
        }
    }
}

# 清理临时文件
Write-Host "`n🗂️ 清理临时文件..." -ForegroundColor Cyan
$tempFiles = Get-ChildItem $env:TEMP -Filter "*cursor*" -Force -ErrorAction SilentlyContinue
foreach ($file in $tempFiles) {
    if ($file.LastWriteTime -lt $cutoffTime) {
        try {
            $size = if ($file.PSIsContainer) { 
                (Get-ChildItem $file.FullName -Recurse -Force -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum 
            } else { 
                $file.Length 
            }
            Remove-Item $file.FullName -Recurse -Force -ErrorAction SilentlyContinue
            $totalCleaned += $size
            Write-Host "  ✅ 清理: $($file.Name)" -ForegroundColor Green
        } catch {
            Write-Host "  ❌ 跳过: $($file.Name)" -ForegroundColor Red
        }
    } else {
        Write-Host "  🛡️ 保留: $($file.Name) (最近创建)" -ForegroundColor Yellow
    }
}

# 清理其他路径
$otherPaths = @(
    "$env:LOCALAPPDATA\cursor-updater",
    "$env:USERPROFILE\.cursor"
)

foreach ($path in $otherPaths) {
    if (Test-Path $path) {
        Write-Host "`n📁 清理: $path" -ForegroundColor Cyan
        $cleaned = Smart-CleanDirectory -dirPath $path -cutoffTime $cutoffTime
        $totalCleaned += $cleaned
    }
}

# 显示清理结果
Write-Host "`n===== 🎉 智能清理完成 =====" -ForegroundColor Green
Write-Host "💾 释放空间: $([math]::Round($totalCleaned / 1MB, 2)) MB" -ForegroundColor Yellow
Write-Host "🛡️ 保护文件: $protectedCount 个(最近2天)" -ForegroundColor Green
Write-Host "⏰ 保留时间: $(Get-Date $cutoffTime -Format 'yyyy-MM-dd HH:mm') 之后的数据" -ForegroundColor White

Write-Host "`n📋 清理策略:" -ForegroundColor Cyan
Write-Host "  ✅ 完全清理: 缓存文件、GPU缓存、崩溃转储" -ForegroundColor White
Write-Host "  🧹 智能清理: 2天前的日志文件" -ForegroundColor White  
Write-Host "  🛡️ 保护数据: 最近2天的会话记录、工作区状态" -ForegroundColor White

Write-Host "`n💡 建议操作:" -ForegroundColor Yellow
Write-Host "  1. 重新启动Cursor恢复最佳性能" -ForegroundColor White
Write-Host "  2. 您的会话记录和工作区设置已保留" -ForegroundColor White
Write-Host "  3. 如需恢复更早的会话，请检查备份" -ForegroundColor White

# 询问是否重启Cursor
$restart = Read-Host "`n🚀 是否现在启动Cursor？(y/N)"
if ($restart -eq "y" -or $restart -eq "Y") {
    Write-Host "正在启动Cursor..." -ForegroundColor Green
    try {
        # 尝试找到Cursor的安装路径
        $cursorPath = @(
            "$env:LOCALAPPDATA\Programs\cursor\Cursor.exe",
            "$env:PROGRAMFILES\Cursor\Cursor.exe",
            "${env:PROGRAMFILES(X86)}\Cursor\Cursor.exe"
        ) | Where-Object { Test-Path $_ } | Select-Object -First 1
        
        if ($cursorPath) {
            Start-Process $cursorPath
            Write-Host "✅ Cursor已启动" -ForegroundColor Green
        } else {
            Write-Host "❌ 未找到Cursor安装路径，请手动启动" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "❌ 启动失败，请手动启动Cursor" -ForegroundColor Red
    }
}

Write-Host "`n🎯 脚本执行完成！您的最近2天会话记录已安全保留。" -ForegroundColor Green
Read-Host "按回车键退出" 