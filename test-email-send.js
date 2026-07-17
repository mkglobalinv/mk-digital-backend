import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
dotenv.config();

const emailPort = Number(process.env.EMAIL_PORT) || 465;
const secure = emailPort === 465;

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: emailPort,
    secure: secure,
    family: 4,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    tls: {
        rejectUnauthorized: false
    }
});

transporter.sendMail({
    from: `"Test" <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_USER,
    subject: "Test email",
    text: "This is a test email."
}).then(info => {
    console.log("Sent successfully:", info.messageId);
    process.exit(0);
}).catch(err => {
    console.error("Send error:", err);
    process.exit(1);
});
