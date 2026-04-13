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

### שלב א: בנייה על מחשב עם אינטרנט

```bash
bash scripts/install-linux.sh
```

הסקריפט מבצע:
- התקנת תלויות (`npm install`)
- בניית ממשק React (`client/dist/`)
- קומפילציית TypeScript (`dist/`)
- בסיום — שואל אם להוריד Node.js v20 לצרף לתיקייה (לשרת ללא Node.js)

### שלב ב: העברה לשרת הפנימי

העתק את כל תיקיית `writingcoach/` לשרת (USB, רשת פנימית וכו').

**כולל:** `dist/`, `client/dist/`, `node_modules/`, `recipes/`, `config/`

**לא לכלול:** `.git/`

### שלב ג: הפעלה על השרת הפנימי

```bash
# אם Node.js לא מותקן על השרת — התקנה מהקובץ שהורדת:
sudo tar -xzf node-v20*-linux-x64.tar.gz -C /usr/local --strip-components=1

# הגדרת קובץ .env:
cp .env.example .env
nano .env    # מלא את פרטי שרת ה-AI הפנימי

# הפעלה:
bash start.sh
```

האפליקציה תהיה זמינה בכתובת: **http://localhost:3000**

#### הגדרה כ-Service (הפעלה אוטומטית עם השרת):
```bash
bash scripts/setup-service-linux.sh
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
