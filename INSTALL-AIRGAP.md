# מדריך התקנה — מאמן כתיבה מנהלית
## רשת פנימית מבודדת (Airgap)

---

## תוכן עניינים

1. [מה צריך לפני שמתחילים](#1-מה-צריך-לפני-שמתחילים)
2. [הכנת הקבצים מחוץ לארגון](#2-הכנת-הקבצים-מחוץ-לארגון)
3. [העברת הקבצים לרשת הפנימית](#3-העברת-הקבצים-לרשת-הפנימית)
4. [התקנה על השרת הפנימי](#4-התקנה-על-השרת-הפנימי)
5. [הגדרת חיבור ל-AI ארגוני](#5-הגדרת-חיבור-ל-ai-ארגוני)
6. [הרצה ראשונה](#6-הרצה-ראשונה)
7. [מתן URL פנים-ארגוני](#7-מתן-url-פנים-ארגוני)
8. [הגדרה כשירות קבוע](#8-הגדרה-כשירות-קבוע)
9. [בדיקות ואימות](#9-בדיקות-ואימות)
10. [תחזוקה ועדכונים](#10-תחזוקה-ועדכונים)

---

## 1. מה צריך לפני שמתחילים

### שרת פנימי נדרש

| רכיב | מינימום | מומלץ |
|------|---------|-------|
| מעבד | 2 ליבות | 4 ליבות |
| זיכרון RAM | 2 GB | 4 GB |
| דיסק | 5 GB פנוי | 20 GB |
| מערכת הפעלה | Ubuntu 20.04 / RHEL 8 / Windows Server 2019 | Ubuntu 22.04 LTS |

### תוכנה נדרשת (להתקין מראש)

**אפשרות A — Docker (מומלצת, הכי פשוטה):**
- Docker Engine 24+
- Docker Compose v2+

**אפשרות B — Node.js ישיר:**
- Node.js 20 LTS
- npm 10+

### מה עוד צריך

- גישה לשרת ה-AI הפנימי (GPT ארגוני / Cohere on-prem) — כתובת IP ומפתח API
- הרשאות לפתוח פורט על השרת (ברירת מחדל: 3000)
- אופציונלי: הרשאות DNS פנימי להגדרת כתובת URL

---

## 2. הכנת הקבצים מחוץ לארגון

> בצעי שלב זה על מחשב **עם גישה לאינטרנט**, לפני המעבר לרשת הפנימית.

### אפשרות A — Docker Image (מומלץ לאיירגאפ)

```bash
# הורידי את קוד המקור
git clone https://github.com/Ruthys1000/writingcoach.git
cd writingcoach
git checkout claude/air-gapped-deployment-hCfD4

# בני את ה-Docker Image
docker build -t writingcoach:latest .

# שמרי אותו כקובץ tar
docker save writingcoach:latest -o writingcoach-image.tar

# (אופציונלי) כווץ לחיסכון במקום
gzip writingcoach-image.tar
# התוצאה: writingcoach-image.tar.gz (~150MB)
```

### אפשרות B — קבצים ישירים (Node.js)

```bash
git clone https://github.com/Ruthys1000/writingcoach.git
cd writingcoach
git checkout claude/air-gapped-deployment-hCfD4

# התקני תלויות (כולל client)
npm install
cd client && npm install && cd ..

# בני את ה-React
cd client && npm run build && cd ..

# קמפלי את ה-TypeScript
npx tsc

# כעת העתיקי את כל תיקיית writingcoach/ כולה
```

---

## 3. העברת הקבצים לרשת הפנימית

### העברה בדרכים אפשריות

**דרך USB / דיסק חיצוני:**
```
העתיקי לדיסק חיצוני:
  writingcoach-image.tar.gz   ← אפשרות Docker
  — או —
  תיקיית writingcoach/        ← אפשרות Node.js ישיר
```

**דרך שרת קבצים פנימי / תיקיה משותפת:**
```
העתיקי לשרת הקבצים הפנימי ואז העתיקי משם לשרת היעד
```

**דרך SCP (אם יש גישה מוגבלת):**
```bash
scp writingcoach-image.tar.gz user@INTERNAL-SERVER-IP:/home/user/
```

---

## 4. התקנה על השרת הפנימי

### אפשרות A — Docker

```bash
# 1. העלי את ה-Image לDocker המקומי
docker load -i writingcoach-image.tar.gz

# 2. אמתי שעלה
docker images | grep writingcoach
# צריך לראות: writingcoach   latest   ...

# 3. צרי תיקיית עבודה
mkdir -p /opt/writingcoach
cd /opt/writingcoach

# 4. צרי קובץ .env (ראי סעיף 5)
nano .env

# 5. צרי קובץ docker-compose.yml
nano docker-compose.yml
```

**תוכן docker-compose.yml לסביבת Airgap:**
```yaml
version: '3.9'
services:
  app:
    image: writingcoach:latest
    ports:
      - "3000:3000"
    env_file:
      - .env
    volumes:
      - ./recipes:/app/recipes:rw
      - ./config:/app/config:rw
    restart: unless-stopped
```

### אפשרות B — Node.js ישיר

```bash
# העתיקי את תיקיית writingcoach/ לשרת
cp -r writingcoach/ /opt/writingcoach/
cd /opt/writingcoach

# אם node_modules לא הועתק — התקיני שוב (דורש גישה לרשת פנימית עם npm mirror)
# אחרת דלגי על שלב זה
npm install --prefer-offline

# צרי קובץ .env (ראי סעיף 5)
nano .env
```

---

## 5. הגדרת חיבור ל-AI ארגוני

צרי קובץ `.env` בתיקיית `/opt/writingcoach/` לפי ספק ה-AI שלך:

### GPT ארגוני (OpenAI-compatible / Azure OpenAI)

```env
LLM_PROVIDER=openai
OPENAI_BASE_URL=http://10.0.0.50:8000/v1
OPENAI_API_KEY=your-internal-token
OPENAI_MODEL=gpt-4
PORT=3000
NODE_ENV=production
```

> הכתובת `10.0.0.50:8000` היא דוגמה — החליפי בכתובת השרת הפנימי שלך.

### Cohere ארגוני (on-prem)

```env
LLM_PROVIDER=cohere
COHERE_BASE_URL=http://10.0.0.51:8080/v2
COHERE_API_KEY=your-internal-token
COHERE_MODEL=command-r-plus
PORT=3000
NODE_ENV=production
```

### הגדרות נוספות (אופציונלי)

```env
# אפשר גישה רק מהרשת הפנימית
ALLOWED_ORIGINS=http://coach.internal.org,http://10.0.0.100

# הגבל קצב בקשות (כבי ברשת פנימית קטנה)
RATE_LIMIT_ENABLED=false
```

---

## 6. הרצה ראשונה

### עם Docker

```bash
cd /opt/writingcoach
docker compose up -d

# בדיקה שעלה
docker compose ps
docker compose logs -f app
```

### עם Node.js ישיר

```bash
cd /opt/writingcoach
NODE_ENV=production node dist/server/index.js
```

### בדיקת תקינות

```bash
curl http://localhost:3000/health
# תשובה תקינה: {"status":"ok"}
```

פתחי דפדפן ועברי ל: **http://[IP-השרת]:3000**

---

## 7. מתן URL פנים-ארגוני

כדי שמשתמשים יגיעו לכלי עם כתובת כמו `http://coach.yourorg.local` במקום IP ופורט.

### שלב א׳ — Nginx כ-Reverse Proxy

**התקנה:**
```bash
# Ubuntu/Debian
sudo apt install nginx -y

# RHEL/CentOS
sudo yum install nginx -y
```

**קובץ הגדרה** — `/etc/nginx/sites-available/writingcoach`:
```nginx
server {
    listen 80;
    server_name coach.yourorg.local;   # ← שמי כאן את הכתובת הפנימית שלך

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;

        # חשוב לבקשות ארוכות (AI יכול לקחת זמן)
        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
    }
}
```

**הפעלה:**
```bash
sudo ln -s /etc/nginx/sites-available/writingcoach /etc/nginx/sites-enabled/
sudo nginx -t          # בדוק תחביר
sudo systemctl reload nginx
```

---

### שלב ב׳ — הגדרת DNS פנימי

> בצעי זאת על **שרת ה-DNS הפנימי** של הארגון (בדרך כלל זה Domain Controller / Active Directory).

#### על Windows Server (Active Directory DNS)

1. פתחי **DNS Manager** (Start → Administrative Tools → DNS)
2. ניווטי ל: `Forward Lookup Zones` → שם הדומיין הפנימי שלך (למשל `yourorg.local`)
3. לחצי ימין → `New Host (A or AAAA Record)`
4. מלאי:
   - **Name:** `coach`
   - **IP Address:** כתובת ה-IP של שרת הכלי (למשל `10.0.1.55`)
5. לחצי `Add Host`

כעת כל מחשב ברשת יוכל להגיע ל: **http://coach.yourorg.local**

#### על Linux DNS (BIND9)

הוסיפי לקובץ ה-zone:
```
coach    IN    A    10.0.1.55
```

---

### אפשרות פשוטה יותר — קובץ HOSTS (ללא שינוי DNS)

אם אין גישה לשרת DNS, ניתן להוסיף לכל מחשב משתמש:

**Windows** — ערכי את הקובץ `C:\Windows\System32\drivers\etc\hosts`:
```
10.0.1.55    coach.yourorg.local
```

**Linux/Mac** — ערכי `/etc/hosts`:
```
10.0.1.55    coach.yourorg.local
```

---

## 8. הגדרה כשירות קבוע

כדי שהכלי יעלה אוטומטית אחרי הפעלת השרת מחדש.

### עם Docker (פשוט)

ה-`restart: unless-stopped` ב-docker-compose.yml מבטיח זאת אוטומטית.
```bash
# הפעלה אוטומטית של Docker בהפעלת המערכת
sudo systemctl enable docker
```

### עם Node.js — systemd service

צרי קובץ `/etc/systemd/system/writingcoach.service`:
```ini
[Unit]
Description=WritingCoach - מאמן כתיבה מנהלית
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/writingcoach
EnvironmentFile=/opt/writingcoach/.env
ExecStart=/usr/bin/node dist/server/index.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=writingcoach

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable writingcoach
sudo systemctl start writingcoach
sudo systemctl status writingcoach
```

---

## 9. בדיקות ואימות

```bash
# 1. בדיקת שרת
curl http://localhost:3000/health

# 2. בדיקת URL פנימי (מהשרת עצמו)
curl http://coach.yourorg.local/health

# 3. צפייה בלוגים (Docker)
docker compose logs -f app

# 4. צפייה בלוגים (systemd)
journalctl -u writingcoach -f
```

**בדיקה מהדפדפן:**
- פתחי דפדפן ממחשב משתמש ברשת
- נווטי ל: `http://coach.yourorg.local`
- אמתי שדף הבית עולה
- לחצי על "התחל אימון" ובדקי שה-AI מגיב

---

## 10. תחזוקה ועדכונים

### קבלת גרסה חדשה (איירגאפ)

1. בנולי Image חדש על מחשב עם אינטרנט (ראי סעיף 2)
2. שמרי `docker save writingcoach:latest -o writingcoach-vNEW.tar.gz`
3. העבירי לרשת הפנימית
4. על השרת:
```bash
docker load -i writingcoach-vNEW.tar.gz
cd /opt/writingcoach
docker compose down
docker compose up -d
```

### גיבוי הגדרות

```bash
# גיבוי הגדרות (מתכוני כתיבה + הגדרות מערכת)
cp -r /opt/writingcoach/config/ /backup/writingcoach-config-$(date +%Y%m%d)/
cp -r /opt/writingcoach/recipes/ /backup/writingcoach-recipes-$(date +%Y%m%d)/
cp /opt/writingcoach/.env /backup/writingcoach-env-$(date +%Y%m%d)
```

---

## סיכום — זרימת העבודה המלאה

```
מחשב עם אינטרנט                    רשת פנימית (Airgap)
──────────────────                  ─────────────────────────────────

1. git clone + build          →     USB/דיסק/שרת קבצים
   docker save → .tar.gz      →

                                    2. docker load
                                       יצירת .env (פרטי AI פנימי)
                                       docker compose up -d

                                    3. nginx reverse proxy
                                       DNS: coach.yourorg.local → IP

                                    4. משתמשים פותחים דפדפן:
                                       http://coach.yourorg.local ✓
```

---

**שאלות או בעיות?** פנו למנהל המערכת שהתקין את הכלי.
