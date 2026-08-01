import axios from 'axios';
import dotenv from 'dotenv';
import fs from 'fs';
import User from '../models/User.js';
import Notification from '../models/Notification.js';

dotenv.config();

// --- 1. Startup Diagnostics ---
console.log("=== EMAIL SERVICE STARTUP DIAGNOSTICS ===");
console.log(`Transport: Brevo REST API (HTTPS)`);

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || process.env.EMAIL_USER;

if (!BREVO_API_KEY) {
    console.error(`[CRITICAL] BREVO_API_KEY is missing from environment variables.`);
} else {
    console.log(`BREVO_API_KEY: EXISTS (Length: ${BREVO_API_KEY.length})`);
}

if (!EMAIL_FROM) {
    console.error(`[CRITICAL] EMAIL_FROM is missing from environment variables.`);
} else {
    console.log(`EMAIL_FROM: ${EMAIL_FROM}`);
}
console.log("==========================================");


// --- 2. Email Flow Logging & HTTPS Transport ---
export const sendEmail = async (to, subject, html) => {
    try {
        console.log(`\n========== INITIATING EMAIL SEND ==========`);
        console.log(`8. BREVO_API_KEY Exists: ${!!BREVO_API_KEY}`);
        console.log(`9. EMAIL_FROM Exists: ${!!EMAIL_FROM}`);
        console.log(`5. Sender Email: ${EMAIL_FROM}`);
        console.log(`6. Recipient Email: ${to}`);
        console.log(`7. Subject: ${subject}`);

        if (!BREVO_API_KEY) {
            console.log(`[MOCK EMAIL to ${to}] Subject: ${subject}`);
            console.log(`==========================================\n`);
            return true;
        }

        const payload = {
            sender: { name: "9JASUB", email: EMAIL_FROM },
            to: [{ email: to }],
            subject: subject,
            htmlContent: html
        };

        console.log(`1. Full HTTP Request Payload (excluding API Key):`);
        console.log(JSON.stringify(payload, null, 2));

        const response = await axios.post('https://api.brevo.com/v3/smtp/email', payload, {
            headers: {
                'api-key': BREVO_API_KEY,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            timeout: 10000 // 10 seconds timeout
        });

        console.log(`2. HTTP Status Code: ${response.status}`);
        console.log(`3. Complete JSON Response from Brevo:`);
        console.log(JSON.stringify(response.data, null, 2));

        // Brevo returns HTTP 201 Created on success
        if (response.status === 201 || response.status === 200) {
            console.log(`10. Success! Brevo messageId: ${response.data.messageId}`);
            console.log(`==========================================\n`);
            return true;
        } else {
            console.warn(`[Email to ${to}] Unexpected success status: ${response.status}`);
            console.log(`==========================================\n`);
            return true;
        }

    } catch (error) {
        console.error(`\n[Email to ${to}] FAILED at Brevo REST API.`);
        
        if (error.response) {
            console.error(`2. HTTP Status Code: ${error.response.status}`);
            console.error(`4. Complete Error Body from Brevo:`);
            console.error(JSON.stringify(error.response.data, null, 2));
        } else if (error.request) {
            console.error("[NETWORK ERROR]: No response received from Brevo API.");
            console.error(error.message);
        } else {
            console.error("[INTERNAL ERROR]:", error.message);
        }
        console.log(`==========================================\n`);
        
        return false;
    }
};

// --- 3. Transport Usage (Unchanged Business Logic) ---

export const sendOTPEmail = async (email, otp) => {
    console.log(`Preparing to send OTP email to ${email} (OTP: ${otp})`);
    const subject = "OTP Verification";
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
            <h2 style="color: #4CAF50; text-align: center;">OTP Verification</h2>
            <p>Your verification OTP is:</p>
            <div style="text-align: center; margin: 20px 0;">
                <span style="font-size: 24px; font-weight: bold; padding: 10px 20px; background-color: #f4f4f4; border-radius: 5px; letter-spacing: 5px;">${otp}</span>
            </div>
            <p>This code will expire in 5 minutes.</p>
            <p>If you did not request this code, you can safely ignore this email.</p>
        </div>
    `;
    try {
        const result = await sendEmail(email, subject, html);
        if (result) {
            console.log(`Successfully sent OTP email to ${email}`);
            return true;
        } else {
            console.error(`Failed to send OTP email to ${email}.`);
            return false;
        }
    } catch (error) {
        console.error(`Exception while sending OTP email to ${email}:`, error);
        return false;
    }
};

export const sendPinResetAlertEmail = async (email) => {
    const subject = "Security Alert: Transaction PIN Reset Attempt";
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ffcccc; border-radius: 10px;">
            <h2 style="color: #D32F2F; text-align: center;">Security Alert</h2>
            <p>Someone attempted to reset your Transaction PIN on 9JASUB.</p>
            <p>If this was you, you can safely ignore this alert.</p>
            <p><strong>If you did not make this request, please contact support immediately and change your account password.</strong></p>
        </div>
    `;
    return sendEmail(email, subject, html);
};

export const sendTransactionReceiptEmail = async (email, transactionDetails) => {
    const { type, amount, description, reference, status, date } = transactionDetails;
    const subject = "Transaction Receipt - 9JASUB";
    const color = status === 'success' ? '#4CAF50' : '#F44336';
    
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
            <h2 style="color: ${color}; text-align: center;">Transaction ${status.toUpperCase()}</h2>
            <p>Here is the receipt for your recent transaction on 9JASUB:</p>
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Amount</strong></td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">₦${amount}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Description</strong></td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${description}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Reference</strong></td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${reference}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Date</strong></td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${new Date(date).toLocaleString()}</td>
                </tr>
            </table>
            <p style="text-align: center; margin-top: 30px; font-size: 12px; color: #888;">Thank you for using 9JASUB.</p>
        </div>
    `;
    return sendEmail(email, subject, html);
};

export const sendSupportEmail = async (supportData) => {
    const { name, email, phone, complaint } = supportData;
    const subject = `Customer Complaint from ${name}`;
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
            <h2 style="color: #3B82F6; text-align: center;">New Help Center Submission</h2>
            <p><strong>Customer Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Phone:</strong> ${phone}</p>
            <hr />
            <p><strong>Complaint:</strong></p>
            <p>${complaint}</p>
        </div>
    `;
    return sendEmail("support@9jasub.com", subject, html);
};

export const sendAdminBroadcastEmail = async (email, title, message) => {
    const subject = title;
    const html = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #1e293b;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #3b82f6; margin: 0; font-size: 24px;">9JASUB</h1>
                <p style="color: #64748b; font-size: 14px; margin-top: 5px;">Secure & Fast VTU Services</p>
            </div>
            <div style="border-top: 3px solid #3b82f6; padding-top: 20px;">
                <h2 style="color: #0f172a; font-size: 20px; margin-bottom: 15px;">${title}</h2>
                <div style="line-height: 1.6; font-size: 16px;">
                    ${message.replace(/\n/g, '<br>')}
                </div>
            </div>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 12px;">
                <p>You are receiving this email because you have an account on 9JASUB.</p>
                <p>&copy; 2024 9JASUB. All rights reserved.</p>
            </div>
        </div>
    `;
    return sendEmail(email, subject, html);
};

export const sendTransactionNotification = async (transaction) => {
    setImmediate(async () => {
        try {
            const adminEmail = process.env.ADMIN_EMAIL;
            
            const user = await User.findById(transaction.userId);
            if (!user) {
                console.error("[NOTIFY] User not found for transaction:", transaction._id);
                return;
            }

            const date = transaction.createdAt || new Date();
            const statusColor = (transaction.status || 'success') === 'success' ? '#10b981' : '#ef4444';
            const statusText = (transaction.status || 'success').toUpperCase();

            // Notify Admin
            if (adminEmail) {
                const adminSubject = `New Transaction Alert: ${statusText}`;
                const adminHtml = `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #f8fafc;">
                        <h2 style="color: #1e293b; text-align: center; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">Transaction Alert</h2>
                        <div style="padding: 15px; background: white; border-radius: 8px; margin-top: 20px;">
                            <p><strong>User:</strong> ${user.name} (${user.email})</p>
                            <p><strong>Phone:</strong> ${transaction.phone || 'N/A'}</p>
                            <p><strong>Service:</strong> ${transaction.description || transaction.type}</p>
                            <p><strong>Amount:</strong> ₦${transaction.amount}</p>
                            <p><strong>Status:</strong> <span style="color: ${statusColor}; font-weight: bold;">${statusText}</span></p>
                            <p><strong>Provider:</strong> ${transaction.provider_used || transaction.provider || 'N/A'}</p>
                            <p><strong>Date:</strong> ${new Date(date).toLocaleString()}</p>
                            <p><strong>Reference:</strong> ${transaction.reference}</p>
                        </div>
                        <p style="text-align: center; font-size: 12px; color: #64748b; margin-top: 20px;">9JASUB Administrative System</p>
                    </div>
                `;
                try {
                    await sendEmail(adminEmail, adminSubject, adminHtml);
                    console.log(`[NOTIFY] Admin notified for transaction ${transaction.reference}`);
                } catch (err) {
                    console.error("[NOTIFY] Admin email failed:", err.message);
                }
            }

            // Notify User
            const userSubject = transaction.status === 'success' ? "Transaction Successful" : "Transaction Failed";
            const userGreeting = transaction.status === 'success' 
                ? `You successfully purchased ${transaction.description || 'your service'}.`
                : "Your transaction failed. Please try again or contact support if your wallet was deducted.";

            const userHtml = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h2 style="color: ${statusColor};">${userSubject}</h2>
                    </div>
                    <p>Hello ${user.name.split(' ')[0]},</p>
                    <p>${userGreeting}</p>
                    <div style="background-color: #f1f5f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <table style="width: 100%;">
                            <tr><td><strong>Amount:</strong></td><td style="text-align: right;">₦${transaction.amount}</td></tr>
                            <tr><td><strong>Description:</strong></td><td style="text-align: right;">${transaction.description}</td></tr>
                            <tr><td><strong>Reference:</strong></td><td style="text-align: right;">${transaction.reference}</td></tr>
                            <tr><td><strong>Date:</strong></td><td style="text-align: right;">${new Date(date).toLocaleString()}</td></tr>
                        </table>
                    </div>
                    ${transaction.token ? `<div style="padding: 10px; background: #fffbeb; border: 1px dashed #f59e0b; border-radius: 8px; text-align: center; font-weight: bold; margin: 10px 0;">Token/PIN: ${transaction.token}</div>` : ''}
                    <p style="font-size: 14px; color: #64748b;">If you have any questions, please contact our support team.</p>
                    <p>Thank you for choosing 9JASUB!</p>
                </div>
            `;
            try {
                await sendEmail(user.email, userSubject, userHtml);
                console.log(`[NOTIFY] User notified for transaction ${transaction.reference}`);
            } catch (err) {
                console.error("[NOTIFY] User email failed:", err.message);
            }

            // In-App Notification
            try {
                await Notification.create({
                    userId: user._id,
                    title: transaction.status === 'success' ? "Transaction successful" : "Transaction failed",
                    message: transaction.status === 'success' 
                        ? `Your purchase of ${transaction.description} was successful.` 
                        : `Your transaction for ${transaction.description} failed.`,
                    type: 'transaction'
                });
                console.log(`[NOTIFY] In-app notification created for ${user.email}`);
            } catch (err) {
                console.error("[NOTIFY] In-app notification failed:", err.message);
            }

        } catch (error) {
            console.error("[NOTIFY] Critical error in notification flow:", error);
        }
    });
};

export const sendAdminLoginAlert = async (email, details) => {
    const { status, ip, device, timestamp } = details;
    const subject = `Admin Login Alert: ${status.toUpperCase()}`;
    const color = status === 'success' ? '#10b981' : '#ef4444';
    const html = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #1e293b;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #3b82f6; margin: 0; font-size: 24px;">9JASUB Admin</h1>
                <p style="color: #64748b; font-size: 14px; margin-top: 5px;">Security Monitoring System</p>
            </div>
            <div style="border-top: 3px solid ${color}; padding-top: 20px;">
                <h2 style="color: ${color}; font-size: 20px; margin-bottom: 15px;">Login Attempt: ${status.toUpperCase()}</h2>
                <div style="line-height: 1.6; font-size: 15px; background: #f8fafc; padding: 20px; border-radius: 12px;">
                    <p><strong>IP Address:</strong> ${ip}</p>
                    <p><strong>Device/Browser:</strong> ${device}</p>
                    <p><strong>Timestamp:</strong> ${new Date(timestamp).toLocaleString()}</p>
                    <p><strong>Status:</strong> <span style="color: ${color}; font-weight: bold;">${status}</span></p>
                </div>
                <p style="margin-top: 20px; font-size: 14px; color: #64748b;">If this was not you, please contact the infrastructure team immediately.</p>
            </div>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 12px;">
                <p>&copy; 2024 9JASUB Infrastructure Operations.</p>
            </div>
        </div>
    `;
    return sendEmail(email, subject, html);
};

export const sendAdminOTPEmail = async (email, otp) => {
    const subject = "Admin Verification Code";
    const html = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #1e293b;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #3b82f6; margin: 0; font-size: 24px;">9JASUB Admin</h1>
                <p style="color: #64748b; font-size: 14px; margin-top: 5px;">Identity Verification</p>
            </div>
            <div style="border-top: 3px solid #3b82f6; padding-top: 20px; text-align: center;">
                <p style="font-size: 16px;">Your administrative verification code is:</p>
                <div style="margin: 30px 0;">
                    <span style="font-size: 32px; font-weight: bold; padding: 15px 30px; background-color: #f1f5f9; border-radius: 12px; letter-spacing: 10px; color: #0f172a; border: 1px solid #e2e8f0;">${otp}</span>
                </div>
                <p style="color: #ef4444; font-weight: bold; font-size: 14px;">This code expires in 10 minutes.</p>
                <p style="font-size: 14px; color: #64748b; margin-top: 20px;">Never share this code with anyone, including staff.</p>
            </div>
        </div>
    `;
    const result = await sendEmail(email, subject, html);
    if (!result) {
        console.error(`Failed to send Admin OTP email to ${email}. Writing to local file for dev.`);
        fs.writeFileSync('LATEST_OTP.txt', `Admin Email: ${email}\nOTP: ${otp}\nTime: ${new Date().toLocaleString()}`);
    }
    return result;
};

export const sendLoginAlertEmail = async (email, details) => {
    const { timestamp, device, ip, role } = details;
    const subject = "New Login Detected";
    const html = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #1e293b;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #3b82f6; margin: 0; font-size: 24px;">9JASUB</h1>
                <p style="color: #64748b; font-size: 14px; margin-top: 5px;">Secure & Fast VTU Services</p>
            </div>
            <div style="border-top: 3px solid #3b82f6; padding-top: 20px;">
                <h2 style="color: #0f172a; font-size: 20px; margin-bottom: 15px;">New Login Detected</h2>
                <p style="font-size: 15px; line-height: 1.6;">A new login was detected on your account.</p>
                <div style="background-color: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; margin: 20px 0; font-size: 14.5px;">
                    <p style="margin: 8px 0;"><strong>Time:</strong> ${new Date(timestamp).toLocaleString()}</p>
                    <p style="margin: 8px 0;"><strong>Device:</strong> ${device}</p>
                    <p style="margin: 8px 0;"><strong>IP Address:</strong> ${ip}</p>
                    <p style="margin: 8px 0;"><strong>Account Type:</strong> ${String(role || 'User').toUpperCase()}</p>
                    <p style="margin: 8px 0;"><strong>Status:</strong> Success</p>
                </div>
                <p style="font-size: 14.5px; color: #ef4444; font-weight: bold; line-height: 1.6;">If this was not you, please secure your account immediately.</p>
            </div>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 12px;">
                <p>&copy; 2024 9JASUB. All rights reserved.</p>
            </div>
        </div>
    `;
    return sendEmail(email, subject, html);
};
