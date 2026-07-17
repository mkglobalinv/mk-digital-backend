import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
dotenv.config();

// Define a minimal User model for the script
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  role: String,
  isEmailVerified: Boolean,
  isSignupComplete: Boolean,
  name: String,
  totalBalance: Number,
  transactionPin: String
}, { strict: false });

const User = mongoose.model('User', userSchema, 'users');

async function upgradeAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/vtuapp');
    console.log('Connected to MongoDB');
    
    const email = 'unuktar1@gmail.com';
    let user = await User.findOne({ email });
    
    if (user) {
      console.log(`User ${email} found! Current role: ${user.role}`);
      user.role = 'admin';
      user.isEmailVerified = true;
      user.isSignupComplete = true;
      
      // We will also reset the password to ensure they can definitely log in
      const hashedPassword = await bcrypt.hash('Admin@123', 10);
      user.password = hashedPassword;
      
      await user.save();
      console.log(`User ${email} upgraded to admin. Password reset to: Admin@123`);
    } else {
      console.log(`User ${email} not found. Creating a new admin account...`);
      const hashedPassword = await bcrypt.hash('Admin@123', 10);
      const hashedPin = await bcrypt.hash('1234', 10);
      user = new User({
        name: 'Super Admin',
        email: email,
        password: hashedPassword,
        role: 'admin',
        isEmailVerified: true,
        isSignupComplete: true,
        totalBalance: 0,
        transactionPin: hashedPin
      });
      await user.save();
      console.log(`Created new admin account for ${email}. Password: Admin@123`);
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

upgradeAdmin();
