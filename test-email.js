import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
dotenv.config();

const emailPort = Number(process.env.EMAIL_PORT) || 465;
const secure = emailPort === 465;

console.log('EMAIL_HOST:', process.env.EMAIL_HOST);
console.log('EMAIL_PORT:', emailPort);
console.log('EMAIL_USER exists:', !!process.env.EMAIL_USER);
console.log('EMAIL_PASS exists:', !!process.env.EMAIL_PASS);

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: emailPort,
    secure: secure,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    tls: {
        rejectUnauthorized: false
    }
});

transporter.verify((error, success) => {
    if (error) {
        console.error("SMTP Connection Error:", error);
        process.exit(1);
    } else {
        console.log("SMTP Server is ready to take our messages");
        process.exit(0);
    }
});
