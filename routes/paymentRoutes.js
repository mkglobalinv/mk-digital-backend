import express from "express";
import { initPayment, monnifyWebhook, verifyPaystack } from "../controllers/paymentController.js";
import { flutterwaveWebhook, verifyPayment } from "../controllers/flutterwaveController.js";
import jwt from "jsonwebtoken";

const router = express.Router();

const auth = (req, res, next) => {
  try {
    let token = req.headers.authorization;
    if (!token) return res.status(401).json({ message: "No token" });
    if (token.startsWith("Bearer ")) token = token.split(" ")[1];

    const verified = jwt.verify(token, process.env.JWT_SECRET || "mk_sub_data_secret_2024_premium");
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ message: "Invalid token" });
  }
};

router.post("/initialize", auth, initPayment);

// INTELLIGENT ROUTING: If Flutterwave incorrectly hits the Monnify webhook URL, route it properly.
router.post("/webhook", (req, res, next) => {
    if (req.headers["verif-hash"]) {
        return flutterwaveWebhook(req, res);
    }
    return monnifyWebhook(req, res);
}); 

// FLUTTERWAVE ROUTES
router.post("/flutterwave/verify", auth, verifyPayment);
router.post("/flutterwave/webhook", flutterwaveWebhook);

// PAYSTACK ROUTES
router.post("/paystack/initialize", auth, initPayment); // We'll update initPayment to handle provider
router.get("/paystack/verify/:reference", auth, verifyPaystack);

export default router;
