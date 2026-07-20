import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const updateAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB.");

        const User = (await import('./models/User.js')).default;

        const result = await User.updateOne(
            { email: 'unuktar1@gmail.com' },
            { $addToSet: { permissions: 'SYSTEM_RECOVERY' } }
        );

        console.log("Migration result:", result);
        console.log("SYSTEM_RECOVERY permission granted successfully.");
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
};

updateAdmin();
