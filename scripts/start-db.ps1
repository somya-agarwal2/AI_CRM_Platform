$ErrorActionPreference = "Stop"

$workspaceDir = "d:\ai_crm"
$pgDataDir = Join-Path $workspaceDir "pg_data"
$pgBinDir = "C:\Program Files\PostgreSQL\17\bin"
$initDb = Join-Path $pgBinDir "initdb.exe"
$pgCtl = Join-Path $pgBinDir "pg_ctl.exe"
$logFile = Join-Path $workspaceDir "pg_data\server.log"

if (-not (Test-Path $pgDataDir)) {
    Write-Host "Initializing PostgreSQL database cluster in $pgDataDir..."
    & $initDb -D $pgDataDir -U postgres --no-locale
}

Write-Host "Starting PostgreSQL server..."
& $pgCtl -D $pgDataDir -l $logFile start

Write-Host "Waiting for database to start..."
Start-Sleep -Seconds 2
Write-Host "PostgreSQL should now be running on port 5432."
