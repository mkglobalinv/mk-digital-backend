import express from 'express';
import { adminAuth } from '../middlewares/adminAuth.js';
import { 
    getSystemHealth, 
    getLogs, 
    createLog, 
    getDeployments, 
    getDiagnostics,
    getMonitoring,
    toggleMaintenanceMode,
    toggleProvider,
    triggerRollback
} from '../controllers/managementController.js';

import { triggerManualBackup, getAvailableBackups } from '../controllers/adminController.js';


const router = express.Router();

// Apply admin authentication to all management routes
router.use(adminAuth);

router.get('/health', getSystemHealth);
router.get('/logs', getLogs);
router.post('/logs', createLog);
router.get('/deployments', getDeployments);
router.get('/diagnostics', getDiagnostics);

router.get('/monitoring', getMonitoring);
router.post('/emergency/maintenance', toggleMaintenanceMode);
router.post('/emergency/provider', toggleProvider);
router.post('/emergency/rollback', triggerRollback);

// Manual Snapshots
router.post('/snapshots/create', triggerManualBackup);
router.get('/snapshots', getAvailableBackups);


export default router;
