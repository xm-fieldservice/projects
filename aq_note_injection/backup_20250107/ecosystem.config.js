module.exports = {
  apps: [{
    name: 'authblock-server',
    script: 'app.js',
    instances: 1,
    exec_mode: 'fork',
    
    // 环境变量
    env: {
      NODE_ENV: 'development',
      PORT: 3000,
      LOG_LEVEL: 'debug'
    },
    
    // 生产环境
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
      LOG_LEVEL: 'info'
    },
    
    // 测试环境
    env_test: {
      NODE_ENV: 'test',
      PORT: 3001,
      LOG_LEVEL: 'warn'
    },
    
    // 性能配置
    max_memory_restart: '500M',
    node_args: '--max-old-space-size=512',
    
    // 日志配置
    log_file: './logs/pm2-combined.log',
    out_file: './logs/pm2-out.log',
    error_file: './logs/pm2-error.log',
    log_type: 'json',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    
    // 进程管理
    autorestart: true,
    watch: false,
    max_restarts: 10,
    min_uptime: '10s',
    
    // 集群模式配置（可选）
    // instances: 'max',
    // exec_mode: 'cluster',
    
    // 监控配置
    pmx: true,
    
    // 源码映射
    source_map_support: false,
    
    // 关闭daemon模式的stdin
    disable_logs: false,
    
    // 合并日志
    merge_logs: true,
    
    // 自动重启条件
    ignore_watch: [
      'node_modules',
      'logs',
      'data',
      'backups',
      '*.log'
    ],
    
    // 启动延迟
    restart_delay: 4000,
    
    // 优雅关闭
    kill_timeout: 5000,
    listen_timeout: 3000,
    
    // 健康检查
    health_check_grace_period: 10000
  }],
  
  // 部署配置
  deploy: {
    production: {
      user: 'authblock',
      host: 'your-server.com',
      ref: 'origin/main',
      repo: 'git@github.com:your-repo/authblock-server.git',
      path: '/opt/authblock-server',
      'pre-deploy-local': '',
      'post-deploy': 'npm install --production && pm2 reload ecosystem.config.js --env production',
      'pre-setup': 'apt-get install git -y'
    },
    
    staging: {
      user: 'authblock',
      host: 'staging-server.com',
      ref: 'origin/develop',
      repo: 'git@github.com:your-repo/authblock-server.git',
      path: '/opt/authblock-server-staging',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env staging'
    }
  }
}; 