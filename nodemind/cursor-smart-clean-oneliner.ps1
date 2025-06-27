# 一键智能清理Cursor缓存 - 保留最近2天会话记录

# 单行版本（复制到PowerShell执行）：
Write-Host "🚀 开始智能清理Cursor缓存(保留2天会话)..." -ForegroundColor Green; $cutoff = (Get-Date).AddDays(-2); Get-Process -Name "Cursor" -ErrorAction SilentlyContinue | Stop-Process -Force; $bases = @("$env:APPDATA\Cursor", "$env:LOCALAPPDATA\Cursor"); $full = @("CachedData", "GPUCache", "ShaderCache", "DawnCache", "Code Cache", "CachedExtensions", "crashDumps"); $total = 0; foreach($b in $bases){ foreach($f in $full){ $p = Join-Path $b $f; if(Test-Path $p){ $s = (Get-ChildItem $p -Recurse -Force -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum; Remove-Item $p -Recurse -Force -ErrorAction SilentlyContinue; $total += $s; Write-Host "✅ 清理: $f" -ForegroundColor Yellow }}}; $protect = @("User\workspaceStorage", "User\globalStorage", "User\History"); foreach($b in $bases){ foreach($p in $protect){ $fp = Join-Path $b $p; if(Test-Path $fp){ Get-ChildItem $fp -Recurse -Force -ErrorAction SilentlyContinue | Where-Object { $_.LastWriteTime -lt $cutoff } | ForEach-Object { $total += $_.Length; Remove-Item $_.FullName -Force -ErrorAction SilentlyContinue }}}}; Write-Host "🎉 完成！释放: $([math]::Round($total/1MB,2)) MB，保留最近2天会话" -ForegroundColor Green

# 多行版本（更详细，复制全部执行）：

Write-Host "===== 🛡️ Cursor智能缓存清理 =====" -ForegroundColor Green
Write-Host "保留最近2天会话记录，清理旧缓存" -ForegroundColor Cyan

# 设置保留时间点
$cutoffTime = (Get-Date).AddDays(-2)
Write-Host "⏰ 保留时间: $($cutoffTime.ToString('MM-dd HH:mm')) 之后的数据" -ForegroundColor Yellow

# 终止Cursor进程
Write-Host "`n🔄 终止Cursor进程..."
Get-Process -Name "Cursor" -ErrorAction SilentlyContinue | ForEach-Object {
    Write-Host "  终止进程: $($_.Id)" -ForegroundColor Yellow
    Stop-Process -Id $_.Id -Force
}

# 清理路径
$basePaths = @("$env:APPDATA\Cursor", "$env:LOCALAPPDATA\Cursor")
$totalCleaned = 0
$protectedFiles = 0

# 完全清理缓存
Write-Host "`n🧹 完全清理缓存文件..."
$fullCleanDirs = @("CachedData", "GPUCache", "ShaderCache", "DawnCache", "Code Cache", "CachedExtensions", "crashDumps")

foreach ($basePath in $basePaths) {
    foreach ($dir in $fullCleanDirs) {
        $fullPath = Join-Path $basePath $dir
        if (Test-Path $fullPath) {
            try {
                $size = (Get-ChildItem $fullPath -Recurse -Force -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
                Remove-Item $fullPath -Recurse -Force -ErrorAction SilentlyContinue
                $totalCleaned += $size
                Write-Host "  ✅ $dir" -ForegroundColor Green
            } catch {
                Write-Host "  ❌ $dir (跳过)" -ForegroundColor Red
            }
        }
    }
}

# 智能清理会话目录（保留最近2天）
Write-Host "`n🛡️ 智能清理会话数据..."
$protectedDirs = @("User\workspaceStorage", "User\globalStorage", "User\History", "logs", "User\logs")

foreach ($basePath in $basePaths) {
    foreach ($dir in $protectedDirs) {
        $fullPath = Join-Path $basePath $dir
        if (Test-Path $fullPath) {
            Write-Host "  📁 处理: $dir" -ForegroundColor Cyan
            try {
                $items = Get-ChildItem $fullPath -Recurse -Force -ErrorAction SilentlyContinue
                foreach ($item in $items) {
                    if ($item.LastWriteTime -lt $cutoffTime) {
                        $size = if ($item.PSIsContainer) { 0 } else { $item.Length }
                        Remove-Item $item.FullName -Recurse -Force -ErrorAction SilentlyContinue
                        $totalCleaned += $size
                        Write-Host "    🗑️ 清理: $($item.Name)" -ForegroundColor Yellow
                    } else {
                        $protectedFiles++
                        Write-Host "    🛡️ 保留: $($item.Name)" -ForegroundColor Green
                    }
                }
            } catch {
                Write-Host "    ❌ 处理失败" -ForegroundColor Red
            }
        }
    }
}

# 清理临时文件
Write-Host "`n🗂️ 清理临时文件..."
Get-ChildItem $env:TEMP -Filter "*cursor*" -Force -ErrorAction SilentlyContinue | ForEach-Object {
    if ($_.LastWriteTime -lt $cutoffTime) {
        $size = if ($_.PSIsContainer) { 
            (Get-ChildItem $_.FullName -Recurse -Force -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum 
        } else { $_.Length }
        Remove-Item $_.FullName -Recurse -Force -ErrorAction SilentlyContinue
        $totalCleaned += $size
        Write-Host "  ✅ $($_.Name)" -ForegroundColor Green
    } else {
        Write-Host "  🛡️ $($_.Name) (保留)" -ForegroundColor Yellow
    }
}

# 显示结果
Write-Host "`n===== 🎉 清理完成 =====" -ForegroundColor Green
Write-Host "💾 释放空间: $([math]::Round($totalCleaned / 1MB, 2)) MB" -ForegroundColor Yellow
Write-Host "🛡️ 保护文件: $protectedFiles 个" -ForegroundColor Green
Write-Host "📅 保留数据: $($cutoffTime.ToString('MM-dd HH:mm')) 之后" -ForegroundColor White

Write-Host "`n💡 效果说明:" -ForegroundColor Cyan
Write-Host "  ✅ 清理了所有缓存文件(GPU、着色器等)" -ForegroundColor White
Write-Host "  🛡️ 保留了最近2天的会话记录" -ForegroundColor White
Write-Host "  🚀 Cursor性能应该明显提升" -ForegroundColor White

Write-Host "`n🎯 您的会话记录安全保留！可以重启Cursor体验提升效果。" -ForegroundColor Green 