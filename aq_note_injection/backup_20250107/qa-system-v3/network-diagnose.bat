@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

:: 个人智能问答系统v3.0 - Windows网络诊断脚本
:: 作者: AI Assistant
:: 版本: 1.0
:: 日期: 2025-01-27

title Docker网络诊断工具 v1.0

echo =======================================
echo 🔍 Docker网络诊断工具 v1.0
echo =======================================
echo.

:: 1. 系统基础检查
echo ===== 1. 系统基础环境检查 =====
echo.

:: 检查操作系统
echo ℹ️  操作系统: %OS% %PROCESSOR_ARCHITECTURE%

:: 检查Docker版本
docker --version >nul 2>&1
if !errorlevel! equ 0 (
    for /f "tokens=*" %%i in ('docker --version') do echo ✅ Docker 版本: %%i
) else (
    echo ❌ Docker 未安装或不可用
)

:: 检查Docker Compose版本
docker-compose --version >nul 2>&1
if !errorlevel! equ 0 (
    for /f "tokens=*" %%i in ('docker-compose --version') do echo ✅ Docker Compose 版本: %%i
) else (
    echo ❌ Docker Compose 未安装或不可用
)

:: 检查Docker服务状态
docker info >nul 2>&1
if !errorlevel! equ 0 (
    echo ✅ Docker 服务运行正常
) else (
    echo ❌ Docker 服务未运行
)

echo.

:: 2. 端口占用检查
echo ===== 2. 端口占用检查 =====
echo.

:: 定义端口检查函数
call :check_port 3000 "前端服务"
call :check_port 8000 "后端API"
call :check_port 3306 "MySQL数据库"
call :check_port 6379 "Redis缓存"

echo.

:: 3. Docker网络状态
echo ===== 3. Docker网络状态 =====
echo.

echo ℹ️  当前Docker网络列表:
docker network ls 2>nul || echo ⚠️  无法获取网络列表

:: 检查项目网络
set PROJECT_NETWORK=qa-system-v3_qa-network
docker network ls | findstr "%PROJECT_NETWORK%" >nul 2>&1
if !errorlevel! equ 0 (
    echo ✅ 项目网络 %PROJECT_NETWORK% 存在
    echo ℹ️  网络详细信息:
    docker network inspect %PROJECT_NETWORK% 2>nul | findstr "Subnet Gateway IPAddress" | more
) else (
    echo ⚠️  项目网络 %PROJECT_NETWORK% 不存在
)

echo.

:: 4. 容器状态检查
echo ===== 4. 容器状态检查 =====
echo.

if exist "docker-compose.yml" (
    echo ℹ️  容器运行状态:
    docker-compose ps 2>nul || echo ⚠️  无法获取容器状态
    
    :: 检查各个容器的运行状态
    call :check_container "qa-frontend"
    call :check_container "qa-backend"
    call :check_container "qa-mysql"
    call :check_container "qa-redis"
) else (
    echo ⚠️  未找到 docker-compose.yml 文件
)

echo.

:: 5. 容器间连通性测试
echo ===== 5. 容器间连通性测试 =====
echo.

echo ℹ️  测试容器间网络连通性...

call :test_connectivity "qa-frontend" "qa-backend" "前端 -> 后端连通性"
call :test_connectivity "qa-backend" "qa-mysql" "后端 -> 数据库连通性"
call :test_connectivity "qa-backend" "qa-redis" "后端 -> Redis连通性"

echo.

:: 6. 服务健康检查
echo ===== 6. 服务健康检查 =====
echo.

:: 检查后端API健康状态
curl -s -f http://localhost:8000/health >nul 2>&1
if !errorlevel! equ 0 (
    echo ✅ 后端API健康检查
    for /f "tokens=*" %%i in ('curl -s http://localhost:8000/health 2^>nul') do echo ℹ️  后端响应: %%i
) else (
    echo ❌ 后端API健康检查
)

:: 检查前端服务
curl -s -f http://localhost:3000/health >nul 2>&1
if !errorlevel! equ 0 (
    echo ✅ 前端服务健康检查
) else (
    echo ❌ 前端服务健康检查
)

:: 检查数据库连接
docker exec qa-mysql mysqladmin ping -h localhost --silent >nul 2>&1
if !errorlevel! equ 0 (
    echo ✅ MySQL数据库连接
) else (
    echo ❌ MySQL数据库连接
)

echo.

:: 7. 防火墙检查
echo ===== 7. 防火墙状态检查 =====
echo.

:: 检查Windows防火墙状态
for /f "tokens=3" %%i in ('netsh advfirewall show allprofiles state ^| findstr "State"') do (
    if "%%i"=="ON" (
        echo ℹ️  Windows防火墙: 已启用
        echo ⚠️  建议检查防火墙规则是否阻挡Docker端口
    ) else (
        echo ℹ️  Windows防火墙: 已禁用
    )
)

echo.

:: 8. 系统资源检查
echo ===== 8. 系统资源检查 =====
echo.

:: 检查磁盘空间
for /f "tokens=4" %%i in ('dir /-c ^| findstr "bytes free"') do echo ℹ️  当前目录可用空间: %%i bytes

:: 检查Docker空间使用
docker system df >nul 2>&1
if !errorlevel! equ 0 (
    echo ℹ️  Docker磁盘使用情况:
    docker system df
) else (
    echo ⚠️  无法获取Docker磁盘使用情况
)

:: 检查内存使用
for /f "skip=1 tokens=4" %%i in ('wmic OS get TotalVisibleMemorySize /value') do (
    if not "%%i"=="" set TotalMem=%%i
)
for /f "skip=1 tokens=4" %%i in ('wmic OS get FreePhysicalMemory /value') do (
    if not "%%i"=="" set FreeMem=%%i
)
if defined TotalMem if defined FreeMem (
    set /a UsedMem=!TotalMem! - !FreeMem!
    echo ℹ️  内存使用情况: 已用 !UsedMem! KB / 总计 !TotalMem! KB
)

echo.

:: 9. 容器日志检查
echo ===== 9. 容器日志检查 =====
echo.

if exist "docker-compose.yml" (
    echo ℹ️  最近的错误日志:
    
    :: 检查各容器的错误日志
    for %%c in (qa-frontend qa-backend qa-mysql) do (
        docker ps | findstr "%%c" >nul 2>&1
        if !errorlevel! equ 0 (
            for /f %%e in ('docker logs %%c 2^>^&1 ^| findstr /i "error" ^| find /c /v ""') do (
                if %%e gtr 0 (
                    echo ⚠️  %%c 有 %%e 条错误日志
                    echo 最新错误:
                    docker logs %%c 2>&1 | findstr /i "error" | more +0
                ) else (
                    echo ✅ %%c 无错误日志
                )
            )
        )
    )
)

echo.

:: 10. 修复建议
echo ===== 10. 修复建议 =====
echo.

echo ℹ️  如果发现问题，可以尝试以下修复方案:
echo.
echo 🔧 常用修复命令:
echo    重启所有服务: docker-compose restart
echo    重建网络: docker-compose down ^&^& docker network prune -f ^&^& docker-compose up -d
echo    清理系统: docker system prune -f
echo    查看日志: docker-compose logs [服务名]
echo.
echo 🌐 网络问题修复:
echo    重建Docker网络: docker network rm qa-system-v3_qa-network ^&^& docker-compose up -d
echo    检查防火墙: netsh advfirewall show allprofiles
echo    临时关闭防火墙: netsh advfirewall set allprofiles state off
echo.
echo 📊 性能优化:
echo    释放内存: docker system prune -a --volumes
echo    重启Docker Desktop: 通过系统托盘重启Docker Desktop

echo.
echo =======================================
echo 🎯 诊断完成! 检查上述结果并按建议进行修复
echo =======================================

pause
goto :eof

:: 函数: 检查端口占用
:check_port
set port=%1
set service=%2
netstat -an | findstr ":%port% " >nul 2>&1
if !errorlevel! equ 0 (
    echo ⚠️  %service% 端口 %port% 已被占用
    netstat -ano | findstr ":%port% " | findstr "LISTENING" | head -1
) else (
    echo ✅ %service% 端口 %port% 可用
)
goto :eof

:: 函数: 检查容器状态
:check_container
set container=%1
docker ps | findstr "%container%" >nul 2>&1
if !errorlevel! equ 0 (
    echo ✅ 容器 %container% 正在运行
) else (
    echo ⚠️  容器 %container% 未运行
)
goto :eof

:: 函数: 测试连通性
:test_connectivity
set from_container=%1
set to_container=%2
set description=%3

docker ps | findstr "%from_container%" >nul 2>&1
if !errorlevel! neq 0 goto :connectivity_skip

docker ps | findstr "%to_container%" >nul 2>&1
if !errorlevel! neq 0 goto :connectivity_skip

docker exec %from_container% ping -n 2 %to_container% >nul 2>&1
if !errorlevel! equ 0 (
    echo ✅ %description%
) else (
    echo ❌ %description%
)
goto :eof

:connectivity_skip
echo ⚠️  %description% (容器未运行)
goto :eof 