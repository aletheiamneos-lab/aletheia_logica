@echo off
setlocal
cd /d "%~dp0"

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$root = [System.IO.Path]::GetFullPath('%~dp0');" ^
  "$runtime = Join-Path $root '.app-runtime';" ^
  "$backendPidFile = Join-Path $runtime 'backend-prod.pid';" ^
  "$backendHealthUrl = 'http://127.0.0.1:8000/health';" ^
  "$appUrl = 'http://127.0.0.1:8000';" ^
  "New-Item -ItemType Directory -Force -Path $runtime | Out-Null;" ^
  "function Test-Url([string]$url) { try { $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 2; return ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) } catch { return $false } }" ^
  "function Wait-Url([string]$url, [int]$seconds, [string]$label) { $deadline = (Get-Date).AddSeconds($seconds); while((Get-Date) -lt $deadline) { if(Test-Url $url) { return $true }; Start-Sleep -Seconds 1 }; Write-Host ('[start-app-prod] ' + $label + ' nu a raspuns in intervalul asteptat.'); return $false }" ^
  "Write-Host '[start-app-prod] Construiesc build-ul frontend...'; Push-Location (Join-Path $root 'frontend'); if(-not (Test-Path 'node_modules')) { & npm.cmd install; if($LASTEXITCODE -ne 0) { Pop-Location; exit $LASTEXITCODE } }; & npm.cmd run build; $buildExitCode = $LASTEXITCODE; Pop-Location; if($buildExitCode -ne 0) { exit $buildExitCode }" ^
  "if(-not (Test-Url $backendHealthUrl)) { Write-Host '[start-app-prod] Pornesc backend-ul FastAPI care serveste build-ul frontend...'; $backendProcess = Start-Process -FilePath (Join-Path $root 'run-backend-prod.bat') -WorkingDirectory $root -PassThru; Set-Content -Path $backendPidFile -Value $backendProcess.Id; if(-not (Wait-Url $appUrl 140 'serverul FastAPI cu build-ul frontend')) { exit 1 } } else { Write-Host '[start-app-prod] Backend-ul ruleaza deja pe portul 8000.' }" ^
  "$lanIp = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254*' } | Select-Object -ExpandProperty IPAddress -First 1; if(-not $lanIp) { $lanIp = [System.Net.Dns]::GetHostAddresses([System.Net.Dns]::GetHostName()) | Where-Object { $_.AddressFamily -eq [System.Net.Sockets.AddressFamily]::InterNetwork -and $_.IPAddressToString -notlike '127.*' } | Select-Object -ExpandProperty IPAddressToString -First 1 };" ^
  "Write-Host ''; Write-Host 'Aplicatia rulata dintr-un singur server este disponibila pe calculator la:'; Write-Host ('  ' + $appUrl); if($lanIp) { Write-Host 'Pe telefon, in aceeasi retea Wi-Fi, deschide:'; Write-Host ('  http://' + $lanIp + ':8000') };" ^
  "Start-Process $appUrl"

exit /b %errorlevel%
