import mongoose from 'mongoose';
import User from './models/User.js';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

async function resetAdmin() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        
        const email = "unuktar1@gmail.com";
        const newPassword = "Admin@123"; // You can change this
        const hashedPw = await bcrypt.hash(newPassword, 10);
        
        let user = await User.findOne({ email });
        
        if (user) {
            console.log(`User ${email} found. Updating to Admin and resetting password...`);
            user.role = "admin";
            user.password = hashedPw;
            user.isEmailVerified = true;
            user.isSignupComplete = true;
            await user.save();
            console.log("SUCCESS: User updated to Admin.");
        } else {
            console.log(`User ${email} not found. Creating new Admin...`);
            user = new User({
                name: "Admin",
                email: email,
                password: hashedPw,
                role: "admin",
                isEmailVerified: true,
                isSignupComplete: true
            });
            await user.save();
            console.log("SUCCESS: New Admin user created.");
        }
        
        console.log("-----------------------------------------");
        console.log("Login Details:");
        console.log(`Email: ${email}`);
        console.log(`Password: ${newPassword}`);
        console.log("-----------------------------------------");
        
        process.exit(0);
    } catch (err) {
        console.error("ERROR:", err);
        process.exit(1);
    }
}

resetAdmin();
