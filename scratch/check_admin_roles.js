import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import User from '../models/User.js';

async function main() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB.");
        
        const admins = await User.find({ role: { $in: ['admin', 'superadmin', 'reseller_admin'] } });
        console.log(`Found ${admins.length} admin users:`);
        for (const admin of admins) {
            console.log({
                id: admin._id,
                name: admin.name,
                email: admin.email,
                role: admin.role,
                admin_subdomain: admin.admin_subdomain,
                subdomain: admin.subdomain,
                isSuspended: admin.isSuspended
            });
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

main();
