import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/vtuapp');
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    const results = [];
    for (const coll of collections) {
      const count = await db.collection(coll.name).countDocuments();
      results.push({ name: coll.name, count });
    }
    
    // Sort alphabetically
    results.sort((a, b) => a.name.localeCompare(b.name));
    
    console.log(JSON.stringify(results, null, 2));
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await mongoose.disconnect();
  }
}
run();
