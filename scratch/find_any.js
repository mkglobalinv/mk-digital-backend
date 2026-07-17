import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function findUsers() {
    await mongoose.connect(process.env.MONGO_URI);
    const db = mongoose.connection.db;
    
    const anyMatches = await db.collection('users').find({ referredBy: null, balance1: { $gt: 0 }, role: 'user' }).toArray();
    console.log(`Orphaned users with balance > 0: ${anyMatches.length}`);
    for (let u of anyMatches) {
        console.log(`- ${u._id} | ${u.email} | balance: ${u.balance1} | date: ${u.createdAt}`);
    }
    
    process.exit(0);
}

findUsers();
