#!/usr/bin/env python3
"""
简单的服务器启动脚本
"""
import os
import sys

# 添加src目录到Python路径
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

try:
    print("🚀 尝试启动服务器...")
    print(f"Python路径: {sys.path}")
    print(f"当前工作目录: {os.getcwd()}")
    
    # 导入main模块
    from main import app
    print("✅ 成功导入main模块")
    
    # 启动服务器
    import uvicorn
    print("📡 启动服务器在端口3000...")
    uvicorn.run(app, host="0.0.0.0", port=3000, log_level="info")
    
except Exception as e:
    print(f"❌ 启动失败: {e}")
    import traceback
    traceback.print_exc() 