import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import User from './models/User.js';

async function run() {
    await mongoose.connect(process.env.MONGO_URI);

    const referrers = await User.find({ referralCode: { $regex: /C119A8A0/i } });
    console.log('Referrers found:', referrers.map(r => ({ id: r._id, email: r.email, code: r.referralCode })));

    for (const ref of referrers) {
        const referred = await User.find({ referredBy: ref._id });
        console.log(`Referred users for ${ref.email}:`, referred.map(u => ({ id: u._id, email: u.email })));
    }

    await mongoose.disconnect();
}

run().catch(console.error);
