@echo off
echo Starting LifeX Rednote Dashboard...
echo.
echo Trying port 3000...
set PORT=3000
node server.js 2>nul
if errorlevel 1 (
    echo Port 3000 is in use, trying port 3001...
    set PORT=3001
    node server.js
) else (
    echo Server started on port 3000
)