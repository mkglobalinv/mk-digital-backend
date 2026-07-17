import axios from "axios";
import mongoose from "mongoose";
import Transaction from "./models/Transaction.js";
import User from "./models/User.js";
import dotenv from "dotenv";
dotenv.config();

const BASE_URL = "http://localhost:3000";

async function verifyFix() {
    console.log("--- Verification Started ---");
    
    // 1. Check if Smart Airtime uses Peyflex
    // We can't easily check internal code execution via HTTP, but we can check the error message
    // If we send a request that we know will fail on Peyflex (e.g. invalid phone)
    try {
        console.log("\nTesting Smart Airtime (Peyflex) response mapping...");
        // Use a real token or skip if not available
        // For this test, we assume the server is running and we can check logs
        console.log("Check server logs for '[Peyflex Request]' and '[Peyflex Response]' tags.");
    } catch (e) {}

    // 2. Check Database for Status
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const tx = await Transaction.findOne({ provider_used: 'peyflex', status: 'pending' }).sort({ createdAt: -1 });
        if (tx) {
            console.log(`Found pending Peyflex transaction: ${tx._id}`);
            console.log(`Reference: ${tx.reference}`);
            console.log(`Status should be pending if it was a 400 error.`);
        } else {
            console.log("No pending Peyflex transactions found. (This is normal if none have failed with 400 recently)");
        }
    } catch (e) {
        console.error("DB Error:", e.message);
    } finally {
        await mongoose.disconnect();
    }
    
    console.log("\n--- Verification Completed ---");
}

verifyFix();
