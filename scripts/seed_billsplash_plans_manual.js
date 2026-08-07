import mongoose from 'mongoose';
import dotenv from 'dotenv';
import DataPlan from '../models/DataPlan.js';

dotenv.config({ path: '../.env' }); // Ensure proper resolution based on execution dir
if (!process.env.MONGO_URI) {
    // Fallback if ran from project root instead of /scripts
    dotenv.config({ path: './.env' });
}

const MONGO_URI = process.env.MONGO_URI;

// Simulated data sourced manually from the Billsplash dashboard
const manualBillsplashPlans = [
    // MTN
    { provider: 'billsplash', network: 'MTN', api_plan_id: 'bs-mtn-500mb', api_price: 150, plan_name: 'MTN 500MB', validity: '30 Days', category: 'SME' },
    { provider: 'billsplash', network: 'MTN', api_plan_id: 'bs-mtn-1gb', api_price: 250, plan_name: 'MTN 1GB', validity: '30 Days', category: 'SME' },
    { provider: 'billsplash', network: 'MTN', api_plan_id: 'bs-mtn-2gb', api_price: 500, plan_name: 'MTN 2GB', validity: '30 Days', category: 'SME' },
    { provider: 'billsplash', network: 'MTN', api_plan_id: 'bs-mtn-5gb', api_price: 1250, plan_name: 'MTN 5GB', validity: '30 Days', category: 'SME' },
    { provider: 'billsplash', network: 'MTN', api_plan_id: 'bs-mtn-10gb', api_price: 2500, plan_name: 'MTN 10GB', validity: '30 Days', category: 'SME' },
    // GLO
    { provider: 'billsplash', network: 'GLO', api_plan_id: 'bs-glo-1gb', api_price: 230, plan_name: 'GLO 1GB', validity: '30 Days', category: 'Corporate' },
    { provider: 'billsplash', network: 'GLO', api_plan_id: 'bs-glo-2gb', api_price: 460, plan_name: 'GLO 2GB', validity: '30 Days', category: 'Corporate' },
    { provider: 'billsplash', network: 'GLO', api_plan_id: 'bs-glo-5gb', api_price: 1150, plan_name: 'GLO 5GB', validity: '30 Days', category: 'Corporate' },
    // AIRTEL
    { provider: 'billsplash', network: 'AIRTEL', api_plan_id: 'bs-airtel-1gb', api_price: 240, plan_name: 'Airtel 1GB', validity: '30 Days', category: 'Corporate' },
    { provider: 'billsplash', network: 'AIRTEL', api_plan_id: 'bs-airtel-2gb', api_price: 480, plan_name: 'Airtel 2GB', validity: '30 Days', category: 'Corporate' },
    { provider: 'billsplash', network: 'AIRTEL', api_plan_id: 'bs-airtel-5gb', api_price: 1200, plan_name: 'Airtel 5GB', validity: '30 Days', category: 'Corporate' },
    // 9MOBILE
    { provider: 'billsplash', network: '9MOBILE', api_plan_id: 'bs-9mobile-1gb', api_price: 220, plan_name: '9Mobile 1GB', validity: '30 Days', category: 'SME' },
    { provider: 'billsplash', network: '9MOBILE', api_plan_id: 'bs-9mobile-2gb', api_price: 440, plan_name: '9Mobile 2GB', validity: '30 Days', category: 'SME' },
];

const seedPlans = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB.');
        
        let inserted = 0;
        let updated = 0;

        for (const plan of manualBillsplashPlans) {
            plan.status = true; // Normalize status

            const result = await DataPlan.updateOne(
                { provider: plan.provider, network: plan.network, api_plan_id: plan.api_plan_id },
                { $set: plan },
                { upsert: true }
            );

            if (result.upsertedCount > 0) {
                inserted++;
            } else if (result.modifiedCount > 0) {
                updated++;
            }
        }

        console.log(`\n✅ Seeding Complete!`);
        console.log(`- Inserted new plans: ${inserted}`);
        console.log(`- Updated existing plans: ${updated}`);
        
        const total = await DataPlan.countDocuments({ provider: 'billsplash' });
        console.log(`- Total Billsplash plans in database: ${total}`);

        process.exit(0);
    } catch (e) {
        console.error('Seeding Failed:', e);
        process.exit(1);
    }
};

seedPlans();
