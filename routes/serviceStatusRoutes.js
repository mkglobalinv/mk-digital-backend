import express from "express";
import { auth } from "../middlewares/auth.js";
import { adminAuth } from "../middlewares/adminAuth.js";
import {
  getActiveServiceStatusesPublic,
  getServiceStatusesAdmin,
  createServiceStatusAdmin,
  updateServiceStatusAdmin,
  deleteServiceStatusAdmin
} from "../controllers/serviceStatusController.js";

const router = express.Router();

// --- PUBLIC/USER ENDPOINTS ---
// GET /api/service-status/active - Returns all active statuses filtered by user tier
router.get("/active", auth, getActiveServiceStatusesPublic);

// --- ADMINISTRATIVE CRUD ENDPOINTS ---
// Protected by full admin authentication
router.get("/admin", adminAuth, getServiceStatusesAdmin);
router.post("/admin", adminAuth, createServiceStatusAdmin);
router.put("/admin/:id", adminAuth, updateServiceStatusAdmin);
router.delete("/admin/:id", adminAuth, deleteServiceStatusAdmin);

export default router;
