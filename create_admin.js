import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

async function createAdmin() {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/mksubdata');
    
    let admin = await User.findOne({ email: 'admin@9jasub.com' });
    if (!admin) {
        const hashedPassword = await bcrypt.hash('Admin@123', 10);
        admin = await User.create({
            name: 'Super Admin',
            email: 'admin@9jasub.com',
            password: hashedPassword,
            role: 'admin',
            phoneNumber: '08000000000',
            pin: '1234',
            accountStatus: 'active'
        });
        console.log('Created admin account: admin@9jasub.com / Admin@123');
    } else {
        console.log('Admin account already exists: admin@9jasub.com / Admin@123');
        if (admin.role !== 'admin') {
            admin.role = 'admin';
            await admin.save();
        }
    }
    process.exit(0);
}

createAdmin();
