#!/bin/bash
# ============================================================
# load-airgap.sh
# Run this on the AIRGAP machine after transferring the bundle.
# ============================================================

set -e

echo "==> Loading Docker images..."
docker load < writingcoach.tar.gz
docker load < ollama.tar.gz

echo "==> Restoring Ollama model volume..."
docker volume create writingcoach_ollama_data 2>/dev/null || true
docker run --rm \
  -v writingcoach_ollama_data:/data \
  -v "$(pwd)":/backup \
  alpine tar xzf /backup/ollama_data.tar.gz -C /data

echo "==> Starting WritingCoach..."
docker compose -f docker-compose.airgap.yml up -d

echo ""
echo "Done! Open http://localhost:3000"
