import dotenv from 'dotenv';
dotenv.config();
import { sendOTPEmail, sendEmail } from './services/emailService.js';
import mongoose from 'mongoose';

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    
    // Patch sendEmail to intercept
    const emailModule = await import('./services/emailService.js');
    console.log(emailModule.sendOTPEmail.toString());
    
    process.exit(0);
}
run();
