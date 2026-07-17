import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import Withdrawal from './models/Withdrawal.js';
import Transaction from './models/Transaction.js';
import Notification from './models/Notification.js';
import AdminLog from './models/AdminLog.js';
import User from './models/User.js';

async function testApprove() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/mkdigital');
        console.log("Connected to MongoDB.");

        const w = await Withdrawal.findOne({ status: 'pending' }).sort({ createdAt: -1 });
        if (!w) {
            console.log("No pending withdrawal found.");
            process.exit(0);
        }

        console.log("Found withdrawal:", w._id);
        console.log("transactionId on withdrawal:", w.transactionId);

        w.status = 'approved';
        console.log("Attempting w.save()...");
        await w.save();
        console.log("w.save() succeeded!");

        if (w.transactionId) {
            console.log("Attempting Transaction.findByIdAndUpdate...");
            await Transaction.findByIdAndUpdate(w.transactionId, { status: 'success' });
            console.log("Transaction update succeeded!");
        } else {
            console.log("w.transactionId is null, skipping transaction update.");
        }

        console.log("Attempting Notification.create...");
        await Notification.create({ userId: w.userId, title: "Withdrawal Approved", message: `Your withdrawal of ₦${w.amount} was processed.`, type: "transaction" });
        console.log("Notification created!");

        console.log("Attempting AdminLog.create...");
        const admin = await User.findOne({ role: 'superadmin' });
        if (admin) {
             await AdminLog.create({ adminId: admin._id, action: 'APPROVE_WITHDRAWAL', details: { withdrawalId: w._id } });
             console.log("AdminLog created!");
        } else {
             console.log("No admin found for AdminLog.");
        }

        console.log("ALL STEPS SUCCEEDED!");
        process.exit(0);
    } catch (err) {
        console.error("DEBUGGER CAUGHT ERROR:");
        console.error(err.stack);
        process.exit(1);
    }
}

testApprove();
