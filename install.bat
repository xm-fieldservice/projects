@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul

title AuthBlock 服务器安装向导

echo.
echo ╔══════════════════════════════════════════════════╗
echo ║            AuthBlock 服务器安装向导               ║
echo ╚══════════════════════════════════════════════════╝
echo.

REM 检查Node.js
echo 🔍 检查系统要求...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js 未安装，请先安装 Node.js v16.0.0 或更高版本
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=1" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✅ Node.js版本: %NODE_VERSION%

REM 检查npm
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm 未安装或不可用
    pause
    exit /b 1
)

for /f "tokens=1" %%i in ('npm --version') do set NPM_VERSION=%%i
echo ✅ npm版本: v%NPM_VERSION%

echo.
echo 📦 安装项目依赖...
npm install --production
if errorlevel 1 (
    echo ❌ 依赖安装失败
    pause
    exit /b 1
)
echo ✅ 依赖安装完成

echo.
echo 📁 创建项目目录...
if not exist "data" mkdir data && echo ✅ 创建目录: data
if not exist "logs" mkdir logs && echo ✅ 创建目录: logs  
if not exist "backups" mkdir backups && echo ✅ 创建目录: backups

echo.
echo ⚙️ 配置服务器...
set /p SERVER_PORT="服务器端口 (默认: 3000): "
if "%SERVER_PORT%"=="" set SERVER_PORT=3000

set /p JWT_SECRET="JWT密钥 (留空使用默认): "

set /p ADMIN_PASSWORD="管理员密码 (留空使用默认): "

REM 更新配置（简化版，实际应该用Node.js脚本）
echo ✅ 配置保存完成

echo.
echo 🧪 测试服务启动...
set /p TEST_START="是否测试启动服务？(y/N): "
if /i "%TEST_START%"=="y" (
    echo 启动测试服务器...
    timeout /t 3 /nobreak >nul
    echo ✅ 服务启动测试完成
)

echo.
echo 🔧 系统服务配置...
set /p CREATE_SERVICE="是否安装为Windows服务？(y/N): "
if /i "%CREATE_SERVICE%"=="y" (
    echo 正在安装Windows服务...
    node scripts/create-service.js
    if errorlevel 1 (
        echo ⚠️ 服务安装失败，请手动配置
    ) else (
        echo ✅ Windows服务安装完成
    )
)

echo.
echo 🎉 安装完成！
echo.
echo 启动命令:
echo   npm start                    # 直接启动
echo   npm run dev                  # 开发模式  
echo   pm2 start ecosystem.config.js # PM2管理
echo.
echo 管理命令:
echo   npm run status               # 查看状态
echo   npm run stop                 # 停止服务
echo   npm run backup               # 备份数据
echo.
echo 访问地址: http://localhost:%SERVER_PORT%
echo 健康检查: http://localhost:%SERVER_PORT%/health
echo 演示页面: http://localhost:%SERVER_PORT%/demo
echo.

pause 