"""
用户数据模型
包含用户认证和基本信息管理
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from datetime import datetime

from app.core.database import Base


class UserRole(str, enum.Enum):
    """用户角色枚举"""
    ADMIN = "admin"
    USER = "user"
    DEMO = "demo"


class UserStatus(str, enum.Enum):
    """用户状态枚举"""
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"


class User(Base):
    """用户模型"""
    
    __tablename__ = "users"
    
    # 基础字段
    id = Column(Integer, primary_key=True, index=True, comment="用户ID")
    username = Column(String(50), unique=True, index=True, nullable=False, comment="用户名")
    email = Column(String(100), unique=True, index=True, nullable=False, comment="邮箱")
    password_hash = Column(String(255), nullable=False, comment="密码哈希")
    
    # 用户信息
    display_name = Column(String(100), nullable=True, comment="显示名称")
    avatar_url = Column(String(255), nullable=True, comment="头像URL")
    bio = Column(Text, nullable=True, comment="个人简介")
    
    # 角色和状态
    role = Column(Enum(UserRole), default=UserRole.USER, nullable=False, comment="用户角色")
    status = Column(Enum(UserStatus), default=UserStatus.ACTIVE, nullable=False, comment="用户状态")
    is_active = Column(Boolean, default=True, nullable=False, comment="是否激活")
    is_verified = Column(Boolean, default=False, nullable=False, comment="是否验证邮箱")
    
    # 设置和偏好
    preferences = Column(Text, nullable=True, comment="用户偏好设置(JSON)")
    settings = Column(Text, nullable=True, comment="用户配置(JSON)")
    
    # 安全字段
    last_login_at = Column(DateTime(timezone=True), nullable=True, comment="最后登录时间")
    last_login_ip = Column(String(45), nullable=True, comment="最后登录IP")
    failed_login_count = Column(Integer, default=0, nullable=False, comment="失败登录次数")
    locked_until = Column(DateTime(timezone=True), nullable=True, comment="锁定到期时间")
    
    # 时间戳
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, comment="创建时间")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False, comment="更新时间")
    deleted_at = Column(DateTime(timezone=True), nullable=True, comment="删除时间")
    
    # 关系
    notes = relationship("Note", back_populates="user", cascade="all, delete-orphan")
    qa_sessions = relationship("QASession", back_populates="user", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<User(id={self.id}, username='{self.username}', role='{self.role}')>"
    
    def to_dict(self, include_sensitive: bool = False):
        """转换为字典"""
        data = {
            "id": self.id,
            "username": self.username,
            "email": self.email if include_sensitive else self.email[:3] + "***@***",
            "display_name": self.display_name,
            "avatar_url": self.avatar_url,
            "bio": self.bio,
            "role": self.role.value,
            "status": self.status.value,
            "is_active": self.is_active,
            "is_verified": self.is_verified,
            "last_login_at": self.last_login_at.isoformat() if self.last_login_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
        
        if include_sensitive:
            data.update({
                "last_login_ip": self.last_login_ip,
                "failed_login_count": self.failed_login_count,
                "locked_until": self.locked_until.isoformat() if self.locked_until else None,
            })
        
        return data
    
    def is_admin(self) -> bool:
        """检查是否为管理员"""
        return self.role == UserRole.ADMIN
    
    def is_locked(self) -> bool:
        """检查账户是否被锁定"""
        if self.locked_until is None:
            return False
        return datetime.utcnow() < self.locked_until
    
    def can_login(self) -> bool:
        """检查是否可以登录"""
        return (
            self.is_active and 
            self.status == UserStatus.ACTIVE and 
            not self.is_locked()
        )
    
    def increment_failed_login(self, max_attempts: int = 5):
        """增加失败登录次数"""
        self.failed_login_count += 1
        if self.failed_login_count >= max_attempts:
            # 锁定30分钟
            from datetime import timedelta
            self.locked_until = datetime.utcnow() + timedelta(minutes=30)
    
    def reset_failed_login(self):
        """重置失败登录计数"""
        self.failed_login_count = 0
        self.locked_until = None
    
    def update_last_login(self, ip_address: str = None):
        """更新最后登录信息"""
        self.last_login_at = datetime.utcnow()
        if ip_address:
            self.last_login_ip = ip_address
        self.reset_failed_login()


class UserSession(Base):
    """用户会话模型"""
    
    __tablename__ = "user_sessions"
    
    id = Column(Integer, primary_key=True, index=True, comment="会话ID")
    user_id = Column(Integer, nullable=False, comment="用户ID")
    session_token = Column(String(255), unique=True, index=True, nullable=False, comment="会话令牌")
    refresh_token = Column(String(255), unique=True, index=True, nullable=True, comment="刷新令牌")
    
    # 会话信息
    ip_address = Column(String(45), nullable=True, comment="IP地址")
    user_agent = Column(Text, nullable=True, comment="用户代理")
    device_info = Column(Text, nullable=True, comment="设备信息")
    
    # 时间戳
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, comment="创建时间")
    expires_at = Column(DateTime(timezone=True), nullable=False, comment="过期时间")
    last_used_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, comment="最后使用时间")
    
    # 状态
    is_active = Column(Boolean, default=True, nullable=False, comment="是否活跃")
    
    def __repr__(self):
        return f"<UserSession(id={self.id}, user_id={self.user_id})>"
    
    def is_expired(self) -> bool:
        """检查是否过期"""
        return datetime.utcnow() > self.expires_at
    
    def is_valid(self) -> bool:
        """检查会话是否有效"""
        return self.is_active and not self.is_expired()


class UserLoginLog(Base):
    """用户登录日志模型"""
    
    __tablename__ = "user_login_logs"
    
    id = Column(Integer, primary_key=True, index=True, comment="日志ID")
    user_id = Column(Integer, nullable=True, comment="用户ID")
    username = Column(String(50), nullable=True, comment="用户名")
    
    # 登录信息
    login_type = Column(String(20), nullable=False, comment="登录类型") # password, token, oauth
    success = Column(Boolean, nullable=False, comment="是否成功")
    failure_reason = Column(String(100), nullable=True, comment="失败原因")
    
    # 请求信息
    ip_address = Column(String(45), nullable=True, comment="IP地址")
    user_agent = Column(Text, nullable=True, comment="用户代理")
    
    # 时间戳
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, comment="创建时间")
    
    def __repr__(self):
        return f"<UserLoginLog(id={self.id}, user_id={self.user_id}, success={self.success})>"


# 导出模型
__all__ = ["User", "UserSession", "UserLoginLog", "UserRole", "UserStatus"] 