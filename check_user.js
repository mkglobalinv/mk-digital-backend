import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/vtuapp';
    await mongoose.connect(uri);
    const db = mongoose.connection.db;
    
    const email = 'unuktar1@gmail.com';
    let user = await db.collection('users').findOne({ email: new RegExp('^' + email + '$', 'i') });
    
    if (user) {
      console.log(`Found user ${email}`);
      console.log(`Current Role: ${user.role}`);
      
      // Update password to 12345678 for easy testing
      const newHash = await bcrypt.hash('12345678', 10);
      await db.collection('users').updateOne(
        { _id: user._id },
        { $set: { password: newHash, role: 'admin' } }
      );
      
      console.log('Password reset to: 12345678');
      console.log('Role ensured to be: admin');
    } else {
      console.log(`User ${email} NOT FOUND. Creating...`);
      const newHash = await bcrypt.hash('12345678', 10);
      await db.collection('users').insertOne({
        email: email,
        password: newHash,
        role: 'admin',
        firstName: 'Unuktar',
        lastName: 'Admin',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log(`Created user ${email} with password 12345678 and role admin.`);
    }
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await mongoose.disconnect();
  }
}
run();
