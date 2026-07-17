import mongoose from 'mongoose';
import User from './models/User.js';
import dotenv from 'dotenv';
dotenv.config();

async function listUsers() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const users = await User.find({}, 'email name role createdAt');
        
        console.log("=== RESELLER ADMIN ACCOUNTS ===");
        let found = 0;
        for (const u of users) {
            if (u.role === 'reseller_admin') {
                found++;
                const created = u.createdAt ? u.createdAt : (u._id ? u._id.getTimestamp() : "Unknown");
                console.log(`Email: ${u.email}`);
                console.log(`Username: ${u.name}`);
                console.log(`Created Date: ${created}`);
                console.log("-----------------------");
            }
        }
        if (found === 0) {
            console.log("No reseller_admin accounts found.");
        }
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

listUsers();
