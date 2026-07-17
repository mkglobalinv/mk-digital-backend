import mongoose from 'mongoose';

const promoCampaignViewSchema = new mongoose.Schema({
  campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'PromoCampaign', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  deviceId: { type: String },
  viewedAt: { type: Date, default: Date.now }
});

const PromoCampaignView = mongoose.model('PromoCampaignView', promoCampaignViewSchema);
export default PromoCampaignView;
