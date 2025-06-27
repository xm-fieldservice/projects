@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ===== Cursor 缓存清理工具 =====
echo 正在清理Cursor缓存，请稍候...
echo.

REM 检查Cursor是否正在运行
tasklist /FI "IMAGENAME eq Cursor.exe" 2>NUL | find /I /N "Cursor.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo [警告] 检测到Cursor正在运行
    set /p choice="建议先关闭Cursor。是否强制终止进程？(y/N): "
    if /i "!choice!"=="y" (
        echo 正在终止Cursor进程...
        taskkill /F /IM Cursor.exe >nul 2>&1
        timeout /t 2 >nul
    ) else (
        echo 清理已取消。请先关闭Cursor后重新运行此脚本。
        pause
        exit /b
    )
)

set totalCleaned=0

echo 开始清理缓存目录...
echo.

REM 清理主要缓存目录
set "paths[0]=%APPDATA%\Cursor"
set "paths[1]=%LOCALAPPDATA%\Cursor"
set "paths[2]=%LOCALAPPDATA%\cursor-updater"
set "paths[3]=%USERPROFILE%\.cursor"

for /L %%i in (0,1,3) do (
    if exist "!paths[%%i]!" (
        echo 清理目录: !paths[%%i]!
        
        REM 清理具体的缓存子目录
        for %%d in (
            "CachedData"
            "logs" 
            "User\workspaceStorage"
            "User\globalStorage"
            "User\History"
            "User\logs"
            "crashDumps"
            "GPUCache"
            "ShaderCache"
            "DawnCache"
            "Code Cache"
            "CachedExtensions"
            "extensions\logs"
        ) do (
            if exist "!paths[%%i]!\%%~d" (
                echo   正在清理: %%~d
                rd /s /q "!paths[%%i]!\%%~d" >nul 2>&1
                if !errorlevel! equ 0 (
                    echo   [完成] %%~d
                ) else (
                    echo   [跳过] %%~d - 可能正在使用中
                )
            )
        )
        echo.
    )
)

REM 清理临时文件
echo 清理临时文件...
if exist "%TEMP%\cursor*" (
    for /d %%d in ("%TEMP%\cursor*") do (
        echo   清理: %%d
        rd /s /q "%%d" >nul 2>&1
    )
)

for %%f in ("%TEMP%\cursor*") do (
    if exist "%%f" (
        echo   清理: %%f
        del /f /q "%%f" >nul 2>&1
    )
)

REM 清理扩展缓存目录
if exist "%LOCALAPPDATA%\Programs\cursor\resources\app\extensions" (
    echo 清理扩展缓存...
    for /d %%d in ("%LOCALAPPDATA%\Programs\cursor\resources\app\extensions\*") do (
        if exist "%%d\logs" (
            echo   清理扩展日志: %%~nxd
            rd /s /q "%%d\logs" >nul 2>&1
        )
    )
)

echo.
echo ===== 清理完成 =====
echo.
echo 建议操作:
echo 1. 重启计算机以完全释放所有资源
echo 2. 重新启动Cursor，首次启动可能稍慢
echo 3. 如果问题依然存在，考虑重新安装Cursor
echo.

REM 询问是否启动Cursor
set /p restart="是否现在启动Cursor？(y/N): "
if /i "!restart!"=="y" (
    echo 正在启动Cursor...
    
    REM 尝试找到Cursor的安装路径
    set cursorPath=""
    if exist "%LOCALAPPDATA%\Programs\cursor\Cursor.exe" (
        set cursorPath="%LOCALAPPDATA%\Programs\cursor\Cursor.exe"
    ) else if exist "%PROGRAMFILES%\Cursor\Cursor.exe" (
        set cursorPath="%PROGRAMFILES%\Cursor\Cursor.exe"
    ) else if exist "%PROGRAMFILES(X86)%\Cursor\Cursor.exe" (
        set cursorPath="%PROGRAMFILES(X86)%\Cursor\Cursor.exe"
    )
    
    if not !cursorPath!=="" (
        start "" !cursorPath!
        echo Cursor已启动
    ) else (
        echo 未找到Cursor安装路径，请手动启动
    )
)

echo.
echo 脚本执行完成！
pause 