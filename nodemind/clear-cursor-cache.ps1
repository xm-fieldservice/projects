# Cursor缓存清理脚本 - PowerShell版本
# 用于清理Cursor编辑器的缓存和临时文件，提升响应速度

Write-Host "===== Cursor 缓存清理工具 =====" -ForegroundColor Green
Write-Host "正在清理Cursor缓存，请稍候..." -ForegroundColor Yellow

# 检查Cursor是否正在运行
$cursorProcesses = Get-Process -Name "Cursor" -ErrorAction SilentlyContinue
if ($cursorProcesses) {
    Write-Host "检测到Cursor正在运行，建议先关闭Cursor后再执行清理" -ForegroundColor Red
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

# 定义需要清理的目录路径
$cleanupPaths = @(
    "$env:APPDATA\Cursor",
    "$env:LOCALAPPDATA\Cursor", 
    "$env:LOCALAPPDATA\cursor-updater",
    "$env:TEMP\cursor*",
    "$env:USERPROFILE\.cursor",
    "$env:LOCALAPPDATA\Programs\cursor\resources\app\extensions"
)

# 定义具体的缓存子目录
$cacheSubDirs = @(
    "CachedData",
    "logs", 
    "User\workspaceStorage",
    "User\globalStorage",
    "User\History",
    "User\logs",
    "crashDumps",
    "GPUCache",
    "ShaderCache",
    "DawnCache",
    "Code Cache",
    "CachedExtensions",
    "extensions\logs"
)

$totalCleaned = 0
$cleanedItems = @()

# 清理主要缓存目录
foreach ($basePath in $cleanupPaths) {
    if (Test-Path $basePath) {
        Write-Host "清理目录: $basePath" -ForegroundColor Cyan
        
        # 如果是临时文件夹的cursor相关文件
        if ($basePath -like "*\cursor*") {
            try {
                $items = Get-ChildItem $basePath -Force -ErrorAction SilentlyContinue
                foreach ($item in $items) {
                    $size = if ($item.PSIsContainer) { 
                        (Get-ChildItem $item.FullName -Recurse -Force -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum 
                    } else { 
                        $item.Length 
                    }
                    Remove-Item $item.FullName -Recurse -Force -ErrorAction SilentlyContinue
                    $totalCleaned += $size
                    $cleanedItems += $item.Name
                }
            } catch {
                Write-Host "  无法清理: $($_.Exception.Message)" -ForegroundColor Red
            }
        } else {
            # 清理子目录
            foreach ($subDir in $cacheSubDirs) {
                $fullPath = Join-Path $basePath $subDir
                if (Test-Path $fullPath) {
                    try {
                        $size = (Get-ChildItem $fullPath -Recurse -Force -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
                        Remove-Item $fullPath -Recurse -Force -ErrorAction SilentlyContinue
                        $totalCleaned += $size
                        $cleanedItems += $subDir
                        Write-Host "  已清理: $subDir" -ForegroundColor Green
                    } catch {
                        Write-Host "  无法清理: $subDir - $($_.Exception.Message)" -ForegroundColor Red
                    }
                }
            }
        }
    }
}

# 清理Windows临时文件夹中的cursor相关文件
Write-Host "清理临时文件..." -ForegroundColor Cyan
$tempFiles = Get-ChildItem $env:TEMP -Filter "*cursor*" -Force -ErrorAction SilentlyContinue
foreach ($file in $tempFiles) {
    try {
        $size = if ($file.PSIsContainer) { 
            (Get-ChildItem $file.FullName -Recurse -Force -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum 
        } else { 
            $file.Length 
        }
        Remove-Item $file.FullName -Recurse -Force -ErrorAction SilentlyContinue
        $totalCleaned += $size
        $cleanedItems += $file.Name
        Write-Host "  已清理: $($file.Name)" -ForegroundColor Green
    } catch {
        Write-Host "  无法清理: $($file.Name)" -ForegroundColor Red
    }
}

# 清理注册表缓存（可选）
Write-Host "清理注册表缓存..." -ForegroundColor Cyan
try {
    $regPaths = @(
        "HKCU:\Software\Cursor",
        "HKCU:\Software\Microsoft\Windows\CurrentVersion\ApplicationAssociationToasts"
    )
    
    foreach ($regPath in $regPaths) {
        if (Test-Path $regPath) {
            $keys = Get-ChildItem $regPath -ErrorAction SilentlyContinue | Where-Object { $_.Name -like "*cursor*" }
            foreach ($key in $keys) {
                Remove-Item $key.PSPath -Recurse -Force -ErrorAction SilentlyContinue
                Write-Host "  已清理注册表项: $($key.Name)" -ForegroundColor Green
            }
        }
    }
} catch {
    Write-Host "  注册表清理跳过（需要管理员权限）" -ForegroundColor Yellow
}

# 显示清理结果
Write-Host "`n===== 清理完成 =====" -ForegroundColor Green
Write-Host "总计清理空间: $([math]::Round($totalCleaned / 1MB, 2)) MB" -ForegroundColor Yellow
Write-Host "清理项目数量: $($cleanedItems.Count)" -ForegroundColor Yellow

if ($cleanedItems.Count -gt 0) {
    Write-Host "`n已清理的项目:" -ForegroundColor Cyan
    $cleanedItems | Sort-Object | Get-Unique | ForEach-Object { Write-Host "  - $_" -ForegroundColor White }
}

Write-Host "`n建议操作:" -ForegroundColor Yellow
Write-Host "1. 重启计算机以完全释放所有资源" -ForegroundColor White
Write-Host "2. 重新启动Cursor，首次启动可能稍慢" -ForegroundColor White
Write-Host "3. 如果问题依然存在，考虑重新安装Cursor" -ForegroundColor White

# 询问是否重启Cursor
$restart = Read-Host "`n是否现在启动Cursor？(y/N)"
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
            Write-Host "Cursor已启动" -ForegroundColor Green
        } else {
            Write-Host "未找到Cursor安装路径，请手动启动" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "启动失败，请手动启动Cursor" -ForegroundColor Red
    }
}

Write-Host "`n脚本执行完成！" -ForegroundColor Green
Read-Host "按回车键退出" 