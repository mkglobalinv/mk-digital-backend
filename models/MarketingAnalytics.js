import mongoose from "mongoose";

const marketingAnalyticsSchema = new mongoose.Schema({
  campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'MarketingCampaign' },
  announcementId: { type: mongoose.Schema.Types.ObjectId, ref: 'MarketingAnnouncement' },
  actionType: { type: String, enum: ['view', 'click'], required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  ipAddress: { type: String },
  deviceInfo: { type: String }
}, { timestamps: true });

export default mongoose.model("MarketingAnalytics", marketingAnalyticsSchema);
