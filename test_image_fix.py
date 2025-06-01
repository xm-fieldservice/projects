#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
图片粘贴编码问题修复测试页面启动器
"""

import webbrowser
import os
import sys
import time
from pathlib import Path

def main():
    """启动图片修复测试页面"""
    print("🖼️ 图片粘贴编码问题修复测试")
    print("=" * 50)
    
    # 获取当前目录
    current_dir = Path(__file__).parent
    test_file = current_dir / "图片粘贴测试验证.html"
    
    if not test_file.exists():
        print(f"❌ 测试文件不存在: {test_file}")
        return False
    
    # 获取文件的绝对路径
    file_url = f"file:///{test_file.absolute().as_posix()}"
    
    print(f"📁 测试文件: {test_file}")
    print(f"🌐 访问地址: {file_url}")
    print()
    
    print("🔧 修复说明:")
    print("- 已修复 note-saver.js 中的双重编码问题")
    print("- 图片链接现在使用正确的 data URL 格式")
    print("- 支持多种图片格式（PNG、JPEG、GIF等）")
    print()
    
    print("🧪 测试步骤:")
    print("1. 页面将在浏览器中打开")
    print("2. 复制一张图片到剪贴板")
    print("3. 在文本框中按 Ctrl+V 粘贴图片")
    print("4. 查看生成的 Markdown 格式是否正确")
    print("5. 正确格式应该只有一个 'data:image/' 前缀")
    print()
    
    # 等待用户确认
    input("按 Enter 键打开测试页面...")
    
    try:
        # 在默认浏览器中打开测试页面
        webbrowser.open(file_url)
        print("✅ 测试页面已在浏览器中打开")
        print()
        print("💡 提示:")
        print("- 如果图片粘贴成功且格式正确，说明修复生效")
        print("- 如果仍有问题，请检查浏览器控制台的错误信息")
        print("- 原始代码已备份为 note-saver.js.backup")
        
    except Exception as e:
        print(f"❌ 打开浏览器失败: {e}")
        print(f"请手动访问: {file_url}")
        return False
    
    return True

if __name__ == "__main__":
    success = main()
    if not success:
        sys.exit(1) 