import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
import Transaction from '../models/Transaction.js';

async function getLatestFailure() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const tx = await Transaction.findOne({ status: 'failed' }).sort({ createdAt: -1 }).lean();
        console.log(JSON.stringify(tx, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
getLatestFailure();
