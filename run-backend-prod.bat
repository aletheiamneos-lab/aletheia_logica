@echo off
setlocal
cd /d "%~dp0"

set "BACKEND_HOST=0.0.0.0"
set "BACKEND_PORT=8000"

call :check_backend
if not errorlevel 1 (
  echo [backend-prod] Serverul ruleaza deja pe http://localhost:%BACKEND_PORT%
  goto :end
)

echo [backend-prod] Pregatesc mediul Python...
if not exist ".venv\Scripts\python.exe" (
  py -m venv .venv
  if errorlevel 1 goto :error
)

if not exist ".venv\logica-backend-deps-ready.stamp" (
  echo [backend-prod] Instalez dependentele necesare...
  ".venv\Scripts\python.exe" -m pip install -r backend\requirements.txt
  if errorlevel 1 goto :error
  type nul > ".venv\logica-backend-deps-ready.stamp"
) else (
  echo [backend-prod] Dependentele Python sunt deja pregatite.
)

echo [backend-prod] Initializare baza de date...
".venv\Scripts\python.exe" backend\init_db.py
if errorlevel 1 goto :error

echo [backend-prod] Pornesc FastAPI + build-ul frontend pe http://0.0.0.0:%BACKEND_PORT%
pushd backend
"..\.venv\Scripts\python.exe" -m uvicorn app:app --host %BACKEND_HOST% --port %BACKEND_PORT%
popd
goto :end

:error
echo.
echo Pornirea backend-ului de productie a esuat.
exit /b 1

:end
endlocal
exit /b 0

:check_backend
powershell -NoProfile -ExecutionPolicy Bypass -Command "try { $response = Invoke-WebRequest -Uri 'http://127.0.0.1:%BACKEND_PORT%/health' -UseBasicParsing -TimeoutSec 2; if($response.StatusCode -eq 200){ exit 0 } } catch {}; exit 1"
exit /b %errorlevel%
