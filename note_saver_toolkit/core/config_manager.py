"""
FILE: config_manager.py
REQ: 配置管理器
CHECK: 配置加载,配置保存,默认配置,错误处理
HIST: 2025-01-31-AI生成
"""

import os
import json
from typing import Dict, Any, Optional


class ConfigManager:
    """配置管理器"""
    
    def __init__(self, config_path: Optional[str] = None):
        """
        初始化配置管理器
        
        Args:
            config_path: 配置文件路径，如果为None则使用默认路径
        """
        if config_path is None:
            # 使用默认配置路径
            self.config_path = os.path.join(os.getcwd(), 'note_saver_config.json')
        else:
            self.config_path = config_path
        
        # 默认配置
        self.default_config = {
            'log_file': 'logs/notes.md',
            'image_dir': 'logs/images',
            'auto_timestamp': True,
            'date_format': '%Y-%m-%d %H:%M:%S',
            'markdown_format': True,
            'auto_backup': False,
            'max_image_size': 1024,  # KB
            'compress_images': True,
            'language': 'zh-CN'
        }
    
    def load_config(self) -> Dict[str, Any]:
        """
        加载配置文件
        
        Returns:
            Dict: 配置字典
        """
        try:
            if os.path.exists(self.config_path):
                with open(self.config_path, 'r', encoding='utf-8') as f:
                    config = json.load(f)
                
                # 合并默认配置（确保新增配置项存在）
                merged_config = self.default_config.copy()
                merged_config.update(config)
                
                # 验证配置
                validated_config = self._validate_config(merged_config)
                
                # 如果配置有更新，保存回去
                if validated_config != config:
                    self.save_config(validated_config)
                
                return validated_config
            else:
                # 配置文件不存在，创建默认配置
                print(f"配置文件 {self.config_path} 不存在，使用默认配置")
                self.save_config(self.default_config)
                return self.default_config.copy()
                
        except Exception as e:
            print(f"加载配置失败: {str(e)}")
            print("使用默认配置")
            return self.default_config.copy()
    
    def save_config(self, config: Dict[str, Any]) -> bool:
        """
        保存配置到文件
        
        Args:
            config: 配置字典
            
        Returns:
            bool: 保存是否成功
        """
        try:
            # 确保配置目录存在
            config_dir = os.path.dirname(self.config_path)
            if config_dir and not os.path.exists(config_dir):
                os.makedirs(config_dir, exist_ok=True)
            
            # 验证配置
            validated_config = self._validate_config(config)
            
            # 保存配置
            with open(self.config_path, 'w', encoding='utf-8') as f:
                json.dump(validated_config, f, indent=2, ensure_ascii=False)
            
            print(f"配置已保存到: {self.config_path}")
            return True
            
        except Exception as e:
            print(f"保存配置失败: {str(e)}")
            return False
    
    def _validate_config(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """
        验证配置的有效性
        
        Args:
            config: 配置字典
            
        Returns:
            Dict: 验证后的配置字典
        """
        validated_config = config.copy()
        
        # 验证日志文件路径
        if 'log_file' in validated_config:
            log_file = validated_config['log_file']
            if not log_file or not isinstance(log_file, str):
                validated_config['log_file'] = self.default_config['log_file']
        
        # 验证图片目录
        if 'image_dir' in validated_config:
            image_dir = validated_config['image_dir']
            if not image_dir or not isinstance(image_dir, str):
                validated_config['image_dir'] = self.default_config['image_dir']
        
        # 验证布尔值配置
        bool_configs = ['auto_timestamp', 'markdown_format', 'auto_backup', 'compress_images']
        for key in bool_configs:
            if key in validated_config:
                if not isinstance(validated_config[key], bool):
                    validated_config[key] = self.default_config[key]
        
        # 验证数值配置
        if 'max_image_size' in validated_config:
            if not isinstance(validated_config['max_image_size'], (int, float)) or validated_config['max_image_size'] <= 0:
                validated_config['max_image_size'] = self.default_config['max_image_size']
        
        # 验证日期格式
        if 'date_format' in validated_config:
            date_format = validated_config['date_format']
            if not date_format or not isinstance(date_format, str):
                validated_config['date_format'] = self.default_config['date_format']
            else:
                # 尝试格式化当前时间以验证格式
                try:
                    import datetime
                    datetime.datetime.now().strftime(date_format)
                except ValueError:
                    print(f"无效的日期格式: {date_format}，使用默认格式")
                    validated_config['date_format'] = self.default_config['date_format']
        
        return validated_config
    
    def get_config_value(self, key: str, default: Any = None) -> Any:
        """
        获取配置值
        
        Args:
            key: 配置键
            default: 默认值
            
        Returns:
            Any: 配置值
        """
        config = self.load_config()
        return config.get(key, default)
    
    def set_config_value(self, key: str, value: Any) -> bool:
        """
        设置配置值
        
        Args:
            key: 配置键
            value: 配置值
            
        Returns:
            bool: 设置是否成功
        """
        config = self.load_config()
        config[key] = value
        return self.save_config(config)
    
    def reset_config(self) -> bool:
        """
        重置配置为默认值
        
        Returns:
            bool: 重置是否成功
        """
        return self.save_config(self.default_config.copy())
    
    def get_config_path(self) -> str:
        """获取配置文件路径"""
        return self.config_path
    
    def backup_config(self, backup_path: Optional[str] = None) -> bool:
        """
        备份配置文件
        
        Args:
            backup_path: 备份文件路径，如果为None则自动生成
            
        Returns:
            bool: 备份是否成功
        """
        try:
            if not os.path.exists(self.config_path):
                print("配置文件不存在，无法备份")
                return False
            
            if backup_path is None:
                import datetime
                timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
                backup_path = f"{self.config_path}.backup_{timestamp}"
            
            # 确保备份目录存在
            backup_dir = os.path.dirname(backup_path)
            if backup_dir and not os.path.exists(backup_dir):
                os.makedirs(backup_dir, exist_ok=True)
            
            # 复制配置文件
            import shutil
            shutil.copy2(self.config_path, backup_path)
            
            print(f"配置文件已备份到: {backup_path}")
            return True
            
        except Exception as e:
            print(f"备份配置失败: {str(e)}")
            return False 