@echo off
title RentNest Server & Client Runner
echo ========================================================
echo        Starting RentNest (Full Stack Marketplace)
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/2] Launching Backend on http://localhost:5000...
start "RentNest Backend (Port 5000)" cmd /k "cd server && npm run dev"

timeout /t 3 /nobreak >nul

echo [2/2] Launching Frontend on http://localhost:3000...
start "RentNest Frontend (Port 3000)" cmd /k "cd client && npm run dev"

timeout /t 3 /nobreak >nul

echo.
echo Opening browser at http://localhost:3000 ...
start http://localhost:3000

echo.
echo ========================================================
echo  All services are running!
echo  Keep the two terminal windows open while testing.
echo ========================================================
pause

