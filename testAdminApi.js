import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import { approveWithdrawal } from './controllers/adminController.js';
import Withdrawal from './models/Withdrawal.js';
import Transaction from './models/Transaction.js';
import Notification from './models/Notification.js';
import AdminLog from './models/AdminLog.js';
import User from './models/User.js';

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
        if (w.transactionId) {
            console.log('With transactionId:', w.transactionId);
        } else {
            console.log('No transactionId attached.');
        }

        const req = {
            body: { withdrawalId: w._id },
            user: admin
        };
        
        const res = {
            status: function(code) {
                this.statusCode = code;
                return this;
            },
            json: function(data) {
                console.log('Response status:', this.statusCode || 200);
                console.log('Response body:', data);
            }
        };

        console.log('Calling approveWithdrawal...');
        await approveWithdrawal(req, res);

        process.exit(0);
    } catch (err) {
        console.error('DEBUGGER CAUGHT ERROR:');
        console.error(err.stack);
        process.exit(1);
    }
}

testApprove();
