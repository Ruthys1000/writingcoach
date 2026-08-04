# מאמן הכתיבה — התקנה בסביבה מנותקת

חבילה מוכנה להרצה. **אין צורך באינטרנט, ב-npm, או בבנייה על השרת.**

## שלושה צעדים

### 1. העתקה לשרת

חלצי את `writingcoach-ready.tar.gz` (או העתיקי את תיקיית `writingcoach-transfer/`) לשרת, למשל:

```bash
sudo mkdir -p /opt/writingcoach
sudo cp -a writingcoach-transfer/. /opt/writingcoach/
cd /opt/writingcoach
```

### 2. חיבור ל-AI הפנימי

```bash
cp .env.example .env
nano .env
```

מלאי את כתובת שרת ה-AI, הטוקן ושם המודל (ממנהל המערכת):

```env
LLM_PROVIDER=openai
OPENAI_BASE_URL=http://כתובת-שרת-ה-AI:פורט/v1
OPENAI_API_KEY=הטוקן-הפנימי
OPENAI_MODEL=שם-המודל
```

אם אין טוקן — כתבי כל ערך, למשל `none`.

ל-Ollama מקומי:

```env
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3
```

### 3. הפעלה

```bash
bash start.sh
```

האפליקציה זמינה ב:
- מהשרת: **http://localhost:3000**
- מרשת פנימית: **http://כתובת-השרת:3000**

לעצירה: `Ctrl+C`.

---

## בדיקת תקינות

```bash
curl http://localhost:3000/health
# צפוי: {"status":"ok"}
```

## הפעלה אוטומטית אחרי אתחול

```bash
sudo bash scripts/setup-service-linux.sh
```

## מה יש בחבילה (ורק זה)

| תיקייה/קובץ | תפקיד |
|---|---|
| `dist/` | שרת מקומפל |
| `client/dist/` | ממשק בנוי |
| `node_modules/` | תלויות להרצה |
| `recipes/` | סוגי מסמכים |
| `config/` | הגדרות מערכת |
| `runtime/` | Node.js מובנה — אין צורך בהתקנה נפרדת |
| `start.sh` | הפעלה |
| `.env.example` | תבנית הגדרות |

אין קוד מקור, אין Docker, ואין צורך ב-`npm install` על השרת.

גודל הארכיון הטיפוסי: כ־40MB (כולל Node.js מובנה).

## פתרון תקלות

| תופעה | מה לבדוק |
|---|---|
| הדף עולה אבל השיחה נכשלת | כתובת / טוקן / שם מודל ב-`.env` |
| אין גישה ממחשב אחר | חומת אש — פתחי פורט 3000 |
| `Node.js was not found` | ודאי שתיקיית `runtime/` הועתקה במלואה |
