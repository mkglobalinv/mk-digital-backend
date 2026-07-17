import mongoose from 'mongoose';
import dotenv from 'dotenv';
import axios from 'axios';
import User from '../models/User.js';
import DataPlan from '../models/DataPlan.js';

dotenv.config();

async function runTest() {
    await mongoose.connect(process.env.MONGO_URI);
    
    console.log('Finding Basic Reseller...');
    let basicReseller = await User.findOne({ role: 'reseller_admin', resellerType: 'basic' });
    if (!basicReseller) {
        console.log('No basic reseller found at all!');
        process.exit(1);
    }
    if (!basicReseller.apiToken) {
        basicReseller.apiToken = 'test_reseller_token_' + Date.now();
        await basicReseller.save();
    }
    
    // Find a basic customer
    const basicCustomer = await User.findOne({ role: 'user', referredBy: basicReseller._id, apiToken: { $exists: true } });
    
    let tokenToUse;
    if (basicCustomer) {
        console.log(`Using Basic Customer: ${basicCustomer.email}`);
        tokenToUse = basicCustomer.apiToken;
    } else {
        console.log('No basic customer found. Using reseller directly to simulate their store sending request.');
        tokenToUse = basicReseller.apiToken; // wait, if it uses reseller token, the apiLevel is reseller. 
        // We need a customer of a basic reseller. I'll create an API token for one if needed.
    }
    
    if (!basicCustomer) {
        const cust = await User.findOne({ role: 'user', referredBy: basicReseller._id });
        if (cust) {
            cust.apiToken = 'test_token_' + Date.now();
            await cust.save();
            tokenToUse = cust.apiToken;
            console.log(`Generated token for customer: ${cust.email}`);
        } else {
            console.log('No customers found for basic reseller.');
            process.exit(1);
        }
    }

    const plan = await DataPlan.findOne({ status: true, selling_price: 120, api_price: 100 }) || await DataPlan.findOne({ status: true });
    
    console.log(`Test Plan: ${plan.plan_name} | API: ${plan.api_price} | Admin: ${plan.selling_price}`);
    
    const beforeBalance = basicReseller.earningsBalance || 0;
    
    const payload = {
        network: plan.network,
        plan_id: plan.api_plan_id,
        phone: '08012345678',
        reference: 'TEST_API_' + Date.now()
    };
    
    // Add balance to customer
    const userToTopUp = basicCustomer || basicReseller;
    userToTopUp.balance1 = 5000;
    await userToTopUp.save();
    
    console.log('Sending request to /api/v1/data ...');
    try {
        const res = await axios.post('http://localhost:5000/api/v1/data', payload, {
            headers: { Authorization: `Bearer ${tokenToUse}` }
        });
        console.log('Response:', res.data);
    } catch (err) {
        console.log('Error:', err.response ? err.response.data : err.message);
    }
    
    // Check reseller wallet
    const updatedReseller = await User.findById(basicReseller._id);
    const afterBalance = updatedReseller.earningsBalance || 0;
    
    console.log('--- RESULTS ---');
    console.log(`api_price: ${plan.api_price}`);
    console.log(`admin selling_price: ${plan.selling_price}`);
    console.log(`adminMarkup: ${plan.selling_price - plan.api_price}`);
    console.log(`basicCommission: ${(plan.selling_price - plan.api_price) * 0.5}`);
    console.log(`resellerCost: ${plan.selling_price}`);
    console.log(`customer price: ${plan.selling_price + ((plan.selling_price - plan.api_price) * 0.5)}`);
    console.log(`generated profit: ${afterBalance - beforeBalance}`);
    console.log(`amount credited to reseller earnings wallet: ${afterBalance - beforeBalance}`);
    
    process.exit(0);
}

runTest();
