# 复制以下命令到PowerShell终端中执行（智能清理Cursor缓存-保留2天会话）

# 单行版本（复制整行执行）：
Write-Host "开始智能清理Cursor缓存(保留2天会话)..." -ForegroundColor Green; $cutoff = (Get-Date).AddDays(-2); $paths = @("$env:APPDATA\Cursor", "$env:LOCALAPPDATA\Cursor", "$env:LOCALAPPDATA\cursor-updater", "$env:USERPROFILE\.cursor"); $fullClean = @("CachedData", "crashDumps", "GPUCache", "ShaderCache", "DawnCache", "Code Cache", "CachedExtensions"); $smartClean = @("logs", "User\logs", "User\workspaceStorage", "User\globalStorage", "User\History"); $total = 0; Get-Process -Name "Cursor" -ErrorAction SilentlyContinue | Stop-Process -Force; foreach($p in $paths){ if(Test-Path $p){ foreach($c in $fullClean){ $fp = Join-Path $p $c; if(Test-Path $fp){ $size = (Get-ChildItem $fp -Recurse -Force -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum; Remove-Item $fp -Recurse -Force -ErrorAction SilentlyContinue; $total += $size; Write-Host "已清理: $c" -ForegroundColor Yellow }}; foreach($s in $smartClean){ $sp = Join-Path $p $s; if(Test-Path $sp){ Get-ChildItem $sp -Recurse -Force -ErrorAction SilentlyContinue | Where-Object { $_.LastWriteTime -lt $cutoff } | ForEach-Object { $total += $_.Length; Remove-Item $_.FullName -Force -ErrorAction SilentlyContinue }; Write-Host "智能清理: $s (保留2天)" -ForegroundColor Cyan }}}}; Get-ChildItem $env:TEMP -Filter "*cursor*" -Force -ErrorAction SilentlyContinue | Where-Object { $_.LastWriteTime -lt $cutoff } | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue; Write-Host "智能清理完成！释放空间: $([math]::Round($total/1MB,2)) MB，保留最近2天会话" -ForegroundColor Green

# 或者使用以下多行版本（更易读，复制全部执行）：

Write-Host "===== 智能清理Cursor缓存(保留2天会话) =====" -ForegroundColor Green

# 设置保留时间点
$cutoffTime = (Get-Date).AddDays(-2)
Write-Host "保留时间点: $($cutoffTime.ToString('MM-dd HH:mm')) 之后的数据" -ForegroundColor Yellow

# 终止Cursor进程
Get-Process -Name "Cursor" -ErrorAction SilentlyContinue | ForEach-Object {
    Write-Host "终止Cursor进程: $($_.Id)" -ForegroundColor Yellow
    Stop-Process -Id $_.Id -Force
}

# 清理路径
$cleanupPaths = @(
    "$env:APPDATA\Cursor",
    "$env:LOCALAPPDATA\Cursor", 
    "$env:LOCALAPPDATA\cursor-updater",
    "$env:USERPROFILE\.cursor"
)

# 完全清理的缓存目录（性能相关）
$fullCleanTypes = @(
    "CachedData", "crashDumps", "GPUCache", "ShaderCache", 
    "DawnCache", "Code Cache", "CachedExtensions"
)

# 智能清理的会话目录（保留2天）
$smartCleanTypes = @(
    "logs", "User\logs", "User\workspaceStorage", "User\globalStorage", "User\History"
)

$totalCleaned = 0

foreach ($basePath in $cleanupPaths) {
    if (Test-Path $basePath) {
        Write-Host "处理目录: $basePath" -ForegroundColor Cyan
        
        # 完全清理缓存
        foreach ($cacheType in $fullCleanTypes) {
            $fullPath = Join-Path $basePath $cacheType
            if (Test-Path $fullPath) {
                try {
                    $size = (Get-ChildItem $fullPath -Recurse -Force -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
                    Remove-Item $fullPath -Recurse -Force -ErrorAction SilentlyContinue
                    $totalCleaned += $size
                    Write-Host "  ✓ 完全清理: $cacheType" -ForegroundColor Green
                } catch {
                    Write-Host "  ✗ $cacheType (跳过)" -ForegroundColor Red
                }
            }
        }
        
        # 智能清理会话数据
        foreach ($sessionType in $smartCleanTypes) {
            $fullPath = Join-Path $basePath $sessionType
            if (Test-Path $fullPath) {
                try {
                    $oldFiles = Get-ChildItem $fullPath -Recurse -Force -ErrorAction SilentlyContinue | Where-Object { $_.LastWriteTime -lt $cutoffTime }
                    $oldSize = ($oldFiles | Measure-Object -Property Length -Sum).Sum
                    $oldFiles | Remove-Item -Force -ErrorAction SilentlyContinue
                    $totalCleaned += $oldSize
                    
                    $remainFiles = (Get-ChildItem $fullPath -Recurse -Force -ErrorAction SilentlyContinue | Where-Object { $_.LastWriteTime -ge $cutoffTime }).Count
                    Write-Host "  🛡️ 智能清理: $sessionType (保留$remainFiles个最新文件)" -ForegroundColor Cyan
                } catch {
                    Write-Host "  ✗ $sessionType (跳过)" -ForegroundColor Red
                }
            }
        }
    }
}

# 智能清理临时文件
Write-Host "智能清理临时文件..." -ForegroundColor Cyan
Get-ChildItem $env:TEMP -Filter "*cursor*" -Force -ErrorAction SilentlyContinue | ForEach-Object {
    if ($_.LastWriteTime -lt $cutoffTime) {
        $size = if ($_.PSIsContainer) { 
            (Get-ChildItem $_.FullName -Recurse -Force -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum 
        } else { 
            $_.Length 
        }
        Remove-Item $_.FullName -Recurse -Force -ErrorAction SilentlyContinue
        $totalCleaned += $size
        Write-Host "  ✓ 清理: $($_.Name)" -ForegroundColor Green
    } else {
        Write-Host "  🛡️ 保留: $($_.Name) (最近创建)" -ForegroundColor Yellow
    }
}

Write-Host "`n===== 智能清理完成 =====" -ForegroundColor Green
Write-Host "释放空间: $([math]::Round($totalCleaned / 1MB, 2)) MB" -ForegroundColor Yellow
Write-Host "🛡️ 已保留最近2天的会话记录和设置" -ForegroundColor Cyan
Write-Host "🚀 建议重启Cursor获得最佳效果" -ForegroundColor White 