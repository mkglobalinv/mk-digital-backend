import express from "express";
import PromotionGrid from "../models/PromotionGrid.js";
import { adminAuth } from "../middlewares/adminAuth.js";

const router = express.Router();

// GET all active and scheduled promotions for user dashboard
router.get("/", async (req, res) => {
  try {
    const now = new Date();
    
    const query = {
      status: "Active",
      displayMode: { $in: ["Dashboard Grid Only", "Both"] },
      $or: [
        { startDate: { $exists: false } },
        { startDate: null },
        { startDate: { $lte: now } }
      ]
    };

    const promotions = await PromotionGrid.find(query).sort({ sortOrder: 1 });
    
    // Filter out expired ones
    const activePromos = promotions.filter(p => {
      if (!p.endDate) return true;
      return new Date(p.endDate) >= now;
    });

    res.json(activePromos);
  } catch (error) {
    console.error("Fetch promotions error:", error);
    res.status(500).json({ error: "Failed to fetch promotions" });
  }
});

// POST increment view count
router.post("/:id/view", async (req, res) => {
  try {
    await PromotionGrid.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to update views" });
  }
});

// POST increment click count
router.post("/:id/click", async (req, res) => {
  try {
    await PromotionGrid.findByIdAndUpdate(req.params.id, { 
      $inc: { clicks: 1 },
      lastClickDate: new Date()
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to update clicks" });
  }
});

// ================= ADMIN ROUTES =================

// GET all promotions for admin
router.get("/admin", adminAuth, async (req, res) => {
  try {
    const promotions = await PromotionGrid.find().sort({ sortOrder: 1, createdAt: -1 });
    res.json(promotions);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch promotions" });
  }
});

// POST create promotion
router.post("/admin", adminAuth, async (req, res) => {
  try {
    const newPromo = new PromotionGrid(req.body);
    const savedPromo = await newPromo.save();
    res.status(201).json(savedPromo);
  } catch (error) {
    res.status(400).json({ error: "Failed to create promotion", details: error.message });
  }
});

// PUT update promotion
router.put("/admin/:id", adminAuth, async (req, res) => {
  try {
    const updatedPromo = await PromotionGrid.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedPromo) return res.status(404).json({ error: "Promotion not found" });
    res.json(updatedPromo);
  } catch (error) {
    res.status(400).json({ error: "Failed to update promotion", details: error.message });
  }
});

// DELETE promotion
router.delete("/admin/:id", adminAuth, async (req, res) => {
  try {
    const deletedPromo = await PromotionGrid.findByIdAndDelete(req.params.id);
    if (!deletedPromo) return res.status(404).json({ error: "Promotion not found" });
    res.json({ success: true, message: "Promotion deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete promotion" });
  }
});

export default router;
