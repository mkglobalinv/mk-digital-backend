import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import DataPlan from '../models/DataPlan.js';
import { fetchDataPlansFromClubkonnect } from '../services/providers/clubkonnect.js';

const networks = ['MTN', 'GLO', '9MOBILE', 'AIRTEL'];

function extractPlanSize(label) {
    const match = label.match(/([0-9.]+\s*(MB|GB|TB))/i);
    return match ? match[1].replace(/\s+/g, '').toUpperCase() : '';
}

function extractValidity(label) {
    const match = label.match(/(\d+\s*Days?)/i) || label.match(/(\d+\s*Months?)/i);
    return match ? match[1] : '30 Days';
}

function determineCategory(label, network) {
    const lower = label.toLowerCase();
    if (lower.includes('sme')) return 'SME';
    if (lower.includes('corporate') || lower.includes('cg')) return 'Corporate';
    if (lower.includes('gifting') || lower.includes('direct')) return 'Gifting';
    if (lower.includes('awoof')) return 'Awoof';
    return 'Gifting'; // Default
}

function calculateSellingPrice(apiPrice) {
    return Math.ceil(Number(apiPrice)) + 20;
}

export const syncClubKonnectPlans = async () => {
    console.log('[ClubKonnect Sync] Starting synchronization...');
    let totalSynced = 0;
    
    for (const network of networks) {
        try {
            console.log(`[ClubKonnect Sync] Fetching plans for ${network}`);
            const result = await fetchDataPlansFromClubkonnect(network);
            
            if (result && result.success && result.plans) {
                const plans = result.plans;
                console.log(`[ClubKonnect Sync] Found ${plans.length} plans for ${network}`);
                
                for (const p of plans) {
                    const planSize = extractPlanSize(p.name) || p.name;
                    const validity = extractValidity(p.name);
                    const category = determineCategory(p.name, network);
                    const sellingPrice = calculateSellingPrice(p.price);
                    
                    // Prepend network to make api_plan_id globally unique
                    const uniqueApiPlanId = `${network}_${p.plan_id}`;
                    
                    await DataPlan.findOneAndUpdate(
                        { api_plan_id: uniqueApiPlanId, provider: 'clubkonnect', network: network },
                        {
                            network: network,
                            category: category,
                            plan_name: p.name,
                            plan_size: planSize,
                            api_price: p.price,
                            $setOnInsert: {
                                selling_price: sellingPrice,
                                reseller_price: sellingPrice - 10,
                                profit: sellingPrice - p.price,
                                premium_price: sellingPrice,
                                basic_selling_price: sellingPrice,
                            },
                            status: true,
                            validity: validity
                        },
                        { upsert: true, new: true, setDefaultsOnInsert: true }
                    );
                }
                totalSynced += plans.length;
            } else {
                console.error(`[ClubKonnect Sync] Failed to fetch plans for ${network}: ${result.message}`);
            }
        } catch (error) {
            console.error(`[ClubKonnect Sync] Error processing ${network}: ${error.message}`);
        }
    }
    
    console.log(`[ClubKonnect Sync] Successfully synced ${totalSynced} plans.`);
    return totalSynced;
};

// If run directly
if (process.argv[1] && process.argv[1].endsWith('sync_clubkonnect_plans.js')) {
    mongoose.connect(process.env.MONGO_URI).then(async () => {
        await syncClubKonnectPlans();
        process.exit(0);
    });
}
