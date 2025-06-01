#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
FILE: run_toolkit_demo.py  
REQ: NoteSaver工具包演示启动脚本
CHECK: 依赖检查,后端启动,工具包演示页面
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

def open_demo_pages():
    """打开演示页面"""
    time.sleep(2)  # 等待后端启动
    
    demo_path = Path(__file__).parent / 'frontend' / 'demo.html'
    demo_url = f'file://{demo_path.absolute()}'
    
    print("🌐 打开NoteSaver工具包演示页面...")
    print(f"📱 工具包演示: {demo_url}")
    
    try:
        webbrowser.open(demo_url)
    except Exception as e:
        print(f"⚠️ 无法自动打开浏览器: {e}")
        print(f"请手动打开: {demo_url}")

def main():
    """主函数"""
    print("=" * 65)
    print("🔧 NoteSaver 工具包演示 - 外部应用集成展示")
    print("=" * 65)
    
    # 检查依赖
    missing = check_dependencies()
    if missing:
        print(f"❌ 缺少依赖包: {', '.join(missing)}")
        if not install_dependencies():
            return
    else:
        print("✅ 所有依赖包已安装")
    
    # 显示说明
    print("📋 工具包演示说明:")
    print("1. 后端API服务将在 http://localhost:5000 启动")
    print("2. 工具包演示页面将自动在浏览器中打开")  
    print("3. 演示如何在任意外部应用中集成NoteSaver工具包")
    print("4. 包含完整的API调用示例和使用场景")
    print("5. 按 Ctrl+C 可以停止服务")
    print()
    
    print("🎯 核心功能演示:")
    print("📁 路径选择 - 打开本地文件选择器")
    print("✏️ 内容输入 - 支持文本和图片粘贴")
    print("💾 保存动作 - 模拟外部应用保存操作")
    print("📝 格式定义 - 设置不同保存格式")
    print("🌐 全局API - 便捷的全局调用接口")
    print()
    
    try:
        # 在新线程中打开演示页面
        demo_thread = threading.Thread(target=open_demo_pages, daemon=True)
        demo_thread.start()
        
        # 启动后端（阻塞）
        start_backend()
        
    except KeyboardInterrupt:
        print("\n👋 感谢使用NoteSaver工具包演示！")
        print("📖 更多信息请查看: NoteSaver工具包使用文档.md")
    except Exception as e:
        print(f"❌ 程序运行出错: {e}")

if __name__ == '__main__':
    main() 