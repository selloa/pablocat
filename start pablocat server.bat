@echo off
setlocal EnableExtensions

REM Starts a local static webserver and opens the site in your browser.
REM Usage: double-click this file (or run it from a terminal).

set "PORT=8000"
set "DIR=%~dp0"
set "URL=http://localhost:%PORT%/"

cd /d "%DIR%"

echo Starting local server at %URL%

REM Open the site once (browser will retry if the server isn't ready yet).
start "" "%URL%"

REM Prefer 'py' launcher if available; otherwise fall back to 'python'.
where py >nul 2>&1
if %ERRORLEVEL%==0 (
  py -3 -m http.server %PORT%
) else (
  where python >nul 2>&1
  if %ERRORLEVEL%==0 (
    python -m http.server %PORT%
  ) else (
    echo.
    echo Python 3 is required to run this server.
    echo Install Python from https://www.python.org/ and try again.
    exit /b 1
  )
)

