import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/mkdigital');
        console.log("Connected to DB.");

        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();
        const collectionNames = collections.map(c => c.name);
        
        const emails = [
            "musulma8@gmail.com",
            "reffar34@gmail.com",
            "kesplaystore1@gmail.com"
        ];

        const usersCol = db.collection('users');

        for (const email of emails) {
            const docs = await usersCol.find({ email }).toArray();
            console.log(`\n\n=== DEPENDENCY REPORT FOR ${email} ===`);
            for (const doc of docs) {
                console.log(`\n--- Document _id: ${doc._id} ---`);
                console.log(JSON.stringify({
                    role: doc.role,
                    tenantOwnerId: doc.tenantOwnerId,
                    archived: doc.archived,
                    createdAt: doc.createdAt,
                    updatedAt: doc.updatedAt,
                    lastLogin: doc.lastLogin, // may not exist
                    status: doc.isSuspended ? 'Suspended' : 'Active',
                    resellerTier: doc.resellerTier,
                    whiteLabelStatus: doc.whiteLabelStatus,
                    subdomain: doc.subdomain,
                    admin_subdomain: doc.admin_subdomain,
                    customDomain: doc.customDomain,
                    referralCode: doc.referralCode,
                    referredBy: doc.referredBy,
                    balance1: doc.balance1,
                    balance2: doc.balance2,
                    loginActivityCount: doc.loginActivity ? doc.loginActivity.length : 0,
                    webauthnCredentials: doc.webauthnCredentials ? doc.webauthnCredentials.length : 0,
                    apiKey: doc.apiKey ? true : false
                }, null, 2));

                console.log("\nSearching ALL collections for references...");
                let hasReferences = false;
                for (const colName of collectionNames) {
                    if (colName === 'users') {
                        // For users, check if this doc is referredBy or tenantOwnerId or mergedInto
                        const count = await db.collection(colName).countDocuments({ 
                            $or: [
                                { referredBy: doc._id },
                                { tenantOwnerId: doc._id },
                                { mergedInto: doc._id }
                            ]
                        });
                        if (count > 0) {
                            console.log(`- Collection 'users' (as referredBy/tenantOwnerId/mergedInto): ${count} records`);
                            hasReferences = true;
                        }
                    } else {
                        // Check common reference fields: userId, user, owner, user_id, resellerId, etc.
                        // Or just search blindly for the ObjectId
                        // Since Mongoose typically uses userId, resellerId, adminId etc, we can try searching all fields that might hold an ObjectId
                        // A safer way is to search known fields or just search values
                        
                        const query = {
                            $or: [
                                { userId: doc._id },
                                { user_id: doc._id },
                                { user: doc._id },
                                { owner: doc._id },
                                { resellerId: doc._id },
                                { adminId: doc._id },
                                { accountId: doc._id }
                            ]
                        };
                        const count = await db.collection(colName).countDocuments(query);
                        if (count > 0) {
                            console.log(`- Collection '${colName}': ${count} records`);
                            hasReferences = true;
                        }
                    }
                }
                if (!hasReferences) console.log("- NO REFERENCES FOUND IN ANY COLLECTION.");
            }
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
run();
