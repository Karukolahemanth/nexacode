#!/bin/bash
# RunPod GPU Server Setup Script for NexusIDE
set -e

echo "=== NexusIDE RunPod Setup ==="

# Install system dependencies
apt-get update && apt-get install -y docker.io docker-compose nginx git

# Install Python deps
pip install "vllm>=0.8.5"

# Clone project
git clone <YOUR_REPO_URL> /opt/nexus-ide
cd /opt/nexus-ide

# Copy env
cp .env.example .env

# Start infrastructure
docker-compose up -d postgres redis qdrant

# Start vLLM (in background)
echo "Starting vLLM server..."
nohup vllm serve Qwen/Qwen2.5-Coder-32B-Instruct \
  --host 0.0.0.0 --port 8080 \
  --tensor-parallel-size 1 \
  --max-model-len 32768 \
  --gpu-memory-utilization 0.9 \
  > /var/log/vllm.log 2>&1 &

# Start backend
cd backend
pip install -r requirements.txt
nohup uvicorn main:app --host 0.0.0.0 --port 8000 --workers 2 > /var/log/nexus-backend.log 2>&1 &

# Setup nginx
cp /opt/nexus-ide/nginx/nginx.conf /etc/nginx/conf.d/nexuside.conf
nginx -t && systemctl restart nginx

echo "=== NexusIDE is ready ==="
echo "Backend: http://localhost:8000"
echo "vLLM:    http://localhost:8080"
