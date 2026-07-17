import mongoose from 'mongoose';
import { getSupabaseClient } from '../services/supabaseClient.js';

const dataPlanSchema = new mongoose.Schema({
    network: {
        type: String,
        required: true,
        uppercase: true, // e.g., 'MTN', 'GLO', 'AIRTEL', '9MOBILE'
    },
    category: {
        type: String,
        required: true,
        // e.g., 'SME', 'Corporate', 'Gifting', 'Direct'
    },
    plan_name: {
        type: String,
        required: true
    },
    plan_size: {
        type: String,
        default: ''
    },
    api_plan_id: {
        type: String,
        required: true
    },
    api_price: {
        type: Number,
        required: true
    },
    selling_price: {
        type: Number,
        required: true // DEPRECATED: Retained for rollback only
    },
    reseller_price: {
        type: Number,
        default: 0 // DEPRECATED: Retained for rollback only
    },
    basic_selling_price: {
        type: Number,
        default: 0 // DEPRECATED: Retained for rollback only
    },
    vip_selling_price: {
        type: Number,
        default: 0 // DEPRECATED: Retained for rollback only
    },
    premium_selling_price: {
        type: Number,
        default: 0 // DEPRECATED: Retained for rollback only
    },
    vip_price: {
        type: Number,
        default: 0 // DEPRECATED: Retained for rollback only
    },
    premium_price: {
        type: Number,
        default: 0 // DEPRECATED: Retained for rollback only
    },
    profit: {
        type: Number,
        default: 0 // DEPRECATED: Retained for rollback only
    },
    status: {
        type: Boolean,
        default: true
    },
    provider: {
        type: String,
        required: true,
        lowercase: true, // 'peyflex' or 'clubkonnect'
    },
    validity: {
        type: String,
        default: '30 Days'
    }
}, { timestamps: true });

// Pre-save middleware to calculate profit
dataPlanSchema.pre('save', function () {
    if (this.isModified('api_price') || this.isModified('selling_price')) {
        this.profit = this.selling_price - this.api_price;
    }
});

dataPlanSchema.post('save', async function(doc) {
    try {
        const supabase = getSupabaseClient();
        if (supabase) {
            // Keep api_plan_id unique in Supabase by stripping potential double-prefixes 
            // if already prefixed (though we'll prefix it before saving to DataPlan).
            // Actually, if we prefix it in `api_plan_id` in MongoDB, `doc.api_plan_id` 
            // will ALREADY be `GLO_100.01`. So Supabase gets `GLO_100.01` automatically!
            await supabase.from('pricing_tiers').upsert({
                plan_id: doc.api_plan_id,
                network: doc.network,
                plan_name: doc.plan_name,
                admin_cost: doc.api_price,
                default_retail_price: doc.selling_price,
                basic_price: doc.reseller_price || doc.selling_price,
                vip_price: doc.vip_price || doc.selling_price,
                premium_price: doc.premium_price || doc.selling_price,
                is_active: doc.status,
                updated_at: new Date().toISOString()
            }, { onConflict: 'plan_id' });
        }
    } catch (err) {
        console.error('[Supabase Sync] Failed to sync DataPlan:', err);
    }
});

// Indexing for faster queries since plans will be searched frequently
dataPlanSchema.index({ network: 1, provider: 1, status: 1 });
dataPlanSchema.index({ api_plan_id: 1, provider: 1, network: 1 }, { unique: true }); // Prevent duplicates per provider network

const DataPlan = mongoose.model('DataPlan', dataPlanSchema);

export default DataPlan;
