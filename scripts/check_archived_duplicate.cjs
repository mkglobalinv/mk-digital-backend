const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI;

const userSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model('User', userSchema, 'users');

async function checkArchivedDuplicate() {
  try {
    await mongoose.connect(MONGO_URI);
    
    const id1 = "6a3a71f09fd45f9f8114767f";
    const id2 = "6a39ad964e5d60f7c755bc56";

    const user1 = await User.findById(id1).lean();
    const user2 = await User.findById(id2).lean();

    console.log("--- User 1 ---");
    console.log(`_id: ${user1._id}`);
    console.log(`email: ${user1.email}`);
    console.log(`tenantOwnerId: ${user1.tenantOwnerId}`);
    console.log(`role: ${user1.role}`);
    console.log(`archived: ${user1.archived}`);
    console.log(`createdAt: ${user1.createdAt}`);

    console.log("\n--- User 2 ---");
    console.log(`_id: ${user2._id}`);
    console.log(`email: ${user2.email}`);
    console.log(`tenantOwnerId: ${user2.tenantOwnerId}`);
    console.log(`role: ${user2.role}`);
    console.log(`archived: ${user2.archived}`);
    console.log(`createdAt: ${user2.createdAt}`);

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
  }
}

checkArchivedDuplicate();
