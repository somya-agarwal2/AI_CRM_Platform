$ErrorActionPreference = "Stop"

Write-Host "Starting Channel Service..."
Start-Process -NoNewWindow -FilePath "powershell.exe" -ArgumentList "-Command cd backend; .\venv\Scripts\activate; python ..\channel-service\app.py"

Write-Host "Starting Backend Service..."
Start-Process -NoNewWindow -FilePath "powershell.exe" -ArgumentList "-Command cd backend; .\venv\Scripts\activate; python app.py"

Write-Host "Starting Frontend Service..."
Start-Process -NoNewWindow -FilePath "powershell.exe" -ArgumentList "-Command cd frontend; npm run dev"

Write-Host "All services started."
# $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# Write-Host "Stopping Services..."
# taskkill /F /IM python.exe /T
# Write-Host "Done."
Wait-Event # Wait indefinitely so background processes don't get killed if the script exits
