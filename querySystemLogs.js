import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

async function run() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected successfully.\n");

        const db = mongoose.connection.db;
        const systemLogsColl = db.collection("systemlogs");

        // Find logs from the last hour (since 19:45 today, i.e., 20:45 local standard time, i.e., 19:45 UTC if database uses UTC)
        // Let's just find the last 50 logs in the collection.
        console.log("Fetching last 50 system logs...");
        const logs = await systemLogsColl.find({}).sort({ timestamp: -1, createdAt: -1 }).limit(50).toArray();
        console.log(`Found ${logs.length} logs.`);
        logs.forEach((log, idx) => {
            console.log(`\n--- Log ${idx + 1} ---`);
            console.log(`Time: ${log.timestamp || log.createdAt}`);
            console.log(`Level: ${log.level}`);
            console.log(`Message: ${log.message}`);
            console.log(`Meta:`, JSON.stringify(log.meta || log.metadata || log, null, 2));
        });

        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

run();
