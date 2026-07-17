import mongoose from "mongoose";

const reconciliationReportSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  totalUsersAudited: { type: Number, default: 0 },
  totalBalances: { type: Number, default: 0 },
  totalGatewayFunding: { type: Number, default: 0 },
  totalCustomerPurchases: { type: Number, default: 0 },
  totalResellerProfits: { type: Number, default: 0 },
  totalRefunds: { type: Number, default: 0 },
  totalWithdrawals: { type: Number, default: 0 },
  totalProviderDebits: { type: Number, default: 0 },
  inconsistencies: [{ type: String }],
  mismatches: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    email: { type: String },
    name: { type: String },
    walletType: { type: String },
    mongoBalance: { type: Number },
    ledgerBalance: { type: Number },
    difference: { type: Number },
    recommendedRepair: { type: String }
  }],
  status: { type: String, enum: ['healthy', 'unbalanced', 'MATCH', 'MISMATCH'], default: 'MATCH' }
}, {
  timestamps: true
});

reconciliationReportSchema.index({ date: -1 });

export default mongoose.model("ReconciliationReport", reconciliationReportSchema);
