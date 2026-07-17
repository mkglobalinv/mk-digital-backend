import { sendAdminOTPEmail } from './services/emailService.js';
import mongoose from 'mongoose';

async function test() {
    try {
        console.log("Testing email...");
        const res = await sendAdminOTPEmail('unuktar1@gmail.com', '123456');
        console.log("Email result:", res);
    } catch (e) {
        console.error("Email error:", e);
    }
    process.exit(0);
}

test();
