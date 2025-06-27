FROM python:3.10-slim

WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# 复制依赖文件
COPY requirements.txt .

# 安装Python依赖
RUN pip install --no-cache-dir -r requirements.txt

# 下载spaCy中文模型
RUN python -m spacy download zh_core_web_sm

# 复制应用代码
COPY . .

# 创建templates目录
RUN mkdir -p templates

# 暴露端口
EXPOSE 5000

# 启动命令
CMD ["python", "app.py"] 