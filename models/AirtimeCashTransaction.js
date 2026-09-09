import mongoose from 'mongoose';

// Dedicated transaction model for the Airtime-to-Cash domain -- deliberately NOT the
// shared models/Transaction.js (that model's status enum and shape are for VTU
// purchases/wallet ledger entries and are not to be modified for this feature).
// A linked models/Transaction.js entry IS created for the actual wallet credit leg
// (see services/airtimeToCash/AirtimeToCashService.js), so the credit still shows up
// in the customer's normal balance history -- this model is the Airtime-to-Cash
// -specific state machine and audit trail sitting alongside it.
const STATUSES = [
    'PENDING',
    'OTP_REQUIRED',
    'OTP_VERIFIED',
    'QUOTA_CHECKING',
    'READY_FOR_TRANSFER',
    'PROCESSING',
    'SUCCESS',
    'FAILED',
    'REVERSED',
    'MANUAL_REVIEW'
];

const airtimeCashTransactionSchema = new mongoose.Schema({
    // Public + internal reference. _id is the internal transaction ID; `reference` is
    // the public-facing one handed back to the client and used for provider/webhook
    // correlation and wallet-credit idempotency.
    reference: { type: String, required: true, unique: true },

    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // null = main platform
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    network: { type: String, required: true, enum: ['MTN', 'AIRTEL', 'GLO', '9MOBILE'] },
    senderPhone: { type: String, required: true },
    airtimeAmount: { type: Number, required: true, min: 0 },

    provider: { type: String, default: 'airtimebridge' },
    providerReference: { type: String }, // provider's transaction/transfer id, once known
    providerSessionId: { type: String }, // OTP sessionId returned by the provider
    providerResponseStatus: { type: String }, // last-seen safe status string (never raw PII/secret fields)

    // Pricing snapshot, frozen at creation time -- a later admin pricing change must
    // never alter an already-created transaction's numbers.
    pricingSnapshot: {
        pricingId: { type: mongoose.Schema.Types.ObjectId, ref: 'AirtimeCashPricing' },
        source: { type: String, enum: ['tenant', 'global'] },
        conversionPercentage: { type: Number },
        fixedFee: { type: Number }
    },
    customerPayoutAmount: { type: Number }, // = airtimeAmount * conversionPercentage/100 - fixedFee, frozen
    platformValue: { type: Number }, // airtimeAmount - customerPayoutAmount, frozen (platform's gross margin on this tx)

    bankName: { type: String },
    accountNumber: { type: String }, // masked on every API/UI response; stored only for the future payout phase

    status: { type: String, enum: STATUSES, default: 'PENDING' },

    // Exactly-once wallet credit guard. walletService.creditBalance() is itself
    // idempotent by reference, but this flag + providerConfirmedAt let the
    // reconciliation job tell "provider confirmed, credit not yet applied" (safe to
    // retry the credit) apart from "provider not yet confirmed" (must not touch the
    // wallet at all).
    providerConfirmedAt: { type: Date },
    walletCredited: { type: Boolean, default: false },
    walletCreditReference: { type: String }, // the models/Transaction.js reference used for the credit

    failureReason: { type: String },

    otpRequestedAt: { type: Date },
    otpVerifiedAt: { type: Date },
    quotaCheckedAt: { type: Date },
    transferInitiatedAt: { type: Date },
    completedAt: { type: Date },

    retryCount: { type: Number, default: 0 },

    // Client-suppliable dedup key (e.g. an Idempotency-Key header) so a retried
    // request that never saw the first response reattaches to the same transaction
    // instead of starting a second one.
    idempotencyKey: { type: String, unique: true, sparse: true },

    isSandbox: { type: Boolean, default: false }
}, { timestamps: true });

airtimeCashTransactionSchema.statics.STATUSES = STATUSES;

airtimeCashTransactionSchema.index({ tenantId: 1, createdAt: -1 });
airtimeCashTransactionSchema.index({ customerId: 1, createdAt: -1 });
airtimeCashTransactionSchema.index({ providerReference: 1 });
airtimeCashTransactionSchema.index({ status: 1 });
airtimeCashTransactionSchema.index({ createdAt: -1 });

export default mongoose.model('AirtimeCashTransaction', airtimeCashTransactionSchema);
