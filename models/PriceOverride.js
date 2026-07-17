import mongoose from "mongoose";
import { getSupabaseClient } from '../services/supabaseClient.js';

const priceOverrideSchema = new mongoose.Schema({
  resellerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  serviceType: { type: String, enum: ["data", "airtime", "cable", "electricity", "epin"], required: true },
  network: { type: String }, // e.g., "MTN", "GLO"
  planId: { type: String },  // For data/cable
  buyingPrice: { type: Number }, // Base price from Mksubdata (cost to reseller)
  sellingPrice: { type: Number }, // Deprecated for Data, Reseller's price to their customer
  customPercentage: { type: Number }, // For V3 Data Pricing (VIP Custom Percentage)
  status: { type: String, enum: ["enabled", "disabled"], default: "enabled" }
}, { timestamps: true });

// Ensure unique override per reseller/plan
priceOverrideSchema.index({ resellerId: 1, serviceType: 1, network: 1, planId: 1 }, { unique: true });

priceOverrideSchema.post('save', async function(doc) {
    try {
        const supabase = getSupabaseClient();
        if (supabase) {
            await supabase.from('reseller_custom_prices').upsert({
                reseller_id: doc.resellerId.toString(),
                plan_id: doc.planId || doc.serviceType,
                custom_retail_price: doc.sellingPrice,
                custom_api_price: doc.buyingPrice || 0,
                updated_at: new Date().toISOString()
            }); // Note: Supabase UNIQUE constraint handles the composite key update
        }
    } catch (err) {
        console.error('[Supabase Sync] Failed to sync PriceOverride:', err);
    }
});

export default mongoose.model("PriceOverride", priceOverrideSchema);
