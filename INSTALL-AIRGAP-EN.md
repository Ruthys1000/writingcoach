# WritingCoach — Air-Gapped Deployment Guide
## Internal Network (No Internet Access)

---

## Which guide applies to you?

| Your server OS | Docker available? | Go to |
|---|---|---|
| **Windows** | No (most common) | [Windows — Node.js (no Docker)](#windows--nodejs-no-docker) |
| **Linux** | Not sure / No | [Linux — Node.js (no Docker)](#linux--nodejs-no-docker) |
| **Linux** | Yes | [Linux — Docker (recommended)](#linux--docker-recommended) |
| Linux / Windows | Docker confirmed | [Section 2 onwards (full Docker guide)](#2-prepare-the-files-on-an-internet-connected-machine) |

---

## Windows — Node.js (no Docker)

Use this path if Docker is not available on your Windows server. No virtualization needed.

### Step 1 — On your internet-connected machine

**Install Node.js 20 LTS** from nodejs.org if you haven't already, then:

```
git clone https://github.com/Ruthys1000/writingcoach.git
cd writingcoach
git fetch origin
git checkout claude/air-gapped-deployment-hCfD4
```

Double-click **`scripts\install-windows.bat`** — it will:
- Install all dependencies
- Build the React frontend
- Compile the TypeScript server
- Optionally download the Node.js installer to bundle on the USB

When it finishes, copy the entire `writingcoach` folder to a USB drive.

### Step 2 — On the air-gapped Windows server

1. **Install Node.js** (if not already installed): double-click `node-v20-x64.msi` from the USB
2. Copy the `writingcoach` folder to `C:\writingcoach`
3. Open `.env.example` in Notepad, fill in your AI server details, and save it as `.env`:

```
LLM_PROVIDER=openai
OPENAI_BASE_URL=http://YOUR-INTERNAL-AI-IP:PORT/v1
OPENAI_API_KEY=your-token
OPENAI_MODEL=your-model-name
PORT=3000
NODE_ENV=production
```

4. Double-click **`start.bat`** — the server starts and prints the URL
5. Open a browser and go to **http://localhost:3000**

### Step 3 — Run automatically on Windows startup

1. Press `Win + R`, type `shell:startup`, press Enter
2. Create a shortcut to `C:\writingcoach\start.bat` in that folder
3. The app will start automatically every time Windows boots

---

---

## Linux — Node.js (no Docker)

Use this if Docker is not installed on your Linux server. Works on Ubuntu, Debian, RHEL, CentOS, and similar.

### Step 1 — On your internet-connected machine

```bash
git clone https://github.com/Ruthys1000/writingcoach.git
cd writingcoach
git fetch origin
git checkout claude/air-gapped-deployment-hCfD4

bash scripts/install-linux.sh
```

The script installs dependencies, builds the React frontend, compiles the TypeScript server,
and optionally downloads the Node.js Linux binary to bundle on the USB.

When it finishes, copy the entire `writingcoach` folder to a USB drive.

### Step 2 — On the air-gapped Linux server

**If Node.js is not installed** and you bundled the tarball:

```bash
sudo tar -xzf node-v20*-linux-x64.tar.gz -C /usr/local --strip-components=1
node --version   # confirm: v20.x.x
```

**Copy files and configure:**

```bash
sudo cp -r /path/to/usb/writingcoach /opt/writingcoach
cd /opt/writingcoach

cp .env.example .env
nano .env   # fill in your AI server details:
```

```
LLM_PROVIDER=openai
OPENAI_BASE_URL=http://YOUR-INTERNAL-AI-IP:PORT/v1
OPENAI_API_KEY=your-token
OPENAI_MODEL=your-model-name
PORT=3000
NODE_ENV=production
```

**Start the server:**

```bash
bash start.sh
```

Health check: `curl http://localhost:3000/health` → `{"status":"ok"}`

### Step 3 — Run automatically on boot (systemd)

```bash
sudo bash scripts/setup-service-linux.sh
```

This installs and starts a systemd service. The app will restart automatically after reboots or crashes.

```bash
# Useful commands after setup:
sudo systemctl status writingcoach
sudo journalctl -u writingcoach -f   # live logs
```

---

## Linux — Docker (recommended)

Use this if Docker is installed (run `docker --version` to check). Docker is the
cleanest option and handles everything in one container.

### Step 1 — On your internet-connected machine

```bash
git clone https://github.com/Ruthys1000/writingcoach.git
cd writingcoach
git fetch origin
git checkout claude/air-gapped-deployment-hCfD4

docker build -t writingcoach:latest .
docker save writingcoach:latest | gzip > writingcoach.tar.gz
```

Copy `writingcoach.tar.gz` to USB (it will be ~150 MB). Also copy the `writingcoach` folder
(for the `recipes/` and `config/` directories and the `docker-compose.yml`).

### Step 2 — On the air-gapped Linux server

```bash
docker load < writingcoach.tar.gz
sudo mkdir -p /opt/writingcoach
cd /opt/writingcoach

# Create .env
cat > .env <<'EOF'
LLM_PROVIDER=openai
OPENAI_BASE_URL=http://YOUR-INTERNAL-AI-IP:PORT/v1
OPENAI_API_KEY=your-token
OPENAI_MODEL=your-model-name
PORT=3000
NODE_ENV=production
EOF

# Create docker-compose.yml
cat > docker-compose.yml <<'EOF'
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
EOF

docker compose up -d
curl http://localhost:3000/health
```

**Auto-start on boot** (Docker handles this automatically via `restart: unless-stopped`):

```bash
sudo systemctl enable docker
```

---

## Table of Contents (Docker path)

1. [What You Need Before You Start](#1-what-you-need-before-you-start)
2. [Prepare the Files (on an Internet-Connected Machine)](#2-prepare-the-files-on-an-internet-connected-machine)
3. [Transfer Files to the Internal Network](#3-transfer-files-to-the-internal-network)
4. [Install on the Internal Server](#4-install-on-the-internal-server)
5. [Configure Your Internal AI Connection](#5-configure-your-internal-ai-connection)
6. [First Run](#6-first-run)
7. [Give Users a Friendly Internal URL](#7-give-users-a-friendly-internal-url)
8. [Run as a Permanent Service](#8-run-as-a-permanent-service)
9. [Testing and Verification](#9-testing-and-verification)
10. [Maintenance and Updates](#10-maintenance-and-updates)

---

## 1. What You Need Before You Start

### Server Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| CPU | 2 cores | 4 cores |
| RAM | 2 GB | 4 GB |
| Disk | 5 GB free | 20 GB |
| OS | Ubuntu 20.04 / RHEL 8 / Windows Server 2019 | Ubuntu 22.04 LTS |

### Required Software (install before starting)

**Option A — Docker (recommended, easiest):**
- Docker Engine 24+
- Docker Compose v2+

**Option B — Node.js (direct):**
- Node.js 20 LTS
- npm 10+

### Also Required

- Access to your internal AI server (OpenAI-compatible / Azure OpenAI / vLLM / LocalAI) — IP address and API key/token
- Permission to open a port on the server (default: 3000)
- Optional: internal DNS permission to set a friendly URL

---

## 2. Prepare the Files (on an Internet-Connected Machine)

> Run these steps on a machine **with internet access**, before moving to the internal network.

### Option A — Docker Image (recommended for air-gap)

```bash
# Clone the source code
git clone https://github.com/Ruthys1000/writingcoach.git
cd writingcoach
git checkout claude/air-gapped-deployment-hCfD4

# Build the Docker image
docker build -t writingcoach:latest .

# Save it as a tar file
docker save writingcoach:latest -o writingcoach-image.tar

# (Optional) Compress to save space
gzip writingcoach-image.tar
# Result: writingcoach-image.tar.gz (~150 MB)
```

### Option B — Direct Files (Node.js)

```bash
git clone https://github.com/Ruthys1000/writingcoach.git
cd writingcoach
git checkout claude/air-gapped-deployment-hCfD4

# Install all dependencies (including client)
npm install
cd client && npm install && cd ..

# Build the React frontend
cd client && npm run build && cd ..

# Compile TypeScript server
npx tsc

# Now copy the entire writingcoach/ folder
```

---

## 3. Transfer Files to the Internal Network

### Via USB Drive / External Disk

```
Copy to the external disk:
  writingcoach-image.tar.gz   ← Docker option
  — or —
  writingcoach/ folder        ← Node.js option
```

### Via Internal File Server / Shared Folder

Copy to the file server, then copy from there to the target server.

### Via SCP (if limited network access exists)

```bash
scp writingcoach-image.tar.gz user@INTERNAL-SERVER-IP:/home/user/
```

---

## 4. Install on the Internal Server

### Option A — Docker

```bash
# 1. Load the image into local Docker
docker load -i writingcoach-image.tar.gz

# 2. Verify it loaded
docker images | grep writingcoach
# Should show: writingcoach   latest   ...

# 3. Create a working directory
mkdir -p /opt/writingcoach
cd /opt/writingcoach

# 4. Create your .env file (see Section 5)
nano .env

# 5. Create a docker-compose.yml file
nano docker-compose.yml
```

**Contents of docker-compose.yml for air-gap deployment:**

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

### Option B — Node.js (Direct)

```bash
# Copy the writingcoach/ folder to the server
cp -r writingcoach/ /opt/writingcoach/
cd /opt/writingcoach

# If node_modules was not copied, reinstall offline:
npm install --prefer-offline

# Create your .env file (see Section 5)
nano .env
```

---

## 5. Configure Your Internal AI Connection

Create a `.env` file in `/opt/writingcoach/` matching your AI provider:

### OpenAI-Compatible Internal AI (vLLM / LocalAI / LM Studio / Azure OpenAI)

This is the most common setup for enterprise internal AI deployments.

```env
LLM_PROVIDER=openai
OPENAI_BASE_URL=http://10.0.0.50:8000/v1
OPENAI_API_KEY=your-internal-token
OPENAI_MODEL=gpt-4
PORT=3000
NODE_ENV=production
```

> Replace `10.0.0.50:8000` with your internal AI server's actual address and port.
> If your server requires no key, set any non-empty string (e.g. `OPENAI_API_KEY=none`).

### Azure OpenAI (internal endpoint)

```env
LLM_PROVIDER=openai
OPENAI_BASE_URL=https://YOUR-RESOURCE.openai.azure.com/openai/deployments/YOUR-DEPLOYMENT/
OPENAI_API_KEY=your-azure-api-key
OPENAI_MODEL=gpt-4
PORT=3000
NODE_ENV=production
```

### Cohere On-Premises

```env
LLM_PROVIDER=cohere
COHERE_BASE_URL=http://10.0.0.51:8080/v2
COHERE_API_KEY=your-internal-token
COHERE_MODEL=command-r-plus
PORT=3000
NODE_ENV=production
```

### Ollama (fully local model, no external AI needed)

```env
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3
PORT=3000
NODE_ENV=production
```

> For Ollama in a fully air-gapped setup, use `docker-compose.airgap.yml` and the
> `scripts/prepare-airgap.sh` / `scripts/load-airgap.sh` scripts instead.

### Additional Optional Settings

```env
# Restrict access to specific internal origins only
ALLOWED_ORIGINS=http://coach.internal.org,http://10.0.0.100

# Disable rate limiting (recommended for small internal networks)
RATE_LIMIT_ENABLED=false
```

---

## 6. First Run

### With Docker

```bash
cd /opt/writingcoach
docker compose up -d

# Check it started
docker compose ps
docker compose logs -f app
```

### With Node.js (Direct)

```bash
cd /opt/writingcoach
NODE_ENV=production node dist/server/index.js
```

### Health Check

```bash
curl http://localhost:3000/health
# Expected response: {"status":"ok"}
```

Open a browser and navigate to: **http://[SERVER-IP]:3000**

---

## 7. Give Users a Friendly Internal URL

So users can reach the tool at an address like `http://coach.yourorg.local` instead of an IP and port.

### Step A — Nginx as Reverse Proxy

**Install:**

```bash
# Ubuntu/Debian
sudo apt install nginx -y

# RHEL/CentOS
sudo yum install nginx -y
```

**Config file** — `/etc/nginx/sites-available/writingcoach`:

```nginx
server {
    listen 80;
    server_name coach.yourorg.local;   # ← your internal address here

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;

        # Important for AI requests that may take time
        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
    }
}
```

**Enable:**

```bash
sudo ln -s /etc/nginx/sites-available/writingcoach /etc/nginx/sites-enabled/
sudo nginx -t          # test config syntax
sudo systemctl reload nginx
```

### Step B — Internal DNS Entry

Run this on your **internal DNS server** (usually Domain Controller / Active Directory).

#### On Windows Server (Active Directory DNS)

1. Open **DNS Manager** (Start → Administrative Tools → DNS)
2. Navigate to: `Forward Lookup Zones` → your internal domain (e.g. `yourorg.local`)
3. Right-click → `New Host (A or AAAA Record)`
4. Fill in:
   - **Name:** `coach`
   - **IP Address:** the server's IP (e.g. `10.0.1.55`)
5. Click `Add Host`

Users can now reach the tool at: **http://coach.yourorg.local**

#### On Linux DNS (BIND9)

Add to your zone file:

```
coach    IN    A    10.0.1.55
```

### Simpler Alternative — HOSTS File (no DNS changes)

Edit on each user's machine:

**Windows** — `C:\Windows\System32\drivers\etc\hosts`:

```
10.0.1.55    coach.yourorg.local
```

**Linux/Mac** — `/etc/hosts`:

```
10.0.1.55    coach.yourorg.local
```

---

## 8. Run as a Permanent Service

So the tool starts automatically after a server reboot.

### With Docker (easiest)

The `restart: unless-stopped` in `docker-compose.yml` handles this automatically.

```bash
# Enable Docker to start on system boot
sudo systemctl enable docker
```

### With Node.js — systemd service

Create `/etc/systemd/system/writingcoach.service`:

```ini
[Unit]
Description=WritingCoach - Administrative Writing Coach
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

## 9. Testing and Verification

```bash
# 1. Server health check
curl http://localhost:3000/health

# 2. Internal URL check (from the server itself)
curl http://coach.yourorg.local/health

# 3. View logs (Docker)
docker compose logs -f app

# 4. View logs (systemd)
journalctl -u writingcoach -f
```

**Browser test:**

1. Open a browser on a user machine on the network
2. Navigate to `http://coach.yourorg.local`
3. Verify the home page loads
4. Click "התחל אימון" (Start Training) and verify the AI responds

---

## 10. Maintenance and Updates

### Getting a New Version (air-gap)

1. Build a new image on an internet-connected machine (see Section 2)
2. Save: `docker save writingcoach:latest -o writingcoach-vNEW.tar.gz`
3. Transfer to the internal network
4. On the server:

```bash
docker load -i writingcoach-vNEW.tar.gz
cd /opt/writingcoach
docker compose down
docker compose up -d
```

### Backup Configuration

```bash
# Backup writing recipes and system settings
cp -r /opt/writingcoach/config/ /backup/writingcoach-config-$(date +%Y%m%d)/
cp -r /opt/writingcoach/recipes/ /backup/writingcoach-recipes-$(date +%Y%m%d)/
cp /opt/writingcoach/.env /backup/writingcoach-env-$(date +%Y%m%d)
```

---

## Full Workflow Summary

```
Internet-connected machine              Air-gapped internal network
──────────────────────────              ─────────────────────────────────────

1. git clone + docker build       →     USB / disk / file server
   docker save → .tar.gz          →

                                        2. docker load
                                           Create .env (internal AI details)
                                           Create docker-compose.yml
                                           docker compose up -d

                                        3. nginx reverse proxy (optional)
                                           DNS: coach.yourorg.local → IP

                                        4. Users open browser:
                                           http://coach.yourorg.local  ✓
```

---

**Questions or issues?** Contact the system administrator who installed this tool.
