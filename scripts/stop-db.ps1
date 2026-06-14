$ErrorActionPreference = "Stop"

$workspaceDir = "d:\ai_crm"
$pgDataDir = Join-Path $workspaceDir "pg_data"
$pgBinDir = "C:\Program Files\PostgreSQL\17\bin"
$pgCtl = Join-Path $pgBinDir "pg_ctl.exe"

if (Test-Path $pgDataDir) {
    Write-Host "Stopping PostgreSQL server..."
    & $pgCtl -D $pgDataDir stop
} else {
    Write-Host "Database directory not found. Is it running?"
}
