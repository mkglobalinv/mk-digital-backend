import mongoose from 'mongoose';
import dotenv from 'dotenv';
import AppBuildJob from '../models/AppBuildJob.js';

dotenv.config();

async function checkJobs() {
    await mongoose.connect(process.env.MONGO_URI);
    const jobs = await AppBuildJob.find().sort({ createdAt: -1 }).limit(3);
    for (const job of jobs) {
        console.log(`Job ${job._id}: Status=${job.status}, Stage=${job.stage}, Progress=${job.progressPct}%`);
        console.log(`Logs:`, job.buildLogs.slice(-2));
        console.log('---');
    }
    process.exit(0);
}

checkJobs();
