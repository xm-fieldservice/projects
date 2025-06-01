"""
FILE: __init__.py
REQ: 笔记保存工具包核心模块
CHECK: 模块导入,版本信息,API接口
HIST: 2025-01-31-AI生成
"""

from .note_engine import NoteSaveEngine
from .config_manager import ConfigManager
from .image_handler import ImageHandler
from .file_manager import FileManager

__version__ = "1.0.0"
__author__ = "AI Generated"

__all__ = [
    'NoteSaveEngine',
    'ConfigManager', 
    'ImageHandler',
    'FileManager'
] 