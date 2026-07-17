import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/mkdigital');
        console.log("Connected to DB.");

        const db = mongoose.connection.db;
        const usersCol = db.collection('users');

        // 1. Get Indexes
        const indexes = await usersCol.indexes();
        console.log("=== CURRENT INDEXES ===");
        console.log(JSON.stringify(indexes, null, 2));

        // 3. Find duplicates (email, tenantOwnerId)
        const dupEmailTenant = await usersCol.aggregate([
            { $group: { _id: { email: "$email", tenantOwnerId: "$tenantOwnerId" }, count: { $sum: 1 }, docs: { $push: "$_id" } } },
            { $match: { count: { $gt: 1 } } }
        ]).toArray();
        console.log("\n=== DUPLICATE (email, tenantOwnerId) ===");
        console.log(JSON.stringify(dupEmailTenant, null, 2));

        // 4. Find duplicates admin_subdomain
        const dupAdminSubdomain = await usersCol.aggregate([
            { $match: { admin_subdomain: { $ne: null, $ne: "" } } },
            { $group: { _id: "$admin_subdomain", count: { $sum: 1 }, docs: { $push: "$_id" } } },
            { $match: { count: { $gt: 1 } } }
        ]).toArray();
        console.log("\n=== DUPLICATE admin_subdomain ===");
        console.log(JSON.stringify(dupAdminSubdomain, null, 2));

        // 5. Find duplicates subdomain
        const dupSubdomain = await usersCol.aggregate([
            { $match: { subdomain: { $ne: null, $ne: "" } } },
            { $group: { _id: "$subdomain", count: { $sum: 1 }, docs: { $push: "$_id" } } },
            { $match: { count: { $gt: 1 } } }
        ]).toArray();
        console.log("\n=== DUPLICATE subdomain ===");
        console.log(JSON.stringify(dupSubdomain, null, 2));

        // 6. Find duplicates customDomain
        const dupCustomDomain = await usersCol.aggregate([
            { $match: { customDomain: { $ne: null, $ne: "" } } },
            { $group: { _id: "$customDomain", count: { $sum: 1 }, docs: { $push: "$_id" } } },
            { $match: { count: { $gt: 1 } } }
        ]).toArray();
        console.log("\n=== DUPLICATE customDomain ===");
        console.log(JSON.stringify(dupCustomDomain, null, 2));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
run();
