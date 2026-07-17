const fs = require('fs');

const file = 'routes/adminRoutes.js';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('requireOwner')) {
    content = content.replace('import { adminAuth } from "../middlewares/adminAuth.js";', 'import { adminAuth } from "../middlewares/adminAuth.js";\nimport { requireOwner } from "../middlewares/requireOwner.js";');
}

// Replace exact routes with requireOwner wrapped versions
const routesToProtect = [
    "router.get(\"/system-settings\", getSystemSettings);",
    "router.post(\"/system-settings\", updateSystemSettings);",
    "router.get(\"/app-requests\", getAppRequests);",
    "router.post(\"/app-requests/:id/status\", updateAppRequestStatus);",
    "router.get(\"/domain-requests\", getDomainRequests);",
    "router.post(\"/domain-requests/:id/status\", updateDomainRequestStatus);",
    "router.post(\"/app-requests/:id/upload/apk\", uploadBuildMemory.single('file'), uploadApk);",
    "router.post(\"/app-requests/:id/upload/aab\", uploadBuildMemory.single('file'), uploadAab);",
    "router.get(\"/telemetry\", getTelemetry);",
    "router.post(\"/resellers/:id/app-rebuild\", forceRebuildApp);",
    "router.post(\"/resellers/:id/app-sync\", forceSyncReseller);",
    "router.post(\"/app-requests/:id/generate-assets\", generateAppAssetsForRequest);",
    "router.get(\"/app-requests/:id/download-assets\", downloadAssetsZip);",
    "router.post(\"/backups/create\", triggerManualBackup);",
    "router.post(\"/backups/restore\", restoreBackupFromFile);",
    "router.get(\"/backups\", getAvailableBackups);",
    "router.get(\"/operations/reconciliation-reports\", getReconciliationReports);",
    "router.post(\"/operations/reconciliation-manual\", triggerManualReconciliation);",
    "router.get(\"/operations/logs\", getSystemLogs);",
    "router.get(\"/operations/stats\", getOperationsStats);",
    "router.get(\"/operations/reconciliation-dry-run\", getReconciliationDryRun);",
    "router.post(\"/operations/reconciliation-repair\", executeReconciliationRepair);",
    "router.post(\"/operations/test-backup\", executeBackupDiagnosticTest);",
    "router.post(\"/operations/test-restore\", executeRestoreDiagnosticTest);",
    "router.post(\"/operations/test-email\", executeEmailDiagnosticTest);",
    "router.get(\"/monitoring-stats\", getMonitoringStats);",
    "router.get(\"/providers\", getProviders);",
    "router.put(\"/providers/:id\", updateProviderStatus);"
];

routesToProtect.forEach(route => {
    // Escape string for regex, handle spacing gracefully
    // Just simple string replace
    const protectedRoute = route.replace(', ', ', requireOwner, ');
    if (content.includes(route)) {
        content = content.replace(route, protectedRoute);
    }
});

fs.writeFileSync(file, content, 'utf8');
console.log('adminRoutes.js successfully patched with requireOwner');
