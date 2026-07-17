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
        
        let user = await User.findOne({ role: 'user' });
        if (!user) {
             user = await User.create({ name: 'Test', email: 'test@test.com', password: 'pwd', role: 'user', earningsBalance: 5000 });
        } else {
             user.earningsBalance = 5000;
             await user.save();
        }
        const userToken = jwt.sign({ id: user._id, role: user.role }, secret, { expiresIn: '1d' });
        await Session.create({ token: userToken, userId: user._id, ipAddress: '127.0.0.1', userAgent: 'test', isValid: true });

        console.log('User requesting withdrawal...');
        const res1 = await fetch('http://localhost:8800/user/withdraw', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + userToken },
            body: JSON.stringify({ amount: 1000, bankName: 'GTB', accountNumber: '0123456789', accountName: 'Test' })
        });
        const text1 = await res1.text();
        console.log('Withdrawal creation status:', res1.status);
        console.log('Withdrawal creation response:', text1);
        
        if (res1.status !== 200) {
            process.exit(1);
        }

        const w = await Withdrawal.findOne({ userId: user._id, status: 'pending' }).sort({ createdAt: -1 });
        if (!w) {
            console.log('Withdrawal not found in DB!');
            process.exit(1);
        }
        
        console.log('Admin approving withdrawal', w._id, '...');
        const res2 = await fetch('http://localhost:8800/api/admin/withdrawals/approve', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + adminToken },
            body: JSON.stringify({ withdrawalId: w._id })
        });

        const text2 = await res2.text();
        console.log('Approve status:', res2.status);
        console.log('Approve response:', text2);

        process.exit(0);
    } catch (err) {
        console.error('DEBUGGER CAUGHT ERROR:');
        console.error(err.stack);
        process.exit(1);
    }
}
testFull();
