# מאמן הכתיבה — הנחיות פריסה

## תוכן עניינים
1. [הרצה מקומית לפיתוח](#1-הרצה-מקומית-לפיתוח)
2. [פריסה ב-Railway.app (אינטרנט)](#2-פריסה-ב-railwayapp-אינטרנט)
3. [פריסה ל-Airgap (ללא אינטרנט)](#3-פריסה-ל-airgap-ללא-אינטרנט)
4. [הגדרת .env — בחירת ספק AI](#4-הגדרת-env--בחירת-ספק-ai)

---

## 1. הרצה מקומית לפיתוח

**דרישות:** Node.js 20+, npm

```bash
# התקנת תלויות
npm install
cd client && npm install && cd ..

# הרצה במצב פיתוח (שרת + ממשק ביחד)
npm run dev:web
```

האפליקציה תהיה זמינה בכתובת: **http://localhost:3000**

---

## 2. פריסה ב-Railway.app (אינטרנט)

Railway.app בונה ומריץ את האפליקציה אוטומטית מה-GitHub.

**שלבים:**
1. Push לענף הרלוונטי ב-GitHub
2. Railway יזהה את ה-Dockerfile ויבנה אוטומטית
3. בדשבורד של Railway — הגדר משתני סביבה (ראה [חלק 4](#4-הגדרת-env--בחירת-ספק-ai))

**משתני סביבה מינימליים ב-Railway:**
```
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-...
```
(או לפי הספק — ראה חלק 4)

---

## 3. פריסה ל-Airgap (ללא אינטרנט)

**המחשב שלך צריך אינטרנט. השרת הפנימי — לא.**

המטרה: חבילה קטנה ונקייה, בלי קוד מקור ובלי בלאגן בהפעלה.
על השרת הפנימי נשארים רק: חילוץ → מילוי `.env` → `bash start.sh`.

### שלב א: בניית החבילה (מחשב עם אינטרנט)

```bash
bash scripts/pack-for-transfer.sh
```

הסקריפט:
- בונה את הממשק והשרת
- משאיר תלויות production בלבד
- מצרף Node.js מובנה תחת `runtime/` (בלי צורך ב-sudo על השרת)
- יוצר `writingcoach-ready.tar.gz` + תיקיית `writingcoach-transfer/`

**לא נכנס לחבילה:** `src/`, `server/`, `client/src/`, Docker, Railway, תלויות פיתוח.

### שלב ב: העברה

העתיקי את `writingcoach-ready.tar.gz` (או את התיקייה) ב-USB / scp לשרת הפנימי.

### שלב ג: הפעלה על השרת הפנימי

```bash
tar -xzf writingcoach-ready.tar.gz
cd writingcoach-transfer
cp .env.example .env
nano .env          # פרטי שרת ה-AI הפנימי בלבד
bash start.sh
```

האפליקציה: **http://localhost:3000**

בתוך החבילה יש `README.md` קצר לגוף המקבל — אפשר להעביר רק אותו כהנחיות.

#### הפעלה אוטומטית עם עליית השרת:
```bash
sudo bash scripts/setup-service-linux.sh
```

---

## 4. הגדרת .env — בחירת ספק AI

העתק `.env.example` ל-`.env` ומלא **רק** את הספק הרלוונטי:

### ספק פנימי (vLLM / LocalAI / LM Studio / Azure):
```env
LLM_PROVIDER=openai
OPENAI_BASE_URL=http://YOUR-AI-SERVER-IP:PORT/v1
OPENAI_API_KEY=your-internal-token
OPENAI_MODEL=your-model-name
```

### Anthropic Claude (ענן):
```env
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-...
```

### Ollama (מקומי/airgap):
```env
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3
```

### Cohere (ענן):
```env
LLM_PROVIDER=cohere
COHERE_API_KEY=your-cohere-key
COHERE_MODEL=command-r-plus
```

---

## הוספת סוגי מסמכים חדשים (Recipes)

ניתן להוסיף סוגי מסמכים נוספים ללא שינוי קוד:
1. צור קובץ YAML חדש בתיקיית `recipes/`
2. עקוב אחר מבנה אחד הקבצים הקיימים
3. הפעל מחדש את השרת — המסמך יופיע אוטומטית בממשק

---

## בדיקת תקינות

```bash
curl http://localhost:3000/health
# תגובה תקינה: {"status":"ok"}
```
