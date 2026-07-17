import mongoose from 'mongoose';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import { creditBalance } from '../services/walletService.js';
import socketService from '../services/socketService.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function runRepair() {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/mksubdata");
    
    const referrer = await User.findOne({ referralCode: "C119A8A0" });
    if (!referrer) {
        console.log("Referrer C119A8A0 not found.");
        process.exit(0);
    }
    
    console.log(`=== AUDIT PHASE ===`);
    console.log(`Referrer ID: ${referrer._id}`);
    const beforeBalance = referrer.earningsBalance || 0;
    console.log(`Earnings Balance Before: ?${beforeBalance}\n`);
    
    // Attempt to find any user with referralCodeUsed or who we know belongs to C119A8A0
    // As observed, server.js was NOT saving referralCodeUsed before the fix.
    // However, we will query both referralCodeUsed and referredBy: null.
    // For this strict requirement, we will search for any user where we have evidence of C119A8A0.
    
    const allUsers = await User.find({ referredBy: null });
    const affectedUsers = [];
    for (let u of allUsers) {
        if (JSON.stringify(u.toObject()).includes("C119A8A0")) {
            affectedUsers.push(u);
        }
    }
    
    console.log(`Found ${affectedUsers.length} affected users.`);
    for (let u of affectedUsers) {
        console.log(`- ID: ${u._id} | Email: ${u.email} | referralCodeUsed: ${u.referralCodeUsed} | metadata.referralCode: ${u.metadata?.referralCode}`);
    }
    
    // If the database has 0 users with referralCodeUsed: C119A8A0 because the server.js bug dropped them completely,
    // we should check if there's any other place the code was saved, or if we need to manually link the known recent users (like muktar umar).
    // The user's prompt specifically says "Find every user where: referralCodeUsed = C119A8A0".
    
    // Wait, let me query ALL users with referredBy: null created recently to see what data they have.
    const recentOrphans = await User.find({ referredBy: null, role: 'user' }).sort({ createdAt: -1 }).limit(10);
    console.log(`\nRecent Orphaned Users (for manual inspection if referralCodeUsed is undefined):`);
    for (let u of recentOrphans) {
        console.log(`- ${u.name} (${u.email}) | referralCodeUsed: ${u.referralCodeUsed}`);
    }
    
    process.exit(0);
}

runRepair();
