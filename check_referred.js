import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import User from './models/User.js';

async function run() {
    await mongoose.connect(process.env.MONGO_URI);

    const users = await User.find({ 
        $or: [ 
            { referredBy: 'C119A8A0' }, 
            { referredBy: 'c119a8a0' } 
        ] 
    });
    console.log('Found by string code:', users.map(u => u.email));
    
    // Also find by Object ID exactly
    const stringId = await User.find({ referredBy: new mongoose.Types.ObjectId('6a1b120ad6eb0f33dc8c6c32') });
    console.log('Found by ObjectId:', stringId.map(u => u.email));

    // See if anyone registered with some variation of C119A8A0
    const fuzzy = await User.find({ referredBy: { $regex: /C119A8A0/i } });
    console.log('Found by regex:', fuzzy.map(u => u.email));

    await mongoose.disconnect();
}

run().catch(console.error);
