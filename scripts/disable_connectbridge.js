import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
import DataPlan from '../models/DataPlan.js';

async function disableConnectBridge() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB.');

        const result = await DataPlan.updateMany(
            { provider: 'connectbridge', status: true },
            { $set: { status: false } }
        );

        console.log(`Successfully deactivated ${result.modifiedCount} ConnectBridge plans.`);
        process.exit(0);
    } catch (err) {
        console.error('Failed to deactivate plans:', err);
        process.exit(1);
    }
}

disableConnectBridge();
