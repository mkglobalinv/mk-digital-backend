import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import Withdrawal from './models/Withdrawal.js';
import User from './models/User.js';
import AdminLog from './models/AdminLog.js';

async function test() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/mkdigital', { serverSelectionTimeoutMS: 15000 });
        console.log('Connected!');
        
        const pending = await Withdrawal.find({ status: 'pending' });
        const admin = await User.findOne({ role: 'superadmin' });
        
        if (pending.length > 0 && admin) {
             const w = pending[0];
             try {
                 const log = new AdminLog({ adminId: admin._id, action: 'APPROVE_WITHDRAWAL', details: { withdrawalId: w._id } });
                 await log.validate();
                 console.log('AdminLog Validation passed!');
             } catch (valErr) {
                 console.error('AdminLog Validation Error:', valErr.message);
             }
        }
        
        process.exit(0);
    } catch(e) {
        console.error('Failed to connect:', e.message);
        process.exit(1);
    }
}
test();
