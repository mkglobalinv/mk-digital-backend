import mongoose from 'mongoose';
import DataPlan from '../models/DataPlan.js';
import dotenv from 'dotenv';

dotenv.config();

const removeBillsplashPlans = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);

        console.log('Connected to DB. Removing Billsplash plans...');

        const result = await DataPlan.deleteMany({ provider: 'billsplash' });

        console.log(`Deleted ${result.deletedCount} DataPlans with provider: billsplash`);
        
        // Also remove Billsplash from ProviderStatus collection
        const ProviderStatus = (await import('../models/ProviderStatus.js')).default;
        const statusResult = await ProviderStatus.deleteOne({ providerName: 'billsplash' });
        console.log(`Deleted Billsplash from ProviderStatus: ${statusResult.deletedCount}`);

        console.log('Done.');
        process.exit(0);
    } catch (err) {
        console.error('Migration error:', err);
        process.exit(1);
    }
};

removeBillsplashPlans();
