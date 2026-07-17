import mongoose from 'mongoose';
import dotenv from 'dotenv';
import OTP from './models/OTP.js';
import User from './models/User.js';

dotenv.config();

async function getOTP() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const user = await User.findOne({ email: 'test_user_unique@gmail.com' });
    if (!user) {
      console.log('User not found');
      return;
    }
    const otp = await OTP.findOne({ userId: user._id });
    if (!otp) {
      console.log('OTP not found');
    } else {
      console.log('OTP for test user:', otp.hashedOtp);
      console.log('Wait, hashedOtp is hashed. I should check the console logs of the server to see the actual OTP.');
    }
    await mongoose.connection.close();
  } catch (err) {
    console.error(err);
  }
}

getOTP();
