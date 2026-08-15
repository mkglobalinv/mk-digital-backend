import express from "express";
import rateLimit from "express-rate-limit";
import { login, register, requestOTP, verifyOTP, resetPassword, verifyEmail, resendEmailOTP, verifySecurityQuestions, resetTransactionPin, changeTransactionPin, requestPinOTP } from "../controllers/authController.js";
import { verifyTransactionPin } from "../middlewares/pinMiddleware.js";

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    message: { message: "Too many login attempts. Please try again after 15 minutes." },
    keyGenerator: (req) => {
        // Support email-based limiting to handle multiple users behind the same network/NAT
        const email = req.body?.email?.toLowerCase().trim();
        return email ? `login_email_${email}` : `login_ip_${req.ip}`;
    }
});

const otpLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 2,
    message: { message: "Too many OTP requests. Please wait a minute before requesting another." },
    keyGenerator: (req) => {
        const email = req.body?.email?.toLowerCase().trim();
        return email ? `otp_email_${email}` : `otp_ip_${req.ip}`;
    }
});

const router = express.Router();

// Public routes
router.post("/register", loginLimiter, register);
router.post("/login", loginLimiter, login);
router.post("/request-otp", otpLimiter, requestOTP);
router.post("/forgot-password", otpLimiter, requestOTP);
router.post("/verify-otp", verifyOTP);
router.post("/reset-password", resetPassword);
router.post("/verify-email", verifyEmail);
router.post("/resend-email-otp", otpLimiter, resendEmailOTP);
router.post("/verify-security-questions", verifySecurityQuestions);
router.post("/reset-pin", resetTransactionPin);

// Protected routes
import { auth } from "../middlewares/auth.js";

router.post("/change-pin", auth, changeTransactionPin);
router.post("/request-pin-otp", auth, otpLimiter, requestPinOTP);

// App Lock PIN unlock — uses existing PIN verification middleware
router.post("/verify-pin", auth, verifyTransactionPin, (req, res) => {
  res.json({ success: true, message: "PIN verified" });
});

export default router;
