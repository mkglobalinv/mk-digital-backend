import mongoose from "mongoose";
import { getSupabaseClient } from '../services/supabaseClient.js';

const withdrawalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  bankName: {
    type: String,
    required: true
  },
  accountNumber: {
    type: String,
    required: true
  },
  accountName: {
    type: String,
    default: ""
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending"
  },
  transactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Transaction"
  },
  adminComment: {
    type: String,
    default: ""
  },
  reference: {
    type: String,
    default: function() {
        return `WD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    }
  }
}, { 
  timestamps: true 
});

withdrawalSchema.post('save', async function(doc) {
    try {
        const supabase = getSupabaseClient();
        if (supabase) {
            await supabase.from('withdrawal_requests').upsert({
                mongo_id: doc._id.toString(),
                user_id: doc.userId.toString(),
                amount: doc.amount,
                bank_name: doc.bankName,
                account_number: doc.accountNumber,
                account_name: doc.accountName,
                status: doc.status,
                reference: doc.reference || doc._id.toString(),
                updated_at: new Date().toISOString()
            }, { onConflict: 'mongo_id' });
        }
    } catch (err) {
        console.error('[Supabase Sync] Failed to sync Withdrawal:', err);
    }
});

export default mongoose.model("Withdrawal", withdrawalSchema);
