import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

async function fixBalances() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB ✅');

    // Find all users who have a 'balance' field (which is not in the schema but might exist in the DB)
    const users = await User.find({ balance: { $exists: true, $ne: 0 } });
    console.log(`Found ${users.length} users with a 'balance' field.`);

    for (const user of users) {
      // Use raw object to access fields not in schema if necessary, 
      // but Mongoose usually lets you access them if they exist in the DB.
      const rawUser = await mongoose.connection.db.collection('users').findOne({ _id: user._id });
      const extraBalance = rawUser.balance || 0;

      if (extraBalance > 0) {
        console.log(`Migrating ₦${extraBalance} for ${user.email}...`);
        
        await mongoose.connection.db.collection('users').updateOne(
          { _id: user._id },
          { 
            $inc: { balance1: extraBalance },
            $unset: { balance: "" } 
          }
        );
        console.log(`Successfully migrated ₦${extraBalance} to balance1 for ${user.email}`);
      }
    }

    console.log('Migration complete! 🎉');
    await mongoose.connection.close();
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

fixBalances();
