import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';

async function run() {
    await mongoose.connect(process.env.MONGO_URI);

    const REFERRER_ID = '6a410974d95fcfbdaa1fb278'; // Abdul basi
    const CUSTOMER_ID = '6a46068eeecceecc1ad3d205'; // loca worke

    console.log("============================================================");
    console.log("PART 1: EXACT WALLET BALANCES FROM MONGODB");
    console.log("============================================================");

    const referrer = await User.findById(REFERRER_ID).select('name email balance1 balance2 earningsBalance referredBy role resellerActivationStatus');
    const customer = await User.findById(CUSTOMER_ID).select('name email balance1 balance2 earningsBalance referredBy role resellerActivationStatus');

    console.log("\n--- REFERRER: Abdul basi ---");
    console.log(JSON.stringify(referrer, null, 2));

    console.log("\n--- CUSTOMER: loca worke ---");
    console.log(JSON.stringify(customer, null, 2));

    console.log("\n============================================================");
    console.log("PART 2: ALL TRANSACTIONS FOR REFERRER (Abdul basi)");
    console.log("============================================================");

    const referrerTxs = await Transaction.find({ userId: REFERRER_ID }).sort({ createdAt: 1 });
    console.log(`\nTotal transactions for Abdul basi: ${referrerTxs.length}`);
    for (const tx of referrerTxs) {
        console.log(`\n  _id:         ${tx._id}`);
        console.log(`  reference:   ${tx.reference}`);
        console.log(`  type:        ${tx.type}`);
        console.log(`  amount:      ${tx.amount}`);
        console.log(`  status:      ${tx.status}`);
        console.log(`  description: ${tx.description}`);
        console.log(`  ledger_type: ${tx.ledger_type}`);
        console.log(`  balance_deducted: ${tx.balance_deducted}`);
        console.log(`  main_wallet_deducted:     ${tx.main_wallet_deducted}`);
        console.log(`  cashback_wallet_deducted: ${tx.cashback_wallet_deducted}`);
        console.log(`  createdAt:   ${tx.createdAt}`);
    }

    console.log("\n============================================================");
    console.log("PART 3: ALL TRANSACTIONS FOR CUSTOMER (loca worke)");
    console.log("============================================================");

    const customerTxs = await Transaction.find({ userId: CUSTOMER_ID }).sort({ createdAt: 1 });
    console.log(`\nTotal transactions for loca worke: ${customerTxs.length}`);
    for (const tx of customerTxs) {
        console.log(`\n  _id:         ${tx._id}`);
        console.log(`  reference:   ${tx.reference}`);
        console.log(`  type:        ${tx.type}`);
        console.log(`  amount:      ${tx.amount}`);
        console.log(`  status:      ${tx.status}`);
        console.log(`  description: ${tx.description}`);
        console.log(`  ledger_type: ${tx.ledger_type}`);
        console.log(`  balance_deducted: ${tx.balance_deducted}`);
        console.log(`  main_wallet_deducted:     ${tx.main_wallet_deducted}`);
        console.log(`  cashback_wallet_deducted: ${tx.cashback_wallet_deducted}`);
        console.log(`  createdAt:   ${tx.createdAt}`);
    }

    console.log("\n============================================================");
    console.log("PART 4: MANUAL WALLET CALCULATION FROM TRANSACTIONS");
    console.log("============================================================");

    // For referrer: sum all credit transactions
    const referrerCredits = referrerTxs.filter(t => t.type === 'credit' && t.status === 'success').reduce((s,t) => s + t.amount, 0);
    const referrerDebits = referrerTxs.filter(t => t.type === 'debit' && t.status === 'success').reduce((s,t) => s + t.amount, 0);
    console.log(`\nAbdul basi - Sum of credit transactions: +${referrerCredits}`);
    console.log(`Abdul basi - Sum of debit transactions:  -${referrerDebits}`);
    console.log(`Abdul basi - Net from transactions:       ${referrerCredits - referrerDebits}`);
    console.log(`Abdul basi - MongoDB balance1:            ${referrer.balance1}`);
    console.log(`Abdul basi - MongoDB balance2:            ${referrer.balance2}`);
    console.log(`Abdul basi - MongoDB earningsBalance:     ${referrer.earningsBalance}`);
    console.log(`Abdul basi - MongoDB TOTAL (b1+b2+earn):  ${(referrer.balance1||0) + (referrer.balance2||0) + (referrer.earningsBalance||0)}`);

    // For customer: sum all credit/debit transactions
    const customerCredits = customerTxs.filter(t => t.type === 'credit' && t.status === 'success').reduce((s,t) => s + t.amount, 0);
    const customerDebits = customerTxs.filter(t => t.type === 'debit' && t.status === 'success').reduce((s,t) => s + t.amount, 0);
    console.log(`\nloca worke - Sum of credit transactions: +${customerCredits}`);
    console.log(`loca worke - Sum of debit transactions:  -${customerDebits}`);
    console.log(`loca worke - Net from transactions:       ${customerCredits - customerDebits}`);
    console.log(`loca worke - MongoDB balance1:            ${customer.balance1}`);
    console.log(`loca worke - MongoDB balance2:            ${customer.balance2}`);
    console.log(`loca worke - MongoDB earningsBalance:     ${customer.earningsBalance}`);
    console.log(`loca worke - MongoDB TOTAL (b1+b2+earn):  ${(customer.balance1||0) + (customer.balance2||0) + (customer.earningsBalance||0)}`);

    await mongoose.disconnect();
}

run().catch(console.error);
