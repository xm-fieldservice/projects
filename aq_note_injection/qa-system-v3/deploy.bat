@echo off
chcp 65001 >nul
title 个人智能问答系统 v3.0 - Windows部署脚本

echo.
echo 🚀 个人智能问答系统 v3.0 部署脚本
echo ==================================
echo.

:: 设置变量
set "PROJECT_NAME=qa-system-v3"
set "FRONTEND_PORT=3000"
set "BACKEND_PORT=8000"
set "DATABASE_PORT=3306"
set "REDIS_PORT=6379"

:: 解析命令行参数
if "%1"=="" goto deploy
if "%1"=="deploy" goto deploy
if "%1"=="start" goto start
if "%1"=="stop" goto stop
if "%1"=="restart" goto restart
if "%1"=="logs" goto logs
if "%1"=="status" goto status
if "%1"=="clean" goto clean
if "%1"=="help" goto help
if "%1"=="-h" goto help
if "%1"=="--help" goto help

echo ❌ 未知命令: %1
echo 💡 使用 '%~nx0 help' 查看可用命令
exit /b 1

:deploy
echo 📋 开始完整部署...
call :check_requirements
if %errorlevel% neq 0 exit /b 1

call :setup_environment
call :stop_existing_services
call :build_and_start
call :wait_for_services
call :show_status
goto end

:start
echo 📋 启动服务...
docker-compose up -d
call :show_status
goto end

:stop
echo 📋 停止服务...
docker-compose down
echo ✅ 服务已停止
goto end

:restart
call :stop
timeout /t 3 >nul
call :start
goto end

:logs
echo 📋 显示服务日志...
docker-compose logs -f
goto end

:status
call :show_status
goto end

:clean
echo ⚠️  这将删除所有容器、镜像和数据，是否继续？[Y/N]
choice /c YN /n /m "请选择: "
if %errorlevel%==1 (
    docker-compose down -v --rmi all
    docker system prune -f
    echo ✅ 清理完成
) else (
    echo 取消清理操作
)
goto end

:help
echo 用法: %~nx0 [命令]
echo.
echo 命令:
echo   deploy    完整部署（默认）
echo   start     启动服务
echo   stop      停止服务
echo   restart   重启服务
echo   logs      查看日志
echo   status    查看状态
echo   clean     清理所有数据
echo   help      显示帮助
goto end

:: 检查系统要求
:check_requirements
echo 🔍 检查系统要求...

:: 检查Docker
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker未安装，请先安装Docker Desktop
    echo 💡 下载地址: https://www.docker.com/products/docker-desktop
    exit /b 1
)

:: 检查Docker Compose
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    docker compose version >nul 2>&1
    if %errorlevel% neq 0 (
        echo ❌ Docker Compose未安装或Docker未启动
        echo 💡 请确保Docker Desktop正在运行
        exit /b 1
    )
)

:: 检查端口占用
netstat -an | findstr ":3000 " >nul 2>&1
if %errorlevel%==0 (
    echo ⚠️  警告: 端口 3000 已被占用，部署可能失败
)

netstat -an | findstr ":8000 " >nul 2>&1
if %errorlevel%==0 (
    echo ⚠️  警告: 端口 8000 已被占用，部署可能失败
)

echo ✅ 系统要求检查完成
exit /b 0

:: 设置部署环境
:setup_environment
echo 🔧 设置部署环境...

:: 创建目录
if not exist "logs" mkdir logs
if not exist "uploads" mkdir uploads

:: 创建环境变量文件
if not exist ".env" (
    (
        echo # 数据库配置
        echo MYSQL_DATABASE=qa_db
        echo MYSQL_USER=qa_user
        echo MYSQL_PASSWORD=qa_password_%RANDOM%%RANDOM%
        echo MYSQL_ROOT_PASSWORD=root_password_%RANDOM%%RANDOM%
        echo.
        echo # JWT配置
        echo JWT_SECRET_KEY=jwt_secret_key_%RANDOM%%RANDOM%%RANDOM%
        echo.
        echo # API配置
        echo API_BASE_URL=http://localhost:8000
        echo CORS_ORIGINS=http://localhost:3000,http://localhost:8080
        echo.
        echo # 调试配置
        echo DEBUG=false
        echo LOG_LEVEL=INFO
    ) > .env
    echo ✅ 已创建环境配置文件 .env
) else (
    echo ℹ️  环境配置文件已存在，跳过创建
)
exit /b 0

:: 停止现有服务
:stop_existing_services
echo 🛑 停止现有服务...
docker-compose ps -q >nul 2>&1
if %errorlevel%==0 (
    docker-compose down >nul 2>&1
    echo ✅ 已停止现有服务
) else (
    echo ℹ️  没有找到运行中的服务
)
exit /b 0

:: 构建和启动服务
:build_and_start
echo 🔨 开始构建镜像...
docker-compose build --no-cache
if %errorlevel% neq 0 (
    echo ❌ 镜像构建失败
    exit /b 1
)

echo 🚀 启动服务...
docker-compose up -d
if %errorlevel% neq 0 (
    echo ❌ 服务启动失败
    exit /b 1
)

echo ✅ 服务启动完成
exit /b 0

:: 等待服务就绪
:wait_for_services
echo ⏳ 等待服务启动...

set /a attempts=0
set /a max_attempts=20

:wait_loop
set /a attempts+=1
if %attempts% gtr %max_attempts% (
    echo ❌ 服务启动超时，请检查日志
    docker-compose logs
    exit /b 1
)

:: 检查前端服务
powershell -Command "try { Invoke-WebRequest -Uri 'http://localhost:3000/health' -UseBasicParsing -TimeoutSec 2 | Out-Null; exit 0 } catch { exit 1 }" >nul 2>&1
set frontend_ok=%errorlevel%

:: 检查后端服务
powershell -Command "try { Invoke-WebRequest -Uri 'http://localhost:8000/health' -UseBasicParsing -TimeoutSec 2 | Out-Null; exit 0 } catch { exit 1 }" >nul 2>&1
set backend_ok=%errorlevel%

if %frontend_ok%==0 if %backend_ok%==0 (
    echo ✅ 所有服务已就绪
    exit /b 0
)

echo 等待中...
timeout /t 3 >nul
goto wait_loop

:: 显示服务状态
:show_status
echo.
echo 📊 服务状态:
docker-compose ps

echo.
echo 🌐 访问地址:
echo   前端应用: http://localhost:%FRONTEND_PORT%
echo   后端API: http://localhost:%BACKEND_PORT%
echo   管理界面: http://localhost:%FRONTEND_PORT%/admin
echo   数据库: localhost:%DATABASE_PORT%
echo.
echo 👤 默认账户:
echo   管理员: admin / admin123
echo   普通用户: user / user123
echo.
exit /b 0

:end
echo.
echo 📝 提示:
echo   - 查看日志: %~nx0 logs
echo   - 查看状态: %~nx0 status
echo   - 停止服务: %~nx0 stop
echo   - 重启服务: %~nx0 restart
echo.
pause 