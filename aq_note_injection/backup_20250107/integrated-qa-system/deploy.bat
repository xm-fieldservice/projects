@echo off
chcp 65001 >nul
title 集成智能问答笔记系统 v3.0 - 部署脚本

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                集成智能问答笔记系统 v3.0                      ║
echo ║                     一键部署脚本                             ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

:: 检查Node.js
echo 🔍 检查系统环境...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js 未安装，请先安装 Node.js v16.0.0 或更高版本
    echo 💡 下载地址: https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=1" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✅ Node.js版本: %NODE_VERSION%

:: 检查npm
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm 未安装或不可用
    pause
    exit /b 1
)

for /f "tokens=1" %%i in ('npm --version') do set NPM_VERSION=%%i
echo ✅ npm版本: v%NPM_VERSION%

:: 检查端口占用
echo.
echo 🔍 检查端口占用...
netstat -an | findstr ":3000 " >nul 2>&1
if %errorlevel%==0 (
    echo ⚠️  警告: 端口 3000 已被占用
    set /p CONTINUE="是否继续部署? (y/N): "
    if /i not "!CONTINUE!"=="y" (
        echo 取消部署
        pause
        exit /b 1
    )
) else (
    echo ✅ 端口 3000 可用
)

:: 安装依赖
echo.
echo 📦 安装项目依赖...
npm install
if errorlevel 1 (
    echo ❌ 依赖安装失败
    pause
    exit /b 1
)
echo ✅ 依赖安装完成

:: 创建必要目录
echo.
echo 📁 创建系统目录...
if not exist "data" (
    mkdir data
    echo ✅ 创建目录: data
)
if not exist "logs" (
    mkdir logs
    echo ✅ 创建目录: logs
)

:: 启动服务
echo.
echo 🚀 启动集成问答系统...
echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║  系统即将启动，请在浏览器访问以下地址：                      ║
echo ║                                                              ║
echo ║  🌍 主系统：http://localhost:3000                            ║
echo ║  🔐 登录页面：http://localhost:3000/auth                     ║
echo ║  🤖 问答系统：http://localhost:3000/qa-system/qa-note.html   ║
echo ║  📊 健康检查：http://localhost:3000/health                   ║
echo ║                                                              ║
echo ║  👤 测试账户：                                               ║
echo ║     admin / admin123  (管理员)                              ║
echo ║     demo / demo123    (演示用户)                            ║
echo ║     test / test123    (测试用户)                            ║
echo ║                                                              ║
echo ║  按 Ctrl+C 停止服务器                                       ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

npm start 