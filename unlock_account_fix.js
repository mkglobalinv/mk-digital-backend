import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function unlockAccount() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const db = mongoose.connection.db;

    const result = await db.collection('users').updateOne(
        { email: 'unuktar1@gmail.com' },
        { 
            $set: { failedLoginAttempts: 0 },
            $unset: { lockoutUntil: "" }
        }
    );
    
    if (result.matchedCount > 0) {
      console.log("Successfully unlocked account for unuktar1@gmail.com by unsetting lockoutUntil");
    } else {
      console.log("Could not find unuktar1@gmail.com");
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

unlockAccount();
