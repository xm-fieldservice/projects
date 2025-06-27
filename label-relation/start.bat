@echo off
chcp 65001 >nul

echo ==========================================
echo 关系知识管理系统 - 快速启动脚本
echo ==========================================

REM 检查Docker是否安装
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker未安装，请先安装Docker Desktop
    pause
    exit /b 1
)

REM 检查Docker Compose是否安装
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker Compose未安装，请先安装Docker Compose
    pause
    exit /b 1
)

echo ✅ Docker环境检查通过

REM 创建必要的目录
echo 📁 创建必要的目录...
if not exist "templates" mkdir templates
if not exist "static" mkdir static
if not exist "logs" mkdir logs

REM 启动服务
echo 🚀 启动服务...
docker-compose up -d

REM 等待服务启动
echo ⏳ 等待服务启动...
timeout /t 10 /nobreak >nul

REM 检查服务状态
echo 🔍 检查服务状态...
docker-compose ps

REM 检查Neo4j是否可访问
echo 📊 检查Neo4j连接...
set /a attempt=1
set /a max_attempts=30

:check_neo4j
docker-compose exec -T neo4j cypher-shell -u neo4j -p password "RETURN 1;" >nul 2>&1
if errorlevel 0 (
    echo ✅ Neo4j连接成功！
    goto init_db
) else (
    echo ⏳ 等待Neo4j启动... ^(尝试 %attempt%/%max_attempts%^)
    timeout /t 2 /nobreak >nul
    set /a attempt+=1
    if %attempt% leq %max_attempts% goto check_neo4j
)

echo ❌ Neo4j启动超时，请检查日志：
docker-compose logs neo4j
pause
exit /b 1

:init_db
REM 初始化数据库
echo 🛠️ 初始化数据库...
docker-compose exec -T app python init_db.py
if errorlevel 0 (
    echo ✅ 数据库初始化成功！
) else (
    echo ❌ 数据库初始化失败，请检查日志：
    docker-compose logs app
    pause
    exit /b 1
)

echo.
echo ==========================================
echo 🎉 系统启动成功！
echo ==========================================
echo.
echo 📱 访问地址：
echo    主应用: http://localhost:5000
echo    Neo4j Browser: http://localhost:7474
echo      用户名: neo4j
echo      密码: password
echo.
echo 🛠️ 管理命令：
echo    查看日志: docker-compose logs -f
echo    停止服务: docker-compose down
echo    重启服务: docker-compose restart
echo.
echo 📖 更多信息请查看 README.md
echo ==========================================
pause 