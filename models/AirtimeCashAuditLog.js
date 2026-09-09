import mongoose from 'mongoose';

// Append-only audit trail for the Airtime-to-Cash state machine. One row per
// meaningful event (OTP requested/verified, quota checked, transfer initiated,
// status change, wallet credited, admin pricing/config change, manual review
// decision). `metadata` must never contain OTP values or the airtime transfer PIN --
// enforced by sanitizeAuditMetadata() in services/airtimeToCash/security.js, which
// every writer in this feature is required to go through.
const airtimeCashAuditLogSchema = new mongoose.Schema({
    transactionId: { type: mongoose.Schema.Types.ObjectId, ref: 'AirtimeCashTransaction' },
    actorType: { type: String, enum: ['customer', 'system', 'admin', 'provider'], required: true },
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, required: true },
    fromStatus: { type: String },
    toStatus: { type: String },
    metadata: { type: mongoose.Schema.Types.Mixed },
    ip: { type: String }
}, { timestamps: true });

airtimeCashAuditLogSchema.index({ transactionId: 1, createdAt: 1 });
airtimeCashAuditLogSchema.index({ createdAt: -1 });

export default mongoose.model('AirtimeCashAuditLog', airtimeCashAuditLogSchema);
