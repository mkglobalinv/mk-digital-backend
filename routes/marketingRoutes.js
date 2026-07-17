import express from "express";
import MarketingCampaign from "../models/MarketingCampaign.js";
import MarketingAnnouncement from "../models/MarketingAnnouncement.js";
import MarketingAnalytics from "../models/MarketingAnalytics.js";
import User from "../models/User.js";
import { adminAuth } from "../middlewares/adminAuth.js";
import jwt from "jsonwebtoken";

const router = express.Router();

// ================= PUBLIC USER ROUTES =================

// Get active campaigns
router.get("/campaigns/active", async (req, res) => {
  try {
    let targetAudience = 'Retail Users';
    let isReseller = false;
    let isResellerCustomer = false;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const secret = process.env.JWT_SECRET || "mk_sub_data_secret_2024_premium";
        const decoded = jwt.verify(token, secret);
        const user = await User.findById(decoded.id || decoded._id);
        if (user) {
            if (user.role === 'reseller_admin' || user.isReseller || user.apiLevel === 'reseller' || user.apiLevel === 'premium') {
                targetAudience = 'Resellers';
                isReseller = true;
            } else if (user.role === 'user' && user.tenantOwnerId) {
                targetAudience = 'Reseller Customers';
                isResellerCustomer = true;
            }
        }
      } catch(e) {}
    }

    const now = new Date();
    const query = {
      status: "Active",
      targetAudience: { $in: [targetAudience, 'All Users'] },
      $or: [{ startDate: { $lte: now } }, { startDate: null }, { startDate: { $exists: false } }],
      $or: [{ endDate: { $gte: now } }, { endDate: null }, { endDate: { $exists: false } }]
    };

    // Removed incorrect campaignType filter so 'All Users' and 'Reseller' banners show correctly

    const campaigns = await MarketingCampaign.find(query).sort({ sortOrder: 1, createdAt: -1 });
    
    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch campaigns" });
  }
});

// Get active announcements
router.get("/announcements/active", async (req, res) => {
  try {
    let targetAudience = 'Retail Users';

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const secret = process.env.JWT_SECRET || "mk_sub_data_secret_2024_premium";
        const decoded = jwt.verify(token, secret);
        const user = await User.findById(decoded.id || decoded._id);
        if (user) {
            if (user.role === 'reseller_admin' || user.apiLevel === 'reseller' || user.apiLevel === 'premium') {
                targetAudience = 'Resellers';
            } else if (user.role === 'user' && user.tenantOwnerId) {
                targetAudience = 'Reseller Customers';
            }
        }
      } catch(e) {}
    }

    const now = new Date();
    const announcements = await MarketingCampaign.find({
      campaignType: "Announcement",
      status: "Active",
      targetAudience: { $in: [targetAudience, 'All Users'] },
      $or: [{ startDate: { $lte: now } }, { startDate: null }, { startDate: { $exists: false } }],
      $or: [{ endDate: { $gte: now } }, { endDate: null }, { endDate: { $exists: false } }]
    }).sort({ createdAt: -1 });
    
    res.json(announcements);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch announcements" });
  }
});

// Log View / Impression
router.post("/analytics/view", async (req, res) => {
  try {
    const { campaignId, announcementId } = req.body;
    
    if (campaignId) {
      await MarketingCampaign.findByIdAndUpdate(campaignId, { $inc: { views: 1 } });
      await MarketingAnalytics.create({
        campaignId,
        actionType: 'view',
        ipAddress: req.ip,
        deviceInfo: req.headers['user-agent']
      });
    } else if (announcementId) {
      await MarketingAnnouncement.findByIdAndUpdate(announcementId, { $inc: { views: 1 } });
      await MarketingAnalytics.create({
        announcementId,
        actionType: 'view',
        ipAddress: req.ip,
        deviceInfo: req.headers['user-agent']
      });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to log view" });
  }
});

// Log Click
router.post("/analytics/click", async (req, res) => {
  try {
    const { campaignId } = req.body;
    if (campaignId) {
      await MarketingCampaign.findByIdAndUpdate(campaignId, { 
        $inc: { clicks: 1 },
        lastClickDate: new Date()
      });
      await MarketingAnalytics.create({
        campaignId,
        actionType: 'click',
        ipAddress: req.ip,
        deviceInfo: req.headers['user-agent']
      });
    }
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to log click" });
  }
});

// ================= ADMIN ROUTES =================

// ----- CAMPAIGNS -----
router.get("/admin/campaigns", adminAuth, async (req, res) => {
  try {
    const campaigns = await MarketingCampaign.find().sort({ sortOrder: 1, createdAt: -1 });
    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch campaigns" });
  }
});

router.post("/admin/campaigns", adminAuth, async (req, res) => {
  try {
    const newPromo = new MarketingCampaign(req.body);
    const savedPromo = await newPromo.save();
    res.status(201).json(savedPromo);
  } catch (error) {
    res.status(400).json({ error: "Failed to create campaign", details: error.message });
  }
});

router.put("/admin/campaigns/:id", adminAuth, async (req, res) => {
  try {
    const updatedPromo = await MarketingCampaign.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedPromo) return res.status(404).json({ error: "Campaign not found" });
    res.json(updatedPromo);
  } catch (error) {
    res.status(400).json({ error: "Failed to update campaign", details: error.message });
  }
});

router.delete("/admin/campaigns/:id", adminAuth, async (req, res) => {
  try {
    console.log(`[Marketing] Attempting to delete campaign: ${req.params.id}`);
    const deletedPromo = await MarketingCampaign.findByIdAndDelete(req.params.id);
    console.log(`[Marketing] Deleted promo result:`, deletedPromo);
    if (!deletedPromo) return res.status(404).json({ error: "Campaign not found" });
    res.json({ message: "Campaign deleted successfully" });
  } catch (error) {
    console.error(`[Marketing] Delete error:`, error);
    res.status(500).json({ error: "Failed to delete campaign" });
  }
});

// ----- ANNOUNCEMENTS -----
router.get("/admin/announcements", adminAuth, async (req, res) => {
  try {
    const items = await MarketingAnnouncement.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch announcements" });
  }
});

router.post("/admin/announcements", adminAuth, async (req, res) => {
  try {
    const newItem = new MarketingAnnouncement(req.body);
    const savedItem = await newItem.save();
    res.status(201).json(savedItem);
  } catch (error) {
    res.status(400).json({ error: "Failed to create announcement", details: error.message });
  }
});

router.put("/admin/announcements/:id", adminAuth, async (req, res) => {
  try {
    const updatedItem = await MarketingAnnouncement.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedItem) return res.status(404).json({ error: "Announcement not found" });
    res.json(updatedItem);
  } catch (error) {
    res.status(400).json({ error: "Failed to update announcement", details: error.message });
  }
});

router.delete("/admin/announcements/:id", adminAuth, async (req, res) => {
  try {
    const deletedItem = await MarketingAnnouncement.findByIdAndDelete(req.params.id);
    if (!deletedItem) return res.status(404).json({ error: "Announcement not found" });
    res.json({ message: "Announcement deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete announcement" });
  }
});

// ----- ANALYTICS -----
router.get("/admin/analytics", adminAuth, async (req, res) => {
  try {
    const totalCampaignViews = await MarketingCampaign.aggregate([{ $group: { _id: null, total: { $sum: "$views" } } }]);
    const totalCampaignClicks = await MarketingCampaign.aggregate([{ $group: { _id: null, total: { $sum: "$clicks" } } }]);
    const totalAnnouncementViews = await MarketingAnnouncement.aggregate([{ $group: { _id: null, total: { $sum: "$views" } } }]);

    res.json({
      campaignViews: totalCampaignViews[0]?.total || 0,
      campaignClicks: totalCampaignClicks[0]?.total || 0,
      announcementViews: totalAnnouncementViews[0]?.total || 0,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

export default router;
