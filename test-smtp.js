import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: 465,
    secure: true, 
    pool: false,
    family: 4,
    auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS,
    },
    tls: {
        rejectUnauthorized: false
    }
});

async function run() {
    console.log("Testing SMTP connection...");
    try {
        const info = await transporter.sendMail({
            from: `"MKSubData Test" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER,
            subject: "SMTP Test",
            text: "This is a test to verify SMTP functionality.",
        });
        console.log("Success! Message sent: %s", info.messageId);
    } catch (error) {
        console.error("SMTP Test Failed: ", error);
    }
}

run();
