const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI;

const userSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model('User', userSchema, 'users');

async function preflight() {
  try {
    await mongoose.connect(MONGO_URI);
    
    // 1. Live Indexes
    console.log("--- 1. Live MongoDB Indexes for Users Collection ---");
    const indexes = await User.collection.indexes();
    console.log(JSON.stringify(indexes, null, 2));

    // 4. Duplicate Check (Logic of New Partial Index)
    console.log("\n--- 4. Active Duplicate Conflicts (archived: false) ---");
    const duplicates = await User.aggregate([
      {
        $match: { archived: false }
      },
      {
        $group: {
          _id: { email: "$email", tenantOwnerId: "$tenantOwnerId" },
          count: { $sum: 1 },
          docs: { $push: "$_id" }
        }
      },
      {
        $match: {
          count: { $gt: 1 },
          "_id.email": { $ne: null }
        }
      }
    ]);
    
    console.log(`Total active duplicate pairs (archived: false): ${duplicates.length}`);
    duplicates.forEach(d => {
      console.log(`Email: ${d._id.email}, Tenant: ${d._id.tenantOwnerId}, Count: ${d.count}, IDs: ${d.docs.join(', ')}`);
    });

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
  }
}

preflight();
