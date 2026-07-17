import mongoose from 'mongoose';
import dotenv from 'dotenv';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import User from '../models/User.js';
import DataPlan from '../models/DataPlan.js';
import Transaction from '../models/Transaction.js';
import Session from '../models/Session.js';

dotenv.config();

const PORT = process.env.PORT || 8800;
const BASE_URL = `http://localhost:${PORT}`;

async function runE2ETests() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB for E2E Tests');

    // Make sure all testers have a known PIN and balance
    const pinHash = await bcrypt.hash('1234', 10);
    const emails = [
        'retail_tester@system.local',
        'basic_tester@system.local',
        'premium_tester@system.local',
        'premium_customer@system.local'
    ];

    await User.updateMany(
        { email: { $in: emails } },
        { transactionPin: pinHash }
    );

    // Ensure testers are funded correctly (using balance1 for wallet balance)
    await User.updateOne({ email: 'retail_tester@system.local' }, { balance1: 10000 });
    await User.updateOne({ email: 'basic_tester@system.local' }, { balance1: 20000 });
    await User.updateOne({ email: 'premium_tester@system.local' }, { balance1: 20000 });
    await User.updateOne({ email: 'premium_customer@system.local' }, { balance1: 10000 });

    // Get a valid DataPlan
    const dataPlan = await DataPlan.findOne({ network: 'MTN', status: true }).sort({ selling_price: 1 });
    if (!dataPlan) {
        console.error('No DataPlan found!');
        process.exit(1);
    }
    console.log(`Using Data Plan: ${dataPlan.plan_name} (API ID: ${dataPlan.api_plan_id}, Cost: ${dataPlan.api_price})`);

    const results = [];

    for (const email of emails) {
        console.log(`\n================================`);
        console.log(`Testing Purchase for: ${email}`);
        
        const user = await User.findOne({ email });
        if (!user) {
            console.error(`User ${email} not found!`);
            continue;
        }

        const initialBalance = user.balance1 || 0;
        console.log(`Initial Balance: ₦${initialBalance}`);

        // Generate Token
        const token = jwt.sign(
            { id: user._id, session_type: 'retail' },
            process.env.JWT_SECRET || "mk_sub_data_secret_2024_premium",
            { expiresIn: '1h' }
        );

        // Create Session Record
        await Session.create({
            userId: user._id,
            token,
            isValid: true,
            createdAt: new Date(),
            deviceInfo: 'E2E Test Script'
        });

        // Perform Purchase via API
        const payload = {
            network: dataPlan.network,
            plan_id: dataPlan.api_plan_id,
            phone: '08012345678',
            transactionPin: '1234',
            reference: `E2E_${user.role}_${Date.now()}`
        };

        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        try {
            // Using retail purchase route
            const res = await axios.post(`${BASE_URL}/api/retail/purchase/data`, payload, { headers });
            console.log(`Response Status: ${res.status}`);
            console.log(`Response Data:`, res.data);
            
            // Wait a moment for DB to update
            await new Promise(r => setTimeout(r, 1000));
            
            // Verify
            const updatedUser = await User.findById(user._id);
            const tx = await Transaction.findOne({ reference: payload.reference });
            
            const deduction = initialBalance - updatedUser.balance1;
            console.log(`Deducted Amount: ₦${deduction}`);
            
            if (tx) {
                console.log(`Transaction Profit: ₦${tx.profit}`);
            }

            results.push({ email, status: 'success', deduction, profit: tx?.profit || 0 });

        } catch (err) {
            console.error(`Request Failed: ${err.response?.status}`);
            console.error(err.response?.data);
            results.push({ email, status: 'failed', error: err.response?.data?.message });
        }
    }

    console.log(`\n================================`);
    console.log('E2E Test Summary:');
    console.table(results);

    await mongoose.disconnect();
    process.exit(0);
}

runE2ETests();
