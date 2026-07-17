import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import User from '../models/User.js';
import AdminLog from '../models/AdminLog.js';
import BackupLog from '../models/BackupLog.js';

dotenv.config();

async function run() {
    try {
        console.log("Connecting to MongoDB using MONGO_URI...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected.");

        const adminLogCount = await AdminLog.countDocuments({});
        console.log("Total AdminLogs in DB:", adminLogCount);

        if (adminLogCount > 0) {
            const sampleLogs = await AdminLog.find().sort({ createdAt: -1 }).limit(10).populate('adminId', 'name email');
            console.log("Sample AdminLogs:", JSON.stringify(sampleLogs, null, 2));
        }

        const backupLogCount = await BackupLog.countDocuments({});
        console.log("Total BackupLogs in DB:", backupLogCount);

        if (backupLogCount > 0) {
            const sampleBackups = await BackupLog.find().sort({ createdAt: -1 }).limit(10);
            console.log("Sample BackupLogs:", JSON.stringify(sampleBackups, null, 2));
        }

    } catch (err) {
        console.error("Error during query:", err);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected from MongoDB.");
    }
}

run();
