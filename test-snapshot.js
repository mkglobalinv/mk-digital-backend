import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { ensureSafeSnapshot } from './controllers/recoveryController.js';

dotenv.config();

async function test() {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/mk-digital');
    try {
        console.log("Creating snapshot...");
        const snapshot = await ensureSafeSnapshot('test@admin.com', 'test');
        console.log("Success:", snapshot);
    } catch (e) {
        console.error("Error occurred:", e.message);
    } finally {
        await mongoose.disconnect();
    }
}
test();
