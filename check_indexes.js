import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 30000 });
        const { default: DataPlan } = await import('./models/DataPlan.js');

        const indexes = await DataPlan.collection.indexes();
        console.log("Indexes on DataPlan:", JSON.stringify(indexes, null, 2));

        process.exit(0);
    } catch (err) {
        console.error("Failed:", err);
        process.exit(1);
    }
};

run();
