import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const testUpsert = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 30000 });
        const { default: DataPlan } = await import('./models/DataPlan.js');

        const p = {
            plan_id: '100.01',
            name: '125MB - 1 day (Awoof Data)',
            price: 100
        };
        const network = 'GLO';

        console.log("Attempting upsert...");
        const result = await DataPlan.findOneAndUpdate(
            { api_plan_id: String(p.plan_id), provider: 'clubkonnect', network: network },
            {
                network: network,
                category: 'Awoof',
                plan_name: p.name,
                plan_size: '125MB',
                api_price: p.price,
                $setOnInsert: {
                    selling_price: 120,
                    status: true,
                    validity: '1 day'
                }
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        console.log("Upsert successful:", result);
        process.exit(0);
    } catch (err) {
        console.error("Upsert failed:", err);
        process.exit(1);
    }
};

testUpsert();
