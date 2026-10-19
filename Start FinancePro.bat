@echo off
title FinancePro
rem Starts alphalist-api (port 8791) if it is not running, then FinancePro (http://localhost:5173).
rem Close the two windows to stop them.
cd /d "%~dp0"

rem alphalist-api sits next to this folder (DAT\AccountingSystem + DAT\alphalist-api), or one level up.
set "API=%~dp0..\alphalist-api"
if not exist "%API%\Start Alphalist API.bat" set "API=%~dp0..\..\alphalist-api"
netstat -ano | findstr /R /C:":8791 .*LISTENING" >nul
if errorlevel 1 (
  if exist "%API%\Start Alphalist API.bat" (
    echo Starting Alphalist API...
    start "Alphalist API" /min cmd /c ""%API%\Start Alphalist API.bat""
  ) else (
    echo Alphalist API not found at %API%
  )
) else (
  echo Alphalist API is already running.
)

if not exist node_modules call npm install
start "" cmd /c "timeout /t 4 /nobreak >nul & start http://localhost:5173"
call npm run dev
