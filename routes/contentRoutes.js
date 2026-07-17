import express from "express";
import { 
  getAllContent, 
  createContent, 
  updateContent, 
  deleteContent 
} from "../controllers/contentController.js";
import { adminAuth } from "../middlewares/adminAuth.js";

import { getAvailablePlatforms } from "../controllers/futurePlatformController.js";

const router = express.Router();

// Public route to get content (for frontend display)
router.get("/", getAllContent);

// Public route to get future platforms with white-label formatting
router.get("/future-platforms", getAvailablePlatforms);


// Protected routes (Admin only)
router.post("/", adminAuth, createContent);
router.put("/:id", adminAuth, updateContent);
router.delete("/:id", adminAuth, deleteContent);

export default router;
