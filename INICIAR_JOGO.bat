@echo off
setlocal
cd /d "%~dp0"
title Pixel Frontier - Inicializador

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo ======================================================
  echo  PIXEL FRONTIER - NODE.JS NAO ENCONTRADO
  echo ======================================================
  echo.
  echo Para iniciar o jogo com dois cliques, instale o Node.js LTS.
  echo Depois volte aqui e clique novamente em INICIAR_JOGO.bat.
  echo.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo.
  echo Primeira execucao: preparando o jogo automaticamente...
  echo Isso acontece apenas uma vez.
  echo.
  call npm install --legacy-peer-deps --no-audit --no-fund
  if errorlevel 1 (
    echo.
    echo Nao foi possivel instalar as dependencias.
    echo Verifique sua conexao com a internet e tente novamente.
    echo.
    pause
    exit /b 1
  )
)

echo.
echo Iniciando Pixel Frontier...
start "Pixel Frontier Server" /min cmd /c "cd /d "%~dp0" && npm run dev -- --host 127.0.0.1 --port 5173 --strictPort"

timeout /t 4 /nobreak >nul
start "" "http://127.0.0.1:5173"

exit /b 0
