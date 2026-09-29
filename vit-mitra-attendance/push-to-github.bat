@echo off
title Push to GitHub - Vishnu Institute of Technology MITRA
color 0A
set "PATH=C:\Users\91995\.gemini\antigravity\scratch\mingit\cmd;%PATH%"

echo ===================================================================
echo   PUSHING TO GITHUB: https://github.com/rekhapallirevanth1-png/vit.mitra
echo ===================================================================
echo.
echo Checking Git status...
git --version
git remote remove origin 2>nul
git remote add origin https://github.com/rekhapallirevanth1-png/vit.mitra.git
git branch -M main

echo.
echo Ready to push all 52 committed project files to GitHub!
echo.
echo GitHub Authentication Notice:
echo - Username: rekhapallirevanth1-png
echo - Password: Enter your GitHub Personal Access Token (classic or fine-grained)
echo   (If you do not have one yet, generate one at https://github.com/settings/tokens)
echo.
git push -u origin main
echo.
echo ===================================================================
if %errorlevel% equ 0 (
    echo SUCCESS! Repository pushed to:
    echo https://github.com/rekhapallirevanth1-png/vit.mitra
) else (
    echo.
    echo If authentication failed, you can run:
    echo   git push https://YOUR_TOKEN@github.com/rekhapallirevanth1-png/vit.mitra.git main
)
echo ===================================================================
pause
