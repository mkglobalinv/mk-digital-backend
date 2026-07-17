import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  amount: Number,
  type: String, // credit or debit
  status: { 
    type: String, 
    enum: ['pending', 'processing', 'success', 'failed', 'reversed', 'needs_verification', 'refund_on_hold', 'unknown'], 
    default: 'pending' 
  },
  reference: { type: String, unique: true, sparse: true }, 
  gateway_id: { type: String, unique: true, sparse: true },
  provider_trace: [{ type: String }], // Track sequence of providers tried
  isSandbox: { type: Boolean, default: false },
  provider: { type: String, default: 'VTPass' }, // Monnify, VTPass
  provider_used: { type: String }, // clubkonnect, dataway, topup
  api_response: { type: mongoose.Schema.Types.Mixed },
  verificationStatus: { type: String, default: 'unverified' }, // unverified, verified
  description: String,
  phone: String,
  network: String,
  countryCode: { type: String, default: 'NG' },
  token: String, // To store electricity tokens, WAEC PINs, EPINs
  cost_price: { type: Number, default: 0 },
  selling_price: { type: Number, default: 0 },
  profit: { type: Number, default: 0 },
  resellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  retry_count: { type: Number, default: 0 },
  balance_deducted: { type: Boolean, default: false },
  cashback_processed: { type: Boolean, default: false }, // Atomic idempotency lock for Phase 13 Lifetime Cashback Engine
  isApiRequest: { type: Boolean, default: false },
  isInternal: { type: Boolean, default: false },
  ledger_type: { type: String }, // e.g., 'LIFETIME_REFERRAL_SHARE', 'LIFETIME_CASHBACK'
  parentTransactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Transaction"
  },
  main_wallet_deducted: { type: Number, default: 0 },
  cashback_wallet_deducted: { type: Number, default: 0 },
  balance_before: { type: Number },
  balance_after: { type: Number },
  wallet_type: { type: String }, // 'normal', 'earnings', 'cashback'
  worker_name: { type: String },
  request_id: { type: String },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Performance indexing to speed up administrative queries and customer dashboard histories
transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ createdAt: -1 });
transactionSchema.index({ resellerId: 1, createdAt: -1 });

transactionSchema.post('save', async function(doc) {
    try {
        const { getSupabaseClient } = await import('../services/supabaseClient.js');
        const supabase = getSupabaseClient();
        if (supabase) {
            await supabase.from('transactions').upsert({
                mongo_id: doc._id.toString(),
                user_id: doc.userId ? doc.userId.toString() : 'system',
                reseller_id: doc.resellerId ? doc.resellerId.toString() : null,
                amount: doc.amount,
                type: doc.type,
                status: doc.status,
                reference: doc.reference,
                description: doc.description,
                phone: doc.phone,
                network: doc.network,
                profit: doc.profit || 0,
                created_at: doc.createdAt.toISOString()
            }, { onConflict: 'mongo_id' });
        }
    } catch (err) {
        console.error('[Supabase Sync] Failed to sync Transaction:', err);
    }
});

export default mongoose.model("Transaction", transactionSchema);