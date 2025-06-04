@echo off
chcp 65001 >nul
title Cursor 快速内存优化 v1.0
echo.
echo 🚀 Cursor 快速内存优化工具
echo ==============================
echo 状态：无需管理员权限的基础优化
echo.

echo 📊 检查Cursor进程状态...
tasklist /fi "imagename eq Cursor.exe" 2>nul | find /i "Cursor.exe" >nul
if %errorlevel%==0 (
    echo ✅ 发现Cursor进程正在运行
) else (
    echo ⚠️  未发现Cursor进程，请先启动Cursor
)
echo.

echo 🔧 开始基础内存优化...

echo.
echo 1️⃣ 清理系统垃圾回收...
powershell -ExecutionPolicy Bypass -NoProfile -Command "[System.GC]::Collect(); [System.GC]::WaitForPendingFinalizers(); [System.GC]::Collect(); Write-Host '    ✅ 垃圾回收完成'"

echo.
echo 2️⃣ 清理临时文件...
del /f /q "%TEMP%\*.tmp" 2>nul
del /f /q "%TEMP%\*.log" 2>nul
echo     ✅ 清理系统临时文件

echo.
echo 3️⃣ 清理Cursor缓存...
if exist "%APPDATA%\Cursor\logs" (
    del /f /q "%APPDATA%\Cursor\logs\*.log" 2>nul
    echo     ✅ 清理Cursor日志文件
)

if exist "%LOCALAPPDATA%\Cursor\User\CachedData" (
    for /d %%i in ("%LOCALAPPDATA%\Cursor\User\CachedData\*") do (
        rd /s /q "%%i\logs" 2>nul
    )
    echo     ✅ 清理扩展日志
)

echo.
echo 4️⃣ 优化内存工作集...
powershell -ExecutionPolicy Bypass -NoProfile -Command "& {
    try {
        $processes = Get-Process -Name '*cursor*' -ErrorAction SilentlyContinue
        if ($processes) {
            $count = 0
            foreach ($proc in $processes) {
                try {
                    # 尝试优化工作集
                    $proc.MaxWorkingSet = $proc.WorkingSet
                    $proc.MinWorkingSet = $proc.WorkingSet / 2
                    $count++
                } catch { }
            }
            Write-Host ('    ✅ 优化了 ' + $count + ' 个进程')
        } else {
            Write-Host '    ℹ️  未找到Cursor进程'
        }
    } catch {
        Write-Host '    ⚠️  优化失败，可能需要更高权限'
    }
}"

echo.
echo 5️⃣ 显示内存使用情况...
powershell -ExecutionPolicy Bypass -NoProfile -Command "& {
    try {
        $procs = Get-Process -Name '*cursor*' -ErrorAction SilentlyContinue
        if ($procs) {
            $totalMem = ($procs | Measure-Object WorkingSet -Sum).Sum / 1MB
            Write-Host ('Cursor总内存使用: ' + [math]::Round($totalMem, 2) + ' MB')
            $procs | Select-Object Name, @{Name='Memory(MB)';Expression={[math]::Round($_.WorkingSet/1MB,2)}} | Sort-Object 'Memory(MB)' -Descending | Format-Table -AutoSize
        }
    } catch {
        Write-Host '无法获取内存信息'
    }
}"

echo.
echo 🎯 基础优化完成！
echo.
echo 💡 如需更深度优化，请运行：内存优化清理工具_改进版.bat
echo 💡 建议配合使用：每隔1-2小时运行一次
echo.

:: 询问是否创建快捷方式
echo 🔗 是否创建桌面快捷方式？(Y/N)
choice /c YN /n /m "请选择 [Y/N]: "
if %errorlevel%==1 (
    powershell -ExecutionPolicy Bypass -Command "& {
        try {
            $ws = New-Object -ComObject WScript.Shell
            $shortcut = $ws.CreateShortcut([Environment]::GetFolderPath('Desktop') + '\Cursor快速优化.lnk')
            $shortcut.TargetPath = '%~f0'
            $shortcut.WorkingDirectory = '%~dp0'
            $shortcut.Description = 'Cursor快速内存优化工具'
            $shortcut.Save()
            Write-Host '✅ 桌面快捷方式创建成功'
        } catch {
            Write-Host '⚠️  快捷方式创建失败'
        }
    }"
)

echo.
pause 