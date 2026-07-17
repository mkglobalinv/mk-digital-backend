import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.set('debug', true);

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  role: String,
  createdAt: Date
}, { strict: false, timestamps: true });

const User = mongoose.model('User', userSchema, 'users');

async function getResellerAdmins() {
  try {
    console.log("Connecting...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected.");
    
    console.log("=== RESELLER ADMIN ACCOUNTS ===");
    const users = await User.find({ role: 'reseller_admin' }).lean().maxTimeMS(20000); // 20s timeout
    
    if (users.length === 0) {
      console.log("No reseller_admin accounts found.");
    } else {
      for (const u of users) {
        const created = u.createdAt ? u.createdAt : (u._id ? u._id.getTimestamp() : "Unknown");
        console.log(`Email: ${u.email}`);
        console.log(`Username: ${u.name}`);
        console.log(`Created Date: ${created}`);
        console.log("-----------------------");
      }
    }
  } catch (err) {
    console.error("Error:", err);
  } finally {
    console.log("Disconnecting...");
    await mongoose.disconnect();
    console.log("Done.");
  }
}

getResellerAdmins();
