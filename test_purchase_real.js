import mongoose from 'mongoose';
import dotenv from 'dotenv';
import axios from 'axios';
import User from './models/User.js';

dotenv.config();

async function runTest() {
    const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5ZWZkMzgyZTMzMzBmY2ZhZDNkZmY3NSIsImlhdCI6MTc3NzM4MTgzMH0.61Gd1NR08noeQKMqjiqL0FejZQ8B1_FXZLM6dJCNBuY";
    
    console.log("Connecting to DB to ensure user is ready...");
    await mongoose.connect(process.env.MONGO_URI);
    const user = await User.findOne({ email: 'kundeenwasanni@gmail.com' });
    user.isProcessingTx = false;
    user.balance1 = 500;
    await user.save();
    await mongoose.connection.close();

    console.log("Sending purchase request...");
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

    try {
        const res = await axios.post(url, payload, { headers });
        console.log("STATUS:", res.status);
        console.log("DATA:", JSON.stringify(res.data, null, 2));
    } catch (e) {
        console.log("STATUS:", e.response?.status);
        console.log("DATA:", JSON.stringify(e.response?.data, null, 2));
    }

    process.exit(0);
}

runTest().catch(console.error);
