import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
  .then(async () => {
    const db = mongoose.connection.db;

    const emailToFind = 'aminuyahaya0991@gmail.com'; // WITHOUT the 'r'
    console.log(`Searching for user with email: ${emailToFind}`);
    const user = await db.collection('users').findOne({ email: emailToFind });
    console.log("\n--- USER DOCUMENT ---");
    console.log(user);

    if (user) {
        const otp = await db.collection('otps').findOne({ userId: user._id });
        console.log("\n--- OTP DOCUMENT (by userId) ---");
        console.log(otp);
    }

    mongoose.disconnect();
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
