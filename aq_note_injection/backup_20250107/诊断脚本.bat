@echo off
chcp 65001 >nul
title Cursor 系统诊断工具
echo.
echo 🔍 Cursor 系统诊断工具
echo =======================
echo.

echo 1️⃣ 检查PowerShell版本和执行策略...
powershell -Command "& {
    Write-Host ('PowerShell版本: ' + $PSVersionTable.PSVersion)
    Write-Host ('执行策略: ' + (Get-ExecutionPolicy))
}"
echo.

echo 2️⃣ 检查Cursor安装路径...
if exist "%APPDATA%\Cursor" (
    echo ✅ Cursor用户目录存在: %APPDATA%\Cursor
    dir "%APPDATA%\Cursor" | findstr /C:"<DIR>"
) else (
    echo ❌ Cursor用户目录不存在
)
echo.

echo 3️⃣ 检查Cursor进程状态...
tasklist | findstr /i cursor
echo.

echo 4️⃣ 检查系统内存状态...
powershell -Command "& {
    $mem = Get-WmiObject -Class Win32_OperatingSystem
    $total = [math]::Round($mem.TotalVisibleMemorySize/1024/1024, 2)
    $free = [math]::Round($mem.FreePhysicalMemory/1024/1024, 2)
    $used = $total - $free
    $usage = [math]::Round(($used / $total) * 100, 2)
    
    Write-Host ('总内存: ' + $total + ' GB')
    Write-Host ('已使用: ' + $used + ' GB (' + $usage + '%)')
    Write-Host ('可用: ' + $free + ' GB')
}"
echo.

echo 5️⃣ 检查临时文件夹权限...
echo 临时文件夹: %TEMP%
dir "%TEMP%" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ 临时文件夹可访问
) else (
    echo ❌ 临时文件夹访问失败
)
echo.

echo 6️⃣ 检查管理员权限...
net session >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ 当前具有管理员权限
) else (
    echo ❌ 当前没有管理员权限
)
echo.

echo 诊断完成！请将以上信息发送给技术支持。
pause 