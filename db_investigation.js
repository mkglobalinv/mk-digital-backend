import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function investigate() {
  try {
    console.log("Connecting to", process.env.MONGO_URI);
    await mongoose.connect(process.env.MONGO_URI);
    const db = mongoose.connection.db;
    
    const admins = await db.collection('users').find({ role: 'admin' }).project({ _id: 1, email: 1, role: 1, createdAt: 1, updatedAt: 1 }).toArray();
    console.log("=== SECTION A: ADMIN ACCOUNTS ===");
    console.log(JSON.stringify(admins, null, 2));

    const superadmins = await db.collection('users').find({ role: 'superadmin' }).project({ _id: 1, email: 1, role: 1, createdAt: 1, updatedAt: 1 }).toArray();
    console.log("\\n=== SECTION B: SUPER ADMIN ACCOUNTS ===");
    console.log(JSON.stringify(superadmins, null, 2));

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

investigate();
