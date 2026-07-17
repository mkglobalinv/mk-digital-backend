import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import User from './models/User.js';

async function run() {
    await mongoose.connect(process.env.MONGO_URI);

    // Find duplicate emails using aggregation
    const duplicates = await User.aggregate([
        { $group: { _id: { $toLower: "$email" }, count: { $sum: 1 }, docs: { $push: "$$ROOT" } } },
        { $match: { count: { $gt: 1 } } }
    ]);

    console.log(`Found ${duplicates.length} emails with duplicate accounts.`);
    
    for (const dup of duplicates) {
        console.log(`\nEmail: ${dup._id} (Count: ${dup.count})`);
        for (const doc of dup.docs) {
            console.log(`- ID: ${doc._id}, Role: ${doc.role}, isResellerActivated: ${doc.isResellerActivated}, resellerTier: ${doc.resellerTier}, createdAt: ${doc.createdAt}, updatedAt: ${doc.updatedAt}`);
        }
    }

    // Check indexes
    const indexes = await User.collection.indexes();
    console.log('\n--- Collection Indexes ---');
    indexes.forEach(idx => console.log(`${idx.name}: ${JSON.stringify(idx.key)} (Unique: ${idx.unique})`));

    await mongoose.disconnect();
}

run().catch(console.error);
