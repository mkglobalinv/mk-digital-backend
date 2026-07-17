import mongoose from 'mongoose';
import FuturePlatform from './models/FuturePlatform.js';
import dotenv from 'dotenv';
dotenv.config();

async function check() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mkdigital');
        // Try to save BBC Hausa exactly as the frontend sends it WITHOUT A LOGO
        const platform = new FuturePlatform({
            name: 'BBC Hausa No Logo',
            retailDisplayName: 'BBC Hausa',
            ownerDisplayNameTemplate: '{Brand}',
            logoUrl: '',
            url: 'https://bbchausa.com',
            mode: 'external',
            status: true,
            displayOrder: 1
        });
        await platform.save();
        console.log("Successfully saved test platform with EMPTY logo!");
        await FuturePlatform.deleteOne({ name: 'BBC Hausa No Logo' });
    } catch(e) {
        console.error("DB Error:", e.message);
    }
    process.exit(0);
}
check();
