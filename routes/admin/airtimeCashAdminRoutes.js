import express from 'express';
import { adminAuth } from '../../middlewares/adminAuth.js';
import {
    getConfig,
    updateConfig,
    listPricing,
    upsertPricing,
    deletePricing,
    listTransactions,
    getTransaction,
    resolveManualReview
} from '../../controllers/admin/airtimeCashAdminController.js';

const router = express.Router();

// Per the security requirement ("Only the main platform admin can: modify provider
// credentials, modify global pricing, modify tenant pricing, enable/disable
// networks, enable/disable the service"), reseller_admin is explicitly excluded here
// even though adminAuth itself allows it through -- same pattern as
// routes/gatewayConfigRoutes.js's requireSuperAdmin gate.
const requirePlatformAdmin = (req, res, next) => {
    if (req.user && ['admin', 'superadmin'].includes(req.user.role)) {
        return next();
    }
    return res.status(403).json({ status: 'error', message: 'Access Denied: Platform Admin Required.' });
};

router.use(adminAuth, requirePlatformAdmin);

router.get('/config', getConfig);
router.put('/config', updateConfig);

router.get('/pricing', listPricing);
router.put('/pricing', upsertPricing);
router.delete('/pricing/:id', deletePricing);

router.get('/transactions', listTransactions);
router.get('/transactions/:reference', getTransaction);
router.post('/transactions/:reference/resolve', resolveManualReview);

export default router;
