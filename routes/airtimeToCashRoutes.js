import express from 'express';
import { auth as protect } from '../middlewares/auth.js';
import { transactionIdempotency } from '../middlewares/idempotency.js';
import {
    getConfig,
    getQuote,
    requestOtp,
    verifyOtp,
    checkAvailability,
    transfer,
    getTransaction,
    listTransactions
} from '../controllers/airtimeToCashController.js';

const router = express.Router();

// Config/quote are read-only lookups -- still require login so a quote is always
// evaluated in the correct tenant context (req.reseller, set by whiteLabelMiddleware
// upstream in server.js), same as every other money-related route in this app.
router.use(protect);

router.get('/config', getConfig);
router.post('/quote', getQuote);

// Idempotency-guarded: a duplicate OTP request or transfer submit must never result
// in two provider calls / two wallet credits.
router.post('/otp', transactionIdempotency, requestOtp);
router.post('/verify-otp', transactionIdempotency, verifyOtp);
router.post('/check-availability', transactionIdempotency, checkAvailability);
router.post('/transfer', transactionIdempotency, transfer);

router.get('/transaction/:reference', getTransaction);
router.get('/transactions', listTransactions);

export default router;
