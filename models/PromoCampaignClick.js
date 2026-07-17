import mongoose from 'mongoose';

const promoCampaignClickSchema = new mongoose.Schema({
  campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'PromoCampaign', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  deviceId: { type: String },
  target: { type: String },
  clickedAt: { type: Date, default: Date.now }
});

const PromoCampaignClick = mongoose.model('PromoCampaignClick', promoCampaignClickSchema);
export default PromoCampaignClick;
