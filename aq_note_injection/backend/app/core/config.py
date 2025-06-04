"""
应用配置管理
使用 Pydantic 设置管理环境变量
"""

from pydantic_settings import BaseSettings
from pydantic import Field
from typing import List
import os


class Settings(BaseSettings):
    """应用配置类"""
    
    # 应用基础配置
    APP_NAME: str = "智能问答系统 API"
    APP_VERSION: str = "3.0.0"
    DEBUG: bool = Field(default=False, description="调试模式")
    
    # 服务器配置
    HOST: str = Field(default="0.0.0.0", description="服务器地址")
    PORT: int = Field(default=8000, description="服务器端口")
    
    # 数据库配置
    DATABASE_URL: str = Field(
        default="mysql+pymysql://qa_user:qa_password@localhost:3306/qa_db",
        description="数据库连接URL"
    )
    DATABASE_ECHO: bool = Field(default=False, description="是否打印SQL语句")
    
    # Redis配置
    REDIS_URL: str = Field(
        default="redis://localhost:6379/0",
        description="Redis连接URL"
    )
    
    # JWT配置
    JWT_SECRET_KEY: str = Field(
        default="your-secret-key-here-change-in-production",
        description="JWT密钥"
    )
    JWT_ALGORITHM: str = Field(default="HS256", description="JWT算法")
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(
        default=30, description="访问令牌过期时间(分钟)"
    )
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = Field(
        default=7, description="刷新令牌过期时间(天)"
    )
    
    # 密码配置
    PASSWORD_MIN_LENGTH: int = Field(default=6, description="密码最小长度")
    
    # CORS配置
    CORS_ORIGINS: List[str] = Field(
        default=["http://localhost:3000", "http://127.0.0.1:3000"],
        description="允许的跨域源"
    )
    
    # 信任主机
    ALLOWED_HOSTS: List[str] = Field(
        default=["localhost", "127.0.0.1", "0.0.0.0"],
        description="允许的主机"
    )
    
    # 日志配置
    LOG_LEVEL: str = Field(default="INFO", description="日志级别")
    LOG_FORMAT: str = Field(
        default="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        description="日志格式"
    )
    
    # 文件上传配置
    MAX_UPLOAD_SIZE: int = Field(default=10 * 1024 * 1024, description="最大上传文件大小(字节)")
    UPLOAD_DIR: str = Field(default="uploads", description="上传文件目录")
    
    # AI服务配置
    AI_SERVICE_ENABLED: bool = Field(default=True, description="是否启用AI服务")
    AI_SERVICE_TIMEOUT: int = Field(default=30, description="AI服务超时时间(秒)")
    
    # 缓存配置
    CACHE_TTL: int = Field(default=3600, description="缓存生存时间(秒)")
    
    # 分页配置
    DEFAULT_PAGE_SIZE: int = Field(default=20, description="默认分页大小")
    MAX_PAGE_SIZE: int = Field(default=100, description="最大分页大小")
    
    # 安全配置
    SECURITY_HEADERS: bool = Field(default=True, description="是否启用安全头")
    RATE_LIMIT_ENABLED: bool = Field(default=True, description="是否启用频率限制")
    RATE_LIMIT_REQUESTS: int = Field(default=100, description="频率限制请求数")
    RATE_LIMIT_WINDOW: int = Field(default=60, description="频率限制时间窗口(秒)")
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True
        extra = "ignore"
    
    def get_database_url(self) -> str:
        """获取数据库连接URL"""
        return self.DATABASE_URL
    
    def get_redis_url(self) -> str:
        """获取Redis连接URL"""
        return self.REDIS_URL
    
    def is_production(self) -> bool:
        """判断是否为生产环境"""
        return not self.DEBUG
    
    def get_upload_path(self) -> str:
        """获取上传文件路径"""
        upload_path = os.path.join(os.getcwd(), self.UPLOAD_DIR)
        os.makedirs(upload_path, exist_ok=True)
        return upload_path


# 创建全局设置实例
settings = Settings()


# 开发环境配置
class DevelopmentSettings(Settings):
    """开发环境配置"""
    DEBUG: bool = True
    DATABASE_ECHO: bool = True
    LOG_LEVEL: str = "DEBUG"
    
    class Config:
        env_file = ".env.dev"


# 测试环境配置
class TestingSettings(Settings):
    """测试环境配置"""
    DEBUG: bool = True
    DATABASE_URL: str = "sqlite:///./test.db"
    
    class Config:
        env_file = ".env.test"


# 生产环境配置
class ProductionSettings(Settings):
    """生产环境配置"""
    DEBUG: bool = False
    LOG_LEVEL: str = "INFO"
    SECURITY_HEADERS: bool = True
    
    class Config:
        env_file = ".env.prod"


def get_settings(environment: str = None) -> Settings:
    """根据环境获取配置"""
    if environment is None:
        environment = os.getenv("ENVIRONMENT", "development")
    
    if environment == "development":
        return DevelopmentSettings()
    elif environment == "testing":
        return TestingSettings()
    elif environment == "production":
        return ProductionSettings()
    else:
        return Settings()


# 导出配置实例
__all__ = ["settings", "get_settings", "Settings"] 