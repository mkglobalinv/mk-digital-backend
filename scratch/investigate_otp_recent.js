import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
  .then(async () => {
    const db = mongoose.connection.db;

    console.log("\n--- RECENT USERS ---");
    const recentUsers = await db.collection('users').find({}).sort({ _id: -1 }).limit(10).toArray();
    recentUsers.forEach(u => console.log(u.email, u.name, u._id));

    console.log("\n--- RECENT OTPS ---");
    const recentOtps = await db.collection('otps').find({}).sort({ _id: -1 }).limit(10).toArray();
    recentOtps.forEach(o => console.log(o.userId, o.email));

    mongoose.disconnect();
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
