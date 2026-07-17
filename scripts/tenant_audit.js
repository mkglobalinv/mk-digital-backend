import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const audit = async () => {
    try {
        const connString = process.env.MONGO_URI || "mongodb://localhost:27017/vtuapp";
        await mongoose.connect(connString);
        console.log("Connected for Audit...");

        const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
        const Transaction = mongoose.model('Transaction', new mongoose.Schema({}, { strict: false }));

        console.log("=== Tenant Isolation Audit ===");

        // 1. Check for duplicate wallet fields across users (unlikely but safe)
        const users = await User.find({});
        console.log(`Total User Documents: ${users.length}`);

        // 2. Check for users with same email across tenants
        const emailCounts = await User.aggregate([
            { $group: { _id: "$email", count: { $sum: 1 }, tenants: { $addToSet: "$referredBy" } } },
            { $match: { count: { $gt: 1 } } }
        ]);

        console.log("\nUsers existing in multiple tenants:");
        emailCounts.forEach(e => {
            console.log(`- ${e._id}: Exists in ${e.count} tenants. Tenants: ${e.tenants.join(', ')}`);
        });

        // 3. Verify Wallet Independence
        console.log("\nVerifying Wallet Independence...");
        const sharedWallets = await User.aggregate([
            { $group: { _id: "$account_number", count: { $sum: 1 }, emails: { $addToSet: "$email" } } },
            { $match: { _id: { $ne: "" }, count: { $gt: 1 } } }
        ]);
        
        if (sharedWallets.length > 0) {
            console.warn("⚠️ FOUND SHARED VIRTUAL ACCOUNTS!");
            sharedWallets.forEach(w => console.log(`Account ${w._id} shared by ${w.emails.join(', ')}`));
        } else {
            console.log("✅ All virtual accounts are unique.");
        }

        // 4. Check for orphaned transactions
        const orphanTx = await Transaction.countDocuments({ userId: { $nin: users.map(u => u._id) } });
        if (orphanTx > 0) console.warn(`⚠️ Found ${orphanTx} orphaned transactions!`);
        else console.log("✅ All transactions correctly linked to valid users.");

        console.log("\n=== Audit Complete ===");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

audit();
