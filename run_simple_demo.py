#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
FILE: run_simple_demo.py  
REQ: 极简版笔记保存工具演示启动脚本
CHECK: 依赖检查,后端启动,浏览器打开,简化界面
HIST: 2025-01-31-AI生成
"""

import os
import sys
import subprocess
import time
import webbrowser
import threading
from pathlib import Path

def check_dependencies():
    """检查依赖包是否已安装"""
    required_packages = ['Flask', 'flask_cors', 'PIL', 'requests']
    missing_packages = []
    
    for package in required_packages:
        try:
            if package == 'PIL':
                import PIL
            elif package == 'flask_cors':
                import flask_cors
            else:
                __import__(package.lower())
        except ImportError:
            missing_packages.append(package)
    
    return missing_packages

def install_dependencies():
    """安装依赖包"""
    print("📦 正在安装依赖包...")
    try:
        subprocess.check_call([sys.executable, '-m', 'pip', 'install', '-r', 'requirements.txt'])
        print("✅ 依赖包安装完成")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ 依赖包安装失败: {e}")
        return False

def start_backend():
    """启动后端服务"""
    backend_dir = Path(__file__).parent / 'backend'
    sys.path.insert(0, str(backend_dir.parent))
    
    try:
        from backend.app import app
        print("🚀 启动后端服务...")
        app.run(host='127.0.0.1', port=5000, debug=False, use_reloader=False)
    except Exception as e:
        print(f"❌ 后端服务启动失败: {e}")

def open_frontend():
    """打开前端页面"""
    time.sleep(2)  # 等待后端启动
    
    frontend_path = Path(__file__).parent / 'frontend' / 'simple.html'
    frontend_url = f'file://{frontend_path.absolute()}'
    
    print("🌐 打开极简版前端页面...")
    print(f"📱 前端页面: {frontend_url}")
    
    try:
        webbrowser.open(frontend_url)
    except Exception as e:
        print(f"⚠️ 无法自动打开浏览器: {e}")
        print(f"请手动打开: {frontend_url}")

def main():
    """主函数"""
    print("=" * 60)
    print("🎯 极简笔记保存工具 - 演示程序")
    print("=" * 60)
    
    # 检查依赖
    missing = check_dependencies()
    if missing:
        print(f"❌ 缺少依赖包: {', '.join(missing)}")
        if not install_dependencies():
            return
    else:
        print("✅ 所有依赖包已安装")
    
    # 显示说明
    print("📋 极简版说明:")
    print("1. 后端API服务将在 http://localhost:5000 启动")
    print("2. 极简版前端页面将自动在浏览器中打开")  
    print("3. 界面包含：路径选择按钮、输入框、保存按钮")
    print("4. 支持Ctrl+V粘贴截图，Ctrl+Enter快速保存")
    print("5. 按 Ctrl+C 可以停止服务")
    print()
    
    try:
        # 在新线程中打开前端
        frontend_thread = threading.Thread(target=open_frontend, daemon=True)
        frontend_thread.start()
        
        # 启动后端（阻塞）
        start_backend()
        
    except KeyboardInterrupt:
        print("\n👋 感谢使用极简笔记保存工具！")
    except Exception as e:
        print(f"❌ 程序运行出错: {e}")

if __name__ == '__main__':
    main() 