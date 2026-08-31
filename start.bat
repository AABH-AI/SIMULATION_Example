@echo off
REM Launch the BTC Adjustment Simulator (React) + open the browser.
REM Double-click this file, or run it from a terminal. Ctrl+C in this window stops the server.
REM
REM NOTE: `npm run dev` (Vite dev server) is broken because this folder path
REM contains a "#" character (D:\Repos\#Git\...), which Vite's dependency
REM scanner rejects with "Access is denied". So this script does a production
REM build and serves it with `vite preview` instead. No hot reload: re-run this
REM script (or press R in this window is NOT available) after code changes.

cd /d "%~dp0"

if not exist "node_modules" (
  echo Installing dependencies ^(first run only^)...
  call npm install
)

echo Building...
call npm run build
if errorlevel 1 (
  echo Build failed. See errors above.
  pause
  exit /b 1
)

REM Open the browser ~3s later, once the preview server is listening.
start "" cmd /c "timeout /t 3 >nul & start "" http://localhost:5173/"

echo Serving production build on http://localhost:5173/  ^(Ctrl+C to stop^)
call npm run preview -- --port 5173
