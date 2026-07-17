import mongoose from 'mongoose';

const promoCampaignSchema = new mongoose.Schema({
  name: { type: String, required: true },
  activeStatus: { type: Boolean, default: false },
  startDate: { type: Date },
  endDate: { type: Date },
  displayFrequency: { type: String, enum: ['once', 'always'], default: 'once' },
  ctaText: { type: String, default: 'Buy Now' },
  ctaUrl: { type: String, default: '/purchase' }
}, { timestamps: true });

const PromoCampaign = mongoose.model('PromoCampaign', promoCampaignSchema);
export default PromoCampaign;
