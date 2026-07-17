import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

async function findTesters() {
    await mongoose.connect(process.env.MONGO_URI);
    
    const users = await User.find({}, 'email role resellerType firstName lastName').lean();
    console.log(`Found ${users.length} users.`);
    
    // Group by resellerType
    const retail = users.filter(u => u.resellerType === 'none' && u.role === 'user');
    const basicReseller = users.filter(u => u.resellerType === 'basic');
    const premiumReseller = users.filter(u => u.resellerType === 'premium');
    
    console.log(`Retail Users: ${retail.length}`);
    console.log(`Basic Resellers: ${basicReseller.length}`);
    console.log(`Premium Resellers: ${premiumReseller.length}`);
    
    // Print a few of each to decide who to use as tester
    console.log('\nSample Retail:', retail.slice(0, 2));
    console.log('\nSample Basic:', basicReseller.slice(0, 2));
    console.log('\nSample Premium:', premiumReseller.slice(0, 2));
    
    await mongoose.disconnect();
    process.exit(0);
}

findTesters();
