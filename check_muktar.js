import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function investigate() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const db = mongoose.connection.db;
    
    const user = await db.collection('users').findOne({ email: 'muktar1@gmail.com' });
    console.log("muktar1@gmail.com:", user ? `FOUND (role: ${user.role})` : "NOT FOUND");

    const unuktar1 = await db.collection('users').findOne({ email: 'unuktar1@gmail.com' });
    console.log("unuktar1@gmail.com:", unuktar1 ? `FOUND (role: ${unuktar1.role})` : "NOT FOUND");

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

investigate();
