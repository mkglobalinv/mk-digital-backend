const fs = require('fs');
const file = 'routes/adminRoutes.js';
let content = fs.readFileSync(file, 'utf8');

const missingRoutes = `
// --- SUPER ADMIN CONTROL CENTER ROUTES (Owner Only) ---
// Operations & Telemetry
router.get("/system-settings", requireOwner, getSystemSettings);
router.post("/system-settings", requireOwner, updateSystemSettings);
router.get("/telemetry", requireOwner, getTelemetry);
router.get("/app-requests", requireOwner, getAppRequests);
router.post("/app-requests/:id/status", requireOwner, updateAppRequestStatus);
router.get("/domain-requests", requireOwner, getDomainRequests);
router.post("/domain-requests/:id/status", requireOwner, updateDomainRequestStatus);
router.post("/app-requests/:id/upload/apk", requireOwner, uploadBuildMemory.single('file'), uploadApk);
router.post("/app-requests/:id/upload/aab", requireOwner, uploadBuildMemory.single('file'), uploadAab);
router.post("/app-requests/:id/generate-assets", requireOwner, generateAppAssetsForRequest);
router.get("/app-requests/:id/download-assets", requireOwner, downloadAssetsZip);

router.post("/resellers/:id/app-rebuild", requireOwner, forceRebuildApp);
router.post("/resellers/:id/app-sync", requireOwner, forceSyncReseller);

// Backups & Snapshots
router.get("/backups", requireOwner, getAvailableBackups);
router.post("/backups/create", requireOwner, triggerManualBackup);
router.post("/backups/restore", requireOwner, restoreBackupFromFile);

// Infrastructure Operations
router.get("/operations/reconciliation-reports", requireOwner, getReconciliationReports);
router.post("/operations/reconciliation-manual", requireOwner, triggerManualReconciliation);
router.get("/operations/logs", requireOwner, getSystemLogs);
router.get("/operations/stats", requireOwner, getOperationsStats);
router.get("/operations/reconciliation-dry-run", requireOwner, getReconciliationDryRun);
router.post("/operations/reconciliation-repair", requireOwner, executeReconciliationRepair);
router.post("/operations/test-backup", requireOwner, executeBackupDiagnosticTest);
router.post("/operations/test-restore", requireOwner, executeRestoreDiagnosticTest);
router.post("/operations/test-email", requireOwner, executeEmailDiagnosticTest);

export default router;
`;

if (!content.includes('getSystemSettings')) {
    content = content.replace('export default router;', missingRoutes);
}

fs.writeFileSync(file, content, 'utf8');
console.log('Restored super admin endpoints into adminRoutes.js');
