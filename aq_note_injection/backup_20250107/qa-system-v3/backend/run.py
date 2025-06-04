#!/usr/bin/env python3
"""
应用启动脚本
提供开发和生产环境的启动选项
"""

import os
import sys
import argparse
import subprocess
from pathlib import Path

# 添加项目根目录到Python路径
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

def install_dependencies():
    """安装项目依赖"""
    print("🔄 正在安装依赖包...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        print("✅ 依赖包安装完成")
    except subprocess.CalledProcessError as e:
        print(f"❌ 依赖包安装失败: {e}")
        sys.exit(1)

def setup_environment():
    """设置环境变量"""
    env_file = project_root / ".env"
    env_example = project_root / ".env.example"
    
    if not env_file.exists() and env_example.exists():
        print("📋 .env文件不存在，正在从.env.example创建...")
        env_example.read_text().replace(
            ".env.example", ".env"
        )
        with open(env_file, 'w') as f:
            f.write("""# 环境配置
ENVIRONMENT=development

# 应用配置
APP_NAME=智能问答系统 v3.0
APP_VERSION=3.0.0
DEBUG=true

# 服务器配置
HOST=0.0.0.0
PORT=8000

# 安全配置
SECRET_KEY=your-super-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_HOURS=24
REFRESH_TOKEN_EXPIRE_DAYS=30

# 数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your-password
DB_NAME=qa_system_v3
DB_ECHO=false

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
REDIS_PASSWORD=

# AI服务配置
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-3.5-turbo
CLAUDE_API_KEY=your-claude-api-key

# 文件上传配置
UPLOAD_DIR=uploads
MAX_UPLOAD_SIZE=10485760

# 邮件配置
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_USE_TLS=true
MAIL_FROM_EMAIL=your-email@gmail.com

# 日志配置
LOG_LEVEL=INFO
LOG_FILE=

# CORS配置
CORS_ORIGINS=http://localhost:3000,http://localhost:8080""")
        print(f"✅ 已创建 {env_file}")
        print("⚠️  请编辑 .env 文件，配置你的数据库和API密钥")

def check_database():
    """检查数据库连接"""
    print("🔄 检查数据库连接...")
    try:
        from app.core.database import db_manager
        if db_manager.check_connection():
            print("✅ 数据库连接正常")
            return True
        else:
            print("❌ 数据库连接失败")
            return False
    except Exception as e:
        print(f"❌ 数据库检查失败: {e}")
        return False

def init_database():
    """初始化数据库"""
    print("🔄 初始化数据库...")
    try:
        from app.core.database import init_database
        init_database()
        print("✅ 数据库初始化完成")
    except Exception as e:
        print(f"❌ 数据库初始化失败: {e}")
        sys.exit(1)

def start_development():
    """启动开发服务器"""
    print("🚀 启动开发服务器...")
    os.environ["ENVIRONMENT"] = "development"
    
    try:
        import uvicorn
        uvicorn.run(
            "app.main:app",
            host="0.0.0.0",
            port=8000,
            reload=True,
            log_level="info"
        )
    except ImportError:
        print("❌ uvicorn未安装，请先安装依赖: pip install -r requirements.txt")
        sys.exit(1)

def start_production():
    """启动生产服务器"""
    print("🚀 启动生产服务器...")
    os.environ["ENVIRONMENT"] = "production"
    
    try:
        import gunicorn
        subprocess.call([
            "gunicorn",
            "app.main:app",
            "-w", "4",
            "-k", "uvicorn.workers.UvicornWorker",
            "--bind", "0.0.0.0:8000",
            "--access-logfile", "-",
            "--error-logfile", "-"
        ])
    except ImportError:
        print("❌ gunicorn未安装，请先安装依赖: pip install -r requirements.txt")
        sys.exit(1)

def run_tests():
    """运行测试"""
    print("🧪 运行测试...")
    try:
        subprocess.check_call([sys.executable, "-m", "pytest", "-v"])
    except subprocess.CalledProcessError as e:
        print(f"❌ 测试失败: {e}")
        sys.exit(1)

def show_info():
    """显示系统信息"""
    print("📊 系统信息:")
    print(f"Python版本: {sys.version}")
    print(f"项目路径: {project_root}")
    
    try:
        from app.core.config import get_settings
        settings = get_settings()
        print(f"应用名称: {settings.APP_NAME}")
        print(f"应用版本: {settings.APP_VERSION}")
        print(f"环境: {os.getenv('ENVIRONMENT', 'development')}")
    except Exception as e:
        print(f"无法获取应用信息: {e}")

def main():
    """主函数"""
    parser = argparse.ArgumentParser(description="智能问答系统 v3.0 启动脚本")
    parser.add_argument("command", choices=[
        "dev", "prod", "install", "init", "test", "info", "check"
    ], help="执行的命令")
    
    args = parser.parse_args()
    
    if args.command == "install":
        install_dependencies()
        setup_environment()
    
    elif args.command == "init":
        setup_environment()
        init_database()
    
    elif args.command == "check":
        setup_environment()
        check_database()
    
    elif args.command == "dev":
        setup_environment()
        if check_database():
            start_development()
        else:
            print("❌ 数据库连接失败，请检查配置")
            sys.exit(1)
    
    elif args.command == "prod":
        setup_environment()
        if check_database():
            start_production()
        else:
            print("❌ 数据库连接失败，请检查配置")
            sys.exit(1)
    
    elif args.command == "test":
        run_tests()
    
    elif args.command == "info":
        show_info()

if __name__ == "__main__":
    main() 