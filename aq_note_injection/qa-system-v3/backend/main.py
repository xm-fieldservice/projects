#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
个人智能问答系统 v3.0 - 主应用
FastAPI 后端服务主入口
"""

import os
import sys
from pathlib import Path
from contextlib import asynccontextmanager
from typing import Dict, Any

from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.openapi.docs import get_swagger_ui_html
from starlette.middleware.base import BaseHTTPMiddleware

# 添加项目根目录到Python路径
sys.path.insert(0, str(Path(__file__).parent))

from app.core.config import settings
from app.core.database import engine, Base
from app.core.logging import setup_logging, logger
from app.middleware.request_middleware import RequestLoggingMiddleware
from app.api.v1.router import api_router


class HealthCheckMiddleware(BaseHTTPMiddleware):
    """健康检查中间件"""
    
    async def dispatch(self, request: Request, call_next):
        if request.url.path == "/health":
            return JSONResponse({
                "status": "healthy",
                "version": settings.APP_VERSION,
                "timestamp": str(request.state.start_time) if hasattr(request.state, 'start_time') else None
            })
        
        response = await call_next(request)
        return response


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    # 启动时执行
    logger.info("🚀 启动个人智能问答系统 v3.0")
    
    # 初始化数据库
    try:
        async with engine.begin() as conn:
            # 检查数据库连接
            await conn.execute("SELECT 1")
            logger.info("✅ 数据库连接成功")
    except Exception as e:
        logger.error(f"❌ 数据库连接失败: {e}")
        raise
    
    # 创建上传目录
    upload_dir = Path("uploads")
    upload_dir.mkdir(exist_ok=True)
    logger.info(f"📁 上传目录: {upload_dir.absolute()}")
    
    logger.info("✅ 应用启动完成")
    
    yield
    
    # 关闭时执行
    logger.info("🛑 正在关闭应用...")
    await engine.dispose()
    logger.info("✅ 应用关闭完成")


# 创建FastAPI应用实例
app = FastAPI(
    title=settings.APP_NAME,
    description="个人智能问答系统，集成AI问答和笔记管理功能",
    version=settings.APP_VERSION,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    openapi_url="/openapi.json" if settings.DEBUG else None,
    lifespan=lifespan
)

# 配置日志
setup_logging()

# 添加中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

app.add_middleware(
    TrustedHostMiddleware, 
    allowed_hosts=settings.ALLOWED_HOSTS
)

app.add_middleware(HealthCheckMiddleware)
app.add_middleware(RequestLoggingMiddleware)

# 挂载静态文件
if os.path.exists("static"):
    app.mount("/static", StaticFiles(directory="static"), name="static")

if os.path.exists("uploads"):
    app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# 注册路由
app.include_router(
    api_router,
    prefix="/api/v1"
)


@app.get("/", tags=["Root"])
async def root():
    """根路径 - API信息"""
    return {
        "message": "个人智能问答系统 v3.0 API",
        "version": settings.APP_VERSION,
        "status": "running",
        "docs": "/docs" if settings.DEBUG else "Production mode - docs disabled",
        "endpoints": {
            "health": "/health",
            "api": "/api/v1",
            "auth": "/api/v1/auth",
            "content": "/api/v1/content",
            "admin": "/api/v1/admin"
        }
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """健康检查端点"""
    try:
        # 检查数据库连接
        async with engine.begin() as conn:
            await conn.execute("SELECT 1")
        
        return {
            "status": "healthy",
            "version": settings.APP_VERSION,
            "database": "connected",
            "environment": settings.ENVIRONMENT
        }
    except Exception as e:
        logger.error(f"健康检查失败: {e}")
        raise HTTPException(status_code=503, detail="Service unavailable")


@app.exception_handler(404)
async def not_found_handler(request: Request, exc: HTTPException):
    """404错误处理"""
    return JSONResponse(
        status_code=404,
        content={
            "error": "Not Found",
            "message": "请求的资源不存在",
            "path": str(request.url.path),
            "method": request.method
        }
    )


@app.exception_handler(500)
async def internal_error_handler(request: Request, exc: Exception):
    """500错误处理"""
    logger.error(f"内部服务器错误: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal Server Error",
            "message": "服务器内部错误",
            "detail": str(exc) if settings.DEBUG else "请联系管理员"
        }
    )


# 自定义API文档（生产环境禁用）
if settings.DEBUG:
    @app.get("/docs", include_in_schema=False)
    async def custom_swagger_ui_html():
        return get_swagger_ui_html(
            openapi_url=app.openapi_url,
            title=f"{app.title} - 接口文档",
            swagger_js_url="/static/swagger-ui-bundle.js",
            swagger_css_url="/static/swagger-ui.css",
        )


if __name__ == "__main__":
    import uvicorn
    
    logger.info(f"🌟 启动开发服务器...")
    logger.info(f"📍 访问地址: http://localhost:{settings.PORT}")
    logger.info(f"📚 API文档: http://localhost:{settings.PORT}/docs")
    
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        reload_dirs=["app"] if settings.DEBUG else None,
        log_level="info" if settings.DEBUG else "warning",
        access_log=settings.DEBUG
    ) 