import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mkdigital');
        console.log("Connected to MongoDB");

        const uModule = await import('../models/User.js');
        const User = uModule.default;
        
        const tModule = await import('../models/Transaction.js');
        const Transaction = tModule.default;

        const users = await User.find({
            $or: [
                { 'account_number': '9906534779' },
                { 'account_number2': '9906534779' }
            ]
        });
        
        if (users.length === 0) {
            console.log("User not found");
            process.exit(0);
        }

        const user = users[0];
        console.log(`Found user: ${user.email} (ID: ${user._id}) with Balance: ${user.balance1}`);

        const txs = await Transaction.find({ userId: user._id }).sort({ createdAt: -1 }).limit(10);
        
        console.log(`Found ${txs.length} recent transactions for user:`);
        txs.forEach(t => {
            console.log(`- ${t.type} | Amount: ${t.amount} | Status: ${t.status} | Ref: ${t.reference} | Desc: ${t.description} | Date: ${t.createdAt}`);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

run();
