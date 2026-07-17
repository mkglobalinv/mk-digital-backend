import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { getRetailPrice } from '../services/pricing/retailPricing.js';
import { applyResellerProfit } from '../services/resellerProfitService.js';
import User from '../models/User.js';
import PricingSettings from '../models/PricingSettings.js';
import Transaction from '../models/Transaction.js';
import { getSupabaseClient } from '../services/supabaseClient.js';

dotenv.config();

async function runTest() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    try {
        // 1. Setup Data: We need a Basic Reseller and a Customer
        const reseller = await User.findOne({ resellerTier: 'basic' });
        if (!reseller) throw new Error('No Basic Reseller found');

        const customer = await User.findOne({ referredBy: reseller._id });
        if (!customer) throw new Error('No Customer found for this reseller');

        // Set Admin Rule to 10%
        await PricingSettings.findOneAndUpdate(
            { resellerId: null, serviceType: 'data' },
            { markupPercentage: 10, status: 'active' },
            { upsert: true }
        );

        console.log('\n--- Stage 1: Price Generation ---');
        // Let's assume a planId and serviceType 'data' where cost is 100
        // To be safe and use "live" data, we'll just mock the wholesale cost in our test by stubbing or checking what it returns.
        // Actually, let's just pick any data plan and see what getRetailPrice does.
        const supabase = getSupabaseClient();
        const { data: plans } = await supabase.from('data_plans').select('*').limit(1);
        if (!plans || plans.length === 0) throw new Error('No data plans found');
        const plan = plans[0];
        
        console.log(`Using Plan: ${plan.plan_id}, Default Cost: ${plan.price}`);

        // We'll call getRetailPrice
        const retailPricing = await getRetailPrice(customer._id, plan.plan_id, 'data');
        
        console.log('getRetailPrice returned:', retailPricing);
        console.log('Provider Cost:', plan.price);
        console.log('Admin Percentage: 10%');
        const adminMarkup = plan.price * 0.10;
        console.log('Admin Markup:', adminMarkup);
        console.log('Admin Price:', plan.price + adminMarkup);
        console.log('Customer Price:', retailPricing.finalPrice);

        console.log('\n--- Stage 2: Transaction Creation ---');
        const tx = new Transaction({
            userId: customer._id,
            resellerId: reseller._id,
            amount: retailPricing.finalPrice,
            cost_price: plan.price,
            selling_price: retailPricing.finalPrice,
            type: 'debit',
            status: 'success',
            serviceType: 'data',
            reference: 'TEST_TX_' + Date.now(),
            description: 'E2E Test Data'
        });
        await tx.save();

        console.log('Transaction Created:', tx._id);
        console.log('cost_price:', tx.cost_price);
        console.log('selling_price:', tx.selling_price);
        const profitCalculated = tx.selling_price - tx.cost_price;
        console.log('profit:', profitCalculated);

        console.log('\n--- Stage 3: Queue Processing ---');
        console.log('Transaction ID:', tx._id);
        console.log('Queue Status: success (simulated)');
        console.log('Provider Response: SUCCESS (simulated)');

        console.log('\n--- Stage 4: Profit Calculation ---');
        console.log('Function: applyResellerProfit');
        
        const resellerBefore = await User.findById(reseller._id);
        console.log('\n--- Stage 5: Wallet Credit ---');
        console.log('earningsBalance BEFORE:', resellerBefore.earningsBalance);
        
        // Execute profit application
        await applyResellerProfit(tx, customer);

        const resellerAfter = await User.findById(reseller._id);
        const amountCredited = resellerAfter.earningsBalance - resellerBefore.earningsBalance;
        console.log('amount credited:', amountCredited);
        console.log('earningsBalance AFTER:', resellerAfter.earningsBalance);

        console.log('\n--- Stage 6: Ledger Synchronization ---');
        const { data: ledgerEntry } = await supabase.from('wallet_ledger')
            .select('*')
            .eq('reference', `COMM-${tx.reference}`)
            .single();
            
        console.log('MongoDB earningsBalance:', resellerAfter.earningsBalance);
        console.log('Supabase Ledger Entry Amount:', ledgerEntry ? ledgerEntry.amount : 'Not found');
        
    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

runTest();
