@echo off
setlocal

cd /d "%~dp0"

set "PYTHON_EXE=..\.venv\Scripts\python.exe"

if not exist "%PYTHON_EXE%" (
  echo [Qubo] Python virtual environment not found at %PYTHON_EXE%
  echo [Qubo] Create it from the project root or update this script.
  exit /b 1
)

if not exist "frontend\node_modules" (
  echo [Qubo] Frontend dependencies are missing.
  echo [Qubo] Run: cd frontend ^&^& npm.cmd install
  exit /b 1
)

echo [Qubo] Starting backend on http://127.0.0.1:8001
start "Qubo Backend" "%~dp0start-backend.bat"

echo [Qubo] Starting frontend on http://localhost:3000
start "Qubo Frontend" "%~dp0start-frontend.bat"

echo.
echo [Qubo] Both dev servers are starting in separate terminal windows.
echo [Qubo] Wait until both windows say they are running, then open:
echo [Qubo]   http://localhost:3000
echo.
echo [Qubo] Backend health check:
echo [Qubo]   http://127.0.0.1:8001/health
