import mongoose from 'mongoose';
import User from './models/User.js';
import dotenv from 'dotenv';
dotenv.config();

async function listUsers() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const users = await User.find({role: 'reseller_admin'}, 'email name createdAt role');
        console.log('Total Reseller Admins:', users.length);
        users.forEach(u => console.log(`- ${u.email} (${u.name}) [Created: ${u.createdAt || u._id.getTimestamp()}]`));
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

listUsers();
