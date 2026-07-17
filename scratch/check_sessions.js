import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import Session from '../models/Session.js';
import User from '../models/User.js';

async function main() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB.");
        
        const sessions = await Session.find({ isValid: true }).sort({ updatedAt: -1 }).limit(10);
        console.log(`Found ${sessions.length} active sessions:`);
        for (const session of sessions) {
            const user = await User.findById(session.userId);
            console.log({
                sessionId: session._id,
                userId: session.userId,
                email: user?.email,
                role: user?.role,
                ipAddress: session.ipAddress,
                userAgent: session.userAgent,
                type: session.type,
                updatedAt: session.updatedAt,
                token: session.token ? (session.token.substring(0, 15) + "...") : null
            });
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

main();
