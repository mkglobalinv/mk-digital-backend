import mongoose from 'mongoose';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
dotenv.config();

import User from './models/User.js';
import Session from './models/Session.js';
import Withdrawal from './models/Withdrawal.js';

async function testFull() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/mkdigital');
        console.log('Connected to MongoDB.');

        const admin = await User.findOne({ role: 'superadmin' });
        const secret = process.env.JWT_SECRET || 'mk_sub_data_secret_2024_premium';
        const adminToken = jwt.sign({ id: admin._id, role: admin.role }, secret, { expiresIn: '1d' });
        await Session.create({ token: adminToken, userId: admin._id, ipAddress: '127.0.0.1', userAgent: 'test', isValid: true, type: 'admin' });
        
        const pending = await Withdrawal.find({ status: 'pending' });
        console.log('Found ' + pending.length + ' pending withdrawals.');

        for (let i = 0; i < pending.length; i++) {
             const w = pending[i];
             console.log('Admin approving withdrawal', w._id, '...');
             const res = await fetch('http://localhost:8800/api/admin/withdrawals/approve', {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + adminToken },
                 body: JSON.stringify({ withdrawalId: w._id })
             });

             const text = await res.text();
             console.log('Approve status:', res.status);
             console.log('Approve response:', text);
        }

        process.exit(0);
    } catch (err) {
        console.error('DEBUGGER CAUGHT ERROR:');
        console.error(err.stack);
        process.exit(1);
    }
}
testFull();
