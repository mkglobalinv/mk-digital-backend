import express from "express";
import jwt from "jsonwebtoken";
import { getReferralLink, getReferrals, getReferralAnalytics } from "../controllers/userController.js";

const router = express.Router();

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

router.use(auth);

router.get("/referral-link", getReferralLink);
router.get("/referrals", getReferrals);
router.get("/referral-analytics", getReferralAnalytics);

export default router;
