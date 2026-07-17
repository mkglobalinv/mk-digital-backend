import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const count = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 30000 });
        const { default: DataPlan } = await import('./models/DataPlan.js');

        const numGlo = await DataPlan.countDocuments({ network: 'GLO', provider: 'clubkonnect' });
        console.log(`Current Glo Plans Count: ${numGlo}`);
        
        process.exit(0);
    } catch (err) {
        console.error("Failed:", err);
        process.exit(1);
    }
};

count();
