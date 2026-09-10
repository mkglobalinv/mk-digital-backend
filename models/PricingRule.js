import mongoose from "mongoose";

const pricingRuleSchema = new mongoose.Schema({
    network: {
        type: String,
        required: true,
        uppercase: true
    },
    category: {
        type: String,
        required: true
    },
    // Optional. Omitted (undefined) = the original "default" V3 rule for this
    // network+category, applied to every provider's plans that don't have
    // their own provider-scoped rule (see applyPricingRuleToPlans in
    // routes/adminRoutes.js). Set (e.g. 'ogdams') = applies only to that
    // provider's plans for this network+category, independently of the
    // default rule and any other provider's rule for the same combination.
    provider: {
        type: String,
        lowercase: true,
        default: undefined
    },
    retailPercentage: {
        type: Number, 
        required: true, 
        min: 0 
    },
    basicPercentage: { 
        type: Number, 
        required: true, 
        min: 0 
    },
    vipPercentage: { 
        type: Number, 
        required: true, 
        min: 0 
    },
    isActive: { 
        type: Boolean, 
        default: true 
    }
}, { timestamps: true });

// Ensure only one rule per network + category + provider (provider omitted
// counts as its own distinct "default" entry, preserving the original
// one-rule-per-network-and-category constraint for existing rules).
pricingRuleSchema.index({ network: 1, category: 1, provider: 1 }, { unique: true });

export default mongoose.model("PricingRule", pricingRuleSchema);
