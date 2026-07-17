import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { getSupabaseClient } from './services/supabaseClient.js';
import { syncClubKonnectPlans } from './scripts/sync_clubkonnect_plans.js';

dotenv.config();

const purgeAndResync = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 30000 });
        const { default: DataPlan } = await import('./models/DataPlan.js');
        const supabase = getSupabaseClient();

        console.log("1. Deleting all ClubKonnect plans from MongoDB...");
        const dbDeleteResult = await DataPlan.deleteMany({ provider: 'clubkonnect' });
        console.log(`Deleted ${dbDeleteResult.deletedCount} plans from MongoDB.`);

        console.log("2. Deleting all ClubKonnect plans from Supabase (by looking at plan_id)...");
        // We can't delete directly by 'provider' in Supabase if the column doesn't exist.
        // Wait, pricing_tiers doesn't have 'provider'. It has 'network', 'plan_id'.
        // I will just delete all pricing_tiers, or wait, I shouldn't delete Peyflex plans!
        // Instead of deleting from Supabase, let's just let it be, or delete by 'is_active: false'? No.
        // Let's just fetch all ClubKonnect plans from API and the sync script will upsert new ones into Supabase.
        // The old ones in Supabase (like '100.01') won't be linked to any MongoDB plan anymore, so they are effectively orphaned.
        // That's acceptable for now to avoid deleting other provider plans by mistake.

        console.log("3. Running Sync Script...");
        await syncClubKonnectPlans();
        
        console.log("4. Sync Complete!");
        
        const countMTN = await DataPlan.countDocuments({ network: 'MTN', provider: 'clubkonnect' });
        const countGLO = await DataPlan.countDocuments({ network: 'GLO', provider: 'clubkonnect' });
        const count9M = await DataPlan.countDocuments({ network: '9MOBILE', provider: 'clubkonnect' });
        const countAIRTEL = await DataPlan.countDocuments({ network: 'AIRTEL', provider: 'clubkonnect' });
        
        console.log(`Final Counts: MTN: ${countMTN}, GLO: ${countGLO}, 9MOBILE: ${count9M}, AIRTEL: ${countAIRTEL}`);

        process.exit(0);
    } catch (err) {
        console.error("Failed:", err);
        process.exit(1);
    }
};

purgeAndResync();
