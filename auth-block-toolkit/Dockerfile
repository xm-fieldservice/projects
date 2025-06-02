# AuthBlock 权限系统 Docker镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000

# 复制package文件
COPY package*.json ./

# 安装依赖（仅生产依赖）
RUN npm ci --only=production

# 复制源代码
COPY src/ ./src/
COPY server/ ./server/
COPY config/ ./config/

# 创建非root用户
RUN addgroup -g 1001 -S authblock && \
    adduser -S authblock -u 1001

# 创建数据目录
RUN mkdir -p /app/data && \
    chown -R authblock:authblock /app

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node ./server/health-check.js || exit 1

# 切换到非root用户
USER authblock

# 启动命令
CMD ["node", "server/app.js"] 