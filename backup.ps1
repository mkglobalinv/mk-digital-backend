$backupDir = "C:\Users\userpc\Backups\V1.0.6_Stable_Working_Restore"
New-Item -ItemType Directory -Force -Path $backupDir

Write-Host "Backing up mk-digital-backend (excluding node_modules and .git)..."
robocopy "C:\Users\userpc\mk-digital-backend" "$backupDir\mk-digital-backend" /MIR /XD "node_modules" ".git"

Write-Host "Backing up mk-management-frontend (excluding node_modules and .git)..."
robocopy "C:\Users\userpc\mk-management-frontend" "$backupDir\mk-management-frontend" /MIR /XD "node_modules" ".git"

Write-Host "Dumping MongoDB vtuapp..."
mongodump --db vtuapp --out "$backupDir\database_dump"

$description = @"
Version name: V1.0.6 - Stable Working Restore

Description:
- Retail portal working
- Reseller portal working
- Admin portal working
- Login system working
- Authentication working
- Current production state verified

This snapshot should become a rollback point so that if future updates break the system, I can immediately revert back to this exact state.
"@
Set-Content -Path "$backupDir\Snapshot_Info.txt" -Value $description

Write-Host "Compressing to ZIP file..."
Compress-Archive -Path "$backupDir\*" -DestinationPath "C:\Users\userpc\Backups\V1.0.6_Stable_Working_Restore.zip" -Force

Write-Host "Backup completed successfully!"
