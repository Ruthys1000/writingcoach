#!/bin/bash
# ============================================================
# prepare-airgap.sh
# Run this on a machine WITH internet access.
# Creates a bundle folder ready to transfer to the airgap machine.
# ============================================================

set -e

MODEL=${OLLAMA_MODEL:-llama3}
BUNDLE_DIR="./airgap-bundle"

echo "==> Building WritingCoach image..."
docker build -t writingcoach:airgap .

echo "==> Pulling Ollama image..."
docker pull ollama/ollama:latest

echo "==> Downloading model '${MODEL}' into a temporary volume..."
docker volume create writingcoach_ollama_data 2>/dev/null || true
docker run --rm \
  -v writingcoach_ollama_data:/root/.ollama \
  ollama/ollama:latest \
  /bin/sh -c "ollama serve & sleep 3 && ollama pull ${MODEL} && sleep 2"

echo "==> Saving Docker images to tar files..."
mkdir -p "$BUNDLE_DIR"
docker save writingcoach:airgap | gzip > "$BUNDLE_DIR/writingcoach.tar.gz"
docker save ollama/ollama:latest | gzip > "$BUNDLE_DIR/ollama.tar.gz"

echo "==> Exporting Ollama model volume..."
docker run --rm \
  -v writingcoach_ollama_data:/data \
  -v "$(pwd)/$BUNDLE_DIR":/backup \
  alpine tar czf /backup/ollama_data.tar.gz -C /data .

echo "==> Copying deployment files..."
cp docker-compose.airgap.yml "$BUNDLE_DIR/"
cp -r recipes "$BUNDLE_DIR/"
cp scripts/load-airgap.sh "$BUNDLE_DIR/"
chmod +x "$BUNDLE_DIR/load-airgap.sh"

echo ""
echo "Done! Transfer the '$BUNDLE_DIR' folder to the airgap machine."
echo "Then run: ./load-airgap.sh"
