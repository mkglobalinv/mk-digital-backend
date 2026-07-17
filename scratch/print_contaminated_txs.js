import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import Transaction from '../models/Transaction.js';

async function run() {
    await mongoose.connect(process.env.MONGO_URI);

    const ids = [
        '6a46601415990616df82c49a',
        '6a465fd315990616df82c26f'
    ];

    for (const id of ids) {
        const tx = await Transaction.findById(id);
        console.log(`\nTransaction ${id}:`, JSON.stringify(tx, null, 2));
    }

    await mongoose.disconnect();
}

run().catch(console.error);
