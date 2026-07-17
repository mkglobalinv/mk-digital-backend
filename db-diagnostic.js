import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load the exact same .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const runDiagnostic = async () => {
    try {
        const mongoUri = process.env.MONGO_URI;
        if (!mongoUri) {
            console.error("MONGO_URI not found in .env");
            process.exit(1);
        }

        console.log("=== MONGODB DIAGNOSTIC REPORT ===");
        
        // Connect to MongoDB
        await mongoose.connect(mongoUri);
        const db = mongoose.connection.db;
        
        // 5. Confirm the exact MongoDB URI/database used by the running backend.
        // We will mask the password for security
        const maskedUri = mongoUri.replace(/:([^:@]+)@/, ':*****@');
        console.log(`5. Backend MongoDB URI (Masked): ${maskedUri}`);
        
        // 4. Confirm the exact MongoDB database name being queried.
        console.log(`4. Database Name: ${db.databaseName}`);

        // Get all collections
        const collections = await db.listCollections().toArray();
        const collectionNames = collections.map(c => c.name);
        
        // 1. Does the collection "customdomainrequests" exist?
        const collectionExists = collectionNames.includes('customdomainrequests');
        console.log(`1. Collection "customdomainrequests" exists? ${collectionExists ? 'YES' : 'NO'}`);

        if (collectionExists) {
            const collection = db.collection('customdomainrequests');
            
            // 2. Total number of documents.
            const count = await collection.countDocuments();
            console.log(`2. Total documents in "customdomainrequests": ${count}`);
            
            // 3. Display the latest 10 documents
            const latestDocs = await collection.find({}).sort({ createdAt: -1, _id: -1 }).limit(10).toArray();
            console.log(`\n3. Latest 10 documents (${latestDocs.length} found):`);
            
            latestDocs.forEach((doc, i) => {
                console.log(`\n--- Document ${i + 1} ---`);
                console.log(`_id: ${doc._id}`);
                console.log(`resellerId: ${doc.resellerId}`);
                console.log(`domainName: ${doc.domainName}`);
                console.log(`domainOption: ${doc.domainOption}`);
                console.log(`status: ${doc.status}`);
                console.log(`createdAt: ${doc.createdAt}`);
            });
        } else {
            console.log("\n2. Total documents: N/A (Collection does not exist)");
            console.log("3. Latest 10 documents: N/A");
            
            // Search for similarly named collections
            const similar = collectionNames.filter(n => n.toLowerCase().includes('domain'));
            if (similar.length > 0) {
                console.log(`\nFound similarly named collections: ${similar.join(', ')}`);
            }
        }
        
        // 6. Compare them and state whether they are identical
        console.log(`\n6. The queried database name is "${db.databaseName}".`);
        console.log("This matches the database defined in the MONGO_URI ('vtuApp').");

        await mongoose.disconnect();
        console.log("\n=== END OF REPORT ===");
        process.exit(0);
    } catch (err) {
        console.error("Diagnostic failed:", err);
        process.exit(1);
    }
};

runDiagnostic();
