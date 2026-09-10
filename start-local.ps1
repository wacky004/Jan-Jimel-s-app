# Starts the Jan & Jimels local development servers:
#   - Django API   -> http://localhost:8000
#   - React (Vite) -> http://localhost:5173  (admin: /admin/login)
# Usage: right-click -> Run with PowerShell, or run start-local.bat

$root = $PSScriptRoot

Write-Host ""
Write-Host "Jan & Jimels Party Needs - starting local servers..." -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path "$root\backend\.venv\Scripts\python.exe")) {
    Write-Host "ERROR: backend virtual environment not found." -ForegroundColor Red
    Write-Host "Run this once: cd backend; python -m venv .venv; .\.venv\Scripts\pip.exe install -r requirements.txt"
    exit 1
}

Write-Host "Starting Django API on port 8000..."
Start-Process -FilePath "$root\backend\.venv\Scripts\python.exe" `
    -ArgumentList "manage.py", "runserver", "8000", "--noreload" `
    -WorkingDirectory "$root\backend" -WindowStyle Minimized

Write-Host "Starting Vite dev server on port 5173..."
Start-Process -FilePath "node" `
    -ArgumentList "node_modules\vite\bin\vite.js" `
    -WorkingDirectory "$root\frontend" -WindowStyle Minimized

Write-Host "Waiting for servers to boot..."
Start-Sleep -Seconds 7

$backendOk = $false
$frontendOk = $false
try { Invoke-WebRequest -Uri "http://localhost:8000/api/items/" -UseBasicParsing -TimeoutSec 5 | Out-Null; $backendOk = $true } catch {}
try { Invoke-WebRequest -Uri "http://localhost:5173/" -UseBasicParsing -TimeoutSec 5 | Out-Null; $frontendOk = $true } catch {}

Write-Host ""
if ($backendOk) { Write-Host "  [OK] Backend  (API)      http://localhost:8000" -ForegroundColor Green }
else { Write-Host "  [..] Backend still starting - wait a few seconds, then refresh" -ForegroundColor Yellow }

if ($frontendOk) { Write-Host "  [OK] Frontend (website)  http://localhost:5173" -ForegroundColor Green }
else { Write-Host "  [..] Frontend still starting - wait a few seconds, then refresh" -ForegroundColor Yellow }

Write-Host ""
Write-Host "  Website:  http://localhost:5173" -ForegroundColor White
Write-Host "  Admin:    http://localhost:5173/admin/login" -ForegroundColor White
Write-Host "  Login:    superadmin / janjimels2026" -ForegroundColor White
Write-Host ""
Write-Host "Servers run in minimized windows. Close those windows to stop them." -ForegroundColor DarkGray
