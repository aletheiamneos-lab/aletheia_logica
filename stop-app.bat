@echo off
setlocal
cd /d "%~dp0"

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$root = [System.IO.Path]::GetFullPath('%~dp0');" ^
  "$runtime = Join-Path $root '.app-runtime';" ^
  "$pidFiles = @('frontend-dev.pid', 'backend-dev.pid', 'backend-prod.pid');" ^
  "foreach($name in $pidFiles) { $file = Join-Path $runtime $name; if(Test-Path $file) { $processId = (Get-Content $file -ErrorAction SilentlyContinue | Select-Object -First 1); if($processId) { Write-Host ('[stop-app] Opreasc PID ' + $processId + ' din ' + $name + '...'); & taskkill /PID $processId /T /F *> $null }; Remove-Item $file -Force -ErrorAction SilentlyContinue } };" ^
  "foreach($port in 5173, 8000) { $processIds = netstat -ano | Select-String (':'+$port+'\s+.*LISTENING\s+(\d+)$') | ForEach-Object { $_.Matches[0].Groups[1].Value } | Sort-Object -Unique; foreach($processId in $processIds) { Write-Host ('[stop-app] Eliberez portul ' + $port + ' (PID ' + $processId + ')...'); & taskkill /PID $processId /T /F *> $null } };" ^
  "Write-Host '[stop-app] Aplicatia a fost oprita.'"

exit /b %errorlevel%
