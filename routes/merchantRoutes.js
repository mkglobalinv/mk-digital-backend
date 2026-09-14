import express from "express";
import { auth } from "../middlewares/auth.js";
import { getMerchantStatus, becomeMerchant, registerMerchant } from "../controllers/merchantController.js";

const router = express.Router();

// Public -- unauthenticated sign-up entry point
router.post("/register", registerMerchant);

router.get("/status", auth, getMerchantStatus);
router.post("/activate", auth, becomeMerchant);

export default router;
