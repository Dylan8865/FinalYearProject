@echo off
setlocal

cd /d "%~dp0frontend"

echo [Qubo Frontend] Working directory: %CD%
echo [Qubo Frontend] Starting Vite on http://localhost:3000
echo.

npm.cmd run dev

echo.
echo [Qubo Frontend] Server stopped or failed to start.
pause
