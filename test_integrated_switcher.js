import dotenv from 'dotenv';
dotenv.config();

// NOW import the switcher
import { smartBuyAirtime } from './services/switcher.js';
import mongoose from 'mongoose';

async function testIntegrated() {
    console.log("Testing Integrated Switcher Flow...");
    
    const network = "MTN";
    const amount = 100;
    const phone = "08133131020";
    
    try {
        const result = await smartBuyAirtime(network, amount, phone);
        console.log("FINAL RESULT:", JSON.stringify(result, null, 2));
    } catch (err) {
        console.error("SWITCHER ERROR:", err);
    }
}

testIntegrated();
