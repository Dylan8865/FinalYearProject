@echo off
setlocal

cd /d "%~dp0backend"

echo [Qubo Backend] Working directory: %CD%
echo [Qubo Backend] Starting FastAPI on http://127.0.0.1:8002
echo.

"%~dp0..\.venv\Scripts\python.exe" -m uvicorn app.main:app --host 127.0.0.1 --port 8002 --reload

echo.
echo [Qubo Backend] Server stopped or failed to start.
pause
