import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import Withdrawal from './models/Withdrawal.js';

async function test() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/mkdigital');
        const pending = await Withdrawal.find({ status: 'pending' });
        console.log('Pending withdrawals:', pending.length);
        if (pending.length > 0) {
            console.log('First withdrawal:', JSON.stringify(pending[0], null, 2));
        }
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}
test();
