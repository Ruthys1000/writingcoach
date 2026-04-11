@echo off
setlocal enabledelayedexpansion
title WritingCoach - Starting...

echo.
echo  ============================================
echo   WritingCoach - Administrative Writing Coach
echo  ============================================
echo.

:: ── Check Node.js is installed ──────────────────────────────────────────────
where node >nul 2>&1
if errorlevel 1 (
    echo  [ERROR] Node.js was not found.
    echo.
    echo  Please install Node.js first:
    echo    1. Look for node-v20-x64.msi in this folder
    echo    2. Double-click it to install
    echo    3. Restart your computer
    echo    4. Run this script again
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('node --version 2^>nul') do set NODE_VER=%%v
echo  Node.js found: %NODE_VER%

:: ── Check app is built ───────────────────────────────────────────────────────
if not exist "dist\server\index.js" (
    echo.
    echo  [ERROR] The app has not been built yet.
    echo.
    echo  The dist\ folder is missing. This means the build step was not run
    echo  before copying the files to this machine.
    echo.
    echo  Please contact your system administrator.
    echo.
    pause
    exit /b 1
)

:: ── Check .env exists ────────────────────────────────────────────────────────
if not exist ".env" (
    echo.
    echo  [SETUP REQUIRED] No .env file found.
    echo.
    if exist ".env.example" (
        copy ".env.example" ".env" >nul
        echo  A template .env file has been created for you.
    ) else (
        echo  Creating a blank .env file...
        echo. > .env
    )
    echo.
    echo  ────────────────────────────────────────────────────────────────
    echo   ACTION NEEDED: Edit the .env file before continuing.
    echo.
    echo   Open .env in Notepad and fill in your internal AI details:
    echo     OPENAI_BASE_URL=http://YOUR-AI-SERVER-IP:PORT/v1
    echo     OPENAI_API_KEY=your-token
    echo     OPENAI_MODEL=your-model-name
    echo  ────────────────────────────────────────────────────────────────
    echo.
    echo  Press any key to open .env in Notepad now, then close Notepad,
    echo  and run this script again to start the server.
    echo.
    pause >nul
    start notepad ".env"
    exit /b 0
)

:: ── Load .env variables into environment ────────────────────────────────────
for /f "usebackq tokens=1,* delims==" %%a in (`findstr /v "^#" .env`) do (
    set "%%a=%%b"
)

:: ── Set production mode ──────────────────────────────────────────────────────
set NODE_ENV=production

:: ── Start the server ─────────────────────────────────────────────────────────
echo.
echo  Starting server...
echo  Open your browser and go to: http://localhost:%PORT%
if "%PORT%"=="" echo  Open your browser and go to: http://localhost:3000
echo.
echo  Press Ctrl+C to stop the server.
echo  ────────────────────────────────────────────────────────────────────────
echo.

node dist\server\index.js

:: ── If we get here the server exited ────────────────────────────────────────
echo.
echo  The server stopped. See any error messages above.
echo.
pause
