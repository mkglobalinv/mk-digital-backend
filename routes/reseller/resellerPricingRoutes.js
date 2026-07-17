import express from 'express';
import { auth as protect } from '../../middlewares/auth.js';
import { getResellerPrice, getResellerMarkup } from '../../services/pricing/resellerPricing.js';

const router = express.Router();

/**
 * @route   GET /api/reseller/pricing/:planId
 * @desc    Get the exact cost for the reseller to purchase this plan
 * @access  Private (Resellers only)
 */
router.get('/pricing/:planId', protect, async (req, res) => {
    try {
        if (req.user.role !== 'reseller' && req.user.role !== 'reseller_admin') {
            return res.status(403).json({ message: 'Access denied' });
        }
        const cost = await getResellerPrice(req.user._id.toString(), req.params.planId);
        res.json({ status: 'success', cost });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

/**
 * @route   GET /api/reseller/markup
 * @desc    Get the reseller's current markup configurations
 * @access  Private (Resellers only)
 */
router.get('/markup', protect, async (req, res) => {
    try {
        if (req.user.role !== 'reseller' && req.user.role !== 'reseller_admin') {
            return res.status(403).json({ message: 'Access denied' });
        }
        const markup = await getResellerMarkup(req.user._id.toString());
        res.json({ status: 'success', markup });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

export default router;
