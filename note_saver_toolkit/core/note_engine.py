"""
FILE: note_engine.py
REQ: 核心笔记保存引擎
CHECK: 文本保存,图片保存,时间戳,格式化
HIST: 2025-01-31-AI生成
"""

import os
import datetime
import json
import base64
from typing import Optional, Dict, Any, Callable
from .config_manager import ConfigManager
from .image_handler import ImageHandler
from .file_manager import FileManager


class NoteSaveEngine:
    """核心笔记保存引擎"""
    
    def __init__(self, config_path: Optional[str] = None, on_success: Optional[Callable] = None, on_error: Optional[Callable] = None):
        """
        初始化笔记保存引擎
        
        Args:
            config_path: 配置文件路径
            on_success: 保存成功回调函数
            on_error: 保存失败回调函数
        """
        self.config_manager = ConfigManager(config_path)
        self.image_handler = ImageHandler()
        self.file_manager = FileManager()
        self.on_success = on_success
        self.on_error = on_error
        
        # 加载配置
        self.config = self.config_manager.load_config()
        
        # 确保日志目录存在
        self._ensure_log_directory()
    
    def _ensure_log_directory(self):
        """确保日志目录存在"""
        log_file = self.config.get('log_file', 'logs/notes.md')
        log_dir = os.path.dirname(log_file)
        if not os.path.exists(log_dir):
            os.makedirs(log_dir, exist_ok=True)
    
    def save_note(self, content: str, app_name: str = "未知应用", images: Optional[list] = None) -> Dict[str, Any]:
        """
        保存笔记
        
        Args:
            content: 笔记内容
            app_name: 应用名称
            images: 图片列表（可选）
            
        Returns:
            Dict: 保存结果
        """
        try:
            # 获取配置
            log_file = self.config.get('log_file', 'logs/notes.md')
            
            # 确保日志文件目录存在
            log_dir = os.path.dirname(log_file)
            if not os.path.exists(log_dir):
                os.makedirs(log_dir, exist_ok=True)
            
            # 生成时间戳
            timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            
            # 构建标题
            title_text = f"\n# {timestamp} ({app_name})\n\n"
            
            # 处理图片
            image_md_content = ""
            if images:
                image_dir = os.path.join(log_dir, "images")
                if not os.path.exists(image_dir):
                    os.makedirs(image_dir, exist_ok=True)
                
                for i, image_data in enumerate(images):
                    # 保存图片
                    image_filename = f"{datetime.datetime.now().strftime('%Y%m%d%H%M%S')}_{i}.png"
                    image_path = os.path.join(image_dir, image_filename)
                    
                    # 处理不同格式的图片数据
                    if isinstance(image_data, str):
                        # Base64编码的图片
                        if image_data.startswith('data:image'):
                            # 去掉data:image/png;base64,前缀
                            base64_data = image_data.split(',')[1]
                            image_bytes = base64.b64decode(base64_data)
                            with open(image_path, 'wb') as f:
                                f.write(image_bytes)
                        else:
                            # 假设是base64字符串
                            image_bytes = base64.b64decode(image_data)
                            with open(image_path, 'wb') as f:
                                f.write(image_bytes)
                    elif isinstance(image_data, bytes):
                        # 直接是字节数据
                        with open(image_path, 'wb') as f:
                            f.write(image_data)
                    else:
                        # 其他格式，尝试保存
                        self.image_handler.save_image(image_data, image_path)
                    
                    # 生成Markdown链接
                    rel_path = os.path.relpath(image_path, os.path.dirname(log_file))
                    rel_path = rel_path.replace("\\", "/")  # 确保使用正斜杠
                    image_md_content += f"\n![图片{i+1}]({rel_path})\n"
            
            # 写入日志文件
            with open(log_file, 'a', encoding='utf-8') as f:
                f.write(title_text)
                
                # 写入文本内容
                if content.strip():
                    f.write(f"{content}\n")
                
                # 写入图片引用
                if image_md_content:
                    f.write(image_md_content)
                
                # 添加分隔符
                f.write("\n---\n")
            
            # 调用成功回调
            result = {
                'success': True,
                'message': '笔记保存成功',
                'file_path': log_file,
                'timestamp': timestamp
            }
            
            if self.on_success:
                self.on_success(result)
            
            return result
            
        except Exception as e:
            # 调用错误回调
            error_result = {
                'success': False,
                'message': f'保存笔记失败：{str(e)}',
                'error': str(e)
            }
            
            if self.on_error:
                self.on_error(error_result)
            
            return error_result
    
    def set_log_file(self, log_file_path: str) -> bool:
        """
        设置日志文件路径
        
        Args:
            log_file_path: 日志文件路径
            
        Returns:
            bool: 设置是否成功
        """
        try:
            # 确保目录存在
            log_dir = os.path.dirname(log_file_path)
            if not os.path.exists(log_dir):
                os.makedirs(log_dir, exist_ok=True)
            
            # 更新配置
            self.config['log_file'] = log_file_path
            self.config_manager.save_config(self.config)
            
            return True
        except Exception as e:
            print(f"设置日志文件失败: {str(e)}")
            return False
    
    def get_log_file(self) -> str:
        """获取当前日志文件路径"""
        return self.config.get('log_file', 'logs/notes.md')
    
    def get_recent_notes(self, count: int = 10) -> list:
        """
        获取最近的笔记
        
        Args:
            count: 获取数量
            
        Returns:
            list: 最近的笔记列表
        """
        try:
            log_file = self.get_log_file()
            if not os.path.exists(log_file):
                return []
            
            with open(log_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # 简单解析最近的笔记
            notes = []
            lines = content.split('\n')
            current_note = None
            
            for line in lines:
                if line.startswith('# ') and '(' in line and ')' in line:
                    # 这是一个新的笔记标题
                    if current_note:
                        notes.append(current_note)
                    
                    # 解析标题
                    title_part = line[2:].strip()  # 去掉"# "
                    if '(' in title_part and ')' in title_part:
                        timestamp_part = title_part.split('(')[0].strip()
                        app_part = title_part.split('(')[1].split(')')[0]
                        
                        current_note = {
                            'timestamp': timestamp_part,
                            'app_name': app_part,
                            'content': '',
                            'images': []
                        }
                elif current_note and line.strip() and not line.startswith('---'):
                    # 这是笔记内容
                    if line.startswith('!['):
                        # 这是图片
                        current_note['images'].append(line)
                    else:
                        current_note['content'] += line + '\n'
            
            # 添加最后一个笔记
            if current_note:
                notes.append(current_note)
            
            # 返回最近的笔记（倒序）
            return notes[-count:] if len(notes) > count else notes
            
        except Exception as e:
            print(f"获取最近笔记失败: {str(e)}")
            return []
    
    def update_config(self, config_updates: Dict[str, Any]) -> bool:
        """
        更新配置
        
        Args:
            config_updates: 配置更新字典
            
        Returns:
            bool: 更新是否成功
        """
        try:
            self.config.update(config_updates)
            self.config_manager.save_config(self.config)
            return True
        except Exception as e:
            print(f"更新配置失败: {str(e)}")
            return False 