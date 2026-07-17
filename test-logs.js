import mongoose from 'mongoose';
import dotenv from 'dotenv';
import SystemLog from './models/SystemLog.js';

dotenv.config({ path: './.env' });

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const count = await SystemLog.countDocuments();
        console.log(`SystemLogs count: ${count}`);
    } catch (e) {
        console.error("Error", e);
    } finally {
        await mongoose.disconnect();
    }
}
run();
