require('dotenv').config();
const mongoose = require('mongoose');

async function investigateDb() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB.');

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    const results = [];
    
    for (const col of collections) {
      const collectionName = col.name;
      const count = await db.collection(collectionName).countDocuments();
      results.push({ collection: collectionName, documentCount: count });
    }
    
    console.log(JSON.stringify(results, null, 2));
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

investigateDb();
