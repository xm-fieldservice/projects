#!/usr/bin/env python
# -*- coding: utf-8 -*-

import sys
import subprocess
import importlib
import os
from packaging import version

def check_python_version():
    """检查Python版本"""
    print("🐍 检查Python版本...")
    current_version = sys.version_info
    required_version = (3, 8)
    
    if current_version >= required_version:
        print(f"✅ Python版本: {sys.version}")
        return True
    else:
        print(f"❌ Python版本过低: {sys.version}")
        print(f"   要求版本: Python {required_version[0]}.{required_version[1]}+")
        return False

def check_package(package_name, min_version=None):
    """检查Python包是否安装"""
    try:
        module = importlib.import_module(package_name)
        if hasattr(module, '__version__'):
            installed_version = module.__version__
            if min_version and version.parse(installed_version) < version.parse(min_version):
                print(f"❌ {package_name}: 版本过低 ({installed_version} < {min_version})")
                return False
            else:
                print(f"✅ {package_name}: {installed_version}")
                return True
        else:
            print(f"✅ {package_name}: 已安装")
            return True
    except ImportError:
        print(f"❌ {package_name}: 未安装")
        return False

def check_command(command, description):
    """检查系统命令是否可用"""
    try:
        result = subprocess.run([command, '--version'], 
                              capture_output=True, text=True, timeout=10)
        if result.returncode == 0:
            version_info = result.stdout.split('\n')[0]
            print(f"✅ {description}: {version_info}")
            return True
        else:
            print(f"❌ {description}: 命令执行失败")
            return False
    except (subprocess.TimeoutExpired, FileNotFoundError):
        print(f"❌ {description}: 未安装或不在PATH中")
        return False

def check_docker():
    """检查Docker环境"""
    print("\n🐳 检查Docker环境...")
    
    docker_ok = check_command('docker', 'Docker')
    compose_ok = check_command('docker-compose', 'Docker Compose')
    
    if docker_ok:
        try:
            # 检查Docker是否运行
            result = subprocess.run(['docker', 'info'], 
                                  capture_output=True, text=True, timeout=10)
            if result.returncode == 0:
                print("✅ Docker服务正在运行")
            else:
                print("❌ Docker服务未运行，请启动Docker")
                docker_ok = False
        except subprocess.TimeoutExpired:
            print("❌ Docker服务响应超时")
            docker_ok = False
    
    return docker_ok and compose_ok

def check_python_packages():
    """检查Python依赖包"""
    print("\n📦 检查Python依赖包...")
    
    required_packages = {
        'flask': '2.0.0',
        'neo4j': '5.0.0',
        'spacy': '3.4.0',
        'requests': '2.25.0',
        'pandas': '1.3.0',
        'numpy': '1.20.0'
    }
    
    all_ok = True
    for package, min_ver in required_packages.items():
        if not check_package(package, min_ver):
            all_ok = False
    
    return all_ok

def check_spacy_model():
    """检查spaCy中文模型"""
    print("\n🔤 检查spaCy中文模型...")
    try:
        import spacy
        nlp = spacy.load("zh_core_web_sm")
        print("✅ spaCy中文模型(zh_core_web_sm): 已安装")
        return True
    except OSError:
        print("❌ spaCy中文模型(zh_core_web_sm): 未安装")
        print("   安装命令: python -m spacy download zh_core_web_sm")
        return False
    except ImportError:
        print("❌ spaCy: 未安装")
        return False

def check_ports():
    """检查端口占用情况"""
    print("\n🔌 检查端口占用...")
    
    import socket
    
    ports_to_check = {
        5000: 'Flask应用',
        7474: 'Neo4j HTTP',
        7687: 'Neo4j Bolt'
    }
    
    all_available = True
    for port, description in ports_to_check.items():
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(1)
        result = sock.connect_ex(('localhost', port))
        sock.close()
        
        if result == 0:
            print(f"⚠️  端口 {port} ({description}): 已被占用")
            all_available = False
        else:
            print(f"✅ 端口 {port} ({description}): 可用")
    
    return all_available

def check_disk_space():
    """检查磁盘空间"""
    print("\n💾 检查磁盘空间...")
    
    import shutil
    
    total, used, free = shutil.disk_usage(".")
    free_gb = free // (1024**3)
    
    if free_gb >= 2:
        print(f"✅ 可用磁盘空间: {free_gb}GB")
        return True
    else:
        print(f"⚠️  可用磁盘空间不足: {free_gb}GB (建议至少2GB)")
        return False

def print_installation_guide():
    """打印安装指南"""
    print("\n" + "="*60)
    print("📋 安装指南")
    print("="*60)
    
    print("\n🐍 Python依赖包安装:")
    print("pip install -r requirements.txt")
    
    print("\n🔤 spaCy中文模型安装:")
    print("python -m spacy download zh_core_web_sm")
    
    print("\n🐳 Docker安装 (Windows):")
    print("1. 下载Docker Desktop: https://www.docker.com/products/docker-desktop")
    print("2. 安装并启动Docker Desktop")
    print("3. 在PowerShell中验证: docker --version")
    
    print("\n🐳 Docker安装 (Linux):")
    print("curl -fsSL https://get.docker.com -o get-docker.sh")
    print("sudo sh get-docker.sh")
    print("sudo usermod -aG docker $USER")
    
    print("\n🚀 快速启动:")
    print("Windows: start.bat")
    print("Linux/Mac: chmod +x start.sh && ./start.sh")

def main():
    """主函数"""
    print("="*60)
    print("🔍 关系知识管理系统 - 环境检查")
    print("="*60)
    
    checks = [
        ("Python版本", check_python_version),
        ("Docker环境", check_docker),
        ("Python依赖", check_python_packages),
        ("spaCy模型", check_spacy_model),
        ("端口可用性", check_ports),
        ("磁盘空间", check_disk_space)
    ]
    
    results = []
    for name, check_func in checks:
        try:
            result = check_func()
            results.append((name, result))
        except Exception as e:
            print(f"❌ {name}: 检查时出错 - {e}")
            results.append((name, False))
    
    # 输出总结
    print("\n" + "="*60)
    print("📊 检查结果总结")
    print("="*60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = "✅ 通过" if result else "❌ 失败"
        print(f"{name:<15} {status}")
    
    print(f"\n通过率: {passed}/{total} ({passed/total*100:.1f}%)")
    
    if passed == total:
        print("\n🎉 所有检查都通过！您可以运行系统了。")
        print("\n启动命令:")
        if os.name == 'nt':  # Windows
            print("start.bat")
        else:  # Linux/Mac
            print("chmod +x start.sh && ./start.sh")
    else:
        print(f"\n⚠️  有 {total-passed} 项检查未通过，请先解决这些问题。")
        print_installation_guide()
    
    return passed == total

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 