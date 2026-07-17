import PromoCampaign from '../models/PromoCampaign.js';
import PromoCard from '../models/PromoCard.js';
import PromoCampaignView from '../models/PromoCampaignView.js';
import PromoCampaignClick from '../models/PromoCampaignClick.js';

export const createCampaign = async (req, res) => {
  try {
    const { name, activeStatus, startDate, endDate, displayFrequency, ctaText, ctaUrl, cards } = req.body;
    
    if (activeStatus) {
      await PromoCampaign.updateMany({}, { activeStatus: false });
    }

    const campaign = new PromoCampaign({
      name, activeStatus, startDate, endDate, displayFrequency, ctaText, ctaUrl
    });
    await campaign.save();

    if (cards && cards.length > 0) {
      const cardDocs = cards.map(c => ({ ...c, campaignId: campaign._id }));
      await PromoCard.insertMany(cardDocs);
    }

    res.status(201).json({ success: true, campaign });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, activeStatus, startDate, endDate, displayFrequency, ctaText, ctaUrl, cards } = req.body;
    
    if (activeStatus) {
      await PromoCampaign.updateMany({ _id: { $ne: id } }, { activeStatus: false });
    }

    const campaign = await PromoCampaign.findByIdAndUpdate(id, {
      name, activeStatus, startDate, endDate, displayFrequency, ctaText, ctaUrl
    }, { new: true });

    if (cards) {
      await PromoCard.deleteMany({ campaignId: id });
      if (cards.length > 0) {
        const cardDocs = cards.map(c => ({ ...c, campaignId: id }));
        await PromoCard.insertMany(cardDocs);
      }
    }

    res.json({ success: true, campaign });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getAdminCampaigns = async (req, res) => {
  try {
    const campaigns = await PromoCampaign.find().sort({ createdAt: -1 }).lean();
    for (let c of campaigns) {
      c.cards = await PromoCard.find({ campaignId: c._id });
      c.viewsCount = await PromoCampaignView.countDocuments({ campaignId: c._id });
      c.clicksCount = await PromoCampaignClick.countDocuments({ campaignId: c._id });
    }
    res.json({ success: true, campaigns });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    await PromoCampaign.findByIdAndDelete(id);
    await PromoCard.deleteMany({ campaignId: id });
    await PromoCampaignView.deleteMany({ campaignId: id });
    await PromoCampaignClick.deleteMany({ campaignId: id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getActiveCampaign = async (req, res) => {
  try {
    const userId = req.user ? req.user._id : null;
    const now = new Date();

    const query = {
      activeStatus: true,
      $or: [
        { startDate: { $lte: now }, endDate: { $gte: now } },
        { startDate: null, endDate: null },
        { startDate: { $lte: now }, endDate: null },
        { startDate: null, endDate: { $gte: now } }
      ]
    };

    const activeCampaign = await PromoCampaign.findOne(query).sort({ createdAt: -1 }).lean();

    if (!activeCampaign) {
      return res.json({ success: true, campaign: null });
    }

    if (activeCampaign.displayFrequency === 'once' && userId) {
      const hasViewed = await PromoCampaignView.findOne({ campaignId: activeCampaign._id, userId });
      if (hasViewed) {
        return res.json({ success: true, campaign: null });
      }
    }

    activeCampaign.cards = await PromoCard.find({ campaignId: activeCampaign._id });
    res.json({ success: true, campaign: activeCampaign });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const logView = async (req, res) => {
  try {
    const { campaignId, deviceId } = req.body;
    const userId = req.user ? req.user._id : null;
    
    await PromoCampaignView.create({ campaignId, userId, deviceId });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const logClick = async (req, res) => {
  try {
    const { campaignId, target, deviceId } = req.body;
    const userId = req.user ? req.user._id : null;
    
    await PromoCampaignClick.create({ campaignId, userId, deviceId, target });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
