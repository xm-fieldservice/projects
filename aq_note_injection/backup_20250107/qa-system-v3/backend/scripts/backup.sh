#!/bin/bash

# 数据库备份脚本
# 智能问答系统 v3.0 - PostgreSQL 自动备份

set -e  # 遇到错误立即退出

# ===============================
# 配置变量
# ===============================

# 数据库配置
DB_HOST=${DB_HOST:-"db"}
DB_PORT=${DB_PORT:-"5432"}
DB_NAME=${DB_NAME:-"qa_system_v3"}
DB_USER=${DB_USER:-"postgres"}
DB_PASSWORD=${PGPASSWORD}

# 备份配置
BACKUP_DIR="/backups"
BACKUP_PREFIX="qa_system_v3"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_PREFIX}_${DATE}.sql"
COMPRESSED_BACKUP="${BACKUP_PREFIX}_${DATE}.sql.gz"

# 保留设置
KEEP_DAYS=${BACKUP_RETENTION_DAYS:-30}
KEEP_WEEKLY=4   # 保留4周的周备份
KEEP_MONTHLY=12 # 保留12个月的月备份

# 日志配置
LOG_FILE="${BACKUP_DIR}/backup.log"
ERROR_LOG="${BACKUP_DIR}/backup_error.log"

# 通知配置
ENABLE_EMAIL_NOTIFICATIONS=${BACKUP_EMAIL_ENABLED:-false}
EMAIL_TO=${BACKUP_EMAIL_TO:-"admin@example.com"}
EMAIL_FROM=${BACKUP_EMAIL_FROM:-"backup@qa-system.com"}

# ===============================
# 函数定义
# ===============================

# 日志函数
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# 错误日志函数
error_log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1" | tee -a "$ERROR_LOG"
}

# 发送通知邮件
send_notification() {
    local subject="$1"
    local body="$2"
    
    if [ "$ENABLE_EMAIL_NOTIFICATIONS" = "true" ]; then
        echo "$body" | mail -s "$subject" "$EMAIL_TO"
        log "通知邮件已发送: $subject"
    fi
}

# 检查依赖
check_dependencies() {
    log "检查备份依赖..."
    
    # 检查 pg_dump
    if ! command -v pg_dump &> /dev/null; then
        error_log "pg_dump 未找到，请安装 PostgreSQL 客户端"
        return 1
    fi
    
    # 检查 gzip
    if ! command -v gzip &> /dev/null; then
        error_log "gzip 未找到，请安装 gzip"
        return 1
    fi
    
    # 检查备份目录
    if [ ! -d "$BACKUP_DIR" ]; then
        log "创建备份目录: $BACKUP_DIR"
        mkdir -p "$BACKUP_DIR"
    fi
    
    log "依赖检查完成"
}

# 检查数据库连接
check_database_connection() {
    log "检查数据库连接..."
    
    if ! pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" &> /dev/null; then
        error_log "无法连接到数据库 $DB_HOST:$DB_PORT/$DB_NAME"
        return 1
    fi
    
    log "数据库连接正常"
}

# 执行数据库备份
perform_backup() {
    log "开始备份数据库..."
    
    local backup_path="${BACKUP_DIR}/${BACKUP_FILE}"
    local compressed_path="${BACKUP_DIR}/${COMPRESSED_BACKUP}"
    
    # 执行备份
    if pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        --no-password --verbose --clean --if-exists --create \
        --format=plain --encoding=UTF8 > "$backup_path" 2>> "$ERROR_LOG"; then
        
        log "数据库备份完成: $backup_path"
        
        # 压缩备份文件
        if gzip "$backup_path"; then
            log "备份文件压缩完成: $compressed_path"
            
            # 获取文件大小
            local file_size=$(du -h "$compressed_path" | cut -f1)
            log "压缩备份文件大小: $file_size"
            
            # 验证备份文件
            if verify_backup "$compressed_path"; then
                log "备份验证成功"
                return 0
            else
                error_log "备份验证失败"
                return 1
            fi
        else
            error_log "备份文件压缩失败"
            return 1
        fi
    else
        error_log "数据库备份失败"
        return 1
    fi
}

# 验证备份文件
verify_backup() {
    local backup_file="$1"
    
    log "验证备份文件: $backup_file"
    
    # 检查文件是否存在且大小大于0
    if [ ! -f "$backup_file" ] || [ ! -s "$backup_file" ]; then
        error_log "备份文件不存在或为空"
        return 1
    fi
    
    # 检查gzip文件完整性
    if ! gzip -t "$backup_file" &> /dev/null; then
        error_log "备份文件损坏（gzip验证失败）"
        return 1
    fi
    
    # 检查SQL内容（解压并检查前几行）
    if ! zcat "$backup_file" | head -10 | grep -q "PostgreSQL database dump" &> /dev/null; then
        error_log "备份文件内容验证失败"
        return 1
    fi
    
    return 0
}

# 清理旧备份
cleanup_old_backups() {
    log "开始清理旧备份..."
    
    # 删除超过指定天数的日常备份
    find "$BACKUP_DIR" -name "${BACKUP_PREFIX}_*.sql.gz" -mtime +$KEEP_DAYS -type f -delete 2>/dev/null || true
    local daily_deleted=$(find "$BACKUP_DIR" -name "${BACKUP_PREFIX}_*.sql.gz" -mtime +$KEEP_DAYS -type f 2>/dev/null | wc -l)
    
    # 保留周备份（每周日的备份）
    find "$BACKUP_DIR" -name "${BACKUP_PREFIX}_*0_*.sql.gz" -mtime +$((KEEP_WEEKLY * 7)) -type f -delete 2>/dev/null || true
    
    # 保留月备份（每月1号的备份）
    find "$BACKUP_DIR" -name "${BACKUP_PREFIX}_*01_*.sql.gz" -mtime +$((KEEP_MONTHLY * 30)) -type f -delete 2>/dev/null || true
    
    log "清理完成，删除了 $daily_deleted 个旧的日常备份"
}

# 生成备份统计
generate_backup_stats() {
    log "生成备份统计..."
    
    local total_backups=$(find "$BACKUP_DIR" -name "${BACKUP_PREFIX}_*.sql.gz" -type f | wc -l)
    local total_size=$(du -sh "$BACKUP_DIR" | cut -f1)
    local latest_backup=$(find "$BACKUP_DIR" -name "${BACKUP_PREFIX}_*.sql.gz" -type f -printf '%T@ %p\n' | sort -n | tail -1 | cut -d' ' -f2-)
    
    log "备份统计信息:"
    log "  总备份数量: $total_backups"
    log "  备份目录大小: $total_size"
    log "  最新备份: $(basename "$latest_backup")"
}

# 数据库表统计
database_stats() {
    log "获取数据库统计信息..."
    
    # 连接数据库并获取表统计
    local stats=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "
        SELECT 
            COUNT(*) as table_count,
            pg_size_pretty(pg_database_size('$DB_NAME')) as db_size
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
    " 2>/dev/null || echo "无法获取统计信息")
    
    log "数据库统计: $stats"
}

# 主执行函数
main() {
    local start_time=$(date +%s)
    
    log "========================================"
    log "开始数据库备份任务"
    log "备份目标: $DB_HOST:$DB_PORT/$DB_NAME"
    log "备份时间: $(date)"
    log "========================================"
    
    # 检查依赖和连接
    if ! check_dependencies; then
        error_log "依赖检查失败"
        send_notification "备份失败 - 依赖检查" "数据库备份依赖检查失败，请检查系统配置。"
        exit 1
    fi
    
    if ! check_database_connection; then
        error_log "数据库连接失败"
        send_notification "备份失败 - 数据库连接" "无法连接到数据库 $DB_HOST:$DB_PORT/$DB_NAME"
        exit 1
    fi
    
    # 获取数据库统计
    database_stats
    
    # 执行备份
    if perform_backup; then
        log "备份成功完成"
        
        # 清理旧备份
        cleanup_old_backups
        
        # 生成统计信息
        generate_backup_stats
        
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        
        log "备份任务完成，耗时: ${duration}秒"
        
        # 发送成功通知
        send_notification "备份成功" "数据库备份成功完成。\n备份文件: ${COMPRESSED_BACKUP}\n耗时: ${duration}秒"
        
    else
        error_log "备份失败"
        
        # 发送失败通知
        send_notification "备份失败" "数据库备份失败，请检查错误日志。\n错误时间: $(date)\n请立即处理此问题。"
        
        exit 1
    fi
    
    log "========================================"
}

# ===============================
# 脚本入口
# ===============================

# 检查是否提供了必要的环境变量
if [ -z "$DB_PASSWORD" ]; then
    error_log "数据库密码未设置，请设置 PGPASSWORD 环境变量"
    exit 1
fi

# 执行主函数
main "$@"

# 脚本结束 