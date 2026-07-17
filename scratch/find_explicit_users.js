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
    
    // Find ANY user with C119A8A0 in referralCodeUsed
    const exactMatches = await db.collection('users').find({ referralCodeUsed: 'C119A8A0' }).toArray();
    console.log(`Exact Matches for referralCodeUsed='C119A8A0': ${exactMatches.length}`);
    for (let u of exactMatches) {
        console.log(`- ${u._id} | ${u.email} | referredBy: ${u.referredBy} | date: ${u.createdAt}`);
    }
    
    // Also try to find by lowercase
    const lowerMatches = await db.collection('users').find({ referralCodeUsed: /c119a8a0/i }).toArray();
    console.log(`Case-insensitive Matches: ${lowerMatches.length}`);
    
    process.exit(0);
}

findUsers();
