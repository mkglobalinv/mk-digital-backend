import mongoose from 'mongoose';
import dotenv from 'dotenv';

import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import Withdrawal from '../models/Withdrawal.js';
import ApiLog from '../models/ApiLog.js';
import SystemLog from '../models/SystemLog.js';
import AdminLog from '../models/AdminLog.js';
import Notification from '../models/Notification.js';
import SystemNotification from '../models/SystemNotification.js';

dotenv.config();

async function runReset() {
    console.log('Starting Pre-Launch Reset...');
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB.');

        // 1. Reset Users
        console.log('Resetting User financial fields to 0...');
        const userUpdateResult = await User.updateMany({}, {
            $set: {
                balance: 0,
                balance1: 0,
                sandboxBalance: 0,
                earningsBalance: 0,
                commissionBalance: 0,
                totalSpent: 0,
                totalFunded: 0
            }
        });
        console.log(`Updated ${userUpdateResult.modifiedCount} users.`);

        // 2. Clear Collections
        console.log('Clearing Transaction records...');
        const txResult = await Transaction.deleteMany({});
        console.log(`Deleted ${txResult.deletedCount} transactions.`);

        console.log('Clearing Withdrawal records...');
        const withdrawalResult = await Withdrawal.deleteMany({});
        console.log(`Deleted ${withdrawalResult.deletedCount} withdrawals.`);

        console.log('Clearing ApiLogs...');
        const apiLogResult = await ApiLog.deleteMany({});
        console.log(`Deleted ${apiLogResult.deletedCount} apilogs.`);

        console.log('Clearing SystemLogs...');
        const sysLogResult = await SystemLog.deleteMany({});
        console.log(`Deleted ${sysLogResult.deletedCount} systemlogs.`);

        console.log('Clearing AdminLogs...');
        const adminLogResult = await AdminLog.deleteMany({});
        console.log(`Deleted ${adminLogResult.deletedCount} adminlogs.`);

        console.log('Clearing Notifications...');
        const notifResult = await Notification.deleteMany({});
        console.log(`Deleted ${notifResult.deletedCount} notifications.`);

        const sysNotifResult = await SystemNotification.deleteMany({});
        console.log(`Deleted ${sysNotifResult.deletedCount} system notifications.`);

        console.log('Pre-Launch Reset completed successfully.');
    } catch (err) {
        console.error('Error during reset:', err);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB.');
        process.exit(0);
    }
}

runReset();
