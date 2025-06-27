# Cursor 日期指定缓存清理脚本
# 清理指定日期（包括）之前的所有缓存数据

param(
    [int]$Day = 20,  # 默认清理20号（包括20号）及之前的数据
    [int]$Month = 6, # 默认6月
    [int]$Year = 2025 # 默认2025年
)

Write-Host "===== Cursor 日期指定缓存清理工具 =====" -ForegroundColor Green
Write-Host "🗓️ 清理 $Year-$Month-$Day (包括当天) 及之前的所有缓存数据" -ForegroundColor Cyan

# 构建截止时间（当天23:59:59）
try {
    $cutoffDate = Get-Date -Year $Year -Month $Month -Day $Day -Hour 23 -Minute 59 -Second 59
    Write-Host "⏰ 清理截止时间: $($cutoffDate.ToString('yyyy-MM-dd HH:mm:ss'))" -ForegroundColor Yellow
} catch {
    Write-Host "❌ 日期格式错误，请检查年月日参数" -ForegroundColor Red
    exit 1
}

# 检查Cursor是否正在运行
$cursorProcesses = Get-Process -Name "Cursor" -ErrorAction SilentlyContinue
if ($cursorProcesses) {
    Write-Host "⚠️ 检测到Cursor正在运行" -ForegroundColor Red
    $response = Read-Host "是否强制终止Cursor进程并继续清理？(y/N)"
    if ($response -eq "y" -or $response -eq "Y") {
        Write-Host "正在终止Cursor进程..." -ForegroundColor Yellow
        Stop-Process -Name "Cursor" -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
        Write-Host "✅ Cursor进程已终止" -ForegroundColor Green
    } else {
        Write-Host "清理已取消。请先关闭Cursor后重新运行此脚本。" -ForegroundColor Red
        exit
    }
}

# 定义清理路径
$basePaths = @(
    "$env:APPDATA\Cursor",
    "$env:LOCALAPPDATA\Cursor",
    "$env:LOCALAPPDATA\cursor-updater",
    "$env:USERPROFILE\.cursor"
)

# 所有需要清理的目录类型
$allCleanDirs = @(
    "CachedData",
    "GPUCache", 
    "ShaderCache",
    "DawnCache",
    "Code Cache",
    "CachedExtensions",
    "crashDumps",
    "logs",
    "User\logs",
    "User\workspaceStorage",
    "User\globalStorage", 
    "User\History",
    "extensions\logs"
)

$totalCleaned = 0
$totalFiles = 0
$skippedFiles = 0

# 日期清理函数
function Clean-ByDate {
    param(
        [string]$dirPath,
        [DateTime]$cutoffDate
    )
    
    if (-not (Test-Path $dirPath)) {
        return @{ Size = 0; Files = 0; Skipped = 0 }
    }
    
    $cleaned = 0
    $files = 0
    $skipped = 0
    
    try {
        Write-Host "    🔍 扫描: $dirPath" -ForegroundColor Gray
        
        # 获取所有文件和目录
        $items = Get-ChildItem $dirPath -Recurse -Force -ErrorAction SilentlyContinue | Sort-Object FullName -Descending
        
        foreach ($item in $items) {
            $itemDate = $item.LastWriteTime
            
            if ($itemDate -le $cutoffDate) {
                try {
                    $size = if ($item.PSIsContainer) { 
                        # 对于目录，计算其大小（如果为空则删除）
                        $childItems = Get-ChildItem $item.FullName -Force -ErrorAction SilentlyContinue
                        if ($childItems.Count -eq 0) {
                            0
                        } else {
                            ($childItems | Measure-Object -Property Length -Sum -ErrorAction SilentlyContinue).Sum
                        }
                    } else { 
                        $item.Length 
                    }
                    
                    Remove-Item $item.FullName -Recurse -Force -ErrorAction SilentlyContinue
                    $cleaned += $size
                    $files++
                    
                    $dateStr = $itemDate.ToString('MM-dd HH:mm')
                    Write-Host "      🗑️ 删除: $($item.Name) ($dateStr)" -ForegroundColor Red
                    
                } catch {
                    $skipped++
                    Write-Host "      ⚠️ 跳过: $($item.Name) (删除失败)" -ForegroundColor Yellow
                }
            } else {
                $skipped++
                $dateStr = $itemDate.ToString('MM-dd HH:mm')
                Write-Host "      ⏭️ 保留: $($item.Name) ($dateStr)" -ForegroundColor Green
            }
        }
    } catch {
        Write-Host "    ❌ 扫描失败: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    return @{ Size = $cleaned; Files = $files; Skipped = $skipped }
}

# 开始清理
Write-Host "`n🚀 开始日期指定清理..." -ForegroundColor Cyan

foreach ($basePath in $basePaths) {
    if (-not (Test-Path $basePath)) {
        Write-Host "📁 跳过不存在的路径: $basePath" -ForegroundColor Gray
        continue
    }
    
    Write-Host "`n📁 处理目录: $basePath" -ForegroundColor Cyan
    
    foreach ($dir in $allCleanDirs) {
        $fullPath = Join-Path $basePath $dir
        if (Test-Path $fullPath) {
            Write-Host "  📂 清理: $dir" -ForegroundColor White
            $result = Clean-ByDate -dirPath $fullPath -cutoffDate $cutoffDate
            
            $totalCleaned += $result.Size
            $totalFiles += $result.Files
            $skippedFiles += $result.Skipped
            
            if ($result.Files -gt 0) {
                $sizeStr = [math]::Round($result.Size / 1MB, 2)
                Write-Host "    ✅ 清理完成: $($result.Files) 个文件/目录, $sizeStr MB" -ForegroundColor Green
            } else {
                Write-Host "    ℹ️ 无需清理 (无匹配日期文件)" -ForegroundColor Gray
            }
        } else {
            Write-Host "  📂 跳过: $dir (不存在)" -ForegroundColor Gray
        }
    }
}

# 清理临时文件
Write-Host "`n🗂️ 清理临时文件..." -ForegroundColor Cyan
$tempFiles = Get-ChildItem $env:TEMP -Filter "*cursor*" -Force -ErrorAction SilentlyContinue
$tempCleaned = 0
$tempFiles_count = 0

foreach ($file in $tempFiles) {
    if ($file.LastWriteTime -le $cutoffDate) {
        try {
            $size = if ($file.PSIsContainer) { 
                (Get-ChildItem $file.FullName -Recurse -Force -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum 
            } else { 
                $file.Length 
            }
            Remove-Item $file.FullName -Recurse -Force -ErrorAction SilentlyContinue
            $tempCleaned += $size
            $tempFiles_count++
            Write-Host "  🗑️ 删除: $($file.Name) ($($file.LastWriteTime.ToString('MM-dd HH:mm')))" -ForegroundColor Red
        } catch {
            Write-Host "  ⚠️ 跳过: $($file.Name) (删除失败)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "  ⏭️ 保留: $($file.Name) ($($file.LastWriteTime.ToString('MM-dd HH:mm')))" -ForegroundColor Green
    }
}

$totalCleaned += $tempCleaned
$totalFiles += $tempFiles_count

# 显示清理结果
Write-Host "`n===== 🎉 日期清理完成 =====" -ForegroundColor Green
Write-Host "📅 清理范围: $Year-$Month-$Day 23:59:59 及之前" -ForegroundColor White
Write-Host "💾 释放空间: $([math]::Round($totalCleaned / 1MB, 2)) MB" -ForegroundColor Yellow
Write-Host "🗑️ 删除文件: $totalFiles 个" -ForegroundColor Red
Write-Host "⏭️ 保留文件: $skippedFiles 个" -ForegroundColor Green
Write-Host "⚡ 建议重启Cursor获得最佳效果" -ForegroundColor Cyan

# 询问是否重启Cursor
$restart = Read-Host "`n是否立即启动Cursor？(y/N)"
if ($restart -eq "y" -or $restart -eq "Y") {
    Write-Host "🚀 正在启动Cursor..." -ForegroundColor Green
    Start-Process "Cursor" -ErrorAction SilentlyContinue
}

Write-Host "`n✨ 清理完成！Cursor应该运行得更快了。" -ForegroundColor Green 