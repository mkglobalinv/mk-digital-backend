import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import Transaction from '../models/Transaction.js';

async function run() {
    await mongoose.connect(process.env.MONGO_URI);

    const ids = [
        '6a46600e15990616df82c435',
        '6a465fce15990616df82c1fa'
    ];

    for (const id of ids) {
        const tx = await Transaction.findById(id);
        console.log(`\nGrandparent Transaction ${id}:`, JSON.stringify(tx, null, 2));
    }

    await mongoose.disconnect();
}

run().catch(console.error);
