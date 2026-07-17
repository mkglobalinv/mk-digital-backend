import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

import User from "../models/User.js";

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/vtuapp");
        console.log("Connected to MongoDB for Index Fix.");

        // Ensure all active users have archived: false so we can use equality in the partial index
        const res = await User.updateMany(
            { archived: { $ne: true } },
            { $set: { archived: false } }
        );
        console.log(`Set archived: false on ${res.modifiedCount} active users.`);

        try {
            await User.collection.dropIndex("email_1");
        } catch (e) {}

        await User.collection.createIndex(
            { email: 1 }, 
            { 
                unique: true, 
                partialFilterExpression: { archived: false } 
            }
        );
        console.log("Created new unique global email index with partialFilterExpression { archived: false }.");

        console.log("\nIndex fix completed successfully.");
        process.exit(0);

    } catch (err) {
        console.error("Error during index fix:", err);
        process.exit(1);
    }
};

run();
