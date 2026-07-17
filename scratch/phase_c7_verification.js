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

        const targetIdsStr = [
            "6a3bd81c1cfe1df0660cb3db",
            "6a3bd14c1cfe1df0660cb1ee"
        ];
        const targetIds = targetIdsStr.map(id => new mongoose.Types.ObjectId(id));

        for (let i = 0; i < targetIds.length; i++) {
            const id = targetIds[i];
            const idStr = targetIdsStr[i];
            console.log(`\n=== INVESTIGATION FOR USER: ${idStr} ===`);

            const doc = await db.collection('users').findOne({ _id: id });
            if (!doc) {
                console.log(`Document ${idStr} NOT FOUND.`);
                continue;
            }

            console.log("Document fields retrieved:");
            console.log(Object.keys(doc).join(', '));

            console.log(`\n--- REFERENCE SCAN FOR ${idStr} ---`);
            let totalRefs = 0;
            for (const colName of collectionNames) {
                const query = {
                    $or: [
                        { _id: idStr },
                        { userId: id },
                        { userId: idStr },
                        { user: id },
                        { user: idStr },
                        { user_id: id },
                        { user_id: idStr },
                        { owner: id },
                        { owner: idStr },
                        { resellerId: id },
                        { resellerId: idStr },
                        { adminId: id },
                        { adminId: idStr },
                        { accountId: id },
                        { accountId: idStr },
                        { referredBy: id },
                        { referredBy: idStr },
                        { tenantOwnerId: id },
                        { tenantOwnerId: idStr },
                        { mergedInto: id },
                        { mergedInto: idStr }
                    ]
                };

                const count = await db.collection(colName).countDocuments(query);
                if (count > 0 && colName !== 'users') {
                    console.log(`FOUND ${count} references in collection: ${colName}`);
                    totalRefs += count;
                }
            }

            if (totalRefs === 0) {
                console.log("ZERO references found in any other collection.");
            } else {
                console.log(`TOTAL references found: ${totalRefs}`);
            }
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
run();
