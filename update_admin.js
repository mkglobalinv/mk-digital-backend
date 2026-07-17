import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function updateAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const db = mongoose.connection.db;

    // First check if muktar1@gmail.com already exists (just to be absolutely safe)
    let user = await db.collection('users').findOne({ email: 'muktar1@gmail.com' });
    
    if (!user) {
        // Find unuktar1@gmail.com and update it to muktar1@gmail.com and set role to superadmin
        const result = await db.collection('users').findOneAndUpdate(
            { email: 'unuktar1@gmail.com' },
            { $set: { email: 'muktar1@gmail.com', role: 'superadmin' } },
            { returnDocument: 'after' }
        );
        user = result;
        console.log("Updated unuktar1@gmail.com -> muktar1@gmail.com, role: superadmin");
    } else {
        // If it already exists, just make sure role is superadmin
        await db.collection('users').updateOne(
            { email: 'muktar1@gmail.com' },
            { $set: { role: 'superadmin' } }
        );
        console.log("Found muktar1@gmail.com, updated role to superadmin");
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

updateAdmin();
