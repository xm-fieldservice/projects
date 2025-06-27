#!/bin/bash

echo "=========================================="
echo "关系知识管理系统 - 快速启动脚本"
echo "=========================================="

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ Docker未安装，请先安装Docker"
    exit 1
fi

# 检查Docker Compose是否安装
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose未安装，请先安装Docker Compose"
    exit 1
fi

echo "✅ Docker环境检查通过"

# 创建必要的目录
echo "📁 创建必要的目录..."
mkdir -p templates static logs

# 启动服务
echo "🚀 启动服务..."
docker-compose up -d

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 10

# 检查服务状态
echo "🔍 检查服务状态..."
docker-compose ps

# 检查Neo4j是否可访问
echo "📊 检查Neo4j连接..."
max_attempts=30
attempt=1

while [ $attempt -le $max_attempts ]; do
    if docker-compose exec -T neo4j cypher-shell -u neo4j -p password "RETURN 1;" &> /dev/null; then
        echo "✅ Neo4j连接成功！"
        break
    else
        echo "⏳ 等待Neo4j启动... (尝试 $attempt/$max_attempts)"
        sleep 2
        ((attempt++))
    fi
done

if [ $attempt -gt $max_attempts ]; then
    echo "❌ Neo4j启动超时，请检查日志："
    docker-compose logs neo4j
    exit 1
fi

# 初始化数据库
echo "🛠️ 初始化数据库..."
if docker-compose exec -T app python init_db.py; then
    echo "✅ 数据库初始化成功！"
else
    echo "❌ 数据库初始化失败，请检查日志："
    docker-compose logs app
    exit 1
fi

echo ""
echo "=========================================="
echo "🎉 系统启动成功！"
echo "=========================================="
echo ""
echo "📱 访问地址："
echo "   主应用: http://localhost:5000"
echo "   Neo4j Browser: http://localhost:7474"
echo "     用户名: neo4j"
echo "     密码: password"
echo ""
echo "🛠️ 管理命令："
echo "   查看日志: docker-compose logs -f"
echo "   停止服务: docker-compose down"
echo "   重启服务: docker-compose restart"
echo ""
echo "📖 更多信息请查看 README.md"
echo "==========================================" 