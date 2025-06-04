"""
主应用文件
配置FastAPI应用、中间件、路由、启动和关闭事件等
"""

from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from fastapi.openapi.docs import get_swagger_ui_html
from fastapi.openapi.utils import get_openapi
import time
import logging
from contextlib import asynccontextmanager

from .core.config import get_settings, validate_startup_config, get_cors_config
from .core.database import init_database, cleanup_database, health_check
from .api import auth, notes, qa

# 获取配置
settings = get_settings()

# 配置日志
logging.basicConfig(
    level=settings.LOG_LEVEL,
    format=settings.LOG_FORMAT,
    filename=settings.LOG_FILE
)
logger = logging.getLogger(__name__)

# 应用生命周期管理
@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    # 启动事件
    logger.info("🚀 智能问答系统 v3.0 启动中...")
    
    # 验证配置
    validate_startup_config()
    
    # 初始化数据库
    try:
        init_database()
    except Exception as e:
        logger.error(f"❌ 数据库初始化失败: {e}")
        raise
    
    # 创建上传目录
    import os
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    logger.info(f"📁 上传目录已创建: {settings.UPLOAD_DIR}")
    
    logger.info("✅ 应用启动完成")
    
    yield
    
    # 关闭事件
    logger.info("🔄 正在关闭应用...")
    cleanup_database()
    logger.info("✅ 应用已关闭")

# 创建FastAPI应用
app = FastAPI(
    title=settings.APP_NAME,
    description=settings.APP_DESCRIPTION,
    version=settings.APP_VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    lifespan=lifespan
)

# 添加CORS中间件
cors_config = get_cors_config()
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_config["allow_origins"],
    allow_credentials=cors_config["allow_credentials"],
    allow_methods=cors_config["allow_methods"],
    allow_headers=cors_config["allow_headers"],
)

# 添加可信主机中间件（生产环境）
if settings.is_production():
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=["*"]  # 生产环境应该配置具体的域名
    )

# 请求处理时间中间件
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    """添加请求处理时间到响应头"""
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response

# 请求日志中间件
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """记录请求日志"""
    start_time = time.time()
    
    # 记录请求信息
    client_ip = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "unknown")
    
    response = await call_next(request)
    
    # 记录响应信息
    process_time = time.time() - start_time
    
    log_data = {
        "method": request.method,
        "url": str(request.url),
        "client_ip": client_ip,
        "user_agent": user_agent,
        "status_code": response.status_code,
        "process_time": round(process_time, 4)
    }
    
    if response.status_code >= 400:
        logger.warning(f"HTTP错误: {log_data}")
    else:
        logger.info(f"HTTP请求: {request.method} {request.url.path} - {response.status_code} ({process_time:.3f}s)")
    
    return response

# 全局异常处理
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """全局异常处理器"""
    logger.error(f"未处理的异常: {exc}", exc_info=True)
    
    return JSONResponse(
        status_code=500,
        content={
            "message": "内部服务器错误",
            "detail": str(exc) if settings.DEBUG else "请联系系统管理员",
            "type": "internal_server_error"
        }
    )

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """HTTP异常处理器"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "message": exc.detail,
            "status_code": exc.status_code,
            "type": "http_error"
        }
    )

# 健康检查端点
@app.get(settings.HEALTH_CHECK_PATH)
async def health_check_endpoint():
    """系统健康检查"""
    try:
        # 检查数据库
        db_status = health_check()
        
        # 检查应用状态
        app_status = {
            "status": "healthy",
            "version": settings.APP_VERSION,
            "environment": "production" if settings.is_production() else "development",
            "timestamp": int(time.time())
        }
        
        return {
            "application": app_status,
            "database": db_status,
            "overall_status": "healthy" if db_status["status"] == "healthy" else "unhealthy"
        }
    except Exception as e:
        logger.error(f"健康检查失败: {e}")
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "error": str(e),
                "timestamp": int(time.time())
            }
        )

# 系统信息端点
@app.get(f"{settings.API_V1_STR}/system/info")
async def system_info():
    """获取系统信息"""
    import sys
    import platform
    from datetime import datetime
    
    return {
        "application": {
            "name": settings.APP_NAME,
            "version": settings.APP_VERSION,
            "description": settings.APP_DESCRIPTION,
            "environment": "production" if settings.is_production() else "development"
        },
        "system": {
            "platform": platform.platform(),
            "python_version": sys.version,
            "architecture": platform.architecture()[0]
        },
        "runtime": {
            "start_time": datetime.now().isoformat(),
            "timezone": "UTC"
        }
    }

# 包含API路由
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(notes.router, prefix=settings.API_V1_STR)
app.include_router(qa.router, prefix=settings.API_V1_STR)

# 根路径
@app.get("/")
async def root():
    """根路径"""
    return {
        "message": f"欢迎使用{settings.APP_NAME}",
        "version": settings.APP_VERSION,
        "docs": f"{settings.API_V1_STR}/docs",
        "health": settings.HEALTH_CHECK_PATH,
        "api_prefix": settings.API_V1_STR
    }

# 自定义OpenAPI文档
def custom_openapi():
    """自定义OpenAPI文档"""
    if app.openapi_schema:
        return app.openapi_schema
    
    openapi_schema = get_openapi(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description=settings.APP_DESCRIPTION,
        routes=app.routes,
    )
    
    # 添加安全方案
    openapi_schema["components"]["securitySchemes"] = {
        "BearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT"
        }
    }
    
    # 添加全局安全要求
    openapi_schema["security"] = [{"BearerAuth": []}]
    
    # 添加服务器信息
    openapi_schema["servers"] = [
        {
            "url": f"http://localhost:{settings.PORT}",
            "description": "开发服务器"
        }
    ]
    
    # 添加标签描述
    openapi_schema["tags"] = [
        {
            "name": "认证",
            "description": "用户认证和授权相关接口"
        },
        {
            "name": "笔记管理",
            "description": "笔记的增删改查和管理功能"
        },
        {
            "name": "问答系统",
            "description": "AI问答和对话管理功能"
        }
    ]
    
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi

# 自定义Swagger UI
@app.get(f"{settings.API_V1_STR}/docs", include_in_schema=False)
async def custom_swagger_ui_html():
    """自定义Swagger UI"""
    return get_swagger_ui_html(
        openapi_url=app.openapi_url,
        title=f"{settings.APP_NAME} - API文档",
        swagger_js_url="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui-bundle.js",
        swagger_css_url="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui.css",
    )

# 启动函数
def start_server():
    """启动服务器"""
    import uvicorn
    
    logger.info(f"🚀 启动服务器 - {settings.HOST}:{settings.PORT}")
    
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.RELOAD and settings.is_development(),
        log_level=settings.LOG_LEVEL.lower(),
        access_log=True
    )

if __name__ == "__main__":
    start_server() 