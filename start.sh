#!/bin/bash
# ============================================================
# start.sh — Start WritingCoach on Linux
# Run from the writingcoach folder: bash start.sh
# ============================================================

set -e
cd "$(dirname "$0")"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo ""
echo " ============================================"
echo "  WritingCoach - Administrative Writing Coach"
echo " ============================================"
echo ""

# ── Check Node.js ─────────────────────────────────────────────────────────────
if ! command -v node &>/dev/null; then
    echo -e "${RED}[ERROR] Node.js was not found.${NC}"
    echo ""
    echo "If a node-*.tar.gz file is in this folder, install it:"
    echo "  sudo tar -xzf node-v20*-linux-x64.tar.gz -C /usr/local --strip-components=1"
    echo ""
    echo "Then run this script again."
    exit 1
fi
echo -e "  Node.js: $(node --version)"

# ── Check app is built ────────────────────────────────────────────────────────
if [ ! -f "dist/server/index.js" ]; then
    echo ""
    echo -e "${RED}[ERROR] The app has not been built (dist/ folder is missing).${NC}"
    echo ""
    echo "The build step was not run before copying files to this server."
    echo "Please contact your system administrator."
    exit 1
fi

# ── Check .env exists ─────────────────────────────────────────────────────────
if [ ! -f ".env" ]; then
    echo ""
    echo -e "${YELLOW}[SETUP REQUIRED] No .env file found.${NC}"
    echo ""
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "  A template .env file has been created from .env.example."
    else
        touch .env
        echo "  A blank .env file has been created."
    fi
    echo ""
    echo "  ────────────────────────────────────────────────────────────────"
    echo "   ACTION NEEDED: Edit .env before starting the server."
    echo ""
    echo "   Run:  nano .env"
    echo "   Fill in your internal AI server details:"
    echo "     LLM_PROVIDER=openai"
    echo "     OPENAI_BASE_URL=http://YOUR-AI-SERVER-IP:PORT/v1"
    echo "     OPENAI_API_KEY=your-token"
    echo "     OPENAI_MODEL=your-model-name"
    echo "  ────────────────────────────────────────────────────────────────"
    echo ""
    echo "  After editing .env, run this script again."
    exit 0
fi

# ── Load .env ─────────────────────────────────────────────────────────────────
set -a
# shellcheck disable=SC1091
source .env
set +a

# ── Start server ──────────────────────────────────────────────────────────────
PORT="${PORT:-3000}"
export NODE_ENV=production

echo ""
echo -e "${GREEN}  Starting server...${NC}"
echo "  URL: http://$(hostname -I | awk '{print $1}'):${PORT}"
echo "  (also available at http://localhost:${PORT})"
echo ""
echo "  Press Ctrl+C to stop."
echo "  ────────────────────────────────────────────────────────────────────"
echo ""

node dist/server/index.js
