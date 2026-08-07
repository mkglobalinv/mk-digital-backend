import mongoose from 'mongoose';
import dotenv from 'dotenv';
import DataPlan from '../models/DataPlan.js';

dotenv.config({ path: '../.env' });
if (!process.env.MONGO_URI) dotenv.config({ path: './.env' });

const MONGO_URI = process.env.MONGO_URI;

const identityPlans = [
    { provider: 'billsplash', network: 'IDENTITY', api_plan_id: 'nin-verify', api_price: 150, selling_price: 200, plan_name: 'NIN Verification', validity: 'N/A', category: 'Verification', status: true },
    { provider: 'billsplash', network: 'IDENTITY', api_plan_id: 'bvn-verify', api_price: 150, selling_price: 200, plan_name: 'BVN Verification', validity: 'N/A', category: 'Verification', status: true },
    { provider: 'billsplash', network: 'IDENTITY', api_plan_id: 'nin-phone', api_price: 150, selling_price: 200, plan_name: 'NIN By Phone', validity: 'N/A', category: 'Verification', status: true },
    { provider: 'billsplash', network: 'IDENTITY', api_plan_id: 'nin-demographics', api_price: 150, selling_price: 200, plan_name: 'NIN By Demographics', validity: 'N/A', category: 'Verification', status: true },
    { provider: 'billsplash', network: 'IDENTITY', api_plan_id: 'ipe-clearance', api_price: 200, selling_price: 300, plan_name: 'IPE Clearance', validity: 'N/A', category: 'Verification', status: true },
    // Placeholders for undocumented
    { provider: 'billsplash', network: 'IDENTITY', api_plan_id: 'adult-enrollment', api_price: 500, selling_price: 1000, plan_name: 'Adult Enrollment', validity: 'N/A', category: 'Enrollment', status: false },
    { provider: 'billsplash', network: 'IDENTITY', api_plan_id: 'child-enrollment', api_price: 500, selling_price: 1000, plan_name: 'Child Enrollment', validity: 'N/A', category: 'Enrollment', status: false },
    { provider: 'billsplash', network: 'IDENTITY', api_plan_id: 'nin-modify', api_price: 300, selling_price: 500, plan_name: 'NIN Modify', validity: 'N/A', category: 'Modification', status: false },
    { provider: 'billsplash', network: 'IDENTITY', api_plan_id: 'nin-delink', api_price: 300, selling_price: 500, plan_name: 'NIN Delink', validity: 'N/A', category: 'Modification', status: false },
    { provider: 'billsplash', network: 'IDENTITY', api_plan_id: 'bvn-modify', api_price: 300, selling_price: 500, plan_name: 'BVN Modify', validity: 'N/A', category: 'Modification', status: false },
];

const seedIdentityPlans = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB. Seeding Identity plans...');
        let inserted = 0;
        let updated = 0;
        
        for (const plan of identityPlans) {
            const result = await DataPlan.updateOne(
                { provider: plan.provider, network: plan.network, api_plan_id: plan.api_plan_id },
                { $set: plan },
                { upsert: true }
            );
            if (result.upsertedCount > 0) inserted++;
            else if (result.modifiedCount > 0) updated++;
        }
        console.log(`Seeding Complete! Inserted: ${inserted}, Updated: ${updated}`);
        process.exit(0);
    } catch (e) {
        console.error('Seeding Failed:', e);
        process.exit(1);
    }
};

seedIdentityPlans();
