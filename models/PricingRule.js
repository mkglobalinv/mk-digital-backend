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

// Ensure only one rule per network and category
pricingRuleSchema.index({ network: 1, category: 1 }, { unique: true });

export default mongoose.model("PricingRule", pricingRuleSchema);
