import mongoose from 'mongoose';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
dotenv.config();

const API_URL = 'http://localhost:8800';

async function verify() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB.");

        const Session = mongoose.models.Session || mongoose.model('Session', new mongoose.Schema({
            userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            token: String,
            isValid: { type: Boolean, default: true },
            createdAt: { type: Date, default: Date.now },
            lastActive: { type: Date, default: Date.now },
            sessionType: { type: String, default: 'business' }
        }));

        // The exact Host header to bypass tenantMiddleware and act as the main app
        const host = '9jasub.com';
        console.log(`Using valid host header: ${host}`);

        // Create a mock user for Basic Activation testing
        const email1 = `test_activation_${Date.now()}@test.com`;
        const testUser1 = await User.create({
            name: "Test Activation User",
            email: email1,
            password: "hashedpassword",
            role: "reseller_admin",
            isEmailVerified: true,
            isResellerActivated: false,
            resellerTier: "basic",
            balance1: 10000,
            balance2: 0
        });

        console.log(`\n--- TESTING PAY ACTIVATION ---`);
        const token1 = jwt.sign({ id: testUser1._id, role: testUser1.role, session_type: 'business' }, process.env.JWT_SECRET, { expiresIn: '1h' });
        
        // Create session
        await Session.create({ userId: testUser1._id, token: token1, isValid: true, sessionType: 'business' });

        try {
            const res1 = await axios.post(`${API_URL}/api/reseller/pay-activation`, {}, {
                headers: { Authorization: `Bearer ${token1}`, 'Host': host }
            });
            console.log("Status:", res1.status);
            console.log("Response:", res1.data);
        } catch(err) {
            console.error("HTTP Error:", err.response?.status, err.response?.data || err.message);
        }

        // Verify state in DB
        const updated1 = await User.findById(testUser1._id);
        console.log(`Balance after activation: ${updated1.balance1} (Expected: 5000)`);
        console.log(`Tier after activation: ${updated1.resellerTier} (Expected: basic)`);
        console.log(`isResellerActivated: ${updated1.isResellerActivated} (Expected: true)`);
        
        const tx1 = await Transaction.findOne({ userId: testUser1._id, type: 'debit' });
        console.log(`Transaction created? ${tx1 ? 'YES' : 'NO'}`);
        if (tx1) console.log(`Transaction details: Amount=${tx1.amount}, Desc=${tx1.description}`);

        // Create a mock user for Premium Upgrade testing
        const email2 = `test_premium_${Date.now()}@test.com`;
        const testUser2 = await User.create({
            name: "Test Premium User",
            email: email2,
            password: "hashedpassword",
            role: "reseller_admin",
            isEmailVerified: true,
            isResellerActivated: true,
            resellerTier: "basic",
            balance1: 50000,
            balance2: 0
        });

        console.log(`\n--- TESTING UPGRADE PREMIUM ---`);
        const token2 = jwt.sign({ id: testUser2._id, role: testUser2.role, session_type: 'business' }, process.env.JWT_SECRET, { expiresIn: '1h' });
        
        // Create session
        await Session.create({ userId: testUser2._id, token: token2, isValid: true, sessionType: 'business' });

        try {
            const res2 = await axios.post(`${API_URL}/api/reseller/upgrade-premium`, { duration: '1year' }, {
                headers: { Authorization: `Bearer ${token2}`, 'Host': host }
            });
            console.log("Status:", res2.status);
            console.log("Response:", res2.data);
        } catch(err) {
            console.error("HTTP Error:", err.response?.status, err.response?.data || err.message);
        }

        // Verify state in DB
        const updated2 = await User.findById(testUser2._id);
        console.log(`Balance after upgrade: ${updated2.balance1} (Expected: <50000)`);
        console.log(`Tier after upgrade: ${updated2.resellerTier} (Expected: premium)`);
        
        const tx2 = await Transaction.findOne({ userId: testUser2._id, type: 'debit' });
        console.log(`Transaction created? ${tx2 ? 'YES' : 'NO'}`);
        if (tx2) console.log(`Transaction details: Amount=${tx2.amount}, Desc=${tx2.description}`);

        // Cleanup
        await User.deleteMany({ email: { $in: [email1, email2] } });
        await Transaction.deleteMany({ userId: { $in: [testUser1._id, testUser2._id] } });
        await Session.deleteMany({ userId: { $in: [testUser1._id, testUser2._id] } });

    } catch(err) {
        console.error("Verification failed:", err);
    } finally {
        process.exit(0);
    }
}

verify();
