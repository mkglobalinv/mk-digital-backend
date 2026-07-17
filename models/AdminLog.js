import mongoose from "mongoose";

const adminLogSchema = new mongoose.Schema({
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: { type: String, required: true }, // e.g., 'CREDIT_WALLET', 'BLOCK_USER', 'UPDATE_PRICING'
  actionType: { type: String }, // e.g., 'admin_credit_debit', 'pricing_adjustment', etc.
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  previousValue: mongoose.Schema.Types.Mixed,
  newValue: mongoose.Schema.Types.Mixed,
  details: mongoose.Schema.Types.Mixed,
  ipAddress: String,
  userAgent: String,
  createdAt: { type: Date, default: Date.now, index: true }
});

export default mongoose.model("AdminLog", adminLogSchema);
