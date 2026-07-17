import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import { processLifetimeReferralCashback } from '../services/referralCashbackEngine.js';

async function run() {
    try {
        console.log("Connecting to", process.env.MONGO_URI);
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB.");

        const referrer = new User({ email: 'ref1@test.com', name: 'Ref1', password: 'test', role: 'user', balance1: 0 });
        await referrer.save();

        const buyer = new User({ email: 'buy1@test.com', name: 'Buy1', password: 'test', role: 'user', referredBy: referrer._id, balance1: 0, balance2: 0 });
        await buyer.save();

        const tx = new Transaction({
            userId: buyer._id,
            selling_price: 250,
            cost_price: 240,
            amount: 250,
            status: 'success',
            reference: `DATA-PND-${Date.now()}`,
            description: 'MTN Data 1GB'
        });
        await tx.save();

        console.log("Running processLifetimeReferralCashback...");
        await processLifetimeReferralCashback(tx, buyer);

        const updatedReferrer = await User.findById(referrer._id);
        const updatedBuyer = await User.findById(buyer._id);

        console.log("Referrer Earnings:", updatedReferrer.earningsBalance);
        console.log("Buyer Cashback:", updatedBuyer.balance2);

        await User.deleteMany({ email: { $in: ['ref1@test.com', 'buy1@test.com'] } });
        await Transaction.deleteMany({ reference: tx.reference });

        console.log("Done.");
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
run();
