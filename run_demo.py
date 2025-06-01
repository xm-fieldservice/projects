"""
FILE: run_demo.py
REQ: 演示启动脚本
CHECK: 服务启动,浏览器打开,错误处理,用户提示
HIST: 2025-01-31-AI生成
"""

import os
import sys
import webbrowser
import threading
import time
from pathlib import Path

def check_dependencies():
    """检查依赖包是否已安装"""
    try:
        import flask
        import flask_cors
        from PIL import Image
        print("✅ 所有依赖包已安装")
        return True
    except ImportError as e:
        print(f"❌ 缺少依赖包: {e}")
        print("请运行: pip install -r requirements.txt")
        return False

def start_backend_server():
    """启动后端服务"""
    try:
        # 切换到backend目录
        backend_path = Path(__file__).parent / "backend"
        os.chdir(backend_path)
        
        # 导入并启动Flask应用
        sys.path.append(str(backend_path.parent))
        from backend.app import app
        
        print("🚀 启动后端服务...")
        app.run(debug=False, host='127.0.0.1', port=5000, use_reloader=False)
        
    except Exception as e:
        print(f"❌ 后端服务启动失败: {e}")
        sys.exit(1)

def open_frontend():
    """打开前端页面"""
    time.sleep(2)  # 等待后端服务启动
    
    frontend_path = Path(__file__).parent / "frontend" / "index.html"
    frontend_url = f"file://{frontend_path.absolute()}"
    
    try:
        print("🌐 打开前端页面...")
        webbrowser.open(frontend_url)
        print(f"📱 前端页面: {frontend_url}")
    except Exception as e:
        print(f"❌ 无法自动打开浏览器: {e}")
        print(f"请手动打开: {frontend_url}")

def main():
    """主函数"""
    print("=" * 60)
    print("🎯 笔记保存工具包 - 演示程序")
    print("=" * 60)
    
    # 检查依赖
    if not check_dependencies():
        return
    
    # 创建必要的目录
    os.makedirs("logs", exist_ok=True)
    
    print("\n📋 演示说明:")
    print("1. 后端API服务将在 http://localhost:5000 启动")
    print("2. 前端页面将自动在浏览器中打开")
    print("3. 可以在页面中测试笔记保存功能")
    print("4. 按 Ctrl+C 可以停止服务")
    print()
    
    # 在新线程中打开前端页面
    frontend_thread = threading.Thread(target=open_frontend, daemon=True)
    frontend_thread.start()
    
    # 启动后端服务（阻塞主线程）
    try:
        start_backend_server()
    except KeyboardInterrupt:
        print("\n\n👋 服务已停止，感谢使用！")
    except Exception as e:
        print(f"\n❌ 程序运行出错: {e}")

if __name__ == "__main__":
    main() 