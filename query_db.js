import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const userSchema = new mongoose.Schema({
  email: String,
  role: String,
  isEmailVerified: Boolean,
  isSignupComplete: Boolean
}, { strict: false });

const User = mongoose.model('User', userSchema, 'users');

async function testAccounts() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/vtuapp');
    
    console.log("=== DB DOCUMENTS ===");
    const users = await User.find({ email: { $in: ['admin@9jasub.com', 'unuktar1@gmail.com'] } }).select('_id email role isEmailVerified isSignupComplete').lean();
    console.log(JSON.stringify(users, null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}
testAccounts();
