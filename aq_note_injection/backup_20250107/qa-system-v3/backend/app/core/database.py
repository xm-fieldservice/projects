"""
数据库连接和会话管理
提供SQLAlchemy数据库连接、会话管理、连接池配置等功能
"""

from sqlalchemy import create_engine, event, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import QueuePool
from sqlalchemy.engine import Engine
from contextlib import contextmanager
from typing import Generator
import logging
import time

from .config import get_settings

# 获取配置
settings = get_settings()

# 配置日志
logger = logging.getLogger(__name__)

# 创建数据库引擎
engine = create_engine(
    settings.sqlalchemy_database_uri,
    poolclass=QueuePool,
    pool_size=10,              # 连接池大小
    max_overflow=20,           # 最大溢出连接数
    pool_recycle=3600,         # 连接回收时间（秒）
    pool_pre_ping=True,        # 连接前ping检查
    echo=settings.DB_ECHO,     # 是否打印SQL语句
    echo_pool=False,           # 是否打印连接池日志
    future=True                # 使用2.0风格
)

# 创建会话工厂
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    expire_on_commit=False
)

# 创建Base类
Base = declarative_base()

# 数据库连接事件监听器
@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    """为SQLite设置PRAGMA（如果使用SQLite）"""
    if 'sqlite' in settings.sqlalchemy_database_uri:
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

@event.listens_for(engine, "before_cursor_execute")
def receive_before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    """执行前记录开始时间"""
    context._query_start_time = time.time()

@event.listens_for(engine, "after_cursor_execute")
def receive_after_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    """执行后记录耗时"""
    total = time.time() - context._query_start_time
    if total > 1.0:  # 记录超过1秒的慢查询
        logger.warning(f"慢查询 ({total:.2f}s): {statement[:100]}...")

# 数据库依赖注入
def get_db() -> Generator[Session, None, None]:
    """
    获取数据库会话（依赖注入）
    用于FastAPI路由中的数据库会话管理
    """
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        logger.error(f"数据库会话错误: {e}")
        db.rollback()
        raise
    finally:
        db.close()

# 数据库上下文管理器
@contextmanager
def get_db_context():
    """
    数据库会话上下文管理器
    用于服务层或非FastAPI环境中的数据库操作
    """
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception as e:
        logger.error(f"数据库事务错误: {e}")
        db.rollback()
        raise
    finally:
        db.close()

# 数据库初始化和管理类
class DatabaseManager:
    """数据库管理器"""
    
    def __init__(self):
        self.engine = engine
        self.SessionLocal = SessionLocal
    
    def create_all_tables(self):
        """创建所有表"""
        try:
            # 导入所有模型以确保它们被注册
            from ..models import Base as ModelsBase
            ModelsBase.metadata.create_all(bind=self.engine)
            logger.info("✅ 数据库表创建成功")
        except Exception as e:
            logger.error(f"❌ 数据库表创建失败: {e}")
            raise
    
    def drop_all_tables(self):
        """删除所有表（危险操作）"""
        try:
            from ..models import Base as ModelsBase
            ModelsBase.metadata.drop_all(bind=self.engine)
            logger.warning("⚠️ 所有数据库表已删除")
        except Exception as e:
            logger.error(f"❌ 删除数据库表失败: {e}")
            raise
    
    def check_connection(self) -> bool:
        """检查数据库连接"""
        try:
            with self.engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            logger.info("✅ 数据库连接正常")
            return True
        except Exception as e:
            logger.error(f"❌ 数据库连接失败: {e}")
            return False
    
    def get_database_info(self) -> dict:
        """获取数据库信息"""
        try:
            with self.engine.connect() as conn:
                # 检查数据库版本
                if 'postgresql' in settings.sqlalchemy_database_uri:
                    result = conn.execute(text("SELECT version()"))
                    version = result.fetchone()[0]
                elif 'mysql' in settings.sqlalchemy_database_uri:
                    result = conn.execute(text("SELECT VERSION()"))
                    version = result.fetchone()[0]
                elif 'sqlite' in settings.sqlalchemy_database_uri:
                    result = conn.execute(text("SELECT sqlite_version()"))
                    version = result.fetchone()[0]
                else:
                    version = "Unknown"
                
                return {
                    "database_url": settings.sqlalchemy_database_uri.split('@')[1] if '@' in settings.sqlalchemy_database_uri else settings.sqlalchemy_database_uri,
                    "version": version,
                    "pool_size": self.engine.pool.size(),
                    "checked_out": self.engine.pool.checkedout(),
                    "pool_class": str(self.engine.pool.__class__.__name__)
                }
        except Exception as e:
            logger.error(f"获取数据库信息失败: {e}")
            return {"error": str(e)}
    
    def execute_raw_sql(self, sql: str) -> list:
        """执行原始SQL查询"""
        try:
            with self.engine.connect() as conn:
                result = conn.execute(text(sql))
                return result.fetchall()
        except Exception as e:
            logger.error(f"执行SQL失败: {e}")
            raise
    
    def get_table_info(self) -> dict:
        """获取表信息"""
        try:
            from ..models import Base as ModelsBase
            tables = {}
            
            for table_name, table in ModelsBase.metadata.tables.items():
                tables[table_name] = {
                    "columns": len(table.columns),
                    "primary_keys": [col.name for col in table.primary_key],
                    "foreign_keys": [fk.parent.name for fk in table.foreign_keys]
                }
            
            return tables
        except Exception as e:
            logger.error(f"获取表信息失败: {e}")
            return {"error": str(e)}
    
    def backup_database(self, backup_path: str = None):
        """数据库备份（简单实现）"""
        if backup_path is None:
            backup_path = f"backup_{int(time.time())}.sql"
        
        # TODO: 实现具体的备份逻辑
        logger.info(f"数据库备份功能待实现: {backup_path}")
    
    def migrate_database(self):
        """数据库迁移"""
        # TODO: 集成Alembic进行数据库迁移
        logger.info("数据库迁移功能待实现")

# 数据库健康检查
def health_check() -> dict:
    """数据库健康检查"""
    db_manager = DatabaseManager()
    
    start_time = time.time()
    is_healthy = db_manager.check_connection()
    response_time = time.time() - start_time
    
    status = {
        "status": "healthy" if is_healthy else "unhealthy",
        "response_time": round(response_time * 1000, 2),  # 毫秒
        "timestamp": int(time.time())
    }
    
    if is_healthy:
        try:
            db_info = db_manager.get_database_info()
            status.update(db_info)
        except Exception as e:
            status["info_error"] = str(e)
    
    return status

# 数据库初始化函数
def init_database():
    """初始化数据库"""
    logger.info("🔄 开始初始化数据库...")
    
    db_manager = DatabaseManager()
    
    # 检查连接
    if not db_manager.check_connection():
        raise Exception("数据库连接失败")
    
    # 创建表
    db_manager.create_all_tables()
    
    # 打印数据库信息
    db_info = db_manager.get_database_info()
    logger.info(f"📊 数据库信息: {db_info}")
    
    logger.info("✅ 数据库初始化完成")

# 数据库清理函数
def cleanup_database():
    """清理数据库连接"""
    try:
        engine.dispose()
        logger.info("✅ 数据库连接池已关闭")
    except Exception as e:
        logger.error(f"❌ 数据库连接池关闭失败: {e}")

# 创建全局数据库管理器实例
db_manager = DatabaseManager()

# 导出主要对象
__all__ = [
    "engine",
    "SessionLocal", 
    "Base",
    "get_db",
    "get_db_context",
    "DatabaseManager",
    "db_manager",
    "health_check",
    "init_database",
    "cleanup_database"
] 