import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { syncClubKonnectPlans } from './scripts/sync_clubkonnect_plans.js';

dotenv.config();

const missingPlanIds = [
    '100.01', '200.01', '500.01', '1000.01', '1500.01', 
    '2000.01', '2500.01', '3000.01', '4000.01', '5000.01', 
    '20000.01', '30000.01', '60000.01'
];

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 30000 });
        const { default: DataPlan } = await import('./models/DataPlan.js');

        console.log("--- Checking MongoDB for the 13 missing Glo plans ---");
        
        // Find plans regardless of network to see if they were mis-mapped
        const foundPlans = await DataPlan.find({ api_plan_id: { $in: missingPlanIds } }).lean();
        
        const foundIds = foundPlans.map(p => String(p.api_plan_id));
        let completelyMissing = 0;

        missingPlanIds.forEach(id => {
            const plan = foundPlans.find(p => String(p.api_plan_id) === id);
            if (plan) {
                console.log(`Plan ID ${id}: EXISTS`);
                console.log(`  - Active Status (status field): ${plan.status}`);
                console.log(`  - Hidden Status (e.g. 'deleted', 'hidden'): ${plan.deleted ? 'Deleted' : 'Not Deleted'}`);
                console.log(`  - Provider Mapping: ${plan.provider}`);
                console.log(`  - Network Value: ${plan.network}`);
                console.log(`  - Frontend Filtering Conditions: Selling Price=₦${plan.selling_price}, Name='${plan.plan_name}'`);
            } else {
                console.log(`Plan ID ${id}: DOES NOT EXIST in DataPlan collection (across all networks and providers)`);
                completelyMissing++;
            }
        });

        if (completelyMissing > 0) {
            console.log(`\n--- ${completelyMissing} plans are missing from the database. Running Synchronization ---`);
            
            // Count Glo plans before
            const gloPlansBefore = await DataPlan.countDocuments({ network: 'GLO', provider: 'clubkonnect' });
            
            // Run sync
            await syncClubKonnectPlans();
            
            // Count Glo plans after
            const gloPlansAfter = await DataPlan.countDocuments({ network: 'GLO', provider: 'clubkonnect' });
            
            console.log(`\nSynchronization completed.`);
            console.log(`Glo plans before sync: ${gloPlansBefore}`);
            console.log(`Glo plans after sync: ${gloPlansAfter}`);
            console.log(`Total NEW Glo plans created: ${gloPlansAfter - gloPlansBefore}`);
        } else {
            console.log("\nAll 13 plans already exist in the database. No synchronization needed.");
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

run();
