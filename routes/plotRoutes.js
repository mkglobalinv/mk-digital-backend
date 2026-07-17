import express from "express";
import Plot from "../models/Plot.js";
import User from "../models/User.js";
import { auth } from "../middlewares/auth.js";
import { adminAuth } from "../middlewares/adminAuth.js";

const router = express.Router();

// Get all plots
router.get("/", async (req, res) => {
  try {
    const plots = await Plot.find();
    res.status(200).json(plots);
  } catch (error) {
    res.status(500).json({ message: "Error fetching plots", error });
  }
});

// Reserve a plot
router.post("/reserve", auth, async (req, res) => {
  const { plotId } = req.body;
  try {
    const plot = await Plot.findById(plotId);
    if (!plot) return res.status(404).json({ message: "Plot not found" });
    if (plot.status !== "available") return res.status(400).json({ message: "Plot not available" });

    const user = await User.findById(req.user.id);
    if (user.balance1 < plot.price) {
      // Initiate loan tracking logic here if needed
      return res.status(400).json({ message: "Insufficient balance for reservation" });
    }

    plot.status = "reserved";
    plot.owner = user._id;
    await plot.save();

    user.balance1 -= plot.price;
    await user.save();

    res.status(200).json({ message: "Plot reserved successfully", plot });
  } catch (error) {
    res.status(500).json({ message: "Error reserving plot", error });
  }
});

// Admin Update Plot
router.put("/:id", auth, adminAuth, async (req, res) => {
  try {
    const updatedPlot = await Plot.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json(updatedPlot);
  } catch (error) {
    res.status(500).json({ message: "Error updating plot", error });
  }
});

// Seed Initial Plots (Utility)
router.post("/seed", auth, adminAuth, async (req, res) => {
  const plotsData = req.body.plots;
  try {
    await Plot.deleteMany({});
    const createdPlots = await Plot.insertMany(plotsData);
    res.status(201).json(createdPlots);
  } catch (error) {
    res.status(500).json({ message: "Error seeding plots", error });
  }
});

export default router;
