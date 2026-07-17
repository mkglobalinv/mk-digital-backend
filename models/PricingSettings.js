import mongoose from "mongoose";

const pricingSettingsSchema = new mongoose.Schema({
    resellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // If null, acts as global admin rule
    serviceType: { type: String, required: true }, // 'data', 'airtime', 'electricity', 'cable', 'epin'
    network: { type: String }, // Optional: e.g., 'MTN', 'AIRTEL'
    markupPercentage: { type: Number, required: true, default: 0 }, 
    status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, { timestamps: true });

export default mongoose.model("PricingSettings", pricingSettingsSchema);
