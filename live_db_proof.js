import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/vtuapp';
    await mongoose.connect(uri);
    const db = mongoose.connection.db;
    
    const dbName = db.databaseName;
    const collections = await db.listCollections().toArray();
    
    const allCollections = [];
    const specificDetails = {};
    
    for (const coll of collections) {
      const count = await db.collection(coll.name).countDocuments();
      allCollections.push({ name: coll.name, count });
      
      if (['users', 'transactions', 'providerstatuses', 'dataplans'].includes(coll.name)) {
        // Aggregate to find oldest and newest createdAt
        const aggregation = [
          {
            $group: {
              _id: null,
              oldest: { $min: "$createdAt" },
              newest: { $max: "$createdAt" },
              count: { $sum: 1 }
            }
          }
        ];
        const stats = await db.collection(coll.name).aggregate(aggregation).toArray();
        if (stats.length > 0) {
          specificDetails[coll.name] = {
            totalDocumentCount: count, // Using exact count
            oldestDocumentCreatedAt: stats[0].oldest,
            newestDocumentCreatedAt: stats[0].newest
          };
        } else {
          specificDetails[coll.name] = {
            totalDocumentCount: count,
            oldestDocumentCreatedAt: null,
            newestDocumentCreatedAt: null
          };
        }
      }
    }
    
    allCollections.sort((a, b) => a.name.localeCompare(b.name));
    
    const proof = {
      databaseName: dbName,
      commandsUsed: {
        listCollections: "db.listCollections()",
        countDocuments: "db.collection(coll.name).countDocuments()",
        specificStatsAggregation: [
          {
            $group: {
              _id: null,
              oldest: { $min: "$createdAt" },
              newest: { $max: "$createdAt" },
              count: { $sum: 1 }
            }
          }
        ]
      },
      allCollections,
      specificDetails
    };
    
    console.log(JSON.stringify(proof, null, 2));
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await mongoose.disconnect();
  }
}
run();
