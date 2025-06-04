-- 个人智能问答系统 v3.0 数据库初始化脚本
-- 创建时间: 2024-12-02

-- 设置字符集
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 创建用户表
CREATE TABLE IF NOT EXISTS `users` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `username` varchar(50) NOT NULL UNIQUE,
    `password_hash` varchar(255) NOT NULL,
    `email` varchar(100) DEFAULT NULL,
    `display_name` varchar(100) DEFAULT NULL,
    `role` enum('admin','user','demo') NOT NULL DEFAULT 'user',
    `is_active` tinyint(1) NOT NULL DEFAULT 1,
    `avatar` varchar(255) DEFAULT NULL,
    `preferences` json DEFAULT NULL,
    `last_login_at` timestamp NULL DEFAULT NULL,
    `login_count` int(11) NOT NULL DEFAULT 0,
    `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_username` (`username`),
    KEY `idx_role` (`role`),
    KEY `idx_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建内容表（统一存储问答和笔记）
CREATE TABLE IF NOT EXISTS `content` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `user_id` int(11) NOT NULL,
    `title` varchar(500) NOT NULL,
    `content` longtext NOT NULL,
    `content_type` enum('qa','note','auto_saved') NOT NULL DEFAULT 'note',
    `agent_id` varchar(50) DEFAULT NULL,
    `tags` json DEFAULT NULL,
    `metadata` json DEFAULT NULL,
    `is_public` tinyint(1) NOT NULL DEFAULT 0,
    `view_count` int(11) NOT NULL DEFAULT 0,
    `like_count` int(11) NOT NULL DEFAULT 0,
    `ai_response` longtext DEFAULT NULL,
    `ai_model` varchar(100) DEFAULT NULL,
    `ai_tokens_used` int(11) DEFAULT NULL,
    `ai_response_time` float DEFAULT NULL,
    `status` enum('draft','published','archived','deleted') NOT NULL DEFAULT 'published',
    `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_content_type` (`content_type`),
    KEY `idx_status` (`status`),
    KEY `idx_created_at` (`created_at`),
    KEY `idx_public` (`is_public`),
    CONSTRAINT `fk_content_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建标签表
CREATE TABLE IF NOT EXISTS `tags` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `name` varchar(50) NOT NULL UNIQUE,
    `color` varchar(7) DEFAULT '#3b82f6',
    `description` varchar(200) DEFAULT NULL,
    `usage_count` int(11) NOT NULL DEFAULT 0,
    `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_name` (`name`),
    KEY `idx_usage_count` (`usage_count`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建内容标签关联表
CREATE TABLE IF NOT EXISTS `content_tags` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `content_id` int(11) NOT NULL,
    `tag_id` int(11) NOT NULL,
    `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_content_tag` (`content_id`, `tag_id`),
    KEY `idx_content_id` (`content_id`),
    KEY `idx_tag_id` (`tag_id`),
    CONSTRAINT `fk_content_tags_content` FOREIGN KEY (`content_id`) REFERENCES `content` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_content_tags_tag` FOREIGN KEY (`tag_id`) REFERENCES `tags` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建AI智能体配置表
CREATE TABLE IF NOT EXISTS `ai_agents` (
    `id` varchar(50) NOT NULL,
    `name` varchar(100) NOT NULL,
    `description` text DEFAULT NULL,
    `prompt_template` text DEFAULT NULL,
    `model` varchar(100) DEFAULT 'gpt-3.5-turbo',
    `max_tokens` int(11) DEFAULT 2000,
    `temperature` float DEFAULT 0.7,
    `is_active` tinyint(1) NOT NULL DEFAULT 1,
    `usage_count` int(11) NOT NULL DEFAULT 0,
    `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_active` (`is_active`),
    KEY `idx_usage_count` (`usage_count`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建系统配置表
CREATE TABLE IF NOT EXISTS `system_config` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `key` varchar(100) NOT NULL UNIQUE,
    `value` text DEFAULT NULL,
    `description` varchar(255) DEFAULT NULL,
    `is_public` tinyint(1) NOT NULL DEFAULT 0,
    `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_key` (`key`),
    KEY `idx_public` (`is_public`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建用户会话表
CREATE TABLE IF NOT EXISTS `user_sessions` (
    `id` varchar(128) NOT NULL,
    `user_id` int(11) NOT NULL,
    `ip_address` varchar(45) DEFAULT NULL,
    `user_agent` varchar(500) DEFAULT NULL,
    `expires_at` timestamp NOT NULL,
    `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_expires_at` (`expires_at`),
    CONSTRAINT `fk_sessions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建操作日志表
CREATE TABLE IF NOT EXISTS `operation_logs` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `user_id` int(11) DEFAULT NULL,
    `action` varchar(100) NOT NULL,
    `resource_type` varchar(50) DEFAULT NULL,
    `resource_id` varchar(100) DEFAULT NULL,
    `details` json DEFAULT NULL,
    `ip_address` varchar(45) DEFAULT NULL,
    `user_agent` varchar(500) DEFAULT NULL,
    `status` enum('success','failed','pending') NOT NULL DEFAULT 'success',
    `error_message` text DEFAULT NULL,
    `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_action` (`action`),
    KEY `idx_resource` (`resource_type`, `resource_id`),
    KEY `idx_created_at` (`created_at`),
    CONSTRAINT `fk_operation_logs_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 插入默认用户数据
INSERT IGNORE INTO `users` (`username`, `password_hash`, `email`, `display_name`, `role`, `is_active`) VALUES
('admin', '$2b$12$LQ3ooLhPyMm5fU8zQKtCOOXtOWKKO9zSO5tGH5UY4p8YCiPVKH9wK', 'admin@example.com', '系统管理员', 'admin', 1),
('user', '$2b$12$LQ3ooLhPyMm5fU8zQKtCOOXtOWKKO9zSO5tGH5UY4p8YCiPVKH9wK', 'user@example.com', '普通用户', 'user', 1),
('demo', '$2b$12$LQ3ooLhPyMm5fU8zQKtCOOXtOWKKO9zSO5tGH5UY4p8YCiPVKH9wK', 'demo@example.com', '演示用户', 'demo', 1);

-- 插入默认AI智能体配置
INSERT IGNORE INTO `ai_agents` (`id`, `name`, `description`, `prompt_template`, `model`, `max_tokens`, `temperature`) VALUES
('general', '通用助手', '适用于各种日常问题的AI助手', '你是一个友善、博学的AI助手。请简洁、准确地回答用户的问题。', 'gpt-3.5-turbo', 2000, 0.7),
('code', '编程助手', '专门帮助解决编程相关问题', '你是一个专业的编程助手。请提供清晰、可执行的代码解决方案，并包含必要的解释。', 'gpt-4', 3000, 0.3),
('writing', '写作助手', '帮助改进文本写作和创作', '你是一个专业的写作助手。请帮助用户改进文本的表达、结构和风格。', 'gpt-3.5-turbo', 2500, 0.8);

-- 插入默认标签
INSERT IGNORE INTO `tags` (`name`, `color`, `description`) VALUES
('AI问答', '#3b82f6', 'AI智能问答相关内容'),
('编程', '#10b981', '编程开发相关内容'),
('学习', '#f59e0b', '学习笔记和知识点'),
('工作', '#ef4444', '工作相关的内容'),
('生活', '#8b5cf6', '日常生活相关内容'),
('auto-saved', '#6b7280', '自动保存的内容');

-- 插入默认系统配置
INSERT IGNORE INTO `system_config` (`key`, `value`, `description`, `is_public`) VALUES
('system_name', '个人智能问答系统', '系统名称', 1),
('system_version', 'v3.0', '系统版本', 1),
('default_agent', 'general', '默认AI智能体', 0),
('max_content_length', '10000', '内容最大长度', 0),
('enable_public_content', 'false', '是否启用公开内容', 0),
('max_daily_questions', '100', '每日最大问答次数', 0),
('auto_save_enabled', 'true', '是否启用自动保存', 1),
('storage_mode', 'hybrid', '存储模式: local/server/hybrid', 1);

-- 插入示例内容
INSERT IGNORE INTO `content` (`user_id`, `title`, `content`, `content_type`, `agent_id`, `tags`, `ai_response`) VALUES
(1, '欢迎使用智能问答系统', '这是一个示例问答，展示系统的基本功能。\n\n系统支持：\n- 智能问答\n- 笔记管理\n- 标签分类\n- 自动保存', 'qa', 'general', '["AI问答", "系统介绍"]', '欢迎使用我们的智能问答系统！这个系统集成了强大的AI问答功能和便捷的笔记管理。您可以：\n\n1. 向AI助手提问各种问题\n2. 自动保存问答记录为笔记\n3. 使用标签进行内容分类\n4. 在不同的AI智能体间切换\n\n希望这个系统能帮助您更好地管理知识和提高工作效率！'),
(2, '如何使用编程助手', '我想了解如何更好地使用系统中的编程助手功能', 'qa', 'code', '["编程", "使用指南"]', '编程助手是专门为开发者设计的AI智能体，它可以：\n\n1. **代码调试**：帮助找出代码中的bug\n2. **算法设计**：提供高效的算法解决方案\n3. **代码优化**：改进代码性能和可读性\n4. **技术选型**：推荐合适的技术栈\n\n使用技巧：\n- 提供具体的代码片段\n- 说明你想要实现的功能\n- 提及使用的编程语言\n- 描述遇到的具体问题\n\n这样编程助手就能给出更准确的帮助！');

-- 更新标签使用次数
UPDATE `tags` SET `usage_count` = (
    SELECT COUNT(*) FROM `content_tags` ct 
    JOIN `content` c ON ct.content_id = c.id 
    WHERE JSON_SEARCH(c.tags, 'one', `tags`.name) IS NOT NULL
);

-- 更新AI智能体使用次数
UPDATE `ai_agents` SET `usage_count` = (
    SELECT COUNT(*) FROM `content` WHERE `agent_id` = `ai_agents`.id
);

-- 创建全文索引（如果支持）
-- ALTER TABLE `content` ADD FULLTEXT(`title`, `content`);

-- 设置外键检查
SET FOREIGN_KEY_CHECKS = 1;

-- 创建视图：用户内容统计
CREATE OR REPLACE VIEW `user_content_stats` AS
SELECT 
    u.id as user_id,
    u.username,
    u.display_name,
    COUNT(c.id) as total_content,
    COUNT(CASE WHEN c.content_type = 'qa' THEN 1 END) as qa_count,
    COUNT(CASE WHEN c.content_type = 'note' THEN 1 END) as note_count,
    COUNT(CASE WHEN c.content_type = 'auto_saved' THEN 1 END) as auto_saved_count,
    MAX(c.created_at) as last_content_at
FROM `users` u
LEFT JOIN `content` c ON u.id = c.user_id AND c.status != 'deleted'
GROUP BY u.id, u.username, u.display_name;

-- 创建视图：热门标签
CREATE OR REPLACE VIEW `popular_tags` AS
SELECT 
    t.id,
    t.name,
    t.color,
    t.description,
    COUNT(ct.content_id) as usage_count,
    COUNT(DISTINCT c.user_id) as user_count
FROM `tags` t
LEFT JOIN `content_tags` ct ON t.id = ct.tag_id
LEFT JOIN `content` c ON ct.content_id = c.id AND c.status = 'published'
GROUP BY t.id, t.name, t.color, t.description
ORDER BY usage_count DESC;

-- 创建存储过程：清理过期会话
DELIMITER //
CREATE PROCEDURE CleanExpiredSessions()
BEGIN
    DELETE FROM `user_sessions` WHERE `expires_at` < NOW();
    SELECT ROW_COUNT() as deleted_sessions;
END //
DELIMITER ;

-- 创建存储过程：用户活跃度统计
DELIMITER //
CREATE PROCEDURE GetUserActivity(IN days INT)
BEGIN
    SELECT 
        DATE(created_at) as date,
        COUNT(DISTINCT user_id) as active_users,
        COUNT(*) as total_content,
        COUNT(CASE WHEN content_type = 'qa' THEN 1 END) as qa_count
    FROM `content` 
    WHERE created_at >= DATE_SUB(NOW(), INTERVAL days DAY)
    GROUP BY DATE(created_at)
    ORDER BY date DESC;
END //
DELIMITER ;

-- 完成初始化
SELECT 'Database initialization completed successfully!' as message; 