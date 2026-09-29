@echo off
title Vishnu Institute of Technology - Vercel Deployment
color 0B
echo ===================================================================
echo   VISHNU INSTITUTE OF TECHNOLOGY - MITRA ATTENDANCE SYSTEM
echo   1-Click Vercel Cloud Deployment
echo ===================================================================
echo.
echo [1/3] Bundling production datasets and static assets...
node build.js
if %errorlevel% neq 0 (
    echo [ERROR] Build failed! Please check your Node installation.
    pause
    exit /b %errorlevel%
)
echo.
echo [2/3] Launching Vercel Deployment CLI...
echo.
echo NOTE: If this is your first time deploying:
echo   - If prompted to log in, select GitHub, Google, or Email in your browser.
echo   - Press Enter to accept the recommended default options.
echo.
npx vercel
echo.
echo ===================================================================
echo Would you like to deploy directly to PRODUCTION? (y/n)
set /p PROD_CHOICE="Enter choice [y/n]: "
if /i "%PROD_CHOICE%"=="y" (
    echo Deploying to production...
    npx vercel --prod
)
echo.
echo ===================================================================
echo Deployment complete! Your live URL is displayed above.
echo ===================================================================
pause
