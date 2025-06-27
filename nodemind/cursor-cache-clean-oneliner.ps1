# 复制以下命令到PowerShell终端中执行（一键清理Cursor缓存）

# 单行版本（复制整行执行）：
Write-Host "开始清理Cursor缓存..." -ForegroundColor Green; $paths = @("$env:APPDATA\Cursor", "$env:LOCALAPPDATA\Cursor", "$env:LOCALAPPDATA\cursor-updater", "$env:USERPROFILE\.cursor"); $caches = @("CachedData", "logs", "User\workspaceStorage", "User\globalStorage", "User\History", "User\logs", "crashDumps", "GPUCache", "ShaderCache", "DawnCache", "Code Cache", "CachedExtensions"); $total = 0; Get-Process -Name "Cursor" -ErrorAction SilentlyContinue | Stop-Process -Force; foreach($p in $paths){ if(Test-Path $p){ foreach($c in $caches){ $fp = Join-Path $p $c; if(Test-Path $fp){ $size = (Get-ChildItem $fp -Recurse -Force -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum; Remove-Item $fp -Recurse -Force -ErrorAction SilentlyContinue; $total += $size; Write-Host "已清理: $c" -ForegroundColor Yellow }}}}; Get-ChildItem $env:TEMP -Filter "*cursor*" -Force -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue; Write-Host "清理完成！释放空间: $([math]::Round($total/1MB,2)) MB" -ForegroundColor Green

# 或者使用以下多行版本（更易读，复制全部执行）：

Write-Host "===== 一键清理Cursor缓存 =====" -ForegroundColor Green

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

# 缓存目录
$cacheTypes = @(
    "CachedData", "logs", "User\workspaceStorage", "User\globalStorage", 
    "User\History", "User\logs", "crashDumps", "GPUCache", "ShaderCache", 
    "DawnCache", "Code Cache", "CachedExtensions"
)

$totalCleaned = 0

foreach ($basePath in $cleanupPaths) {
    if (Test-Path $basePath) {
        Write-Host "清理目录: $basePath" -ForegroundColor Cyan
        foreach ($cacheType in $cacheTypes) {
            $fullPath = Join-Path $basePath $cacheType
            if (Test-Path $fullPath) {
                try {
                    $size = (Get-ChildItem $fullPath -Recurse -Force -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
                    Remove-Item $fullPath -Recurse -Force -ErrorAction SilentlyContinue
                    $totalCleaned += $size
                    Write-Host "  ✓ $cacheType" -ForegroundColor Green
                } catch {
                    Write-Host "  ✗ $cacheType (跳过)" -ForegroundColor Red
                }
            }
        }
    }
}

# 清理临时文件
Write-Host "清理临时文件..." -ForegroundColor Cyan
Get-ChildItem $env:TEMP -Filter "*cursor*" -Force -ErrorAction SilentlyContinue | ForEach-Object {
    $size = if ($_.PSIsContainer) { 
        (Get-ChildItem $_.FullName -Recurse -Force -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum 
    } else { 
        $_.Length 
    }
    Remove-Item $_.FullName -Recurse -Force -ErrorAction SilentlyContinue
    $totalCleaned += $size
    Write-Host "  ✓ $($_.Name)" -ForegroundColor Green
}

Write-Host "`n===== 清理完成 =====" -ForegroundColor Green
Write-Host "释放空间: $([math]::Round($totalCleaned / 1MB, 2)) MB" -ForegroundColor Yellow
Write-Host "建议重启Cursor获得最佳效果" -ForegroundColor White 