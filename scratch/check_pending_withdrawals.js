import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import Withdrawal from '../models/Withdrawal.js';

async function main() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB.");
        
        const withdrawals = await Withdrawal.find({ status: 'pending' });
        console.log(`Found ${withdrawals.length} pending withdrawals:`);
        for (const w of withdrawals) {
            console.log({
                _id: w._id,
                userId: w.userId,
                amount: w.amount,
                bankName: w.bankName,
                accountNumber: w.accountNumber,
                status: w.status,
                transactionId: w.transactionId,
                transactionIdType: typeof w.transactionId,
                transactionIdConstructor: w.transactionId ? w.transactionId.constructor.name : null,
                createdAt: w.createdAt
            });
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

main();
