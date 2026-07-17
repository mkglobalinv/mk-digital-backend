import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import ApiLog from '../models/ApiLog.js';
import SystemLog from '../models/SystemLog.js';
import User from '../models/User.js';

const connectDB = async () => {
    const connString = process.env.MONGO_URI;
    console.log("Connecting to:", connString.split('@')[1] || "localhost");
    await mongoose.connect(connString);
};

const trace = async () => {
    await connectDB();
    console.log("DB Connected.");
    
    const apiLogs = await ApiLog.find({ endpoint: { $regex: /register-with-payment/i } })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();
    
    console.log("Recent API Logs:");
    apiLogs.forEach(log => console.log(JSON.stringify(log, null, 2)));

    const sysLogs = await SystemLog.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();
    console.log("Recent System Logs:");
    sysLogs.forEach(log => console.log(JSON.stringify(log, null, 2)));

    const users = await User.find().sort({ createdAt: -1 }).limit(10).lean();
    console.log("Recent Users:");
    users.forEach(u => console.log(u.email, u.createdAt, u.admin_subdomain, u.subdomain));

    process.exit(0);
};

trace().catch(console.error);
