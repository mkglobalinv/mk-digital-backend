import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import User from '../models/User.js';
import OTP from '../models/OTP.js';

dotenv.config();

async function traceAdminOTP() {
    console.log("==================================================");
    console.log("STARTING ADMIN OTP TRACE");
    console.log("==================================================");

    // Verify SMTP config loaded
    console.log("EMAIL_USER:", process.env.EMAIL_USER);
    console.log("EMAIL_PASS Loaded:", process.env.EMAIL_PASS ? "YES" : "NO");
    console.log("==================================================");

    try {
        await mongoose.connect(process.env.MONGO_URI);
        
        console.log("STEP 1");
        console.log("Admin login request received (simulated).");
        
        const email = process.env.ADMIN_EMAIL || 'unuktar1@gmail.com';
        const user = await User.findOne({ email, role: 'admin' });
        
        if (!user) {
            console.log("Admin user not found. Exiting trace.");
            process.exit(1);
        }

        console.log("\nSTEP 2");
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const hashedOtp = await bcrypt.hash(otpCode, 10);
        console.log("OTP generated.");
        console.log(`OTP:\n${otpCode}`);

        console.log("\nSTEP 3");
        await OTP.deleteMany({ userId: user._id });
        const otpRecord = await OTP.create({ 
            userId: user._id, 
            hashedOtp, 
            expiresAt: new Date(Date.now() + 10 * 60000) 
        });
        if (otpRecord) {
            console.log("OTP saved into MongoDB.");
            console.log("Result:\nSUCCESS");
        } else {
            console.log("OTP saved into MongoDB.");
            console.log("Result:\nFAILED");
        }

        console.log("\nSTEP 4");
        console.log("Calling sendAdminOTPEmail()");

        console.log("\nSTEP 5");
        console.log("Calling sendMail()");
        
        const emailPort = Number(process.env.EMAIL_PORT) || 465;
        const secure = emailPort === 465;

        console.log("\nVerify the transporter:");
        console.log(`host: ${process.env.EMAIL_HOST || 'smtp.gmail.com'}`);
        console.log(`port: ${emailPort}`);
        console.log(`secure: ${secure}`);
        console.log(`service: undefined (using host/port instead)`); // Not set in original
        
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST || 'smtp.gmail.com',
            port: emailPort,
            secure: secure, 
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

        const subject = "Admin Verification Code";
        const html = `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #1e293b;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h1 style="color: #3b82f6; margin: 0; font-size: 24px;">MKSubData Admin</h1>
                    <p style="color: #64748b; font-size: 14px; margin-top: 5px;">Identity Verification</p>
                </div>
                <div style="border-top: 3px solid #3b82f6; padding-top: 20px; text-align: center;">
                    <p style="font-size: 16px;">Your administrative verification code is:</p>
                    <div style="margin: 30px 0;">
                        <span style="font-size: 32px; font-weight: bold; padding: 15px 30px; background-color: #f1f5f9; border-radius: 12px; letter-spacing: 10px; color: #0f172a; border: 1px solid #e2e8f0;">${otpCode}</span>
                    </div>
                </div>
            </div>
        `;

        try {
            const info = await transporter.sendMail({
                from: '"MKSubData" <' + process.env.EMAIL_USER + '>',
                to: user.email,
                subject,
                html,
            });

            console.log("\nSTEP 6");
            console.log("Complete Nodemailer response.");
            console.log(info);

            console.log("\nSTEP 7");
            console.log("SMTP server response.");
            console.log(info.response);

            console.log("\nSTEP 8");
            console.log("Message ID.");
            console.log(info.messageId);

            console.log("\nSTEP 9");
            console.log("Accepted recipients.");
            console.log(info.accepted);

            console.log("\nSTEP 10");
            console.log("Rejected recipients.");
            console.log(info.rejected);

        } catch (error) {
            console.log("\nSTEP 6");
            console.log("Complete Nodemailer error response.");
            console.log("error.code:", error.code);
            console.log("error.command:", error.command);
            console.log("error.response:", error.response);
            console.log("error.responseCode:", error.responseCode);
            console.log("error.message:", error.message);
            console.log("error.stack:\n", error.stack);
            
            console.log("\nSTEP 7");
            console.log("SMTP server response (from error):");
            console.log(error.response);
        }

    } catch (err) {
        console.error("FATAL ERROR IN TRACE:", err);
    } finally {
        await mongoose.disconnect();
    }
}

traceAdminOTP();
