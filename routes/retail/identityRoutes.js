import express from 'express';
import { auth as protect, restrictToRetailSession } from '../../middlewares/auth.js';
import { getIdentityService, processIdentityService, processAssistedIdentityService } from '../../controllers/identityController.js';
import { transactionIdempotency } from '../../middlewares/idempotency.js';
import { uploadSecureDocument } from '../../middlewares/uploadMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(restrictToRetailSession);

/**
 * @route   GET /api/retail/identity/service/:serviceId
 * @desc    Fetch a single identity service by api_plan_id from MongoDB (source of truth)
 * @access  Private (Retail Users)
 */
router.get('/service/:serviceId', getIdentityService);

/**
 * @route   POST /api/retail/identity/purchase
 * @desc    Purchase an identity service
 * @access  Private (Retail Users)
 */
router.post('/purchase', transactionIdempotency, processIdentityService);

/**
 * @route   POST /api/retail/identity/assisted-purchase
 * @desc    Purchase an assisted identity service (requires manual processing)
 * @access  Private (Retail Users)
 */
router.post('/assisted-purchase', uploadSecureDocument.array('documents', 5), transactionIdempotency, processAssistedIdentityService);

export default router;
