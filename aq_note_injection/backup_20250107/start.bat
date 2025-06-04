@echo off
chcp 65001 >nul
title Teams 智能体团队协作系统
color 0A

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    Teams 智能体团队协作系统                   ║
echo ║            从 qa_note_injection 提取的团队协作功能            ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

:: 检查 Node.js
echo [检查] 验证 Node.js 环境...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ [错误] 未检测到 Node.js
    echo    请安装 Node.js 16.0.0 或更高版本
    pause
    exit /b 1
)

echo ✅ [完成] Node.js 版本:
node --version
echo.

:: 安装依赖
echo [步骤 1/3] 安装项目依赖...
call npm install --silent
if %errorlevel% neq 0 (
    echo ❌ [错误] 依赖安装失败
    pause
    exit /b 1
)
echo ✅ [完成] 依赖安装成功
echo.

:: 启动后端服务
echo [步骤 2/3] 启动后端智能体服务...
echo 🚀 启动 Teams 后端服务 (端口: 8001)...
start "Teams Backend" cmd /k "echo Teams 后端智能体服务已启动 && echo 支持的智能体: rag_team (主要), general, rag_single, code_assistant, writing_assistant && echo 端点: /api/rag/team && echo. && npm run start:backend"

:: 等待后端启动
echo ⏳ 等待后端服务启动...
timeout /t 3 /nobreak >nul

:: 启动前端服务
echo [步骤 3/3] 启动前端界面服务...
echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                        访问地址                              ║
echo ║                                                              ║
echo ║  🏠 主页面: http://localhost:3000                            ║
echo ║  👥 团队界面: http://localhost:3000/qa-note-block/qa-note.html ║
echo ║  🔗 后端API: http://localhost:8001                          ║
echo ║  🤖 团队智能体: http://localhost:8001/api/rag/team            ║
echo ║                                                              ║
echo ║  📊 团队配置: 3个团队, 7名成员                                ║
echo ║  🧠 主要智能体: rag_team (团队协作)                           ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

npm run start:frontend

echo.
echo 👋 Teams 智能体团队协作系统已退出
pause 