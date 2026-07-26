@echo off
setlocal
cd /d "%~dp0"

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$root = [System.IO.Path]::GetFullPath('%~dp0');" ^
  "$runtime = Join-Path $root '.app-runtime';" ^
  "$backendPidFile = Join-Path $runtime 'backend-dev.pid';" ^
  "$frontendPidFile = Join-Path $runtime 'frontend-dev.pid';" ^
  "$backendHealthUrl = 'http://127.0.0.1:8000/health';" ^
  "$frontendUrl = 'http://127.0.0.1:5173';" ^
  "New-Item -ItemType Directory -Force -Path $runtime | Out-Null;" ^
  "function Test-Url([string]$url) { try { $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 2; return ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) } catch { return $false } }" ^
  "function Wait-Url([string]$url, [int]$seconds, [string]$label) { $deadline = (Get-Date).AddSeconds($seconds); while((Get-Date) -lt $deadline) { if(Test-Url $url) { return $true }; Start-Sleep -Seconds 1 }; Write-Host ('[start-app] ' + $label + ' nu a raspuns in intervalul asteptat.'); return $false }" ^
  "function Clear-Port([int]$port, [string]$label) { $processIds = netstat -ano | Select-String (':'+$port+'\s+.*LISTENING\s+(\d+)$') | ForEach-Object { $_.Matches[0].Groups[1].Value } | Sort-Object -Unique; foreach($processId in $processIds) { Write-Host ('[start-app] Inchid proces blocat pentru ' + $label + ' pe portul ' + $port + ' (PID ' + $processId + ').'); & taskkill /PID $processId /T /F *> $null } }" ^
  "if(-not (Test-Url $backendHealthUrl)) { Clear-Port 8000 'backend'; Write-Host '[start-app] Pornesc backend-ul FastAPI...'; $backendProcess = Start-Process -FilePath (Join-Path $root 'run-backend.bat') -WorkingDirectory $root -PassThru; Set-Content -Path $backendPidFile -Value $backendProcess.Id; if(-not (Wait-Url $backendHealthUrl 140 'backend-ul FastAPI')) { exit 1 } } else { Write-Host '[start-app] Backend-ul ruleaza deja pe portul 8000.' }" ^
  "if(-not (Test-Url $frontendUrl)) { Clear-Port 5173 'frontend'; Write-Host '[start-app] Pornesc frontend-ul Vite...'; $frontendProcess = Start-Process -FilePath (Join-Path $root 'run-frontend.bat') -WorkingDirectory $root -PassThru; Set-Content -Path $frontendPidFile -Value $frontendProcess.Id; if(-not (Wait-Url $frontendUrl 140 'frontend-ul Vite')) { exit 1 } } else { Write-Host '[start-app] Frontend-ul ruleaza deja pe portul 5173.' }" ^
  "$lanIp = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254*' } | Select-Object -ExpandProperty IPAddress -First 1; if(-not $lanIp) { $lanIp = [System.Net.Dns]::GetHostAddresses([System.Net.Dns]::GetHostName()) | Where-Object { $_.AddressFamily -eq [System.Net.Sockets.AddressFamily]::InterNetwork -and $_.IPAddressToString -notlike '127.*' } | Select-Object -ExpandProperty IPAddressToString -First 1 };" ^
  "Write-Host ''; Write-Host 'Aplicatia este deschisa pe calculator la:'; Write-Host ('  ' + $frontendUrl); if($lanIp) { Write-Host 'Pe telefon, in aceeasi retea Wi-Fi, deschide:'; Write-Host ('  http://' + $lanIp + ':5173') }; Write-Host ''; Write-Host 'Daca telefonul nu se conecteaza, verifica firewall-ul Windows pentru porturile 5173 si 8000.';" ^
  "Start-Process $frontendUrl"

exit /b %errorlevel%
