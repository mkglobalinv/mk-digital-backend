import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { buyData } from './services/vtuService.js';

dotenv.config({ path: './.env' });

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');
        
        // Mock payload
        console.log('--- Testing Smart Option (Peyflex) ---');
        let res1 = await buyData('MTN', '500', '08031234567', 100, 'NG', null, null, 'smart');
        console.log(res1);

        console.log('\n--- Testing Value Option (Billsplash) ---');
        let res2 = await buyData('MTN', 'mtn-1gb', '08031234567', 100, 'NG', null, null, 'value');
        console.log(res2);

    } catch (e) {
        console.error("Error", e);
    } finally {
        await mongoose.disconnect();
    }
}
run();
