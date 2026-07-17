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
    
    const referrerId = new mongoose.Types.ObjectId('6a1b120ad6eb0f33dc8c6c32');
    const referredUsers = await db.collection('users').find({ referredBy: referrerId }).toArray();
    console.log(`Users successfully referred by C119A8A0: ${referredUsers.length}`);
    for (let u of referredUsers) {
        console.log(`- ${u._id} | ${u.email} | date: ${u.createdAt} | codeUsed: ${u.referralCodeUsed}`);
    }
    
    process.exit(0);
}

findUsers();
