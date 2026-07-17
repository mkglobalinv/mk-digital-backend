import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

import User from "../models/User.js";

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/vtuapp");
        console.log("Connected to MongoDB for Snapshot.");

        const emails = [
            "reffar34@gmail.com",
            "unuktar1@gmail.com",
            "mkcollectn@gmail.com",
            "reciprocaltech@gmail.com",
            "unuktar@gmail.com"
        ];

        const users = await User.find({ email: { $in: emails.map(e => e.toLowerCase()) } });
        
        // Step 1: Create full backups
        fs.writeFileSync(path.join(__dirname, '../backups/full_users_backup.json'), JSON.stringify(users, null, 2));
        
        // Step 2: Create pre_migration_snapshot.json
        const snapshot = users.map(u => ({
            userId: u._id.toString(),
            email: u.email,
            role: u.role,
            walletBalance: (u.balance1 || 0) + (u.balance2 || 0),
            earningsBalance: u.earningsBalance || 0,
            referralCode: u.referralCode || "N/A",
            websiteName: u.branding?.siteName || "N/A",
            websiteOwnerStatus: u.resellerActivationStatus || "none",
            subscriptionTier: u.resellerTier || "basic",
            subscriptionStatus: u.isResellerActivated ? "Active" : "Inactive",
            referredBy: u.referredBy ? u.referredBy.toString() : "N/A",
            archivedStatus: u.archived || false
        }));

        fs.writeFileSync(path.join(__dirname, '../backups/pre_migration_snapshot.json'), JSON.stringify(snapshot, null, 2));

        console.log("Snapshots created successfully.");
        process.exit(0);
    } catch (err) {
        console.error("Error creating snapshot:", err);
        process.exit(1);
    }
};

run();
