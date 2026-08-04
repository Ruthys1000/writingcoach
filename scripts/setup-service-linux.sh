#!/bin/bash
# ============================================================
# setup-service-linux.sh
# Installs WritingCoach as a systemd service so it starts
# automatically on boot. Run with sudo on the Linux server.
# ============================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# ── Must run as root ──────────────────────────────────────────────────────────
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}[ERROR] Please run with sudo:${NC}"
    echo "  sudo bash scripts/setup-service-linux.sh"
    exit 1
fi

INSTALL_DIR="$(cd "$(dirname "$0")/.." && pwd)"

# Prefer bundled runtime (airgap package), then system node
NODE_BIN=""
if [ -x "${INSTALL_DIR}/runtime/bin/node" ]; then
    NODE_BIN="${INSTALL_DIR}/runtime/bin/node"
elif command -v node >/dev/null 2>&1; then
    NODE_BIN="$(command -v node)"
fi

echo ""
echo "════════════════════════════════════════════════════"
echo " WritingCoach — Install as System Service"
echo "════════════════════════════════════════════════════"
echo ""
echo "  App directory : $INSTALL_DIR"
echo "  Node.js       : ${NODE_BIN:-NOT FOUND}"
echo ""

if [ -z "$NODE_BIN" ]; then
    echo -e "${RED}[ERROR] Node.js not found.${NC}"
    echo "  Expected bundled runtime at: ${INSTALL_DIR}/runtime/bin/node"
    echo "  Or install Node.js 20+ system-wide, then re-run."
    exit 1
fi

if [ ! -f "$INSTALL_DIR/dist/server/index.js" ]; then
    echo -e "${RED}[ERROR] dist/server/index.js not found. The app must be built first.${NC}"
    exit 1
fi

if [ ! -f "$INSTALL_DIR/.env" ]; then
    echo -e "${YELLOW}[WARNING] No .env file found. Copy .env.example to .env and fill in AI details before starting.${NC}"
fi

# ── Write systemd unit file ───────────────────────────────────────────────────
SERVICE_FILE="/etc/systemd/system/writingcoach.service"

cat > "$SERVICE_FILE" <<EOF
[Unit]
Description=WritingCoach - Administrative Writing Coach
After=network.target

[Service]
Type=simple
WorkingDirectory=${INSTALL_DIR}
EnvironmentFile=${INSTALL_DIR}/.env
ExecStart=${NODE_BIN} dist/server/index.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=writingcoach
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

echo "  Service file written to: $SERVICE_FILE"

# ── Enable and start ──────────────────────────────────────────────────────────
systemctl daemon-reload
systemctl enable writingcoach
systemctl start writingcoach

echo ""
sleep 2

if systemctl is-active --quiet writingcoach; then
    echo -e "${GREEN}════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN} Service installed and running!${NC}"
    echo -e "${GREEN}════════════════════════════════════════════════════${NC}"
    echo ""
    echo "  Useful commands:"
    echo "    sudo systemctl status writingcoach   — check status"
    echo "    sudo systemctl restart writingcoach  — restart"
    echo "    sudo systemctl stop writingcoach     — stop"
    echo "    sudo journalctl -u writingcoach -f   — view live logs"
else
    echo -e "${RED}[ERROR] Service failed to start. Check logs:${NC}"
    echo "  sudo journalctl -u writingcoach -n 30"
    exit 1
fi

echo ""
PORT=$(grep -m1 '^PORT=' "${INSTALL_DIR}/.env" 2>/dev/null | cut -d= -f2 || echo "3000")
echo "  Open in browser: http://$(hostname -I | awk '{print $1}'):${PORT:-3000}"
echo ""
