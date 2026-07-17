import dotenv from 'dotenv';
dotenv.config();
import { sendEmail } from './services/emailService.js';
import axios from 'axios';
import mongoose from 'mongoose';
import fs from 'fs';

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    const db = mongoose.connection.db;

    // We will test if ANY email is sent by checking the server logs or by directly triggering register.
    // Wait, we can't easily mock transporter in the running server process from outside.
    // Instead, I'll modify emailService.js temporarily to log EVERY email recipient to a file.
    
    // Read emailService.js
    let content = fs.readFileSync('./services/emailService.js', 'utf8');
    if (!content.includes('fs.appendFileSync("EMAIL_TRACE.log"')) {
        content = content.replace(
            `const info = await transporter.sendMail({`,
            `fs.appendFileSync("EMAIL_TRACE.log", \`\\n[SEND_EMAIL_TRACE] \${new Date().toISOString()} | TO: \${to} | SUBJECT: \${subject}\\n\`);\n        const info = await transporter.sendMail({`
        );
        fs.writeFileSync('./services/emailService.js', content);
        console.log("Injected trace into emailService.js");
    } else {
        console.log("Trace already injected.");
    }
    process.exit(0);
}
run();
