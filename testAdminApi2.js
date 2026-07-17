import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

import Withdrawal from './models/Withdrawal.js';
import Transaction from './models/Transaction.js';
import Notification from './models/Notification.js';
import AdminLog from './models/AdminLog.js';
import User from './models/User.js';
import Session from './models/Session.js';
import fetch from 'node-fetch';

async function testApprove() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/mkdigital');
        console.log('Connected to MongoDB.');

        const admin = await User.findOne({ role: 'superadmin' });
        
        let t = await Transaction.create({
            userId: admin._id,
            type: 'debit',
            status: 'pending',
            amount: 1000,
            description: 'Test',
            reference: 'TEST-123'
        });

        let w = await Withdrawal.create({
            userId: admin._id,
            amount: 1000,
            bankName: 'Test Bank',
            accountNumber: '1234567890',
            accountName: 'Test Account',
            status: 'pending',
            transactionId: t._id
        });
        
        console.log('Using withdrawal:', w._id);
        console.log('With transactionId:', w.transactionId);

        const secret = process.env.JWT_SECRET || 'mk_sub_data_secret_2024_premium';
        const token = jwt.sign({ id: admin._id, role: admin.role }, secret, { expiresIn: '1d' });
        
        await Session.create({
            userId: admin._id,
            token: token,
            deviceInfo: 'test',
            ipAddress: '127.0.0.1'
        });

        console.log('Created session. Now making HTTP request...');

        const response = await fetch('http://localhost:5000/api/admin/withdrawals/approve', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': \Bearer \\
            },
            body: JSON.stringify({ withdrawalId: w._id })
        });

        const text = await response.text();
        console.log('HTTP Status:', response.status);
        console.log('HTTP Response:', text);

        process.exit(0);
    } catch (err) {
        console.error('DEBUGGER CAUGHT ERROR:');
        console.error(err.stack);
        process.exit(1);
    }
}

testApprove();
