import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import { processLifetimeReferralCashback } from '../services/referralCashbackEngine.js';

dotenv.config();

async function runSimulation() {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mkdigital');
    
    // 1. Create Users
    const userA = await User.create({ name: 'Retail A', email: `a_${Date.now()}@test.com`, password: 'pass', role: 'user', balance1: 0 });
    const userB = await User.create({ name: 'Retail B', email: `b_${Date.now()}@test.com`, password: 'pass', role: 'user', referredBy: userA._id, balance1: 50000 });
    
    // Also create some excluded users to test exclusions
    const reseller = await User.create({ name: 'Reseller', email: `res_${Date.now()}@test.com`, password: 'pass', role: 'reseller_admin' });
    const resellerCustomer = await User.create({ name: 'Reseller Cust', email: `rc_${Date.now()}@test.com`, password: 'pass', role: 'user', referredBy: reseller._id });
    
    console.log(`User A (Referrer): ${userA._id}`);
    console.log(`User B (Referred): ${userB._id}`);
    
    // Execute Transactions for B
    const txList = [
        { desc: 'Data Purchase', amount: 500, cost: 400 },
        { desc: 'Airtime Purchase', amount: 1000, cost: 950 },
        { desc: 'Electricity Purchase', amount: 5000, cost: 4900 },
        { desc: 'Cable Purchase', amount: 3000, cost: 2900 }
    ];
    
    let totalRefReward = 0;
    let totalCustCashback = 0;

    for (let i = 0; i < txList.length; i++) {
        const t = txList[i];
        const txObj = {
            reference: `TX-${Date.now()}-${i}`,
            description: t.desc,
            selling_price: t.amount,
            cost_price: t.cost
        };
        
        await processLifetimeReferralCashback(txObj, userB);
        
        // Let's print expected
        const profit = t.amount - t.cost;
        const refReward = Number((profit * 0.15).toFixed(4));
        const remProfit = profit - refReward;
        const custCashback = Number((remProfit * 0.15).toFixed(4));
        
        totalRefReward += refReward;
        totalCustCashback += custCashback;

        console.log(`\n--- ${t.desc} ---`);
        console.log(`Platform Profit: ${profit}`);
        console.log(`Expected Referrer Reward (15%): ${refReward}`);
        console.log(`Expected Customer Cashback (15% of rem): ${custCashback}`);
    }
    
    // Wait a sec for DB
    await new Promise(r => setTimeout(r, 1000));
    
    const finalUserA = await User.findById(userA._id);
    const finalUserB = await User.findById(userB._id);
    
    console.log('\n--- FINAL WALLETS ---');
    console.log(`User A Earnings Balance: ${finalUserA.earningsBalance} (Expected: ${totalRefReward})`);
    console.log(`User B Cashback Balance (balance2): ${finalUserB.balance2} (Expected: ${totalCustCashback})`);
    
    console.log('\n--- EXCLUSION TESTING ---');
    // Test Reseller Customer
    const txExcl1 = { reference: `EX1-${Date.now()}`, description: 'Data', selling_price: 500, cost_price: 400 };
    await processLifetimeReferralCashback(txExcl1, resellerCustomer);
    const finalRC = await User.findById(resellerCustomer._id);
    console.log(`Reseller Customer Cashback: ${finalRC.balance2} (Should be 0)`);
    
    // Test Emergency
    const txExcl2 = { reference: `EMG-${Date.now()}`, description: 'EMERGENCY_SMS_CASHBACK Data', selling_price: 500, cost_price: 400 };
    await processLifetimeReferralCashback(txExcl2, userB);
    const finalUserB2 = await User.findById(userB._id);
    console.log(`Emergency Purchase Cashback added: ${finalUserB2.balance2 - finalUserB.balance2} (Should be 0)`);
    
    // Fetch Ledger
    const lref = await Transaction.find({ userId: userA._id, ledger_type: 'LIFETIME_REFERRAL_SHARE' });
    const lcb = await Transaction.find({ userId: userB._id, ledger_type: 'LIFETIME_CASHBACK' });
    
    console.log(`\n--- LEDGER RECORDS ---`);
    console.log(`LIFETIME_REFERRAL_SHARE count for A: ${lref.length} (Expected: 4)`);
    console.log(`LIFETIME_CASHBACK count for B: ${lcb.length} (Expected: 4)`);
    
    process.exit(0);
}

runSimulation().catch(console.error);
