"""
FILE: file_manager.py
REQ: 文件管理器
CHECK: 文件操作,路径管理,备份,安全检查
HIST: 2025-01-31-AI生成
"""

import os
import shutil
import datetime
from typing import Optional, List, Dict, Any
import hashlib


class FileManager:
    """文件管理器"""
    
    def __init__(self, base_dir: Optional[str] = None):
        """
        初始化文件管理器
        
        Args:
            base_dir: 基础目录，如果为None则使用当前目录
        """
        self.base_dir = base_dir if base_dir else os.getcwd()
        self.ensure_directory(self.base_dir)
    
    def ensure_directory(self, dir_path: str) -> bool:
        """
        确保目录存在
        
        Args:
            dir_path: 目录路径
            
        Returns:
            bool: 创建是否成功
        """
        try:
            if not os.path.exists(dir_path):
                os.makedirs(dir_path, exist_ok=True)
                print(f"目录已创建: {dir_path}")
            return True
        except Exception as e:
            print(f"创建目录失败: {str(e)}")
            return False
    
    def write_file(self, file_path: str, content: str, encoding: str = 'utf-8', append: bool = False) -> bool:
        """
        写入文件
        
        Args:
            file_path: 文件路径
            content: 文件内容
            encoding: 编码格式
            append: 是否追加模式
            
        Returns:
            bool: 写入是否成功
        """
        try:
            # 确保目录存在
            file_dir = os.path.dirname(file_path)
            if file_dir:
                self.ensure_directory(file_dir)
            
            mode = 'a' if append else 'w'
            with open(file_path, mode, encoding=encoding) as f:
                f.write(content)
            
            return True
        except Exception as e:
            print(f"写入文件失败: {str(e)}")
            return False
    
    def read_file(self, file_path: str, encoding: str = 'utf-8') -> Optional[str]:
        """
        读取文件
        
        Args:
            file_path: 文件路径
            encoding: 编码格式
            
        Returns:
            Optional[str]: 文件内容或None
        """
        try:
            if not os.path.exists(file_path):
                return None
            
            with open(file_path, 'r', encoding=encoding) as f:
                return f.read()
        except Exception as e:
            print(f"读取文件失败: {str(e)}")
            return None
    
    def copy_file(self, src_path: str, dst_path: str) -> bool:
        """
        复制文件
        
        Args:
            src_path: 源文件路径
            dst_path: 目标文件路径
            
        Returns:
            bool: 复制是否成功
        """
        try:
            if not os.path.exists(src_path):
                print(f"源文件不存在: {src_path}")
                return False
            
            # 确保目标目录存在
            dst_dir = os.path.dirname(dst_path)
            if dst_dir:
                self.ensure_directory(dst_dir)
            
            shutil.copy2(src_path, dst_path)
            print(f"文件已复制: {src_path} -> {dst_path}")
            return True
        except Exception as e:
            print(f"复制文件失败: {str(e)}")
            return False
    
    def move_file(self, src_path: str, dst_path: str) -> bool:
        """
        移动文件
        
        Args:
            src_path: 源文件路径
            dst_path: 目标文件路径
            
        Returns:
            bool: 移动是否成功
        """
        try:
            if not os.path.exists(src_path):
                print(f"源文件不存在: {src_path}")
                return False
            
            # 确保目标目录存在
            dst_dir = os.path.dirname(dst_path)
            if dst_dir:
                self.ensure_directory(dst_dir)
            
            shutil.move(src_path, dst_path)
            print(f"文件已移动: {src_path} -> {dst_path}")
            return True
        except Exception as e:
            print(f"移动文件失败: {str(e)}")
            return False
    
    def delete_file(self, file_path: str) -> bool:
        """
        删除文件
        
        Args:
            file_path: 文件路径
            
        Returns:
            bool: 删除是否成功
        """
        try:
            if not os.path.exists(file_path):
                print(f"文件不存在: {file_path}")
                return True  # 文件不存在视为删除成功
            
            os.remove(file_path)
            print(f"文件已删除: {file_path}")
            return True
        except Exception as e:
            print(f"删除文件失败: {str(e)}")
            return False
    
    def backup_file(self, file_path: str, backup_dir: Optional[str] = None) -> Optional[str]:
        """
        备份文件
        
        Args:
            file_path: 文件路径
            backup_dir: 备份目录，如果为None则在原目录创建backup子目录
            
        Returns:
            Optional[str]: 备份文件路径或None
        """
        try:
            if not os.path.exists(file_path):
                print(f"文件不存在: {file_path}")
                return None
            
            # 确定备份目录
            if backup_dir is None:
                backup_dir = os.path.join(os.path.dirname(file_path), 'backup')
            
            self.ensure_directory(backup_dir)
            
            # 生成备份文件名
            timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
            file_name = os.path.basename(file_path)
            name_part, ext_part = os.path.splitext(file_name)
            backup_name = f"{name_part}_backup_{timestamp}{ext_part}"
            backup_path = os.path.join(backup_dir, backup_name)
            
            # 复制文件
            if self.copy_file(file_path, backup_path):
                print(f"文件已备份: {backup_path}")
                return backup_path
            else:
                return None
                
        except Exception as e:
            print(f"备份文件失败: {str(e)}")
            return None
    
    def get_file_info(self, file_path: str) -> Optional[Dict[str, Any]]:
        """
        获取文件信息
        
        Args:
            file_path: 文件路径
            
        Returns:
            Optional[Dict]: 文件信息字典或None
        """
        try:
            if not os.path.exists(file_path):
                return None
            
            stat = os.stat(file_path)
            info = {
                'path': file_path,
                'name': os.path.basename(file_path),
                'size': stat.st_size,
                'size_kb': round(stat.st_size / 1024, 2),
                'created_time': datetime.datetime.fromtimestamp(stat.st_ctime),
                'modified_time': datetime.datetime.fromtimestamp(stat.st_mtime),
                'accessed_time': datetime.datetime.fromtimestamp(stat.st_atime),
                'is_file': os.path.isfile(file_path),
                'is_dir': os.path.isdir(file_path)
            }
            
            # 计算文件MD5（仅对小文件）
            if info['size'] <= 10 * 1024 * 1024:  # 10MB以下
                info['md5'] = self.calculate_file_md5(file_path)
            
            return info
        except Exception as e:
            print(f"获取文件信息失败: {str(e)}")
            return None
    
    def calculate_file_md5(self, file_path: str) -> Optional[str]:
        """
        计算文件MD5值
        
        Args:
            file_path: 文件路径
            
        Returns:
            Optional[str]: MD5值或None
        """
        try:
            if not os.path.exists(file_path):
                return None
            
            hash_md5 = hashlib.md5()
            with open(file_path, "rb") as f:
                for chunk in iter(lambda: f.read(4096), b""):
                    hash_md5.update(chunk)
            return hash_md5.hexdigest()
        except Exception as e:
            print(f"计算MD5失败: {str(e)}")
            return None
    
    def list_files(self, directory: str, pattern: str = "*", recursive: bool = False) -> List[str]:
        """
        列出目录中的文件
        
        Args:
            directory: 目录路径
            pattern: 文件匹配模式
            recursive: 是否递归搜索
            
        Returns:
            List[str]: 文件路径列表
        """
        try:
            if not os.path.exists(directory):
                return []
            
            import glob
            
            if recursive:
                search_pattern = os.path.join(directory, "**", pattern)
                files = glob.glob(search_pattern, recursive=True)
            else:
                search_pattern = os.path.join(directory, pattern)
                files = glob.glob(search_pattern)
            
            # 只返回文件，不包括目录
            return [f for f in files if os.path.isfile(f)]
            
        except Exception as e:
            print(f"列出文件失败: {str(e)}")
            return []
    
    def cleanup_old_files(self, directory: str, days_old: int = 30, pattern: str = "*") -> int:
        """
        清理旧文件
        
        Args:
            directory: 目录路径
            days_old: 多少天前的文件算作旧文件
            pattern: 文件匹配模式
            
        Returns:
            int: 删除的文件数量
        """
        try:
            if not os.path.exists(directory):
                return 0
            
            cutoff_time = datetime.datetime.now() - datetime.timedelta(days=days_old)
            cutoff_timestamp = cutoff_time.timestamp()
            
            files = self.list_files(directory, pattern)
            deleted_count = 0
            
            for file_path in files:
                try:
                    stat = os.stat(file_path)
                    if stat.st_mtime < cutoff_timestamp:
                        if self.delete_file(file_path):
                            deleted_count += 1
                except Exception as e:
                    print(f"处理文件失败 {file_path}: {str(e)}")
                    continue
            
            print(f"清理完成，删除了 {deleted_count} 个旧文件")
            return deleted_count
            
        except Exception as e:
            print(f"清理旧文件失败: {str(e)}")
            return 0
    
    def is_safe_path(self, file_path: str) -> bool:
        """
        检查路径是否安全（防止路径穿越攻击）
        
        Args:
            file_path: 文件路径
            
        Returns:
            bool: 路径是否安全
        """
        try:
            # 规范化路径
            normalized_path = os.path.normpath(file_path)
            
            # 检查是否包含危险字符
            dangerous_patterns = ['..', '~', '$']
            for pattern in dangerous_patterns:
                if pattern in normalized_path:
                    return False
            
            # 检查是否是绝对路径且在基础目录之外
            if os.path.isabs(normalized_path):
                base_abs = os.path.abspath(self.base_dir)
                path_abs = os.path.abspath(normalized_path)
                if not path_abs.startswith(base_abs):
                    return False
            
            return True
        except Exception as e:
            print(f"路径安全检查失败: {str(e)}")
            return False
    
    def get_relative_path(self, file_path: str, base_path: Optional[str] = None) -> str:
        """
        获取相对路径
        
        Args:
            file_path: 文件路径
            base_path: 基础路径，如果为None则使用base_dir
            
        Returns:
            str: 相对路径
        """
        try:
            if base_path is None:
                base_path = self.base_dir
            
            return os.path.relpath(file_path, base_path)
        except Exception as e:
            print(f"获取相对路径失败: {str(e)}")
            return file_path 