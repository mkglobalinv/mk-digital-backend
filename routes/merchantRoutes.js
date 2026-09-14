import express from "express";
import { auth } from "../middlewares/auth.js";
import { getMerchantStatus, becomeMerchant } from "../controllers/merchantController.js";

const router = express.Router();

router.get("/status", auth, getMerchantStatus);
router.post("/activate", auth, becomeMerchant);

export default router;
