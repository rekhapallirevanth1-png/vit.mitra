@echo off
title Push with GitHub Token - Vishnu Institute of Technology MITRA
color 0B
set "PATH=C:\Users\91995\.gemini\antigravity\scratch\mingit\cmd;%PATH%"

echo ===================================================================
echo   PUSH WITH GITHUB TOKEN TO: rekhapallirevanth1-png/vit.mitra
echo ===================================================================
echo.
echo Please paste your GitHub Personal Access Token (starts with ghp_ or github_pat_):
set /p GH_TOKEN="GitHub Token: "

if "%GH_TOKEN%"=="" (
    echo Error: Token cannot be empty.
    pause
    exit /b 1
)

echo.
echo Pushing to https://github.com/rekhapallirevanth1-png/vit.mitra.git ...
git push https://rekhapallirevanth1-png:%GH_TOKEN%@github.com/rekhapallirevanth1-png/vit.mitra.git main
if %errorlevel% equ 0 (
    echo.
    echo ===================================================================
    echo SUCCESS! Repository successfully updated at:
    echo https://github.com/rekhapallirevanth1-png/vit.mitra
    echo ===================================================================
) else (
    echo.
    echo Push failed. Please check that your token has 'repo' permissions.
)
pause
