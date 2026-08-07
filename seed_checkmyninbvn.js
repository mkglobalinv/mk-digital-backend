import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mk-digital';

const DataPlanSchema = new mongoose.Schema({
    network: { type: String, required: true, uppercase: true },
    category: { type: String, required: true },
    plan_name: { type: String, required: true },
    plan_size: { type: String, default: '' },
    api_plan_id: { type: String, required: true },
    api_price: { type: Number, required: true },
    selling_price: { type: Number, required: true },
    status: { type: Boolean, default: true },
    provider: { type: String, required: true, lowercase: true }
}, { strict: false });

const DataPlan = mongoose.model('DataPlan', DataPlanSchema, 'dataplans');

const plansToSeed = [
    { name: 'NIN Verification', id: 'nin-verify', api_price: 150 },
    { name: 'NIN by Phone', id: 'nin-phone', api_price: 250 },
    { name: 'NIN by Tracking ID', id: 'nin-tracking', api_price: 150 },
    { name: 'NIN by Demographics', id: 'nin-demographics', api_price: 250 },
    { name: 'BVN Verification', id: 'bvn-verify', api_price: 150 },
    { name: 'BVN by Phone', id: 'bvn-phone', api_price: 250 },
    { name: 'NIN Modification', id: 'nin-modification', api_price: 16000 }
];

async function run() {
    await mongoose.connect(uri);
    console.log("Connected to MongoDB.");

    for (const plan of plansToSeed) {
        // Find existing plan
        let existing = await DataPlan.findOne({ api_plan_id: plan.id, network: 'IDENTITY' });
        
        // As per Pricing Engine V3 requirements, we supply the base prices.
        // We set selling_price to a baseline (e.g., api_price + 50) so the DB schema is satisfied,
        // but the actual retail price can be adjusted by the admin dashboard.
        const defaultMarkup = plan.id === 'nin-modification' ? 1000 : 50;
        const baselineSellingPrice = plan.api_price + defaultMarkup;

        if (existing) {
            existing.api_price = plan.api_price;
            existing.selling_price = baselineSellingPrice;
            existing.provider = 'checkmyninbvn';
            await existing.save();
            console.log(`Updated existing plan: ${plan.name} (${plan.id})`);
        } else {
            await DataPlan.create({
                network: 'IDENTITY',
                category: 'Identity Verification',
                plan_name: plan.name,
                api_plan_id: plan.id,
                api_price: plan.api_price,
                selling_price: baselineSellingPrice,
                provider: 'checkmyninbvn',
                status: true
            });
            console.log(`Created new plan: ${plan.name} (${plan.id})`);
        }
    }

    console.log("Seeding complete.");
    process.exit(0);
}
run().catch(console.error);
