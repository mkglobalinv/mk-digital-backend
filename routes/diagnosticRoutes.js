import express from 'express';
import { adminAuth } from '../middlewares/adminAuth.js';
import { runDiagnosticScan, getDiagnosticReports } from '../services/diagnosticEngine.js';

const router = express.Router();

router.use(adminAuth);

router.post('/scan', async (req, res) => {
    try {
        const result = await runDiagnosticScan();
        res.json(result);
    } catch (err) {
        res.status(500).json({ success: false, message: 'Scan failed' });
    }
});

router.get('/reports', async (req, res) => {
    try {
        const reports = await getDiagnosticReports();
        res.json({ success: true, data: reports });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch reports' });
    }
});

export default router;
