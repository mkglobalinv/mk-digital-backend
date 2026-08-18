import express from 'express';
import { validateBody } from './validators.js';
import {
    ninPremium,
    ninPhonePremium,
    ninDemo,
    bvnPremium,
    bankVerify,
    ipeSubmit,
    ipeStatus,
    ninValidate,
    ninValidateStatus
} from './controller.js';

const router = express.Router();

// NIN verification slips
router.post('/nin/premium', validateBody('ninPremium'), ninPremium);
router.post('/nin/phone-premium', validateBody('ninPhonePremium'), ninPhonePremium);
router.post('/nin/demo', validateBody('ninDemo'), ninDemo);

// BVN verification slip
router.post('/bvn/premium', validateBody('bvnPremium'), bvnPremium);

// Bank account verification
router.post('/bank/verify', validateBody('bankVerify'), bankVerify);

// IPE clearance
router.post('/ipe/submit', validateBody('ipeSubmit'), ipeSubmit);
router.post('/ipe/status', validateBody('ipeStatus'), ipeStatus);

// NIN validation
router.post('/nin/validate', validateBody('ninValidate'), ninValidate);
router.post('/nin/validate-status', validateBody('ninValidateStatus'), ninValidateStatus);

export default router;
