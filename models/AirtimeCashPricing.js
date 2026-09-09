import mongoose from 'mongoose';

// One document per (tenantId, network). tenantId = null is the global/default rate;
// a document with a real tenantId overrides the global one for that reseller only.
// tenantId is a User._id (role reseller_admin) -- there is no separate Tenant model,
// per the existing 9jaSub tenant-isolation architecture (see middlewares/whiteLabel.js,
// User.tenantOwnerId).
const airtimeCashPricingSchema = new mongoose.Schema({
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    network: { type: String, required: true, enum: ['MTN', 'AIRTEL', 'GLO', '9MOBILE'] },

    // Percentage of the airtime face value the customer receives, e.g. 78 = 78%.
    conversionPercentage: { type: Number, required: true, min: 0, max: 100 },
    fixedFee: { type: Number, default: 0, min: 0 },
    minAmount: { type: Number, required: true, min: 0 },
    maxAmount: { type: Number, required: true, min: 0 },
    isEnabled: { type: Boolean, default: true },

    // Not used by the v1 calculation (which always uses conversionPercentage above),
    // but present so amount-tiered pricing can be added later without a schema
    // migration. A tier match, when tiers are populated and one covers the amount,
    // is expected to take priority over the flat conversionPercentage -- that
    // priority rule is intentionally NOT implemented yet (see item 15 of the brief).
    tiers: [{
        minAmount: { type: Number, required: true },
        maxAmount: { type: Number, required: true },
        conversionPercentage: { type: Number, required: true, min: 0, max: 100 },
        _id: false
    }],

    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// One rate per tenant+network (tenantId: null included -- Mongo treats null as a
// normal indexable value, so exactly one global row per network is enforced too).
airtimeCashPricingSchema.index({ tenantId: 1, network: 1 }, { unique: true });
airtimeCashPricingSchema.index({ network: 1, isEnabled: 1 });

export default mongoose.model('AirtimeCashPricing', airtimeCashPricingSchema);
