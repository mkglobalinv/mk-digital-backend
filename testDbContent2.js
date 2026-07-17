import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import Withdrawal from './models/Withdrawal.js';

async function test() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/mkdigital');
        const all = await Withdrawal.find({});
        console.log('Total withdrawals:', all.length);
        console.log('Approved:', all.filter(w => w.status === 'approved').length);
        console.log('Pending:', all.filter(w => w.status === 'pending').length);
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}
test();
