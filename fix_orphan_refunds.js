import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const TransactionSchema = new mongoose.Schema({
    userId: mongoose.Schema.Types.ObjectId,
    status: String,
    amount: Number,
    balance_deducted: { type: Boolean, default: false },
    reference: String
});

const Transaction = mongoose.model('Transaction', TransactionSchema);

const UserSchema = new mongoose.Schema({
    totalBalance: Number
});

const User = mongoose.model('User', UserSchema);

async function fixOrphanDeductions() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB.");

        const orphans = await Transaction.find({ 
            status: 'failed', 
            balance_deducted: true 
        });

        console.log(`Found ${orphans.length} orphan deductions.`);

        for (const tx of orphans) {
            console.log(`Refunding TX ${tx.reference} | Amount: ${tx.amount} | User: ${tx.userId}`);
            await User.findByIdAndUpdate(tx.userId, { $inc: { totalBalance: tx.amount } });
            tx.balance_deducted = false;
            await tx.save();
            console.log(`  Refunded and marked.`);
        }

        process.exit(0);
    } catch (e) {
        console.error(e.message);
        process.exit(1);
    }
}

fixOrphanDeductions();
