import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import Transaction from '../models/Transaction.js';

async function run() {
    await mongoose.connect(process.env.MONGO_URI);

    const ids = [
        '6a46601315990616df82c486',
        '6a465fd215990616df82c24b'
    ];

    for (const id of ids) {
        const tx = await Transaction.findById(id);
        console.log(`\nParent Transaction ${id}:`, JSON.stringify(tx, null, 2));
    }

    await mongoose.disconnect();
}

run().catch(console.error);
