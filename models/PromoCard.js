import mongoose from 'mongoose';

const promoCardSchema = new mongoose.Schema({
  campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'PromoCampaign', required: true },
  title: { type: String, required: true },
  subtitle: { type: String },
  price: { type: String, required: true },
  color: { type: String, default: 'blue' },
  icon: { type: String }
}, { timestamps: true });

const PromoCard = mongoose.model('PromoCard', promoCardSchema);
export default PromoCard;
