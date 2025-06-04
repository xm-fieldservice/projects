@echo off
REM 智能问答系统 v3.0 Windows 部署脚本
REM 支持 Windows 环境

setlocal EnableDelayedExpansion

REM 项目信息
set PROJECT_NAME=qa-system-v3
set VERSION=v3.0.0
set COMPOSE_FILE=deploy-block\docker-compose.yml

REM 颜色支持（Windows 10+）
if exist "%windir%\system32\colorcpl.exe" (
    set "ESC="
)

REM 显示欢迎信息
:show_banner
echo.
echo ==================================================
echo    🚀 智能问答系统 v3.0 部署工具
echo    版本: %VERSION%
echo    架构: 完整解耦版 ^(Windows^)
echo ==================================================
echo.
goto :eof

REM 日志函数
:log_info
echo [INFO] %~1
goto :eof

:log_success
echo [SUCCESS] %~1
goto :eof

:log_warning
echo [WARNING] %~1
goto :eof

:log_error
echo [ERROR] %~1
goto :eof

REM 检查系统要求
:check_requirements
call :log_info "检查系统要求..."

REM 检查 Docker
docker --version >nul 2>&1
if errorlevel 1 (
    call :log_error "Docker 未安装。请先安装 Docker Desktop: https://docs.docker.com/desktop/windows/"
    exit /b 1
)

REM 检查 Docker Compose
docker-compose --version >nul 2>&1
if errorlevel 1 (
    docker compose version >nul 2>&1
    if errorlevel 1 (
        call :log_error "Docker Compose 未安装。请确保 Docker Desktop 已正确安装"
        exit /b 1
    )
)

REM 检查 Docker 服务状态
docker info >nul 2>&1
if errorlevel 1 (
    call :log_error "Docker 服务未运行。请启动 Docker Desktop"
    exit /b 1
)

call :log_success "系统要求检查通过"
goto :eof

REM 创建必要的目录
:create_directories
call :log_info "创建必要的目录..."

if not exist "deploy-block\data" mkdir "deploy-block\data"
if not exist "deploy-block\data\mysql" mkdir "deploy-block\data\mysql"
if not exist "deploy-block\data\redis" mkdir "deploy-block\data\redis"
if not exist "deploy-block\data\uploads" mkdir "deploy-block\data\uploads"
if not exist "deploy-block\logs" mkdir "deploy-block\logs"
if not exist "deploy-block\logs\nginx" mkdir "deploy-block\logs\nginx"
if not exist "deploy-block\logs\backend" mkdir "deploy-block\logs\backend"
if not exist "deploy-block\mysql" mkdir "deploy-block\mysql"
if not exist "deploy-block\mysql\init" mkdir "deploy-block\mysql\init"
if not exist "deploy-block\mysql\conf" mkdir "deploy-block\mysql\conf"
if not exist "deploy-block\redis" mkdir "deploy-block\redis"
if not exist "deploy-block\nginx" mkdir "deploy-block\nginx"
if not exist "deploy-block\nginx\ssl" mkdir "deploy-block\nginx\ssl"

call :log_success "目录创建完成"
goto :eof

REM 生成环境配置文件
:generate_env
call :log_info "生成环境配置文件..."

if not exist ".env" (
    (
        echo # 智能问答系统 v3.0 环境配置
        echo.
        echo # 数据库配置
        echo MYSQL_ROOT_PASSWORD=root_password_change_me
        echo MYSQL_PASSWORD=qa_password_secure
        echo.
        echo # JWT密钥
        echo JWT_SECRET_KEY=your-secret-key-here-change-in-production-64-chars-long
        echo.
        echo # 环境设置
        echo NODE_ENV=production
        echo DEBUG=false
        echo LOG_LEVEL=INFO
        echo.
        echo # 端口配置
        echo FRONTEND_PORT=3000
        echo BACKEND_PORT=8000
        echo MYSQL_PORT=3306
        echo REDIS_PORT=6379
        echo.
        echo # 生成时间
        echo GENERATED_AT=%date% %time%
    ) > .env
    call :log_success "环境配置文件已生成: .env"
) else (
    call :log_info "环境配置文件已存在，跳过生成"
)
goto :eof

REM 生成数据库初始化脚本
:generate_db_init
call :log_info "生成数据库初始化脚本..."

(
    echo -- 智能问答系统 v3.0 数据库初始化脚本
    echo.
    echo -- 创建用户表
    echo CREATE TABLE IF NOT EXISTS users ^(
    echo     id INT AUTO_INCREMENT PRIMARY KEY,
    echo     username VARCHAR^(50^) UNIQUE NOT NULL,
    echo     display_name VARCHAR^(100^),
    echo     email VARCHAR^(100^),
    echo     password_hash VARCHAR^(255^) NOT NULL,
    echo     role ENUM^('admin', 'user', 'demo'^) DEFAULT 'user',
    echo     is_active BOOLEAN DEFAULT TRUE,
    echo     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    echo     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    echo     last_login_at TIMESTAMP NULL
    echo ^) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    echo.
    echo -- 创建内容表
    echo CREATE TABLE IF NOT EXISTS contents ^(
    echo     id INT AUTO_INCREMENT PRIMARY KEY,
    echo     user_id INT NOT NULL,
    echo     title VARCHAR^(255^) NOT NULL,
    echo     content TEXT NOT NULL,
    echo     content_type ENUM^('qa', 'note'^) DEFAULT 'note',
    echo     tags JSON,
    echo     agent_id VARCHAR^(50^),
    echo     ai_response TEXT,
    echo     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    echo     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    echo     FOREIGN KEY ^(user_id^) REFERENCES users^(id^) ON DELETE CASCADE,
    echo     INDEX idx_user_type ^(user_id, content_type^),
    echo     INDEX idx_created_at ^(created_at^)
    echo ^) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    echo.
    echo -- 创建系统日志表
    echo CREATE TABLE IF NOT EXISTS system_logs ^(
    echo     id INT AUTO_INCREMENT PRIMARY KEY,
    echo     level ENUM^('info', 'warning', 'error'^) NOT NULL,
    echo     message TEXT NOT NULL,
    echo     source VARCHAR^(50^),
    echo     details JSON,
    echo     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    echo     INDEX idx_level_time ^(level, created_at^)
    echo ^) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    echo.
    echo -- 插入默认管理员用户 ^(密码: admin123^)
    echo INSERT IGNORE INTO users ^(username, display_name, email, password_hash, role^) 
    echo VALUES ^('admin', '系统管理员', 'admin@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj1fLpUo8kKS', 'admin'^);
    echo.
    echo -- 插入演示用户 ^(密码: demo123^)
    echo INSERT IGNORE INTO users ^(username, display_name, email, password_hash, role^) 
    echo VALUES ^('demo', '演示用户', 'demo@example.com', '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'demo'^);
    echo.
    echo -- 插入测试内容
    echo INSERT IGNORE INTO contents ^(user_id, title, content, content_type, tags^) 
    echo VALUES ^(1, '欢迎使用智能问答系统', '这是一个测试笔记，用于验证系统功能。', 'note', '^["测试", "欢迎"^]'^);
) > deploy-block\mysql\init\01-init.sql

call :log_success "数据库初始化脚本已生成"
goto :eof

REM 生成 Redis 配置
:generate_redis_config
call :log_info "生成 Redis 配置..."

(
    echo # Redis 配置文件
    echo bind 0.0.0.0
    echo port 6379
    echo timeout 300
    echo keepalive 60
    echo maxmemory 256mb
    echo maxmemory-policy allkeys-lru
    echo save 900 1
    echo save 300 10
    echo save 60 10000
) > deploy-block\redis\redis.conf

call :log_success "Redis 配置已生成"
goto :eof

REM 构建和启动服务
:deploy_services
call :log_info "开始部署服务..."

REM 停止现有服务
call :log_info "停止现有服务..."
docker-compose -f %COMPOSE_FILE% down --remove-orphans 2>nul

REM 构建镜像
call :log_info "构建 Docker 镜像..."
docker-compose -f %COMPOSE_FILE% build --no-cache
if errorlevel 1 (
    call :log_error "镜像构建失败"
    exit /b 1
)

REM 启动服务
call :log_info "启动服务..."
docker-compose -f %COMPOSE_FILE% up -d
if errorlevel 1 (
    call :log_error "服务启动失败"
    exit /b 1
)

call :log_success "服务部署完成"
goto :eof

REM 等待服务启动
:wait_for_services
call :log_info "等待服务启动..."

REM 等待数据库
call :log_info "等待数据库启动..."
set /a count=0
:wait_mysql
docker-compose -f %COMPOSE_FILE% exec -T mysql mysqladmin ping -h localhost --silent >nul 2>&1
if not errorlevel 1 (
    call :log_success "数据库已启动"
    goto wait_backend
)
set /a count+=1
if %count% geq 30 (
    call :log_error "数据库启动超时"
    exit /b 1
)
timeout /t 2 /nobreak >nul
goto wait_mysql

:wait_backend
REM 等待后端服务
call :log_info "等待后端服务启动..."
set /a count=0
:wait_backend_loop
curl -f http://localhost:8000/api/v1/health >nul 2>&1
if not errorlevel 1 (
    call :log_success "后端服务已启动"
    goto wait_frontend
)
set /a count+=1
if %count% geq 30 (
    call :log_error "后端服务启动超时"
    exit /b 1
)
timeout /t 2 /nobreak >nul
goto wait_backend_loop

:wait_frontend
REM 等待前端服务
call :log_info "等待前端服务启动..."
set /a count=0
:wait_frontend_loop
curl -f http://localhost:3000/health >nul 2>&1
if not errorlevel 1 (
    call :log_success "前端服务已启动"
    goto :eof
)
set /a count+=1
if %count% geq 30 (
    call :log_error "前端服务启动超时"
    exit /b 1
)
timeout /t 2 /nobreak >nul
goto wait_frontend_loop

REM 检查服务状态
:check_services
call :log_info "检查服务状态..."

echo.
echo === 服务状态 ===
docker-compose -f %COMPOSE_FILE% ps

echo.
echo === 健康检查 ===

REM 前端健康检查
curl -f http://localhost:3000/health >nul 2>&1
if not errorlevel 1 (
    call :log_success "前端服务: ✅ 正常"
) else (
    call :log_error "前端服务: ❌ 异常"
)

REM 后端健康检查
curl -f http://localhost:8000/api/v1/health >nul 2>&1
if not errorlevel 1 (
    call :log_success "后端服务: ✅ 正常"
) else (
    call :log_error "后端服务: ❌ 异常"
)

REM 数据库健康检查
docker-compose -f %COMPOSE_FILE% exec -T mysql mysqladmin ping -h localhost --silent >nul 2>&1
if not errorlevel 1 (
    call :log_success "数据库服务: ✅ 正常"
) else (
    call :log_error "数据库服务: ❌ 异常"
)

goto :eof

REM 显示访问信息
:show_access_info
echo.
echo ==================================================
echo    🎉 部署完成！
echo ==================================================
echo.
echo 📱 前端访问地址:
echo    主页: http://localhost:3000
echo    管理界面: http://localhost:3000/admin.html
echo.
echo 🔌 后端API地址:
echo    API文档: http://localhost:8000/docs
echo    健康检查: http://localhost:8000/api/v1/health
echo.
echo 🗄️ 数据库连接:
echo    地址: localhost:3306
echo    数据库: qa_db
echo    用户: qa_user
echo.
echo 👤 默认用户:
echo    管理员: admin / admin123
echo    演示用户: demo / demo123
echo.
echo 📋 常用命令:
echo    查看日志: docker-compose -f %COMPOSE_FILE% logs -f
echo    停止服务: docker-compose -f %COMPOSE_FILE% down
echo    重启服务: docker-compose -f %COMPOSE_FILE% restart
echo.
goto :eof

REM 主函数
:main
call :show_banner

REM 检查参数
if "%~1"=="stop" (
    call :log_info "停止服务..."
    docker-compose -f %COMPOSE_FILE% down
    call :log_success "服务已停止"
    exit /b 0
)

if "%~1"=="restart" (
    call :log_info "重启服务..."
    docker-compose -f %COMPOSE_FILE% restart
    call :log_success "服务已重启"
    exit /b 0
)

if "%~1"=="logs" (
    docker-compose -f %COMPOSE_FILE% logs -f
    exit /b 0
)

if "%~1"=="status" (
    call :check_services
    exit /b 0
)

if "%~1"=="clean" (
    call :log_warning "清理所有数据..."
    set /p confirm="确定要清理所有数据吗？(y/N): "
    if /i "!confirm!"=="y" (
        docker-compose -f %COMPOSE_FILE% down -v --remove-orphans
        docker system prune -f
        rmdir /s /q deploy-block\data 2>nul
        rmdir /s /q deploy-block\logs 2>nul
        call :log_success "清理完成"
    )
    exit /b 0
)

if "%~1"=="help" (
    echo 用法: %~nx0 [命令]
    echo.
    echo 命令:
    echo   (无参数^)  - 完整部署
    echo   stop      - 停止服务
    echo   restart   - 重启服务
    echo   logs      - 查看日志
    echo   status    - 检查状态
    echo   clean     - 清理数据
    echo   help      - 显示帮助
    exit /b 0
)

REM 执行部署流程
call :check_requirements
if errorlevel 1 exit /b 1

call :create_directories
call :generate_env
call :generate_db_init
call :generate_redis_config
call :deploy_services
if errorlevel 1 exit /b 1

call :wait_for_services
if errorlevel 1 exit /b 1

call :check_services
call :show_access_info

goto :eof

REM 执行主函数
call :main %* 