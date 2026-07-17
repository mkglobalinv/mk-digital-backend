import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: 587,
    secure: false, 
    pool: false,
    auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS,
    },
    tls: {
        rejectUnauthorized: false
    }
});

async function run() {
    console.log("Testing SMTP connection on port 587...");
    try {
        const info = await transporter.sendMail({
            from: `"MKSubData Test" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER,
            subject: "SMTP Test 587",
            text: "This is a test to verify SMTP functionality on port 587.",
        });
        console.log("Success! Message sent: %s", info.messageId);
    } catch (error) {
        console.error("SMTP Test Failed: ", error.message);
    }
}

run();
