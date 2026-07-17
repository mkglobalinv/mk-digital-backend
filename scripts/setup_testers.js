import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import User from '../models/User.js';

dotenv.config();

async function setupTesters() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB. Setting up tester accounts...');

    const passwordHash = await bcrypt.hash('password123', 10);
    const systemAdmin = await User.findOne({ email: 'admin@system.local' }) || null;

    const createOrUpdateUser = async (email, data) => {
        let user = await User.findOne({ email });
        if (user) {
            Object.assign(user, data);
            await user.save();
            console.log(`Updated existing user: ${email}`);
        } else {
            user = new User({ email, password: passwordHash, ...data });
            await user.save();
            console.log(`Created new user: ${email}`);
        }
        return user;
    };

    // 1. Premium Reseller Tester (₦20,000)
    const premiumReseller = await createOrUpdateUser('premium_tester@system.local', {
        name: 'Premium Tester',
        firstName: 'Premium',
        lastName: 'Tester',
        phone: '08000000001',
        role: 'reseller_admin',
        resellerType: 'premium',
        balance: 20000,
        tenantId: systemAdmin ? systemAdmin._id : null
    });

    // 2. Basic Reseller Tester (₦20,000)
    await createOrUpdateUser('basic_tester@system.local', {
        name: 'Basic Tester',
        firstName: 'Basic',
        lastName: 'Tester',
        phone: '08000000002',
        role: 'user',
        resellerType: 'basic',
        balance: 20000,
        tenantId: systemAdmin ? systemAdmin._id : null
    });

    // 3. Retail Tester (₦10,000)
    await createOrUpdateUser('retail_tester@system.local', {
        name: 'Retail Tester',
        firstName: 'Retail',
        lastName: 'Tester',
        phone: '08000000003',
        role: 'user',
        balance: 10000,
        tenantId: systemAdmin ? systemAdmin._id : null
    });

    // 4. Premium Customer Tester (₦10,000) - Tenant is the Premium Reseller
    await createOrUpdateUser('premium_customer@system.local', {
        name: 'Premium Customer',
        firstName: 'Premium',
        lastName: 'Customer',
        phone: '08000000004',
        role: 'user',
        balance: 10000,
        tenantId: premiumReseller._id
    });

    console.log('All tester accounts set up and funded successfully.');
    await mongoose.disconnect();
    process.exit(0);
}

setupTesters();
