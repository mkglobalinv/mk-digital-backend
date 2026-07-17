import mongoose from 'mongoose';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const activateWhiteLabel = async (email) => {
    try {
        const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/vtu_db';
        await mongoose.connect(uri);
        console.log('Connected to MongoDB');

        const user = await User.findOne({ email });
        if (!user) {
            console.log(`User with email ${email} not found.`);
            process.exit(0);
        }

        user.whiteLabelStatus = 'active';
        // Ensure they have a site name if not set
        if (!user.branding?.siteName) {
            if (!user.branding) user.branding = {};
            user.branding.siteName = user.name + " VTU";
        }
        
        await user.save();
        console.log(`Successfully activated White Label for: ${email}`);
        console.log(`Current Status: ${user.whiteLabelStatus}`);
        
        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
};

activateWhiteLabel('ghcplaystore1@gmail.com');
