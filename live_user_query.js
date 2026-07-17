import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

function maskEmail(email) {
  if (!email) return "N/A";
  const parts = email.split('@');
  if (parts.length !== 2) return email;
  return parts[0].substring(0, 3) + "***@" + parts[1];
}

async function executeQuery(db, runLabel) {
  const count = await db.collection('users').countDocuments();
  const newestUsers = await db.collection('users').find().sort({ createdAt: -1 }).limit(1).toArray();
  const newestUser = newestUsers[0] || {};
  
  return {
    run: runLabel,
    totalCount: count,
    newestUser_id: newestUser._id,
    newestUserCreatedAt: newestUser.createdAt,
    newestUserEmail: maskEmail(newestUser.email)
  };
}

async function run() {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/vtuapp';
    await mongoose.connect(uri);
    const db = mongoose.connection.db;
    
    // First query execution
    const run1 = await executeQuery(db, "Execution 1 (Live DB Query)");
    
    // Second query execution (immediately after to confirm no caching)
    const run2 = await executeQuery(db, "Execution 2 (Immediate Follow-up Live DB Query)");
    
    console.log(JSON.stringify([run1, run2], null, 2));
    
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await mongoose.disconnect();
  }
}
run();
