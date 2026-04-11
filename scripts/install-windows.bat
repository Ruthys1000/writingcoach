@echo off
setlocal
title WritingCoach - Build for Deployment

echo.
echo  ════════════════════════════════════════════════════
echo   WritingCoach - Build Script (Internet Machine)
echo  ════════════════════════════════════════════════════
echo.
echo  This builds the app so it is ready to copy to your
echo  air-gapped server. Run this ONCE on the machine that
echo  has internet access.
echo.

cd /d "%~dp0.."

:: ── Check Node.js ────────────────────────────────────────────────────────────
where node >nul 2>&1
if errorlevel 1 (
    echo  [ERROR] Node.js not found. Install Node.js 20 LTS from nodejs.org first.
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('node --version') do set NODE_VER=%%v
echo  Node.js: %NODE_VER%
echo.

:: ── Install server dependencies ───────────────────────────────────────────────
echo  [1/4] Installing server dependencies...
call npm install
if errorlevel 1 ( echo  [ERROR] npm install failed. & pause & exit /b 1 )
echo  Done.
echo.

:: ── Install client dependencies ───────────────────────────────────────────────
echo  [2/4] Installing client dependencies...
cd client
call npm install
if errorlevel 1 ( echo  [ERROR] client npm install failed. & cd .. & pause & exit /b 1 )
cd ..
echo  Done.
echo.

:: ── Build React frontend ──────────────────────────────────────────────────────
echo  [3/4] Building React frontend...
cd client
call npm run build
if errorlevel 1 ( echo  [ERROR] client build failed. & cd .. & pause & exit /b 1 )
cd ..
echo  Done.
echo.

:: ── Compile TypeScript server ─────────────────────────────────────────────────
echo  [4/4] Compiling server TypeScript...
call npx tsc
if errorlevel 1 ( echo  [ERROR] TypeScript compilation failed. & pause & exit /b 1 )
echo  Done.
echo.

:: ── Optional: download Node.js installer ────────────────────────────────────
echo  Would you also like to download the Node.js installer to include on the USB?
echo  (Useful if the server does not have Node.js installed yet)
echo.
set /p GETNODEJS=  Type Y and press Enter, or just press Enter to skip:
if /i "%GETNODEJS%"=="Y" (
    call scripts\get-nodejs.bat
)

echo.
echo  ════════════════════════════════════════════════════
echo   Build complete!
echo  ════════════════════════════════════════════════════
echo.
echo  Copy the entire writingcoach folder to your USB drive.
echo.
echo  On the air-gapped server:
echo    1. Install node-v20-x64.msi  (if Node.js not already installed)
echo    2. Edit .env.example, fill in your AI server details, save as .env
echo    3. Double-click start.bat
echo.
pause
