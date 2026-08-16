@echo off
echo Stopping all running Qubo Backend (Python) processes...
taskkill /F /IM python.exe /T
echo Done! Now run start-dev.bat again.
pause
