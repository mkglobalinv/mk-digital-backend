import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.staging') });

const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log("Connected to MongoDB Staging.");

    const db = mongoose.connection.db;

    const emailToFind = 'arminuyahaya0991@gmail.com'.toLowerCase();

    const user = await db.collection('users').findOne({ email: emailToFind });
    console.log("\n--- USER DOCUMENT ---");
    console.log(user);

    if (user) {
        const otp = await db.collection('otps').findOne({ userId: user._id });
        const otp2 = await db.collection('otps').findOne({ email: emailToFind });
        console.log("\n--- OTP DOCUMENT (by userId) ---");
        console.log(otp);
        console.log("\n--- OTP DOCUMENT (by email) ---");
        console.log(otp2);
    } else {
        const otp2 = await db.collection('otps').findOne({ email: emailToFind });
        console.log("\n--- OTP DOCUMENT (by email only) ---");
        console.log(otp2);
    }

    mongoose.disconnect();
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
