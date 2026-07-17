import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/mkdigital');
        console.log("Connected to DB.");

        const db = mongoose.connection.db;
        const usersCol = db.collection('users');
        const transactionsCol = db.collection('transactions');

        const emails = [
            "musulma8@gmail.com",
            "reffar34@gmail.com",
            "kesplaystore1@gmail.com"
        ];

        console.log("=== DUPLICATE INVENTORY ===");
        for (const email of emails) {
            const docs = await usersCol.find({ email }).toArray();
            for (const doc of docs) {
                // Fetch extra counts
                const txCount = await transactionsCol.countDocuments({ userId: doc._id });
                const referralCount = await usersCol.countDocuments({ referredBy: doc._id });
                const withdrawalCount = await transactionsCol.countDocuments({ userId: doc._id, type: 'withdrawal' });

                console.log(JSON.stringify({
                    _id: doc._id,
                    email: doc.email,
                    role: doc.role,
                    tenantOwnerId: doc.tenantOwnerId,
                    archived: doc.archived,
                    createdAt: doc.createdAt,
                    updatedAt: doc.updatedAt,
                    referredBy: doc.referredBy,
                    subdomain: doc.subdomain,
                    admin_subdomain: doc.admin_subdomain,
                    customDomain: doc.customDomain,
                    resellerTier: doc.resellerTier,
                    isResellerActivated: doc.isResellerActivated,
                    whiteLabelStatus: doc.whiteLabelStatus,
                    balance1: doc.balance1,
                    balance2: doc.balance2,
                    transactionCount: txCount,
                    referralCount: referralCount,
                    withdrawalCount: withdrawalCount,
                    loginActivityCount: doc.loginActivity ? doc.loginActivity.length : 0
                }, null, 2));
            }
        }

        console.log("\n=== MISSING ARCHIVED FIELD INVENTORY ===");
        const missingArchivedFilter = { archived: { $exists: false } };
        const missingCount = await usersCol.countDocuments(missingArchivedFilter);
        
        if (missingCount > 0) {
            const firstCreated = await usersCol.find(missingArchivedFilter).sort({ createdAt: 1 }).limit(1).toArray();
            const lastCreated = await usersCol.find(missingArchivedFilter).sort({ createdAt: -1 }).limit(1).toArray();
            
            console.log(JSON.stringify({
                missingCount,
                firstCreatedDate: firstCreated.length ? firstCreated[0].createdAt : null,
                lastCreatedDate: lastCreated.length ? lastCreated[0].createdAt : null,
            }, null, 2));
        } else {
            console.log("Zero missing archived fields.");
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
run();
