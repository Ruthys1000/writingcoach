#!/bin/bash
# ============================================================
# pack-for-transfer.sh
# בונה חבילה מינימלית מוכנה להעברה לשרת ללא אינטרנט.
# הרץ על מחשב עם אינטרנט ו-Node.js 20+.
#
# התוצאה: writingcoach-ready.tar.gz
# בתוך החבילה — רק מה שצריך להרצה. בלי קוד מקור, בלי
# תלויות פיתוח, בלי Docker/Railway. Node.js מובנה ב-runtime/
# כך שאין צורך ב-sudo או בהתקנה נפרדת על השרת.
# ============================================================

set -euo pipefail
cd "$(dirname "$0")/.."

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

BUNDLE="writingcoach-transfer"
ARCHIVE="writingcoach-ready.tar.gz"
NODE_VERSION="v20.19.1"
NODE_ARCH="linux-x64"
NODE_FILE="node-${NODE_VERSION}-${NODE_ARCH}.tar.gz"
NODE_URL="https://nodejs.org/dist/${NODE_VERSION}/${NODE_FILE}"

# Allow skipping Node download: INCLUDE_NODE=0 bash scripts/pack-for-transfer.sh
INCLUDE_NODE="${INCLUDE_NODE:-1}"

echo ""
echo "  ================================================"
echo "   WritingCoach — חבילת Airgap נקייה"
echo "  ================================================"
echo ""

if ! command -v node >/dev/null 2>&1; then
  echo -e "${RED}[ERROR] Node.js לא נמצא. התקיני Node 20+ והריצי שוב.${NC}"
  exit 1
fi

# ── 1. תלויות + בנייה ──────────────────────────────────────
echo "[1/5] מתקין תלויות שרת..."
npm ci
echo "[1/5] מתקין תלויות ממשק..."
cd client && npm ci && cd ..

echo "[2/5] בונה ממשק React..."
cd client && npm run build && cd ..
echo "[2/5] מקמפל TypeScript..."
npx tsc

if [ ! -f "dist/server/index.js" ] || [ ! -f "client/dist/index.html" ]; then
  echo -e "${RED}[ERROR] הבנייה נכשלה — dist חסר.${NC}"
  exit 1
fi

# ── 2. תלויות production בלבד ──────────────────────────────
echo "[3/5] משאיר תלויות production בלבד..."
npm ci --omit=dev

# ── 3. הרכבת תיקייה מינימלית ───────────────────────────────
echo "[4/5] מרכיב תיקייה מינימלית (בלי קוד מקור)..."
rm -rf "$BUNDLE"
mkdir -p "$BUNDLE/client" "$BUNDLE/scripts"

cp -r dist              "$BUNDLE/"
cp -r client/dist       "$BUNDLE/client/dist"
cp -r node_modules      "$BUNDLE/"
cp -r recipes           "$BUNDLE/"
cp -r config            "$BUNDLE/"
cp    package.json      "$BUNDLE/"
cp    start.sh          "$BUNDLE/"
cp    scripts/setup-service-linux.sh "$BUNDLE/scripts/"

# Airgap-focused env template (no cloud-only noise)
cat > "$BUNDLE/.env.example" <<'EOF'
# ============================================================
# WritingCoach — הגדרת AI פנימי (סביבה מנותקת)
# העתיקי לקובץ בשם .env ומלאי את הפרטים ממנהל מערכת ה-AI.
# ============================================================

# בחרי ספק אחד: openai | ollama
LLM_PROVIDER=openai

# ---- שרת AI פנימי תואם-OpenAI (vLLM / LocalAI / LM Studio / Azure) ----
OPENAI_BASE_URL=http://YOUR-AI-SERVER-IP:PORT/v1
OPENAI_API_KEY=your-internal-token
OPENAI_MODEL=your-model-name

# ---- Ollama (מקומי) ----
# LLM_PROVIDER=ollama
# OLLAMA_BASE_URL=http://localhost:11434
# OLLAMA_MODEL=llama3

# פורט האפליקציה (ברירת מחדל 3000)
# PORT=3000
EOF

# Simple recipient README — the only doc they need
cp scripts/airgap-README.md "$BUNDLE/README.md"

chmod +x "$BUNDLE/start.sh"
chmod +x "$BUNDLE/scripts/setup-service-linux.sh"

# ── 4. Node.js מובנה (בלי sudo על השרת) ────────────────────
if [ "$INCLUDE_NODE" = "1" ]; then
  echo "[5/5] מצרף Node.js ${NODE_VERSION} לתוך runtime/..."
  if [ ! -f "$NODE_FILE" ]; then
    echo "  מוריד $NODE_URL"
    if command -v curl >/dev/null 2>&1; then
      curl -fL --progress-bar -o "$NODE_FILE" "$NODE_URL"
    else
      wget -q --show-progress -O "$NODE_FILE" "$NODE_URL"
    fi
  else
    echo "  משתמש ב-$NODE_FILE הקיים"
  fi

  mkdir -p "$BUNDLE/runtime"
  tar -xzf "$NODE_FILE" -C "$BUNDLE/runtime" --strip-components=1
  # Keep only the node binary + license — drop npm/npx/corepack/docs/headers
  rm -rf \
    "$BUNDLE/runtime/bin/npm" \
    "$BUNDLE/runtime/bin/npx" \
    "$BUNDLE/runtime/bin/corepack" \
    "$BUNDLE/runtime/lib" \
    "$BUNDLE/runtime/include" \
    "$BUNDLE/runtime/share" \
    "$BUNDLE/runtime/CHANGELOG.md" \
    "$BUNDLE/runtime/README.md"
  if [ ! -x "$BUNDLE/runtime/bin/node" ]; then
    echo -e "${RED}[ERROR] runtime/bin/node חסר אחרי צירוף Node.${NC}"
    exit 1
  fi
else
  echo "[5/5] מדלג על צירוף Node.js (INCLUDE_NODE=0)"
fi

# Sanity: no source trees accidentally included
for leak in src server client/src client/node_modules Dockerfile railway.toml SPEC.md; do
  if [ -e "$BUNDLE/$leak" ]; then
    echo -e "${RED}[ERROR] קובץ מיותר בחבילה: $leak${NC}"
    exit 1
  fi
done

tar -czf "$ARCHIVE" "$BUNDLE"
SIZE=$(du -sh "$ARCHIVE" | cut -f1)
FILE_COUNT=$(find "$BUNDLE" -type f | wc -l)

# Keep the unpacked folder for inspection / USB copy; archive is the transfer unit
echo ""
echo -e "${GREEN}  ================================================"
echo "   החבילה מוכנה"
echo -e "  ================================================${NC}"
echo ""
echo "  ארכיון:  $ARCHIVE  ($SIZE)"
echo "  תיקייה:  $BUNDLE/  ($FILE_COUNT קבצים)"
echo ""
echo "  מה בפנים:"
echo "    dist/          — שרת מקומפל"
echo "    client/dist/   — ממשק בנוי"
echo "    node_modules/  — תלויות production בלבד"
echo "    recipes/       — סוגי מסמכים"
echo "    config/        — הגדרות"
if [ "$INCLUDE_NODE" = "1" ]; then
  echo "    runtime/       — Node.js מובנה (בלי התקנה)"
fi
echo "    start.sh       — הפעלה"
echo "    README.md      — הנחיות קצרות לגוף המקבל"
echo ""
echo -e "${YELLOW}  לא כלול במכוון: קוד מקור, Docker, Railway, תלויות פיתוח${NC}"
echo ""
echo "  העברה:"
echo "    scp $ARCHIVE user@jump:/tmp/"
echo "    או העתקה ל-USB של $ARCHIVE / $BUNDLE/"
echo ""
echo "  על השרת הפנימי:"
echo "    tar -xzf $ARCHIVE && cd $BUNDLE"
echo "    cp .env.example .env && nano .env"
echo "    bash start.sh"
echo ""
