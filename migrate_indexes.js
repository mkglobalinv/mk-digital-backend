/**
 * MONGODB INDEX MIGRATION SCRIPT
 * Run this script to drop legacy global unique indexes on email and phone
 * that interfere with tenant-isolated user registration.
 * 
 * Usage: node migrate_indexes.js
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/vtuapp';

const runMigration = async () => {
    try {
        console.log(`[Migration] Connecting to MongoDB: ${MONGO_URI}`);
        await mongoose.connect(MONGO_URI);
        const db = mongoose.connection.db;

        console.log('[Migration] Connected. Checking existing indexes on "users" collection...');
        const indexes = await db.collection('users').indexes();
        
        let droppedCount = 0;
        for (const index of indexes) {
            // Check for legacy global unique index on email
            if (index.name === 'email_1') {
                console.log('[Migration] Found legacy global index: email_1. Dropping...');
                await db.collection('users').dropIndex('email_1');
                console.log('[Migration] Successfully dropped email_1.');
                droppedCount++;
            }
            // Check for any legacy global unique index on phone
            if (index.name === 'phone_1' || index.name === 'kycData.phone_1') {
                console.log(`[Migration] Found legacy global index: ${index.name}. Dropping...`);
                await db.collection('users').dropIndex(index.name);
                console.log(`[Migration] Successfully dropped ${index.name}.`);
                droppedCount++;
            }
        }

        if (droppedCount === 0) {
            console.log('[Migration] No legacy global indexes found. Database is already clean.');
        } else {
            console.log(`[Migration] Migration complete. Dropped ${droppedCount} legacy indexes.`);
        }
        
        // Let's print the remaining indexes to verify the correct compound index exists
        console.log('\n[Migration] Current Indexes:');
        const newIndexes = await db.collection('users').indexes();
        newIndexes.forEach(idx => {
            console.log(` - ${idx.name} (Unique: ${!!idx.unique})`);
        });

    } catch (err) {
        console.error('[Migration] Fatal Error:', err);
    } finally {
        await mongoose.disconnect();
        console.log('[Migration] Disconnected from MongoDB.');
    }
};

runMigration();
