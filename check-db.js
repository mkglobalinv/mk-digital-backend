import mongoose from 'mongoose';
import FuturePlatform from './models/FuturePlatform.js';
import dotenv from 'dotenv';
dotenv.config();

async function check() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const p = await FuturePlatform.find();
        console.log("All platforms:", p.map(x => x.name));
    } catch(e) {
        console.error("DB Error:", e.message);
    }
    process.exit(0);
}
check();
