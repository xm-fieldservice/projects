-- 数据库初始化脚本
-- 智能问答系统 v3.0 - PostgreSQL

-- ======================================
-- 数据库和用户创建
-- ======================================

-- 创建应用数据库（如果不存在）
CREATE DATABASE qa_system_v3
    WITH ENCODING 'UTF8'
    LC_COLLATE = 'C'
    LC_CTYPE = 'C'
    TEMPLATE = template0;

-- 创建应用用户（如果不存在）
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'qa_app_user') THEN
        CREATE ROLE qa_app_user LOGIN PASSWORD 'your-app-user-password';
    END IF;
END
$$;

-- 连接到应用数据库
\c qa_system_v3;

-- ======================================
-- 扩展插件
-- ======================================

-- 启用UUID生成扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 启用全文搜索扩展
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 启用密码加密扩展
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ======================================
-- 权限设置
-- ======================================

-- 授予应用用户数据库权限
GRANT CONNECT ON DATABASE qa_system_v3 TO qa_app_user;
GRANT USAGE ON SCHEMA public TO qa_app_user;
GRANT CREATE ON SCHEMA public TO qa_app_user;

-- 设置默认权限
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO qa_app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO qa_app_user;

-- ======================================
-- 性能优化配置
-- ======================================

-- 设置搜索路径
ALTER DATABASE qa_system_v3 SET search_path TO public;

-- 设置时区
ALTER DATABASE qa_system_v3 SET timezone TO 'Asia/Shanghai';

-- 设置字符集
ALTER DATABASE qa_system_v3 SET client_encoding TO 'UTF8';

-- ======================================
-- 索引优化函数
-- ======================================

-- 创建更新时间自动更新函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 创建全文搜索配置
CREATE TEXT SEARCH CONFIGURATION chinese (COPY = simple);

-- ======================================
-- 数据库级别配置
-- ======================================

-- 优化连接数和性能参数
-- 这些设置在 postgresql.conf 中配置

-- ======================================
-- 监控和统计
-- ======================================

-- 启用查询统计
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- ======================================
-- 备份和恢复相关
-- ======================================

-- 创建备份用户（只读权限）
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'qa_backup_user') THEN
        CREATE ROLE qa_backup_user LOGIN PASSWORD 'your-backup-user-password';
    END IF;
END
$$;

-- 授予备份用户只读权限
GRANT CONNECT ON DATABASE qa_system_v3 TO qa_backup_user;
GRANT USAGE ON SCHEMA public TO qa_backup_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO qa_backup_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO qa_backup_user;

-- ======================================
-- 审计日志表（可选）
-- ======================================

-- 创建审计日志表
CREATE TABLE IF NOT EXISTS audit_log (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(100) NOT NULL,
    operation VARCHAR(10) NOT NULL,
    row_id INTEGER,
    old_data JSONB,
    new_data JSONB,
    user_id INTEGER,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建审计日志索引
CREATE INDEX IF NOT EXISTS idx_audit_log_table_operation ON audit_log(table_name, operation);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);

-- 授予应用用户审计表权限
GRANT SELECT, INSERT ON audit_log TO qa_app_user;
GRANT USAGE, SELECT ON SEQUENCE audit_log_id_seq TO qa_app_user;

-- ======================================
-- 会话管理表（Redis备份）
-- ======================================

-- 创建会话备份表（用于Redis故障时的会话恢复）
CREATE TABLE IF NOT EXISTS session_backup (
    session_id VARCHAR(255) PRIMARY KEY,
    user_id INTEGER,
    data JSONB,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建会话表索引
CREATE INDEX IF NOT EXISTS idx_session_backup_user_id ON session_backup(user_id);
CREATE INDEX IF NOT EXISTS idx_session_backup_expires_at ON session_backup(expires_at);

-- 创建自动更新时间触发器
CREATE TRIGGER update_session_backup_updated_at
    BEFORE UPDATE ON session_backup
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 授予应用用户会话表权限
GRANT SELECT, INSERT, UPDATE, DELETE ON session_backup TO qa_app_user;

-- ======================================
-- 系统配置表
-- ======================================

-- 创建系统配置表
CREATE TABLE IF NOT EXISTS system_config (
    id SERIAL PRIMARY KEY,
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value TEXT,
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 插入默认配置
INSERT INTO system_config (config_key, config_value, description, is_public) VALUES
('system_name', '智能问答系统 v3.0', '系统名称', TRUE),
('system_version', '3.0.0', '系统版本', TRUE),
('maintenance_mode', 'false', '维护模式开关', FALSE),
('registration_enabled', 'true', '是否允许注册', FALSE),
('max_upload_size', '52428800', '最大上传文件大小（字节）', FALSE),
('session_timeout', '86400', '会话超时时间（秒）', FALSE),
('rate_limit_requests', '100', '速率限制请求数', FALSE),
('rate_limit_window', '60', '速率限制时间窗口（秒）', FALSE)
ON CONFLICT (config_key) DO NOTHING;

-- 创建系统配置表索引
CREATE INDEX IF NOT EXISTS idx_system_config_key ON system_config(config_key);

-- 创建自动更新时间触发器
CREATE TRIGGER update_system_config_updated_at
    BEFORE UPDATE ON system_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 授予应用用户系统配置表权限
GRANT SELECT, INSERT, UPDATE ON system_config TO qa_app_user;
GRANT USAGE, SELECT ON SEQUENCE system_config_id_seq TO qa_app_user;

-- ======================================
-- 性能统计视图
-- ======================================

-- 创建表大小统计视图
CREATE OR REPLACE VIEW table_size_stats AS
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as index_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- 授予查看权限
GRANT SELECT ON table_size_stats TO qa_app_user, qa_backup_user;

-- ======================================
-- 数据清理函数
-- ======================================

-- 创建清理过期会话的函数
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM session_backup WHERE expires_at < CURRENT_TIMESTAMP;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 创建清理旧审计日志的函数
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs(days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM audit_log WHERE created_at < CURRENT_TIMESTAMP - (days_to_keep || ' days')::INTERVAL;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ======================================
-- 完成信息
-- ======================================

-- 显示初始化完成信息
DO $$
BEGIN
    RAISE NOTICE '===========================================';
    RAISE NOTICE '数据库初始化完成！';
    RAISE NOTICE '数据库名称: qa_system_v3';
    RAISE NOTICE '应用用户: qa_app_user';
    RAISE NOTICE '备份用户: qa_backup_user';
    RAISE NOTICE '时区设置: Asia/Shanghai';
    RAISE NOTICE '字符编码: UTF8';
    RAISE NOTICE '===========================================';
END
$$; 