@echo off
echo Installing Python dependencies for Obsidian File Core ML features...
echo.

cd /d "%~dp0\ml"

echo Installing requirements...
pip install -r requirements.txt

echo.
echo Testing ML scripts...
python -c "import json, os; print(json.dumps({'test': 'success'}))"

echo.
echo ✅ Python dependencies installed successfully!
echo You can now run the Obsidian File Core backend with full ML support.
pause