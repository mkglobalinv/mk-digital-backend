import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function revertAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const db = mongoose.connection.db;

    const result = await db.collection('users').findOneAndUpdate(
        { email: 'muktar1@gmail.com' },
        { $set: { email: 'unuktar1@gmail.com' } },
        { returnDocument: 'after' }
    );
    
    if (result) {
      console.log("Successfully reverted email back to unuktar1@gmail.com");
    } else {
      console.log("Could not find muktar1@gmail.com. Maybe it was already unuktar1@gmail.com?");
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

revertAdmin();
