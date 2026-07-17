import mongoose from "mongoose";
import { getSupabaseClient } from '../services/supabaseClient.js';

const adminPricingOverrideSchema = new mongoose.Schema({
  resellerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  serviceType: { type: String, enum: ["data", "airtime", "cable", "electricity", "betting", "epin"], required: true },
  network: { type: String }, // e.g., "MTN", "GLO" (optional, depending on service)
  planId: { type: String },  // Optional, for data/cable
  buyingPrice: { type: Number }, // Admin-set cost to reseller (what reseller pays the platform)
  assignedSellingPrice: { type: Number }, // Admin-set price reseller charges their customers
  marginPercentage: { type: Number }, // Margin override (used for airtime, cable, etc.)
  note: { type: String, default: "" }, // Admin note/reason for override
  status: { type: String, enum: ["enabled", "disabled"], default: "enabled" }
}, { timestamps: true });

// Ensure unique override per reseller/service/network/plan
adminPricingOverrideSchema.index({ resellerId: 1, serviceType: 1, network: 1, planId: 1 }, { unique: true });

adminPricingOverrideSchema.post('save', async function(doc) {
  try {
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.from('admin_price_assignments').upsert({
        reseller_id: doc.resellerId.toString(),
        service_type: doc.serviceType,
        network: doc.network || '',
        plan_id: doc.planId || '',
        buying_price: doc.buyingPrice || 0,
        assigned_selling_price: doc.assignedSellingPrice || 0,
        margin_percentage: doc.marginPercentage || 0,
        note: doc.note || '',
        status: doc.status,
        updated_at: new Date().toISOString()
      }, { onConflict: 'reseller_id,service_type,network,plan_id' });
    }
  } catch (err) {
    console.error('[Supabase Sync] Failed to sync AdminPricingOverride:', err);
  }
});

export default mongoose.model("AdminPricingOverride", adminPricingOverrideSchema);
