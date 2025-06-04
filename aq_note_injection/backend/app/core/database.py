"""
数据库连接和初始化
SQLAlchemy 异步数据库配置
"""

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base
from sqlalchemy import text
import structlog
from typing import AsyncGenerator

from app.core.config import settings

logger = structlog.get_logger()

# 创建异步数据库引擎
engine = create_async_engine(
    settings.get_database_url(),
    echo=settings.DATABASE_ECHO,
    pool_size=20,
    max_overflow=0,
    pool_pre_ping=True,
    pool_recycle=3600,
)

# 创建异步会话工厂
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

# 创建基础模型类
Base = declarative_base()


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """
    获取数据库会话
    用于依赖注入
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception as e:
            logger.error("数据库会话异常", error=str(e), exc_info=True)
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db() -> None:
    """
    初始化数据库
    创建所有表结构
    """
    try:
        logger.info("开始初始化数据库")
        
        # 导入所有模型以确保它们被注册
        from app.models.user import User
        from app.models.note import Note
        from app.models.qa_session import QASession
        
        # 创建所有表
        async with engine.begin() as conn:
            # 检查数据库连接
            await conn.execute(text("SELECT 1"))
            logger.info("数据库连接成功")
            
            # 创建表结构
            await conn.run_sync(Base.metadata.create_all)
            logger.info("数据库表结构创建完成")
            
        logger.info("数据库初始化完成")
        
    except Exception as e:
        logger.error("数据库初始化失败", error=str(e), exc_info=True)
        raise


async def check_db_health() -> bool:
    """
    检查数据库健康状态
    """
    try:
        async with AsyncSessionLocal() as session:
            # 执行简单查询测试连接
            result = await session.execute(text("SELECT 1"))
            result.fetchone()
            return True
    except Exception as e:
        logger.error("数据库健康检查失败", error=str(e), exc_info=True)
        return False


async def create_test_data() -> None:
    """
    创建测试数据（仅在开发环境）
    """
    if not settings.DEBUG:
        return
        
    try:
        logger.info("开始创建测试数据")
        
        from app.models.user import User
        from app.models.note import Note
        from app.services.auth_service import AuthService
        
        async with AsyncSessionLocal() as session:
            # 检查是否已有用户
            result = await session.execute(text("SELECT COUNT(*) FROM users"))
            user_count = result.scalar()
            
            if user_count > 0:
                logger.info("测试数据已存在，跳过创建")
                return
            
            auth_service = AuthService()
            
            # 创建管理员用户
            admin_user = User(
                username="admin",
                email="admin@example.com",
                display_name="系统管理员",
                password_hash=auth_service.hash_password("admin123"),
                role="admin",
                is_active=True
            )
            session.add(admin_user)
            
            # 创建演示用户
            demo_user = User(
                username="demo",
                email="demo@example.com", 
                display_name="演示用户",
                password_hash=auth_service.hash_password("demo123"),
                role="demo",
                is_active=True
            )
            session.add(demo_user)
            
            # 提交用户数据
            await session.commit()
            
            # 刷新以获取ID
            await session.refresh(admin_user)
            await session.refresh(demo_user)
            
            # 创建示例笔记
            sample_note = Note(
                title="欢迎使用智能问答系统",
                content="这是一个示例笔记，展示了系统的笔记管理功能。\n\n您可以：\n- 创建和编辑笔记\n- 使用标签分类\n- 搜索和过滤笔记\n- 导出笔记内容",
                tags=["欢迎", "示例", "功能介绍"],
                content_type="note",
                user_id=admin_user.id
            )
            session.add(sample_note)
            
            await session.commit()
            
            logger.info("测试数据创建完成", 
                       admin_id=admin_user.id,
                       demo_id=demo_user.id)
            
    except Exception as e:
        logger.error("创建测试数据失败", error=str(e), exc_info=True)


class DatabaseManager:
    """数据库管理器"""
    
    def __init__(self):
        self.engine = engine
        self.session_factory = AsyncSessionLocal
    
    async def get_session(self) -> AsyncSession:
        """获取数据库会话"""
        return self.session_factory()
    
    async def execute_raw_sql(self, sql: str, params: dict = None) -> None:
        """执行原始SQL"""
        async with self.session_factory() as session:
            await session.execute(text(sql), params)
            await session.commit()
    
    async def backup_database(self, backup_path: str) -> bool:
        """备份数据库（MySQL）"""
        try:
            # 这里可以实现数据库备份逻辑
            # 例如调用 mysqldump 或其他备份工具
            logger.info("数据库备份功能暂未实现", backup_path=backup_path)
            return True
        except Exception as e:
            logger.error("数据库备份失败", error=str(e), exc_info=True)
            return False
    
    async def get_database_info(self) -> dict:
        """获取数据库信息"""
        try:
            async with self.session_factory() as session:
                # 获取数据库版本
                version_result = await session.execute(text("SELECT VERSION()"))
                version = version_result.scalar()
                
                # 获取表信息
                tables_result = await session.execute(text(
                    "SELECT table_name FROM information_schema.tables "
                    "WHERE table_schema = DATABASE()"
                ))
                tables = [row[0] for row in tables_result.fetchall()]
                
                return {
                    "version": version,
                    "tables": tables,
                    "table_count": len(tables)
                }
        except Exception as e:
            logger.error("获取数据库信息失败", error=str(e), exc_info=True)
            return {}


# 创建全局数据库管理器实例
db_manager = DatabaseManager()


# 导出常用对象
__all__ = [
    "Base",
    "engine", 
    "AsyncSessionLocal",
    "get_db_session",
    "init_db",
    "check_db_health",
    "create_test_data",
    "db_manager"
] 