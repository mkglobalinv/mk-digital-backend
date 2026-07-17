import express from "express";
import rateLimit from "express-rate-limit";
import { login, register, requestOTP, verifyOTP, resetPassword, verifyEmail, resendEmailOTP, verifySecurityQuestions, resetTransactionPin, changeTransactionPin, requestPinOTP } from "../controllers/authController.js";

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    message: { message: "Too many login attempts. Please try again after 15 minutes." }
});

const otpLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 2,
    message: { message: "Too many OTP requests. Please wait a minute before requesting another." }
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
import jwt from "jsonwebtoken";
const auth = (req, res, next) => {
    let token = req.headers.authorization;
    if (!token) return res.status(401).json({ message: "Unauthorized" });
    if (token.startsWith("Bearer ")) token = token.split(" ")[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "mk_sub_data_secret_2024_premium");
        req.user = decoded;
        next();
    } catch (err) { res.status(401).json({ message: "Invalid token" }); }
};

router.post("/change-pin", auth, changeTransactionPin);
router.post("/request-pin-otp", auth, otpLimiter, requestPinOTP);

export default router;
