#!/bin/bash
# ============================================================
# install-linux.sh
# Run this on a machine WITH internet access (Linux or Mac).
# Builds the app and optionally bundles Node.js for the server.
# ============================================================

set -e

cd "$(dirname "$0")/.."

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo ""
echo "════════════════════════════════════════════════════"
echo " WritingCoach — Build Script (Internet Machine)"
echo "════════════════════════════════════════════════════"
echo ""

# ── Check Node.js ─────────────────────────────────────────────────────────────
if ! command -v node &>/dev/null; then
    echo -e "${RED}[ERROR] Node.js not found.${NC}"
    echo "Install Node.js 20 LTS first: https://nodejs.org"
    echo "Or via nvm: curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash"
    exit 1
fi
echo "Node.js: $(node --version)"
echo ""

# ── Install server dependencies ───────────────────────────────────────────────
echo "[1/4] Installing server dependencies..."
npm install
echo -e "${GREEN}Done.${NC}"
echo ""

# ── Install client dependencies ───────────────────────────────────────────────
echo "[2/4] Installing client dependencies..."
cd client && npm install && cd ..
echo -e "${GREEN}Done.${NC}"
echo ""

# ── Build React frontend ──────────────────────────────────────────────────────
echo "[3/4] Building React frontend..."
cd client && npm run build && cd ..
echo -e "${GREEN}Done.${NC}"
echo ""

# ── Compile TypeScript server ─────────────────────────────────────────────────
echo "[4/4] Compiling TypeScript server..."
npx tsc
echo -e "${GREEN}Done.${NC}"
echo ""

# ── Optional: bundle Node.js for the server ───────────────────────────────────
echo -e "${YELLOW}Would you like to download the Node.js 20 LTS Linux binary to bundle on the USB?${NC}"
echo "(Useful if the server does not have Node.js installed yet)"
echo ""
read -r -p "  Type y and press Enter, or just press Enter to skip: " GET_NODE

if [[ "$GET_NODE" =~ ^[Yy]$ ]]; then
    NODE_VERSION="v20.19.1"
    NODE_FILE="node-${NODE_VERSION}-linux-x64.tar.gz"
    NODE_URL="https://nodejs.org/dist/${NODE_VERSION}/${NODE_FILE}"

    if [ -f "$NODE_FILE" ]; then
        echo "  $NODE_FILE already exists — skipping download."
    else
        echo "  Downloading Node.js ${NODE_VERSION}..."
        if command -v curl &>/dev/null; then
            curl -L --progress-bar -o "$NODE_FILE" "$NODE_URL"
        else
            wget -q --show-progress -O "$NODE_FILE" "$NODE_URL"
        fi
        echo -e "  ${GREEN}Downloaded: $NODE_FILE${NC}"
    fi
fi

echo ""
echo "════════════════════════════════════════════════════"
echo -e "${GREEN} Build complete!${NC}"
echo "════════════════════════════════════════════════════"
echo ""
echo "Copy the entire writingcoach folder to your USB drive."
echo ""
echo "On the Linux server:"
echo "  1. Copy the folder to /opt/writingcoach"
echo "  2. Copy .env.example to .env and fill in your AI details"
echo "  3. Run: bash start.sh"
echo "  (or run scripts/setup-service-linux.sh to install as a system service)"
echo ""
