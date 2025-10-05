@echo off
echo Starting Obsidian File Core Development Environment...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python from https://python.org
    pause
    exit /b 1
)

echo [✓] Node.js and Python are installed
echo.

REM Install dependencies if not present
if not exist "forticrypt-backend\node_modules" (
    echo [INFO] Installing backend dependencies...
    cd forticrypt-backend
    npm install
    cd ..
    echo.
)

if not exist "forticrypt-frontend\node_modules" (
    echo [INFO] Installing frontend dependencies...
    cd forticrypt-frontend
    npm install
    cd ..
    echo.
)

echo [INFO] Starting MongoDB (make sure it's installed and configured)
echo [INFO] Starting development servers...
echo.

REM Start backend in a new window
start "Obsidian File Core Backend" cmd /k "cd forticrypt-backend && echo Starting backend server... && npm run dev"

REM Wait a few seconds for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend in a new window
start "Obsidian File Core Frontend" cmd /k "cd forticrypt-frontend && echo Starting frontend server... && npm start"

echo.
echo [✓] Obsidian File Core is starting up!
echo.
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:5000
echo.
echo Press any key to close this window...
pause >nul