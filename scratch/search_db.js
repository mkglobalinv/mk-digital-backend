import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function searchAllCollections() {
    await mongoose.connect(process.env.MONGO_URI);
    const db = mongoose.connection.db;
    
    const collections = await db.listCollections().toArray();
    for (let c of collections) {
        const docs = await db.collection(c.name).find({}).toArray();
        let found = 0;
        for (let d of docs) {
            if (JSON.stringify(d).includes("C119A8A0")) {
                found++;
            }
        }
        if (found > 0) {
            console.log(`Found ${found} matches in collection: ${c.name}`);
        }
    }
    
    process.exit(0);
}

searchAllCollections();
