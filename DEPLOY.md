# מאמן הכתיבה — התקנה והפעלה בסביבה מנותקת (Airgap)

הענף הזה הוא **חבילה מוכנה להרצה**: הוא כולל את הקוד המקומפל (`dist/`),
הממשק הבנוי (`client/dist/`), כל התלויות (`node_modules/`) וגם את קובץ
ההתקנה של Node.js 20 ללינוקס. **אין צורך באינטרנט, בבנייה או ב-npm install
על השרת הפנימי.**

## תוכן עניינים
1. [העברה ל-disk on key](#1-העברה-ל-disk-on-key)
2. [התקנה על השרת הפנימי](#2-התקנה-על-השרת-הפנימי)
3. [חיבור ל-AI הפנימי (.env)](#3-חיבור-ל-ai-הפנימי-env)
4. [הפעלה](#4-הפעלה)
5. [הפעלה אוטומטית כ-Service](#5-הפעלה-אוטומטית-כ-service)
6. [בדיקת תקינות ופתרון תקלות](#6-בדיקת-תקינות-ופתרון-תקלות)
7. [הוספת סוגי מסמכים (Recipes)](#7-הוספת-סוגי-מסמכים-recipes)

---

## 1. העברה ל-disk on key

במחשב עם אינטרנט:

1. הורידי את הענף כ-ZIP מ-GitHub:
   **Code ← Download ZIP** (כשהענף `claude/airgapped-app-deployment-kta89e` נבחר),
   או `git clone` של הענף.
2. חלצי את ה-ZIP והעתיקי את **כל התיקייה כמות שהיא** ל-disk on key.
   הכול כבר בפנים — אין שום דבר נוסף להוריד.

---

## 2. התקנה על השרת הפנימי

1. העתיקי את התיקייה מה-USB לשרת, למשל ל-`/opt/writingcoach`:
   ```bash
   sudo mkdir -p /opt/writingcoach
   sudo cp -r /media/usb/writingcoach/* /opt/writingcoach/
   cd /opt/writingcoach
   ```

2. בדקי אם Node.js מותקן:
   ```bash
   node --version
   ```
   - אם מוצג מספר גרסה 18 ומעלה — הכול טוב, המשיכי לשלב 3.
   - אם לא — התקיני מהקובץ שמצורף בתיקייה (בלי אינטרנט):
     ```bash
     sudo tar -xzf node-v20.19.1-linux-x64.tar.gz -C /usr/local --strip-components=1
     node --version   # אמור להציג v20.19.1
     ```

---

## 3. חיבור ל-AI הפנימי (.env)

```bash
cp .env.example .env
nano .env
```

מלאי **רק** את החלק של הספק שלך. לרוב שרתי AI פנימיים (vLLM / LocalAI /
LM Studio / Azure וכד') משתמשים בממשק תואם-OpenAI:

```env
LLM_PROVIDER=openai
OPENAI_BASE_URL=http://כתובת-שרת-ה-AI:פורט/v1
OPENAI_API_KEY=הטוקן-הפנימי        # אם אין טוקן — כתבי כל טקסט, למשל none
OPENAI_MODEL=שם-המודל-בשרת
```

אם ה-AI הפנימי הוא Ollama:

```env
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://כתובת-השרת:11434
OLLAMA_MODEL=שם-המודל
```

> את שלושת הפרטים (כתובת, טוקן, שם מודל) מקבלים ממנהל מערכת ה-AI בארגון.

---

## 4. הפעלה

```bash
bash start.sh
```

האפליקציה תהיה זמינה בדפדפן:
- מהשרת עצמו: **http://localhost:3000**
- ממחשבים אחרים ברשת הפנימית: **http://כתובת-השרת:3000**

לעצירה: `Ctrl+C`. לשינוי פורט — הוסיפי `PORT=8080` לקובץ `.env`.

---

## 5. הפעלה אוטומטית כ-Service

כדי שהאפליקציה תעלה לבד אחרי הפעלה מחדש של השרת:

```bash
bash scripts/setup-service-linux.sh
```

---

## 6. בדיקת תקינות ופתרון תקלות

```bash
curl http://localhost:3000/health
# תגובה תקינה: {"status":"ok"}
```

| תופעה | סיבה נפוצה | פתרון |
|---|---|---|
| `node: command not found` | Node.js לא מותקן | שלב 2, סעיף 2 |
| הדף עולה אבל השיחה נתקעת/שגיאה | פרטי ה-AI ב-.env שגויים | בדקי כתובת/טוקן/שם מודל מול מנהל ה-AI |
| הדף לא נפתח ממחשב אחר | חומת אש על השרת | פתחי את פורט 3000 (`sudo firewall-cmd --add-port=3000/tcp --permanent && sudo firewall-cmd --reload` או `sudo ufw allow 3000`) |

בדיקה ישירה של החיבור לשרת ה-AI (מהשרת של האפליקציה):
```bash
curl http://כתובת-שרת-ה-AI:פורט/v1/models
```

---

## 7. הוספת סוגי מסמכים (Recipes)

ניתן להוסיף סוגי מסמכים חדשים ללא שינוי קוד:
1. צרי קובץ YAML חדש בתיקיית `recipes/` (העתיקי אחד קיים כבסיס)
2. הפעילי מחדש את השרת — המסמך יופיע אוטומטית בממשק

---

## למפתחים: בנייה מחדש (דורש אינטרנט)

אם בעתיד ישתנה קוד המקור (`src/`, `server/`, `client/src/`), יש לבנות מחדש
על מחשב עם אינטרנט לפני העברה:

```bash
bash scripts/pack-for-transfer.sh
```
