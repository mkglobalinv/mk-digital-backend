import mongoose from "mongoose";
import fs from "fs";

import dotenv from "dotenv";
dotenv.config();

const dbUrl = process.env.MONGO_URI;

if (!dbUrl) {
    console.error("No MONGO_URI found in .env");
    process.exit(1);
}

mongoose.connect(dbUrl)
    .then(async () => {
        console.log("Connected to MongoDB.");
        
        // Define schemas or import models
        // But simpler: just use mongoose.connection.db
        const db = mongoose.connection.db;
        
        const users = await db.collection("users").find({ 
            email: { $in: ["arewa969@gmail.com", "unuktar1@gmail.com"] } 
        }).toArray();
        
        console.log("Users found:", users.length);
        for (const u of users) {
            console.log(`\nUser: ${u.email}`);
            console.log(`  ID: ${u._id}`);
            console.log(`  Role: ${u.role}`);
            console.log(`  isEmailVerified: ${u.isEmailVerified}`);
            console.log(`  isSignupComplete: ${u.isSignupComplete}`);
            console.log(`  resellerId: ${u.resellerId}`);
            console.log(`  referredBy: ${u.referredBy}`);
            console.log(`  createdAt: ${u.createdAt}`);
            console.log(`  archived / isSuspended: ${u.isSuspended}`);
        }

        const otps = await db.collection("otps").find({}).sort({createdAt: -1}).limit(10).toArray();
        console.log("\nRecent OTPs:");
        for(const otp of otps) {
            console.log(`  UserId: ${otp.userId}, HashedOTP: ${otp.hashedOtp}, ExpiresAt: ${otp.expiresAt}`);
        }

        process.exit(0);
    })
    .catch(err => {
        console.error("DB connection error:", err);
        process.exit(1);
    });
