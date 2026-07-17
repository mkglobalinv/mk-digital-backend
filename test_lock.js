import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import axios from 'axios';
import User from './models/User.js';
import Session from './models/Session.js';

dotenv.config();

async function runTest() {
    console.log("Connecting to DB...");
    await mongoose.connect(process.env.MONGO_URI);
    
    console.log("Setting up test user...");
    const user = await User.findOne({ email: 'kundeenwasanni@gmail.com' });
    if (!user) {
        console.error("User not found");
        process.exit(1);
    }
    
    const hashedPin = await bcrypt.hash('1234', 10);
    user.transactionPin = hashedPin;
    user.isProcessingTx = false; // Ensure it's unlocked
    user.balance1 = 500; // Ensure enough balance
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    await Session.create({ userId: user._id, token, isValid: true });

    console.log("Sending concurrent requests...");
    const url = 'http://localhost:3000/buy-airtime';
    const payload = {
        amount: 100,
        phone: '08133131020',
        network: 'MTN',
        transactionPin: '1234'
    };

    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    // Send two requests almost simultaneously
    const req1 = axios.post(url, payload, { headers }).catch(e => e.response);
    const req2 = axios.post(url, payload, { headers }).catch(e => e.response);

    const [res1, res2] = await Promise.all([req1, req2]);

    console.log("Response 1:", res1.status, res1.data);
    console.log("Response 2:", res2.status, res2.data);

    if (res1.status === 400 && res1.data.message.includes("processing") || 
        res2.status === 400 && res2.data.message.includes("processing")) {
        console.log("LOCK TEST PASSED! One request was blocked.");
    } else {
        console.log("LOCK TEST FAILED! Both requests were processed (or failed for other reasons).");
    }

    await mongoose.connection.close();
    process.exit(0);
}

runTest().catch(console.error);
