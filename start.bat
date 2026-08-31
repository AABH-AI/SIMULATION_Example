@echo off
REM Launch the BTC Adjustment Simulator (React) dev server + open the browser.
REM Double-click this file, or run it from a terminal. Ctrl+C in this window stops the server.

cd /d "%~dp0"

if not exist "node_modules" (
  echo Installing dependencies ^(first run only^)...
  call npm install
)

REM Open the browser ~3s later, once Vite is listening (server runs in THIS window).
start "" cmd /c "timeout /t 3 >nul & start "" http://localhost:5173/"

echo Starting dev server on http://localhost:5173/  ^(Ctrl+C to stop^)
npm run dev
