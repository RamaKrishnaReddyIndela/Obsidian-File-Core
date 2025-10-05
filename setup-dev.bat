@echo off
echo ================================================
echo     Obsidian File Core Development Setup
echo ================================================
echo.

echo Setting up backend dependencies...
cd forticrypt-backend
call npm install
echo.

echo Setting up Python ML dependencies...
call install-python-deps.bat
echo.

echo Setting up frontend dependencies...
cd ../forticrypt-frontend
call npm install
echo.

echo ================================================
echo           Setup Complete! 
echo ================================================
echo.
echo To run the project:
echo 1. Start MongoDB service
echo 2. Start Redis (optional)
echo 3. Backend: cd forticrypt-backend && npm run dev
echo 4. Frontend: cd forticrypt-frontend && npm start
echo.
echo Backend will run on: http://localhost:5000
echo Frontend will run on: http://localhost:3000
echo.
pause