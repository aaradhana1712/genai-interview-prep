@echo off
title GenAI Project Launcher
color 0B
cd /d "%~dp0"

echo ======================================================================
echo           ⚡ PrepAI - Auto-Setup and Launch Script ⚡
echo ======================================================================
echo.

:: 1. Auto-check and setup Backend .env
echo [1/5] Checking Backend Environment Configuration...
if not exist "Backend\.env" (
    echo   [!] Backend\.env not found. Creating from template...
    if exist "Backend\.env.example" (
        copy "Backend\.env.example" "Backend\.env" >nul
    ) else (
        (
            echo PORT=3000
            echo JWT_SECRET=supersecretjwtkey_123456
        ) > "Backend\.env"
    )
    echo   [+] Backend\.env ready!
) else (
    echo   [+] Backend\.env verified.
)

:: 2. Ensure Backend data directory exists for SQLite
if not exist "Backend\data" (
    mkdir "Backend\data" 2>nul
)

:: 3. Check and install Backend dependencies if missing
echo.
echo [2/5] Checking Backend Dependencies...
if not exist "Backend\node_modules\" (
    echo   [!] Backend dependencies missing. Installing packages (npm install)...
    cd Backend
    call npm install
    cd ..
    echo   [+] Backend dependencies installed!
) else (
    echo   [+] Backend dependencies ready.
)

:: 4. Check and install Frontend dependencies if missing
echo.
echo [3/5] Checking Frontend Dependencies...
if not exist "Frontend\node_modules\" (
    echo   [!] Frontend dependencies missing. Installing packages (npm install)...
    cd Frontend
    call npm install
    cd ..
    echo   [+] Frontend dependencies installed!
) else (
    echo   [+] Frontend dependencies ready.
)

:: 5. Launch Backend Server in its own window
echo.
echo [4/5] Launching Backend Server on Port 3000...
start "Backend Server (Port 3000)" cmd /k "cd /d ""%~dp0Backend"" && npm run dev"

:: Small pause to allow backend port to bind
timeout /t 3 /nobreak >nul

:: 6. Launch Frontend Server in its own window
echo [5/5] Launching Frontend Server on Port 5173...
start "Frontend Server (Port 5173)" cmd /k "cd /d ""%~dp0Frontend"" && npm run dev"

:: Small pause before opening browser
timeout /t 2 /nobreak >nul

:: 7. Auto-open application in the default web browser
echo.
echo ======================================================================
echo  [SUCCESS] All services started! Opening http://localhost:5173 ...
echo ======================================================================
start http://localhost:5173

echo.
echo You can keep this window open or close it. The servers are running in
echo their respective windows.
echo.
pause
