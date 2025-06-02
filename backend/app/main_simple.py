"""
智能问答系统 v3.0 后端服务 - 简化版
FastAPI 应用主入口
"""

from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import time
import logging

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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
    allow_origins=["*"],  # 开发环境允许所有来源
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# 请求日志中间件
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """记录所有HTTP请求"""
    start_time = time.time()
    
    # 记录请求开始
    logger.info(f"HTTP请求: {request.method} {request.url}")
    
    # 处理请求
    try:
        response = await call_next(request)
        process_time = time.time() - start_time
        
        # 记录请求完成
        logger.info(f"HTTP响应: {response.status_code} - {process_time:.3f}s")
        
        # 添加处理时间头
        response.headers["X-Process-Time"] = str(process_time)
        return response
        
    except Exception as e:
        process_time = time.time() - start_time
        logger.error(f"HTTP异常: {str(e)} - {process_time:.3f}s")
        raise

# 全局异常处理器
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """HTTP异常处理器"""
    logger.warning(f"HTTP异常: {exc.status_code} - {exc.detail}")
    
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
    logger.error(f"未捕获异常: {str(exc)}")
    
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
    logger.info("智能问答系统 v3.0 后端服务启动")

# 应用关闭事件
@app.on_event("shutdown")
async def shutdown_event():
    """应用关闭时执行"""
    logger.info("智能问答系统 v3.0 后端服务关闭")

# 健康检查端点
@app.get("/api/v1/health")
async def health_check():
    """健康检查接口"""
    return {
        "success": True,
        "status": "healthy",
        "version": "3.0.0",
        "timestamp": time.time(),
        "message": "智能问答系统后端服务运行正常"
    }

# 根路径
@app.get("/")
async def root():
    """根路径接口"""
    return {
        "message": "智能问答系统 v3.0 API",
        "version": "3.0.0",
        "docs": "/docs",
        "health": "/api/v1/health",
        "status": "running"
    }

# 简单的问答接口（模拟）
@app.post("/api/v1/qa/ask")
async def ask_question(request: dict):
    """问答接口 - 模拟实现"""
    question = request.get("question", "")
    agent = request.get("agent", "general")
    
    # 模拟AI回答
    mock_responses = {
        "general": f"这是通用智能体对问题「{question}」的回答。",
        "code": f"这是代码助手对问题「{question}」的技术回答。",
        "writing": f"这是写作助手对问题「{question}」的文学性回答。"
    }
    
    response_text = mock_responses.get(agent, mock_responses["general"])
    
    return {
        "success": True,
        "data": {
            "answer": response_text,
            "agent": agent,
            "question": question,
            "timestamp": time.time(),
            "tokens_used": len(question) + len(response_text)
        }
    }

# 笔记保存接口（模拟）
@app.post("/api/v1/notes/save")
async def save_note(request: dict):
    """保存笔记接口 - 模拟实现"""
    title = request.get("title", "")
    content = request.get("content", "")
    tags = request.get("tags", [])
    
    # 模拟保存成功
    note_id = f"note_{int(time.time())}"
    
    return {
        "success": True,
        "data": {
            "note_id": note_id,
            "title": title,
            "content": content,
            "tags": tags,
            "created_at": time.time(),
            "message": "笔记保存成功"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 