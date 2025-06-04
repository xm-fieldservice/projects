"""
智能问答系统 v3.0 后端服务
FastAPI 应用主入口
"""

from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import time
import structlog

from app.core.config import settings
from app.core.database import init_db
from app.api.auth import router as auth_router
from app.api.notes import router as notes_router
from app.api.qa import router as qa_router
from app.api.admin import router as admin_router

# 配置结构化日志
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()

# 创建 FastAPI 应用实例
app = FastAPI(
    title="智能问答系统 API",
    description="v3.0 完整解耦版后端服务",
    version="3.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# CORS 中间件配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# 信任主机中间件
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=settings.ALLOWED_HOSTS
)

# 请求日志中间件
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """记录所有HTTP请求"""
    start_time = time.time()
    
    # 记录请求开始
    logger.info(
        "HTTP请求开始",
        method=request.method,
        url=str(request.url),
        client_ip=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent", "unknown")
    )
    
    # 处理请求
    try:
        response = await call_next(request)
        process_time = time.time() - start_time
        
        # 记录请求完成
        logger.info(
            "HTTP请求完成",
            method=request.method,
            url=str(request.url),
            status_code=response.status_code,
            process_time_ms=round(process_time * 1000, 2)
        )
        
        # 添加处理时间头
        response.headers["X-Process-Time"] = str(process_time)
        return response
        
    except Exception as e:
        process_time = time.time() - start_time
        
        # 记录请求错误
        logger.error(
            "HTTP请求异常",
            method=request.method,
            url=str(request.url),
            error=str(e),
            process_time_ms=round(process_time * 1000, 2),
            exc_info=True
        )
        raise

# 全局异常处理器
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """HTTP异常处理器"""
    logger.warning(
        "HTTP异常",
        status_code=exc.status_code,
        detail=exc.detail,
        url=str(request.url)
    )
    
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": exc.detail,
            "status_code": exc.status_code,
            "timestamp": time.time()
        }
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """通用异常处理器"""
    logger.error(
        "未捕获异常",
        error=str(exc),
        url=str(request.url),
        exc_info=True
    )
    
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": "服务器内部错误",
            "status_code": 500,
            "timestamp": time.time()
        }
    )

# 应用启动事件
@app.on_event("startup")
async def startup_event():
    """应用启动时执行"""
    logger.info("应用启动", version="3.0.0")
    
    # 初始化数据库
    await init_db()
    logger.info("数据库初始化完成")

# 应用关闭事件
@app.on_event("shutdown")
async def shutdown_event():
    """应用关闭时执行"""
    logger.info("应用关闭")

# 健康检查端点
@app.get("/api/v1/health")
async def health_check():
    """健康检查接口"""
    return {
        "success": True,
        "status": "healthy",
        "version": "3.0.0",
        "timestamp": time.time()
    }

# 根路径
@app.get("/")
async def root():
    """根路径接口"""
    return {
        "message": "智能问答系统 v3.0 API",
        "version": "3.0.0",
        "docs": "/docs",
        "health": "/api/v1/health"
    }

# 注册路由
app.include_router(
    auth_router,
    prefix="/api/v1/auth",
    tags=["认证"]
)

app.include_router(
    notes_router,
    prefix="/api/v1/notes",
    tags=["笔记管理"]
)

app.include_router(
    qa_router,
    prefix="/api/v1/qa",
    tags=["问答功能"]
)

app.include_router(
    admin_router,
    prefix="/api/v1/admin",
    tags=["系统管理"]
)

# 开发环境启动
if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level="debug" if settings.DEBUG else "info"
    ) 