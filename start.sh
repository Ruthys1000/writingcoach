#!/bin/bash
# ============================================================
# start.sh — Start WritingCoach (airgap-friendly)
# Run from the app folder: bash start.sh
#
# Prefers a bundled Node.js under ./runtime/bin/node so the
# receiving server needs no system-wide Node install / sudo.
# Falls back to node on PATH if runtime/ is absent.
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

# ── Resolve Node.js (bundled runtime first) ───────────────────────────────────
NODE_BIN=""
if [ -x "runtime/bin/node" ]; then
  NODE_BIN="$(pwd)/runtime/bin/node"
elif command -v node >/dev/null 2>&1; then
  NODE_BIN="$(command -v node)"
fi

if [ -z "$NODE_BIN" ]; then
  echo -e "${RED}[ERROR] Node.js was not found.${NC}"
  echo ""
  echo "This package should include runtime/bin/node."
  echo "If it is missing, re-copy the full transfer folder,"
  echo "or install Node.js 20+ on this server."
  exit 1
fi

NODE_VER="$("$NODE_BIN" --version 2>/dev/null || echo unknown)"
echo -e "  Node.js: ${NODE_VER}  (${NODE_BIN})"

# ── Check app is built ────────────────────────────────────────────────────────
if [ ! -f "dist/server/index.js" ]; then
  echo ""
  echo -e "${RED}[ERROR] The app has not been built (dist/ folder is missing).${NC}"
  echo ""
  echo "This transfer package should already include dist/."
  echo "Please contact the person who prepared the package."
  exit 1
fi

if [ ! -f "client/dist/index.html" ]; then
  echo ""
  echo -e "${RED}[ERROR] client/dist/ is missing — UI will not load.${NC}"
  echo "Please re-copy the full transfer package."
  exit 1
fi

# ── Check .env exists ─────────────────────────────────────────────────────────
if [ ! -f ".env" ]; then
  echo ""
  echo -e "${YELLOW}[SETUP REQUIRED] No .env file found.${NC}"
  echo ""
  if [ -f ".env.example" ]; then
    cp .env.example .env
    echo "  Created .env from .env.example."
  else
    touch .env
    echo "  Created a blank .env file."
  fi
  echo ""
  echo "  ────────────────────────────────────────────────────────────────"
  echo "   Edit .env, then run this script again:"
  echo ""
  echo "     nano .env"
  echo ""
  echo "   Typical internal AI settings:"
  echo "     LLM_PROVIDER=openai"
  echo "     OPENAI_BASE_URL=http://YOUR-AI-SERVER-IP:PORT/v1"
  echo "     OPENAI_API_KEY=your-token"
  echo "     OPENAI_MODEL=your-model-name"
  echo "  ────────────────────────────────────────────────────────────────"
  echo ""
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

HOST_IP="$(hostname -I 2>/dev/null | awk '{print $1}')"
echo ""
echo -e "${GREEN}  Starting server...${NC}"
echo "  URL: http://localhost:${PORT}"
if [ -n "$HOST_IP" ]; then
  echo "       http://${HOST_IP}:${PORT}"
fi
echo ""
echo "  Press Ctrl+C to stop."
echo "  ────────────────────────────────────────────────────────────────────"
echo ""

exec "$NODE_BIN" dist/server/index.js
