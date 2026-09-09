import express from 'express';
import { auth as protect } from '../../middlewares/auth.js';
import { getOwnPricing, listOwnTenantTransactions } from '../../controllers/resellerAirtimeCashController.js';

const router = express.Router();

const requireReseller = (req, res, next) => {
    if (req.user.role !== 'reseller' && req.user.role !== 'reseller_admin') {
        return res.status(403).json({ status: 'error', message: 'Access denied' });
    }
    next();
};

router.get('/pricing', protect, requireReseller, getOwnPricing);
router.get('/transactions', protect, requireReseller, listOwnTenantTransactions);

export default router;
