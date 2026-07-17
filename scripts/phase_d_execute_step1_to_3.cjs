const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI;

const userSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model('User', userSchema, 'users');

async function execute() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB.");

    // Step 1: Verify both indexes still exist.
    console.log("--- Step 1: Verifying indexes ---");
    const indexes = await User.collection.indexes();
    const email1Exists = indexes.some(idx => idx.name === 'email_1');
    const emailReferredExists = indexes.some(idx => idx.name === 'email_1_referredBy_1');
    
    console.log(`email_1 exists: ${email1Exists}`);
    console.log(`email_1_referredBy_1 exists: ${emailReferredExists}`);
    
    if (!email1Exists || !emailReferredExists) {
        console.error("STOP: One or both indexes are missing.");
        process.exit(1);
    }

    // Step 2: Drop ONLY email_1
    console.log("--- Step 2: Dropping email_1 ---");
    await User.collection.dropIndex('email_1');
    console.log("Successfully dropped email_1");

    // Step 3: Immediately inspect MongoDB indexes.
    console.log("--- Step 3: Inspecting indexes ---");
    const updatedIndexes = await User.collection.indexes();
    const newEmail1Exists = updatedIndexes.some(idx => idx.name === 'email_1');
    const compoundExists = updatedIndexes.some(idx => idx.name === 'email_1_tenantOwnerId_1');
    
    console.log(`email_1 dropped successfully: ${!newEmail1Exists}`);
    console.log(`email_1_tenantOwnerId_1 still exists: ${compoundExists}`);

    console.log("\nAll step 1-3 complete.");

  } catch (error) {
    console.error("Error during execution:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected.");
  }
}

execute();
