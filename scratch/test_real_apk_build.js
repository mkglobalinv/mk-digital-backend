import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import User from '../models/User.js';
import { generateAppAssets } from '../services/appAssetService.js';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const testApkBuild = async () => {
    try {
        console.log("Connecting to DB...");
        if (!process.env.MONGO_URI) {
            console.error("MONGO_URI not found in env. Available keys:", Object.keys(process.env));
            process.exit(1);
        }
        await mongoose.connect(process.env.MONGO_URI);
        
        const user = await User.findOne({ email: 'unuktar@gmail.com' });
        if (!user) {
            console.error("User not found");
            process.exit(1);
        }

        console.log("Starting REAL APK Build Pipeline Test...");
        console.time("BuildDuration");
        
        const assets = await generateAppAssets(user);
        
        console.timeEnd("BuildDuration");
        console.log("Build successful!", assets);
        
        process.exit(0);
    } catch (err) {
        console.error("Build Failed:", err);
        process.exit(1);
    }
};

testApkBuild();
