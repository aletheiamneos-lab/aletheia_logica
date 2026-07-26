@echo off
setlocal
cd /d "%~dp0\frontend"

set "FRONTEND_HOST=0.0.0.0"
set "FRONTEND_PORT=5173"
set "FRONTEND_URL=http://127.0.0.1:%FRONTEND_PORT%"

powershell -NoProfile -ExecutionPolicy Bypass -Command "try { $response = Invoke-WebRequest -Uri 'http://127.0.0.1:%FRONTEND_PORT%' -UseBasicParsing -TimeoutSec 2; if($response.StatusCode -eq 200){ exit 0 } } catch {}; exit 1"
if not errorlevel 1 (
  echo [frontend] Serverul Vite ruleaza deja pe %FRONTEND_URL%
  start "" "%FRONTEND_URL%"
  goto :end
)

echo [frontend] Verific dependentele Node...
if not exist "node_modules" (
  call npm.cmd install
  if errorlevel 1 goto :error
)

echo [frontend] Pornesc Vite pe http://0.0.0.0:%FRONTEND_PORT%
call npm.cmd run dev -- --host %FRONTEND_HOST% --port %FRONTEND_PORT% --strictPort --open /
goto :end

:error
echo.
echo Pornirea frontend-ului a esuat.
exit /b 1

:end
endlocal
exit /b 0
