import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import { processLifetimeReferralCashback } from '../services/referralCashbackEngine.js';

dotenv.config();

async function run() {
    await mongoose.connect(process.env.MONGO_URI);

    // Create a dummy user
    const referrer = new User({ email: 'referrer@test.com', role: 'user', balance1: 0 });
    await referrer.save();

    const buyer = new User({ email: 'buyer@test.com', role: 'user', referredBy: referrer._id, balance1: 0, balance2: 0 });
    await buyer.save();

    // Create a dummy transaction
    const tx = new Transaction({
        userId: buyer._id,
        selling_price: 250,
        cost_price: 240,
        amount: 250,
        status: 'success',
        reference: `TEST-${Date.now()}`,
        description: 'MTN Data 1GB'
    });
    await tx.save();

    console.log("Before:");
    console.log("Referrer Earnings:", referrer.earningsBalance);
    console.log("Buyer Cashback:", buyer.balance2);

    await processLifetimeReferralCashback(tx, buyer);

    const updatedReferrer = await User.findById(referrer._id);
    const updatedBuyer = await User.findById(buyer._id);

    console.log("After:");
    console.log("Referrer Earnings:", updatedReferrer.earningsBalance);
    console.log("Buyer Cashback:", updatedBuyer.balance2);

    await User.deleteMany({ email: { $in: ['referrer@test.com', 'buyer@test.com'] } });
    await Transaction.deleteMany({ reference: tx.reference });

    mongoose.connection.close();
}

run();
