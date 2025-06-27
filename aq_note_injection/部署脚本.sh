#!/bin/bash

# 智能问答系统 v3.0 - 自动化部署脚本
# 适用于 Ubuntu 20.04+ / Debian 11+ / CentOS 8+

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置变量
PROJECT_DIR="/var/www/qa-system"
DOMAIN_NAME="yourdomain.com"
DB_PASSWORD="your_secure_password_here"
DB_NAME="qa_system_db"
DB_USER="qa_user"

# 打印彩色信息
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查是否为root用户
check_root() {
    if [[ $EUID -ne 0 ]]; then
        print_error "此脚本需要以root权限运行"
        echo "请使用: sudo $0"
        exit 1
    fi
}

# 检测操作系统
detect_os() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$NAME
        VER=$VERSION_ID
    else
        print_error "无法检测操作系统"
        exit 1
    fi
    
    print_info "检测到操作系统: $OS $VER"
}

# 更新系统
update_system() {
    print_info "更新系统包..."
    
    if [[ "$OS" == *"Ubuntu"* ]] || [[ "$OS" == *"Debian"* ]]; then
        apt update && apt upgrade -y
        apt install -y curl wget git unzip build-essential software-properties-common
    elif [[ "$OS" == *"CentOS"* ]] || [[ "$OS" == *"Red Hat"* ]]; then
        yum update -y
        yum groupinstall -y "Development Tools"
        yum install -y curl wget git unzip epel-release
    else
        print_error "不支持的操作系统: $OS"
        exit 1
    fi
    
    print_success "系统更新完成"
}

# 安装 Node.js
install_nodejs() {
    print_info "安装 Node.js 18..."
    
    # 安装 Node.js 18
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
    
    # 验证安装
    node_version=$(node --version)
    npm_version=$(npm --version)
    
    print_success "Node.js 安装完成: $node_version"
    print_success "NPM 版本: $npm_version"
}

# 安装 Python
install_python() {
    print_info "安装 Python 3.9+..."
    
    if [[ "$OS" == *"Ubuntu"* ]] || [[ "$OS" == *"Debian"* ]]; then
        apt install -y python3 python3-pip python3-venv python3-dev
    elif [[ "$OS" == *"CentOS"* ]]; then
        yum install -y python3 python3-pip python3-devel
    fi
    
    # 安装 virtualenv
    pip3 install virtualenv
    
    python_version=$(python3 --version)
    print_success "Python 安装完成: $python_version"
}

# 安装 MySQL
install_mysql() {
    print_info "安装 MySQL 8.0..."
    
    if [[ "$OS" == *"Ubuntu"* ]] || [[ "$OS" == *"Debian"* ]]; then
        apt install -y mysql-server mysql-client
    elif [[ "$OS" == *"CentOS"* ]]; then
        yum install -y mysql-server mysql
    fi
    
    # 启动 MySQL
    systemctl start mysql
    systemctl enable mysql
    
    print_success "MySQL 安装完成"
    print_warning "请稍后手动运行 mysql_secure_installation 进行安全配置"
}

# 安装 Nginx
install_nginx() {
    print_info "安装 Nginx..."
    
    if [[ "$OS" == *"Ubuntu"* ]] || [[ "$OS" == *"Debian"* ]]; then
        apt install -y nginx
    elif [[ "$OS" == *"CentOS"* ]]; then
        yum install -y nginx
    fi
    
    systemctl enable nginx
    systemctl start nginx
    
    print_success "Nginx 安装完成"
}

# 安装 PM2
install_pm2() {
    print_info "安装 PM2..."
    
    npm install -g pm2
    
    print_success "PM2 安装完成"
    print_info "请稍后手动运行: pm2 startup 并执行输出的命令"
}

# 创建项目目录
create_project_dir() {
    print_info "创建项目目录..."
    
    mkdir -p $PROJECT_DIR
    mkdir -p $PROJECT_DIR/logs
    mkdir -p $PROJECT_DIR/backups
    mkdir -p $PROJECT_DIR/ssl
    mkdir -p $PROJECT_DIR/scripts
    
    # 设置权限
    chown -R www-data:www-data $PROJECT_DIR
    chmod -R 755 $PROJECT_DIR
    
    print_success "项目目录创建完成: $PROJECT_DIR"
}

# 配置数据库
setup_database() {
    print_info "配置数据库..."
    
    # 创建数据库和用户的SQL脚本
    mysql -u root -p << EOF
CREATE DATABASE $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';
FLUSH PRIVILEGES;
EXIT;
EOF
    
    print_success "数据库配置完成"
}

# 创建 PM2 生态系统配置
create_pm2_config() {
    print_info "创建 PM2 配置文件..."
    
    cat > $PROJECT_DIR/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'qa-frontend',
      script: 'qa-system-v3/simple-server.js',
      cwd: '/var/www/qa-system',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        HOST: '127.0.0.1'
      },
      error_file: '/var/www/qa-system/logs/frontend-error.log',
      out_file: '/var/www/qa-system/logs/frontend-out.log',
      log_file: '/var/www/qa-system/logs/frontend.log',
      time: true,
      max_memory_restart: '500M'
    },
    {
      name: 'qa-backend',
      script: 'qa-system-v3/backend/venv/bin/python',
      args: '-m uvicorn main:app --host 127.0.0.1 --port 8000',
      cwd: '/var/www/qa-system/qa-system-v3/backend',
      interpreter: 'none',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      env: {
        PYTHONPATH: '/var/www/qa-system/qa-system-v3/backend',
        ENV_FILE: '.env.production'
      },
      error_file: '/var/www/qa-system/logs/backend-error.log',
      out_file: '/var/www/qa-system/logs/backend-out.log',
      log_file: '/var/www/qa-system/logs/backend.log',
      time: true,
      max_memory_restart: '1G'
    }
  ]
};
EOF
    
    print_success "PM2 配置文件创建完成"
}

# 创建 Nginx 配置
create_nginx_config() {
    print_info "创建 Nginx 配置..."
    
    cat > /etc/nginx/sites-available/qa-system << EOF
server {
    listen 80;
    server_name $DOMAIN_NAME www.$DOMAIN_NAME;
    
    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
    }
    
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
    }
    
    location /health {
        proxy_pass http://127.0.0.1:3001/health;
        access_log off;
    }
}
EOF
    
    # 启用站点
    ln -sf /etc/nginx/sites-available/qa-system /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    
    # 测试配置
    nginx -t
    systemctl reload nginx
    
    print_success "Nginx 配置完成"
}

# 创建部署后脚本
create_post_deploy_script() {
    print_info "创建部署后配置脚本..."
    
    cat > $PROJECT_DIR/scripts/post-deploy.sh << 'EOF'
#!/bin/bash

# 部署后配置脚本
PROJECT_DIR="/var/www/qa-system"

echo "开始部署后配置..."

# 1. 安装前端依赖
cd $PROJECT_DIR/qa-system-v3
npm install --production

# 2. 创建 Python 虚拟环境
cd $PROJECT_DIR/qa-system-v3/backend
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# 3. 创建后端环境配置
cat > .env.production << 'ENVEOF'
DATABASE_URL=mysql+pymysql://qa_user:your_secure_password_here@localhost:3306/qa_system_db
SECRET_KEY=your_super_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
LOG_LEVEL=INFO
LOG_FILE=/var/www/qa-system/logs/backend.log
API_HOST=127.0.0.1
API_PORT=8000
CORS_ORIGINS=["http://yourdomain.com", "https://yourdomain.com"]
ENVEOF

# 4. 设置权限
chown -R www-data:www-data $PROJECT_DIR
chmod -R 755 $PROJECT_DIR

# 5. 启动服务
cd $PROJECT_DIR
pm2 start ecosystem.config.js
pm2 save

echo "部署后配置完成！"
echo "请访问: http://yourdomain.com"
EOF
    
    chmod +x $PROJECT_DIR/scripts/post-deploy.sh
    
    print_success "部署后脚本创建完成"
}

# 创建管理脚本
create_management_scripts() {
    print_info "创建管理脚本..."
    
    # 服务状态检查脚本
    cat > $PROJECT_DIR/scripts/status.sh << 'EOF'
#!/bin/bash

echo "=== 智能问答系统服务状态 ==="
echo

echo "1. PM2 应用状态:"
pm2 status

echo
echo "2. Nginx 状态:"
systemctl status nginx --no-pager -l

echo
echo "3. MySQL 状态:"
systemctl status mysql --no-pager -l

echo
echo "4. 端口占用情况:"
netstat -tlnp | grep -E ':80|:443|:3001|:8000|:3306'

echo
echo "5. 系统资源使用:"
free -h
df -h /
EOF

    # 服务重启脚本
    cat > $PROJECT_DIR/scripts/restart.sh << 'EOF'
#!/bin/bash

echo "重启智能问答系统服务..."

echo "1. 重启 PM2 应用..."
pm2 restart all

echo "2. 重新加载 Nginx..."
systemctl reload nginx

echo "3. 检查服务状态..."
pm2 status
systemctl status nginx --no-pager -l

echo "服务重启完成！"
EOF

    # 日志查看脚本
    cat > $PROJECT_DIR/scripts/logs.sh << 'EOF'
#!/bin/bash

case $1 in
    "frontend"|"前端")
        pm2 logs qa-frontend --lines 50
        ;;
    "backend"|"后端")
        pm2 logs qa-backend --lines 50
        ;;
    "nginx")
        tail -f /var/log/nginx/access.log
        ;;
    "error"|"错误")
        tail -f /var/log/nginx/error.log
        ;;
    *)
        echo "用法: $0 [frontend|backend|nginx|error]"
        echo "查看对应服务的日志"
        ;;
esac
EOF

    # 设置执行权限
    chmod +x $PROJECT_DIR/scripts/*.sh
    
    print_success "管理脚本创建完成"
}

# 主安装函数
main() {
    echo "=================================================="
    echo "智能问答系统 v3.0 - 自动化部署脚本"
    echo "=================================================="
    echo
    
    check_root
    detect_os
    
    print_info "开始安装基础环境..."
    update_system
    install_nodejs
    install_python
    install_mysql
    install_nginx
    install_pm2
    
    print_info "配置项目环境..."
    create_project_dir
    create_pm2_config
    create_nginx_config
    create_post_deploy_script
    create_management_scripts
    
    echo
    echo "=================================================="
    print_success "基础环境安装完成！"
    echo "=================================================="
    echo
    print_info "接下来的步骤："
    echo "1. 运行 MySQL 安全配置: mysql_secure_installation"
    echo "2. 配置数据库（修改脚本中的密码后运行）"
    echo "3. 上传项目文件到: $PROJECT_DIR"
    echo "4. 运行部署后脚本: $PROJECT_DIR/scripts/post-deploy.sh"
    echo "5. 配置域名和SSL证书"
    echo
    print_info "管理命令："
    echo "- 查看状态: $PROJECT_DIR/scripts/status.sh"
    echo "- 重启服务: $PROJECT_DIR/scripts/restart.sh"
    echo "- 查看日志: $PROJECT_DIR/scripts/logs.sh [frontend|backend|nginx|error]"
    echo
    print_warning "请记得修改配置文件中的密码和域名！"
}

# 执行主函数
main "$@" 