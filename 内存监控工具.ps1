# Cursor 内存监控工具
# 保留AI功能的内存优化监控

param(
    [int]$Duration = 60,  # 监控时长（秒）
    [int]$Interval = 5    # 检查间隔（秒）
)

Write-Host "🧠 Cursor 内存监控工具" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host "目标：保持AI功能，优化内存使用" -ForegroundColor Green
Write-Host "监控时长：$Duration 秒，检查间隔：$Interval 秒" -ForegroundColor Yellow
Write-Host ""

# 创建监控数据收集
$memoryData = @()
$startTime = Get-Date

for ($i = 0; $i -lt ($Duration / $Interval); $i++) {
    $currentTime = Get-Date
    
    # 获取Cursor进程信息
    $cursorProcesses = Get-Process -Name '*cursor*' -ErrorAction SilentlyContinue
    
    if ($cursorProcesses) {
        $totalMemory = ($cursorProcesses | Measure-Object WorkingSet -Sum).Sum / 1MB
        $processCount = $cursorProcesses.Count
        
        # 显示当前状态
        Write-Host "⏰ $($currentTime.ToString('HH:mm:ss'))" -ForegroundColor Gray -NoNewline
        Write-Host " | 内存: " -NoNewline
        
        # 根据内存使用量显示不同颜色
        if ($totalMemory -lt 600) {
            Write-Host "$([math]::Round($totalMemory, 2)) MB" -ForegroundColor Green -NoNewline
            Write-Host " ✅ 优秀"
        } elseif ($totalMemory -lt 800) {
            Write-Host "$([math]::Round($totalMemory, 2)) MB" -ForegroundColor Yellow -NoNewline
            Write-Host " ⚠️  良好"
        } elseif ($totalMemory -lt 1200) {
            Write-Host "$([math]::Round($totalMemory, 2)) MB" -ForegroundColor Orange -NoNewline
            Write-Host " 🔶 偏高"
        } else {
            Write-Host "$([math]::Round($totalMemory, 2)) MB" -ForegroundColor Red -NoNewline
            Write-Host " 🔴 过高"
        }
        
        Write-Host " | 进程数: $processCount"
        
        # 收集数据
        $memoryData += [PSCustomObject]@{
            Time = $currentTime
            MemoryMB = [math]::Round($totalMemory, 2)
            ProcessCount = $processCount
        }
        
        # 内存过高时的实时建议
        if ($totalMemory -gt 1000) {
            Write-Host "💡 建议：运行内存清理工具" -ForegroundColor Magenta
        }
        
    } else {
        Write-Host "❌ 未检测到Cursor进程" -ForegroundColor Red
    }
    
    Start-Sleep $Interval
}

Write-Host ""
Write-Host "📊 监控总结报告" -ForegroundColor Cyan
Write-Host "=================" -ForegroundColor Cyan

if ($memoryData.Count -gt 0) {
    $avgMemory = ($memoryData | Measure-Object MemoryMB -Average).Average
    $maxMemory = ($memoryData | Measure-Object MemoryMB -Maximum).Maximum
    $minMemory = ($memoryData | Measure-Object MemoryMB -Minimum).Minimum
    
    Write-Host "平均内存使用: $([math]::Round($avgMemory, 2)) MB" -ForegroundColor White
    Write-Host "最高内存使用: $([math]::Round($maxMemory, 2)) MB" -ForegroundColor Red
    Write-Host "最低内存使用: $([math]::Round($minMemory, 2)) MB" -ForegroundColor Green
    
    # 内存趋势分析
    if ($memoryData.Count -gt 2) {
        $firstHalf = $memoryData[0..([math]::Floor($memoryData.Count/2)-1)]
        $secondHalf = $memoryData[([math]::Floor($memoryData.Count/2))..($memoryData.Count-1)]
        
        $firstAvg = ($firstHalf | Measure-Object MemoryMB -Average).Average
        $secondAvg = ($secondHalf | Measure-Object MemoryMB -Average).Average
        
        if ($secondAvg -gt $firstAvg * 1.1) {
            Write-Host "📈 内存趋势: 持续增长" -ForegroundColor Red
            Write-Host "💡 建议: 立即运行内存清理" -ForegroundColor Yellow
        } elseif ($secondAvg -lt $firstAvg * 0.9) {
            Write-Host "📉 内存趋势: 持续下降" -ForegroundColor Green
            Write-Host "✅ 内存管理良好" -ForegroundColor Green
        } else {
            Write-Host "📊 内存趋势: 相对稳定" -ForegroundColor Yellow
        }
    }
    
    Write-Host ""
    Write-Host "🎯 优化建议:" -ForegroundColor Cyan
    
    if ($avgMemory -gt 1000) {
        Write-Host "🔴 内存过高 - 立即执行:" -ForegroundColor Red
        Write-Host "   1. 运行 '内存优化清理工具.bat'" -ForegroundColor White
        Write-Host "   2. Ctrl+Shift+P → 'Developer: Reload Window'" -ForegroundColor White
        Write-Host "   3. 检查大文件是否已打开" -ForegroundColor White
    } elseif ($avgMemory -gt 800) {
        Write-Host "🔶 内存偏高 - 建议执行:" -ForegroundColor Yellow
        Write-Host "   1. 定期运行内存清理工具" -ForegroundColor White
        Write-Host "   2. 检查.vscode/settings.json配置" -ForegroundColor White
    } else {
        Write-Host "✅ 内存使用良好，AI功能运行正常" -ForegroundColor Green
    }
    
} else {
    Write-Host "❌ 无监控数据" -ForegroundColor Red
}

Write-Host ""
Write-Host "💡 提示: 重新运行监控 -> .\内存监控工具.ps1 -Duration 120" -ForegroundColor Gray 