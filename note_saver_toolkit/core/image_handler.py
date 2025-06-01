"""
FILE: image_handler.py
REQ: 图片处理器
CHECK: 图片保存,格式转换,压缩,错误处理
HIST: 2025-01-31-AI生成
"""

import os
import base64
import io
from typing import Union, Optional, Tuple
from PIL import Image, ImageOps


class ImageHandler:
    """图片处理器"""
    
    def __init__(self, max_size_kb: int = 1024, quality: int = 85):
        """
        初始化图片处理器
        
        Args:
            max_size_kb: 图片最大大小（KB）
            quality: 压缩质量（1-100）
        """
        self.max_size_kb = max_size_kb
        self.quality = quality
        self.supported_formats = ['PNG', 'JPEG', 'JPG', 'GIF', 'BMP', 'WEBP']
    
    def save_image(self, image_data: Union[str, bytes, Image.Image], save_path: str, 
                   compress: bool = True, format: str = 'PNG') -> bool:
        """
        保存图片
        
        Args:
            image_data: 图片数据（base64字符串、字节数据或PIL Image对象）
            save_path: 保存路径
            compress: 是否压缩
            format: 保存格式
            
        Returns:
            bool: 保存是否成功
        """
        try:
            # 确保保存目录存在
            save_dir = os.path.dirname(save_path)
            if save_dir and not os.path.exists(save_dir):
                os.makedirs(save_dir, exist_ok=True)
            
            # 转换为PIL Image对象
            image = self._convert_to_pil_image(image_data)
            if image is None:
                print("无法转换图片数据")
                return False
            
            # 压缩图片（如果需要）
            if compress:
                image = self._compress_image(image)
            
            # 保存图片
            image.save(save_path, format=format, quality=self.quality)
            
            print(f"图片已保存到: {save_path}")
            return True
            
        except Exception as e:
            print(f"保存图片失败: {str(e)}")
            return False
    
    def _convert_to_pil_image(self, image_data: Union[str, bytes, Image.Image]) -> Optional[Image.Image]:
        """
        将不同格式的图片数据转换为PIL Image对象
        
        Args:
            image_data: 图片数据
            
        Returns:
            Optional[Image.Image]: PIL Image对象或None
        """
        try:
            if isinstance(image_data, Image.Image):
                return image_data
            elif isinstance(image_data, str):
                # Base64字符串
                if image_data.startswith('data:image'):
                    # 去掉data:image/...;base64,前缀
                    base64_data = image_data.split(',')[1]
                    image_bytes = base64.b64decode(base64_data)
                else:
                    # 纯base64字符串
                    image_bytes = base64.b64decode(image_data)
                
                # 从字节数据创建Image
                return Image.open(io.BytesIO(image_bytes))
            elif isinstance(image_data, bytes):
                # 字节数据
                return Image.open(io.BytesIO(image_data))
            else:
                print(f"不支持的图片数据类型: {type(image_data)}")
                return None
                
        except Exception as e:
            print(f"转换图片数据失败: {str(e)}")
            return None
    
    def _compress_image(self, image: Image.Image) -> Image.Image:
        """
        压缩图片
        
        Args:
            image: PIL Image对象
            
        Returns:
            Image.Image: 压缩后的图片
        """
        try:
            # 如果图片已经很小，不需要压缩
            temp_buffer = io.BytesIO()
            image.save(temp_buffer, format='PNG')
            if len(temp_buffer.getvalue()) <= self.max_size_kb * 1024:
                return image
            
            # 获取原始尺寸
            original_width, original_height = image.size
            
            # 计算压缩比例
            scale_factor = 0.8
            new_width = int(original_width * scale_factor)
            new_height = int(original_height * scale_factor)
            
            # 逐步压缩直到满足大小要求
            compressed_image = image.copy()
            attempts = 0
            max_attempts = 10
            
            while attempts < max_attempts:
                # 调整尺寸
                if new_width > 100 and new_height > 100:  # 保持最小尺寸
                    compressed_image = compressed_image.resize((new_width, new_height), Image.LANCZOS)
                
                # 检查文件大小
                temp_buffer = io.BytesIO()
                compressed_image.save(temp_buffer, format='JPEG', quality=self.quality)
                
                if len(temp_buffer.getvalue()) <= self.max_size_kb * 1024:
                    break
                
                # 继续压缩
                new_width = int(new_width * scale_factor)
                new_height = int(new_height * scale_factor)
                self.quality = max(10, self.quality - 10)  # 降低质量，但不低于10
                attempts += 1
            
            print(f"图片压缩完成: {original_width}x{original_height} -> {new_width}x{new_height}")
            return compressed_image
            
        except Exception as e:
            print(f"压缩图片失败: {str(e)}")
            return image
    
    def get_image_info(self, image_path: str) -> Optional[dict]:
        """
        获取图片信息
        
        Args:
            image_path: 图片路径
            
        Returns:
            Optional[dict]: 图片信息字典或None
        """
        try:
            if not os.path.exists(image_path):
                return None
            
            with Image.open(image_path) as image:
                info = {
                    'width': image.width,
                    'height': image.height,
                    'format': image.format,
                    'mode': image.mode,
                    'size_bytes': os.path.getsize(image_path),
                    'size_kb': round(os.path.getsize(image_path) / 1024, 2)
                }
                return info
                
        except Exception as e:
            print(f"获取图片信息失败: {str(e)}")
            return None
    
    def convert_to_base64(self, image_path: str) -> Optional[str]:
        """
        将图片转换为base64字符串
        
        Args:
            image_path: 图片路径
            
        Returns:
            Optional[str]: base64字符串或None
        """
        try:
            if not os.path.exists(image_path):
                return None
            
            with open(image_path, 'rb') as f:
                image_bytes = f.read()
            
            base64_string = base64.b64encode(image_bytes).decode('utf-8')
            
            # 获取图片格式
            with Image.open(image_path) as image:
                format_lower = image.format.lower()
                mime_type = f"image/{format_lower}"
                if format_lower == 'jpeg':
                    mime_type = "image/jpeg"
                elif format_lower == 'jpg':
                    mime_type = "image/jpeg"
            
            # 返回完整的data URL
            return f"data:{mime_type};base64,{base64_string}"
            
        except Exception as e:
            print(f"转换为base64失败: {str(e)}")
            return None
    
    def resize_image(self, image_path: str, max_width: int = 800, max_height: int = 600, 
                     save_path: Optional[str] = None) -> bool:
        """
        调整图片尺寸
        
        Args:
            image_path: 原图片路径
            max_width: 最大宽度
            max_height: 最大高度
            save_path: 保存路径，如果为None则覆盖原文件
            
        Returns:
            bool: 调整是否成功
        """
        try:
            if not os.path.exists(image_path):
                return False
            
            with Image.open(image_path) as image:
                # 计算新尺寸
                original_width, original_height = image.size
                
                # 如果图片已经小于最大尺寸，无需调整
                if original_width <= max_width and original_height <= max_height:
                    if save_path and save_path != image_path:
                        image.save(save_path)
                    return True
                
                # 计算缩放比例
                width_ratio = max_width / original_width
                height_ratio = max_height / original_height
                scale_ratio = min(width_ratio, height_ratio)
                
                new_width = int(original_width * scale_ratio)
                new_height = int(original_height * scale_ratio)
                
                # 调整尺寸
                resized_image = image.resize((new_width, new_height), Image.LANCZOS)
                
                # 保存
                target_path = save_path if save_path else image_path
                resized_image.save(target_path)
                
                print(f"图片尺寸已调整: {original_width}x{original_height} -> {new_width}x{new_height}")
                return True
                
        except Exception as e:
            print(f"调整图片尺寸失败: {str(e)}")
            return False
    
    def create_thumbnail(self, image_path: str, thumbnail_path: str, size: Tuple[int, int] = (150, 150)) -> bool:
        """
        创建缩略图
        
        Args:
            image_path: 原图片路径
            thumbnail_path: 缩略图保存路径
            size: 缩略图尺寸
            
        Returns:
            bool: 创建是否成功
        """
        try:
            if not os.path.exists(image_path):
                return False
            
            # 确保缩略图目录存在
            thumbnail_dir = os.path.dirname(thumbnail_path)
            if thumbnail_dir and not os.path.exists(thumbnail_dir):
                os.makedirs(thumbnail_dir, exist_ok=True)
            
            with Image.open(image_path) as image:
                # 创建缩略图
                image.thumbnail(size, Image.LANCZOS)
                image.save(thumbnail_path)
                
                print(f"缩略图已创建: {thumbnail_path}")
                return True
                
        except Exception as e:
            print(f"创建缩略图失败: {str(e)}")
            return False 