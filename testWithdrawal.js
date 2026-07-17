import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import Withdrawal from './models/Withdrawal.js';
import User from './models/User.js';
import Transaction from './models/Transaction.js';
import Notification from './models/Notification.js';
import AdminLog from './models/AdminLog.js';

async function test() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/mkdigital', { serverSelectionTimeoutMS: 15000 });
        console.log('Connected!');
        
        const pending = await Withdrawal.find({ status: 'pending' });
        console.log('Pending withdrawals:', pending.length);
        
        if (pending.length > 0) {
             const w = pending[0];
             console.log('First pending withdrawal ID:', w._id);
             
             // Simulate what the admin controller does
             try {
                 w.status = 'approved';
                 // We won't actually save, just validate
                 await w.validate();
                 console.log('Validation passed!');
             } catch (valErr) {
                 console.error('Validation Error:', valErr.message);
             }
        }
        
        process.exit(0);
    } catch(e) {
        console.error('Failed to connect:', e.message);
        process.exit(1);
    }
}
test();
