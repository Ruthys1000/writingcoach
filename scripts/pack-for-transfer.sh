#!/bin/bash
# ============================================================
# pack-for-transfer.sh
# הכנת חבילה מוכנה להעברה לשרת ללא אינטרנט
# הרץ על מחשב עם אינטרנט ו-Node.js 20+
# ============================================================

set -e
cd "$(dirname "$0")/.."

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

BUNDLE="writingcoach-transfer"
ARCHIVE="writingcoach-ready.tar.gz"

echo ""
echo "  ================================================"
echo "   WritingCoach — הכנת חבילה להעברה"
echo "  ================================================"
echo ""

# ── 1. התקנת תלויות ────────────────────────────────────────
echo "[1/4] מתקין תלויות שרת..."
npm install
echo "[1/4] מתקין תלויות ממשק..."
cd client && npm install && cd ..

# ── 2. בנייה ──────────────────────────────────────────────
echo "[2/4] בונה ממשק React..."
cd client && npm run build && cd ..
echo "[2/4] מקמפל TypeScript..."
npx tsc

# ── 3. תלויות production בלבד (ללא dev) ──────────────────
echo "[3/4] מסיר תלויות פיתוח (מקטין גודל)..."
npm ci --omit=dev

# ── 4. הרכבת החבילה ────────────────────────────────────────
echo "[4/4] מרכיב חבילה..."
rm -rf "$BUNDLE"
mkdir -p "$BUNDLE/client"

cp -r dist              "$BUNDLE/"
cp -r client/dist       "$BUNDLE/client/dist"
cp -r node_modules      "$BUNDLE/"
cp -r recipes           "$BUNDLE/"
cp -r config            "$BUNDLE/"
cp    start.sh          "$BUNDLE/"
cp    .env.example      "$BUNDLE/"
cp    package.json      "$BUNDLE/"
cp    DEPLOY.md         "$BUNDLE/"

chmod +x "$BUNDLE/start.sh"

tar -czf "$ARCHIVE" "$BUNDLE/"
rm -rf "$BUNDLE"

SIZE=$(du -sh "$ARCHIVE" | cut -f1)

echo ""
echo -e "${GREEN}  ================================================"
echo "   החבילה מוכנה!"
echo -e "  ================================================${NC}"
echo ""
echo "  קובץ: $ARCHIVE  ($SIZE)"
echo ""
echo "  להעברה לשרת:"
echo "    scp $ARCHIVE user@server:/opt/"
echo ""
echo "  על השרת:"
echo "    tar -xzf $ARCHIVE"
echo "    cd $BUNDLE"
echo "    cp .env.example .env && nano .env"
echo "    bash start.sh"
echo ""
