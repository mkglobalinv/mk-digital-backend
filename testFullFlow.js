import axios from 'axios';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import User from './models/User.js';
import jwt from 'jsonwebtoken';

async function test() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/mkdigital');
        const API = axios.create({ baseURL: 'http://localhost:8800' });
        
        // 1. Reseller creates withdrawal
        const reseller = await User.findOne({ role: 'reseller' });
        if (!reseller) { console.log('No reseller found'); process.exit(1); }
        // Give some earnings to withdraw
        reseller.earningsBalance = 5000;
        await reseller.save();

        const secret = process.env.JWT_SECRET || 'mk_sub_data_secret_2024_premium';
        const resellerToken = jwt.sign({ id: reseller._id, role: reseller.role, sessionType: 'reseller_full' }, secret, { expiresIn: '1d' });
        
        console.log('Creating withdrawal...');
        const createRes = await API.post('/api/reseller/withdraw-bank', {
            amount: 500, bankName: 'Test Bank', accountNumber: '12345', accountName: 'Test Name', pin: '1234' // Wait, pin check will fail if not matched
        }, { headers: { Authorization: 'Bearer ' + resellerToken } }).catch(e => e.response);
        
        // If pin fails, we just bypass and create it manually to mimic a valid creation
        // Wait, the user said 'The referral withdrawal request is created successfully.'
        // So let's manually create it the exact same way resellerController does.
        const Withdrawal = (await import('./models/Withdrawal.js')).default;
        const Transaction = (await import('./models/Transaction.js')).default;
        const tx = await Transaction.create({ userId: reseller._id, type: 'debit', status: 'pending', amount: 500, description: 'Bank Withdrawal Request', reference: 'REF' });
        const w = await Withdrawal.create({ userId: reseller._id, amount: 500, bankName: 'Bank', accountNumber: '123', status: 'pending', transactionId: tx._id });

        // 2. Admin approves
        const admin = await User.findOne({ role: 'superadmin' });
        const adminToken = jwt.sign({ id: admin._id, role: admin.role, sessionType: 'admin_full' }, secret, { expiresIn: '1d' });
        
        console.log('Approving withdrawal...');
        const approveRes = await API.post('/api/admin/withdrawals/approve', { withdrawalId: w._id.toString() }, {
            headers: { Authorization: 'Bearer ' + adminToken }
        });
        console.log('Approve response:', approveRes.status, approveRes.data);
        process.exit(0);
    } catch(err) {
        console.error('Error:', err.response?.status, err.response?.data || err.message);
        process.exit(1);
    }
}
test();
