@echo off
title Vishnu Institute of Technology - MITRA Attendance Live Server
cls
echo =======================================================================
echo   Vishnu Institute of Technology - MITRA Attendance Portal
echo =======================================================================
echo.
echo Starting Live Server on port 3000...
echo.

:: Open default browser to the app after 1 second
start "" cmd /c "timeout /t 1 /nobreak >nul & start http://localhost:3000"

:: Start the Node.js server
node server.js

pause
