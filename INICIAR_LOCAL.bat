@echo off
setlocal
cd /d "%~dp0"
where py >nul 2>nul
if %errorlevel%==0 (
  start "" "http://localhost:8080/"
  py -m http.server 8080
  exit /b
)
where python >nul 2>nul
if %errorlevel%==0 (
  start "" "http://localhost:8080/"
  python -m http.server 8080
  exit /b
)
echo.
echo Python nao foi encontrado.
echo Para testar localmente, use um servidor HTTP ou publique no GitHub Pages.
echo.
pause
