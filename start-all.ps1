# Caly Startup Script
# Run from project root: powershell -ExecutionPolicy Bypass -File start-all.ps1

$root = $PSScriptRoot

Write-Host "Starting Caly services..." -ForegroundColor Green

# Terminal 1 — Django
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\Backend'; python manage.py runserver"

Start-Sleep -Seconds 3

# Terminal 2 — Celery worker (--pool=solo required on Windows to avoid PermissionError)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\Backend'; celery -A core worker --loglevel=info --pool=solo"

Start-Sleep -Seconds 2

# Terminal 3 — Celery beat
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\Backend'; celery -A core beat --loglevel=info"

Start-Sleep -Seconds 2

# Terminal 4 — Frontend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\Frontend'; npm run dev"
