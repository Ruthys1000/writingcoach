@echo off
setlocal
title Download Node.js Installer

echo.
echo  ════════════════════════════════════════════════════
echo   Download Node.js 20 LTS for the air-gapped server
echo  ════════════════════════════════════════════════════
echo.
echo  This will download the Node.js 20 LTS Windows installer
echo  into the project root folder so you can copy it to the
echo  server on a USB drive.
echo.
echo  Requires internet access — run this on your internet-
echo  connected machine BEFORE copying files to USB.
echo.

set DEST=..\node-v20-x64.msi
set URL=https://nodejs.org/dist/v20.19.1/node-v20.19.1-x64.msi

if exist "%DEST%" (
    echo  node-v20-x64.msi already exists — skipping download.
    goto done
)

:: Try curl first (built into Windows 10+)
where curl >nul 2>&1
if not errorlevel 1 (
    echo  Downloading with curl...
    curl -L --progress-bar -o "%DEST%" "%URL%"
    if not errorlevel 1 goto done
    echo  curl failed, trying PowerShell...
)

:: Fallback: PowerShell
echo  Downloading with PowerShell...
powershell -Command "& { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; (New-Object Net.WebClient).DownloadFile('%URL%', '%DEST%') }"

:done
if exist "%DEST%" (
    echo.
    echo  ✓ Done! File saved to:
    echo    node-v20-x64.msi  (in the writingcoach folder)
    echo.
    echo  Copy the entire writingcoach folder to your USB drive.
    echo  On the server, double-click node-v20-x64.msi to install Node.js,
    echo  then double-click start.bat to run the app.
) else (
    echo.
    echo  [ERROR] Download failed. Check your internet connection and try again.
)

echo.
pause
