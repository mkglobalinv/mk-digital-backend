import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { exec } from 'child_process';
import util from 'util';
import fs from 'fs';

dotenv.config();
const execPromise = util.promisify(exec);

async function run() {
    try {
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/mkdigital';
        
        console.log("Starting Phase C.8 Cleanup...");
        
        // Connect to DB first for JS-based backups
        await mongoose.connect(mongoUri);
        console.log("Connected to DB.");
        const usersCol = mongoose.connection.db.collection('users');

        const toDeleteIdsStr = ["6a3bd81c1cfe1df0660cb3db", "6a3bd14c1cfe1df0660cb1ee"];
        const toDeleteIds = toDeleteIdsStr.map(id => new mongoose.Types.ObjectId(id));

        const docsToBackup = await usersCol.find({ _id: { $in: toDeleteIds } }).toArray();
        if (docsToBackup.length !== 2) {
            throw new Error("Could not find both documents to backup.");
        }

        // 1. Export JSON
        console.log("Exporting to JSON...");
        fs.writeFileSync('ghost_users_backup.json', JSON.stringify(docsToBackup, null, 2));
        if (!fs.existsSync('ghost_users_backup.json')) throw new Error("JSON backup failed to create the file.");
        console.log("JSON backup verified.");

        // 2. Export BSON (Using BSON serializer from mongoose)
        console.log("Exporting to BSON...");
        const BSON = mongoose.mongo.BSON;
        if (!fs.existsSync('./ghost_users_dump')) fs.mkdirSync('./ghost_users_dump');
        
        let bsonBuffer = Buffer.alloc(0);
        for (const doc of docsToBackup) {
            bsonBuffer = Buffer.concat([bsonBuffer, BSON.serialize(doc)]);
        }
        fs.writeFileSync('./ghost_users_dump/users.bson', bsonBuffer);
        
        if (!fs.existsSync('./ghost_users_dump/users.bson')) throw new Error("BSON backup failed to create the file.");
        console.log("BSON backup verified.");


        // Pre-verification checks
        const originalReseller1 = await usersCol.findOne({ _id: new mongoose.Types.ObjectId("69ee1e332bd4a2325e37cc49") });
        const originalReseller2 = await usersCol.findOne({ _id: new mongoose.Types.ObjectId("69e8d1c5ac2ae8c113b9d57d") });

        if (!originalReseller1 || !originalReseller2) {
            throw new Error("Original resellers not found before deletion!");
        }



        // 3. Delete records
        console.log("Deleting ghost records...");
        const deleteResult = await usersCol.deleteMany({ _id: { $in: toDeleteIds } });
        console.log(`Deleted ${deleteResult.deletedCount} records.`);

        if (deleteResult.deletedCount !== 2) {
            console.error("Warning: Expected to delete 2 records, but deleted " + deleteResult.deletedCount);
        }

        // 4. Verify deletions
        const remainingDeleted = await usersCol.countDocuments({ _id: { $in: toDeleteIds } });
        if (remainingDeleted > 0) {
            throw new Error("Records were not fully deleted!");
        }

        // Verify original resellers are intact
        const postReseller1 = await usersCol.findOne({ _id: new mongoose.Types.ObjectId("69ee1e332bd4a2325e37cc49") });
        const postReseller2 = await usersCol.findOne({ _id: new mongoose.Types.ObjectId("69e8d1c5ac2ae8c113b9d57d") });

        if (!postReseller1 || !postReseller2) {
            throw new Error("Original resellers were accidentally deleted or modified!");
        }

        console.log("Original reseller accounts verified intact.");

        // Find remaining (email, tenantOwnerId) duplicates
        const remainingDuplicates = await usersCol.aggregate([
            { $group: { _id: { email: "$email", tenantOwnerId: "$tenantOwnerId" }, count: { $sum: 1 } } },
            { $match: { count: { $gt: 1 }, "_id.email": { $ne: null } } }
        ]).toArray();

        console.log("\n=== FINAL REPORT ===");
        console.log(`IDs deleted: 6a3bd81c1cfe1df0660cb3db, 6a3bd14c1cfe1df0660cb1ee`);
        console.log(`Backup status: SUCCESS (JSON & BSON)`);
        console.log(`Verification status: SUCCESS (Originals intact, ghost records removed)`);
        console.log(`Remaining duplicate (email, tenantOwnerId) pairs: ${remainingDuplicates.length}`);
        if (remainingDuplicates.length > 0) {
            console.log(JSON.stringify(remainingDuplicates, null, 2));
        }

        process.exit(0);

    } catch (err) {
        console.error("ABORTING:", err.message);
        process.exit(1);
    }
}

run();
