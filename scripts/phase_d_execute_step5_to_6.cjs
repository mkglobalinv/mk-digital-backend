const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI;

const userSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model('User', userSchema, 'users');

async function execute() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB.");

    // Step 5: Drop ONLY email_1_referredBy_1
    console.log("--- Step 5: Dropping email_1_referredBy_1 ---");
    await User.collection.dropIndex('email_1_referredBy_1');
    console.log("Successfully dropped email_1_referredBy_1");

    // Step 6: Inspect indexes again
    console.log("--- Step 6: Inspecting final indexes ---");
    const updatedIndexes = await User.collection.indexes();
    
    const hasEmail1 = updatedIndexes.some(idx => idx.name === 'email_1');
    const hasEmailReferred = updatedIndexes.some(idx => idx.name === 'email_1_referredBy_1');
    const hasCompound = updatedIndexes.some(idx => idx.name === 'email_1_tenantOwnerId_1');
    const hasReferredBy = updatedIndexes.some(idx => idx.name === 'referredBy_1');
    
    console.log(`email_1 removed: ${!hasEmail1}`);
    console.log(`email_1_referredBy_1 removed: ${!hasEmailReferred}`);
    console.log(`email_1_tenantOwnerId_1 still exists: ${hasCompound}`);
    console.log(`referredBy_1 still exists: ${hasReferredBy}`);

    console.log("\nRemaining index names for verification:");
    updatedIndexes.forEach(idx => console.log("- " + idx.name));

  } catch (error) {
    console.error("Error during execution:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected.");
  }
}

execute();
