@echo off
chcp 65001 >nul
title 个人智能问答系统 v3.0 - 打包脚本

echo.
echo 📦 个人智能问答系统 v3.0 - 生成部署包
echo ==========================================
echo.

set "PACKAGE_NAME=qa-system-v3-deploy-%date:~0,4%%date:~5,2%%date:~8,2%-%time:~0,2%%time:~3,2%%time:~6,2%"
set "PACKAGE_NAME=%PACKAGE_NAME: =0%"

echo 🔍 检查必要文件...

:: 检查核心配置文件
if not exist "docker-compose.yml" (
    echo ❌ 缺少 docker-compose.yml
    goto error
)

if not exist "Dockerfile.frontend" (
    echo ❌ 缺少 Dockerfile.frontend
    goto error
)

if not exist "Dockerfile.backend" (
    echo ❌ 缺少 Dockerfile.backend
    goto error
)

if not exist "nginx.conf" (
    echo ❌ 缺少 nginx.conf
    goto error
)

if not exist "init.sql" (
    echo ❌ 缺少 init.sql
    goto error
)

:: 检查部署脚本
if not exist "deploy.sh" (
    echo ❌ 缺少 deploy.sh
    goto error
)

if not exist "deploy.bat" (
    echo ❌ 缺少 deploy.bat
    goto error
)

:: 检查后端文件
if not exist "backend\main.py" (
    echo ❌ 缺少 backend\main.py
    goto error
)

if not exist "backend\requirements.txt" (
    echo ❌ 缺少 backend\requirements.txt
    goto error
)

echo ✅ 所有核心文件检查完成

echo.
echo 📁 创建部署包目录结构...

:: 创建临时打包目录
if exist "%PACKAGE_NAME%" rmdir /s /q "%PACKAGE_NAME%"
mkdir "%PACKAGE_NAME%"

:: 复制核心配置文件
echo   复制Docker配置文件...
copy "docker-compose.yml" "%PACKAGE_NAME%\"
copy "Dockerfile.frontend" "%PACKAGE_NAME%\"
copy "Dockerfile.backend" "%PACKAGE_NAME%\"
copy "nginx.conf" "%PACKAGE_NAME%\"
copy "init.sql" "%PACKAGE_NAME%\"

:: 复制部署脚本
echo   复制部署脚本...
copy "deploy.sh" "%PACKAGE_NAME%\"
copy "deploy.bat" "%PACKAGE_NAME%\"

:: 复制后端文件
echo   复制后端服务...
if not exist "%PACKAGE_NAME%\backend" mkdir "%PACKAGE_NAME%\backend"
copy "backend\main.py" "%PACKAGE_NAME%\backend\"
copy "backend\requirements.txt" "%PACKAGE_NAME%\backend\"

:: 复制前端文件（如果存在）
if exist "auth-block" (
    echo   复制认证模块...
    xcopy "auth-block" "%PACKAGE_NAME%\auth-block\" /e /i /q
)

if exist "qa-note-block" (
    echo   复制问答笔记模块...
    xcopy "qa-note-block" "%PACKAGE_NAME%\qa-note-block\" /e /i /q
)

if exist "ui-block" (
    echo   复制界面模块...
    xcopy "ui-block" "%PACKAGE_NAME%\ui-block\" /e /i /q
)

if exist "deploy-block" (
    echo   复制部署管理模块...
    xcopy "deploy-block" "%PACKAGE_NAME%\deploy-block\" /e /i /q
)

if exist "shared" (
    echo   复制共享模块...
    xcopy "shared" "%PACKAGE_NAME%\shared\" /e /i /q
)

:: 复制文档
echo   复制文档...
if exist "README.md" copy "README.md" "%PACKAGE_NAME%\"
if exist "部署清单.md" copy "部署清单.md" "%PACKAGE_NAME%\"

:: 创建快速开始文件
echo   生成快速开始指南...
(
echo # 🚀 快速开始
echo.
echo ## Windows 用户
echo ```cmd
echo # 1. 确保已安装 Docker Desktop
echo # 2. 在当前目录执行：
echo deploy.bat
echo.
echo # 3. 等待部署完成后访问：
echo # http://localhost:3000
echo ```
echo.
echo ## Linux/macOS 用户  
echo ```bash
echo # 1. 确保已安装 Docker 和 Docker Compose
echo # 2. 设置执行权限：
echo chmod +x deploy.sh
echo.
echo # 3. 执行部署：
echo ./deploy.sh
echo.
echo # 4. 访问系统：
echo # http://localhost:3000
echo ```
echo.
echo ## 默认账户
echo - 管理员: admin / admin123
echo - 普通用户: user / user123
echo - 演示用户: demo / demo123
echo.
echo ⚠️ 生产环境请修改默认密码！
) > "%PACKAGE_NAME%\快速开始.md"

:: 创建目录说明文件
(
echo # 📁 目录结构说明
echo.
echo ```
echo qa-system-v3-deploy/
echo ├── docker-compose.yml          # Docker容器编排配置
echo ├── Dockerfile.frontend        # 前端容器构建配置  
echo ├── Dockerfile.backend         # 后端容器构建配置
echo ├── nginx.conf                 # Nginx服务器配置
echo ├── init.sql                   # 数据库初始化脚本
echo ├── deploy.sh                  # Linux/macOS部署脚本
echo ├── deploy.bat                 # Windows部署脚本
echo ├── backend/                   # 后端服务代码
echo │   ├── main.py               # FastAPI主应用
echo │   └── requirements.txt      # Python依赖
echo ├── auth-block/               # 用户认证功能块
echo ├── qa-note-block/            # 问答笔记功能块  
echo ├── ui-block/                 # 界面协调功能块
echo ├── deploy-block/             # 部署管理功能块
echo ├── shared/                   # 共享模块
echo ├── README.md                 # 完整使用说明
echo ├── 部署清单.md                # 部署清单
echo └── 快速开始.md                # 快速开始指南
echo ```
) > "%PACKAGE_NAME%\目录说明.md"

echo.
echo 📦 压缩部署包...

:: 使用PowerShell压缩文件
powershell -Command "Compress-Archive -Path '%PACKAGE_NAME%' -DestinationPath '%PACKAGE_NAME%.zip' -Force"

if %errorlevel%==0 (
    echo ✅ 部署包生成成功！
    echo.
    echo 📍 文件位置: %PACKAGE_NAME%.zip
    echo 📊 包含内容:
    echo   - Docker容器化配置
    echo   - 一键部署脚本（Windows/Linux/macOS）
    echo   - 完整前后端代码
    echo   - 数据库初始化脚本
    echo   - 详细文档和使用说明
    echo.
    echo 🚀 使用方法:
    echo   1. 将 %PACKAGE_NAME%.zip 复制到目标服务器
    echo   2. 解压缩文件
    echo   3. 执行部署脚本: deploy.bat 或 ./deploy.sh
    echo   4. 访问 http://localhost:3000
    echo.
    echo 💡 详细使用说明请查看解压后的 README.md 文件
) else (
    echo ❌ 压缩失败，请检查PowerShell权限
    echo 💡 您可以手动压缩 %PACKAGE_NAME% 文件夹
)

echo.
echo 🧹 清理临时文件...
if exist "%PACKAGE_NAME%" rmdir /s /q "%PACKAGE_NAME%"

echo.
echo 🎉 打包完成！祝您部署顺利！
pause
goto end

:error
echo.
echo ❌ 打包失败：缺少必要文件
echo 💡 请确保在正确的项目目录中运行此脚本
echo.
pause
exit /b 1

:end 