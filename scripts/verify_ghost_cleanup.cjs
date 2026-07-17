const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI;

const userSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model('User', userSchema, 'users');

async function verify() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB.");

    // 1. Existence Check
    console.log("\n--- Existence Check ---");
    const id1 = "6a3bd81c1cfe1df0660cb3db";
    const id2 = "6a3bd14c1cfe1df0660cb1ee";

    const user1 = await User.findById(id1).lean();
    console.log(`_id: ${id1} (email: musulma8@gmail.com) -> ${user1 ? 'EXISTS' : 'DELETED'}`);
    
    const user2 = await User.findById(id2).lean();
    console.log(`_id: ${id2} (email: kesplaystore1@gmail.com) -> ${user2 ? 'EXISTS' : 'DELETED'}`);

    // 2. Deletion Verification
    console.log("\n--- Deletion Verification ---");
    if (!user1 && !user2) {
      console.log("deletion confirmed: YES");
      console.log("deletion timestamp: Unknown (MongoDB physical deletion does not record timestamp by default)");
      console.log("execution method: Unknown (likely script/manual as per previous phase)");
      console.log("whether backup existed before deletion: Unknown (check previous scripts)");
    }

    // 3. Duplicate Verification
    console.log("\n--- Duplicate Verification ---");
    const duplicates = await User.aggregate([
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

    console.log(`Total duplicate pairs remaining: ${duplicates.length}`);
    duplicates.forEach(d => {
      console.log(`Email: ${d._id.email}, Tenant: ${d._id.tenantOwnerId}, Count: ${d.count}, IDs: ${d.docs.join(', ')}`);
    });
    
    console.log(`State whether deleted ghost records contribute to any conflict: ${duplicates.some(d => d.docs.includes(id1) || d.docs.includes(id2)) ? 'YES' : 'NO'}`);

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\nDisconnected.");
  }
}

verify();
