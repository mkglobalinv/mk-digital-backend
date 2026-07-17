import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import Withdrawal from './models/Withdrawal.js';
import User from './models/User.js';
import Notification from './models/Notification.js';

async function test() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/mkdigital', { serverSelectionTimeoutMS: 15000 });
        console.log('Connected!');
        
        const pending = await Withdrawal.find({ status: 'pending' });
        
        if (pending.length > 0) {
             const w = pending[0];
             try {
                 const notif = new Notification({ userId: w.userId, title: 'Withdrawal Approved', message: 'Your withdrawal of ?' + w.amount + ' was processed.', type: 'transaction' });
                 await notif.validate();
                 console.log('Notification Validation passed!');
             } catch (valErr) {
                 console.error('Notification Validation Error:', valErr.message);
             }
        }
        
        process.exit(0);
    } catch(e) {
        console.error('Failed to connect:', e.message);
        process.exit(1);
    }
}
test();
