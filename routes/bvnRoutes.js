import express from 'express';
import { verifyBvn } from '../controllers/bvnController.js';
import { auth as protect } from '../middlewares/auth.js';

const router = express.Router();

// Protect this route with standard 9JASUB auth middleware
router.use(protect);

/**
 * @route   POST /api/bvn/verify
 * @desc    Verify BVN via BillSplash
 * @access  Private (Requires valid JWT token)
 */
router.post('/verify', verifyBvn);

export default router;
