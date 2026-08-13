import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import fs from 'fs';
import User from '../models/User.js';
import Notification from '../models/Notification.js';

dotenv.config();

// Helper to get siteName for emails
const getBrandingForEmail = async (email) => {
    try {
        const user = await User.findOne({ email }).populate('tenantOwnerId').lean();
        if (user && user.tenantOwnerId) {
            const tenant = user.tenantOwnerId;
            return {
                ...(tenant.branding || {}),
                siteName: tenant.branding?.siteName || tenant.onboardingData?.brandName || tenant.onboardingData?.businessName || tenant.name,
                primaryColor: tenant.branding?.primaryColor || "#3B82F6"
            };
        }
        if (user) {
            return {
                ...(user.branding || {}),
                siteName: user.branding?.siteName || user.onboardingData?.brandName || user.onboardingData?.businessName || user.name,
                primaryColor: user.branding?.primaryColor || "#3B82F6"
            };
        }
    } catch (e) {
        console.error("Email branding lookup error", e);
    }
    return { siteName: "9JASUB", primaryColor: "#3B82F6" }; // Fallback
};

// --- 1. Startup Diagnostics ---
console.log("=== EMAIL SERVICE STARTUP DIAGNOSTICS ===");
console.log(`Transport: Nodemailer (SMTP)`);

// Resolve email credentials, prefer Brevo-specific env vars if present
const EMAIL_USER = process.env.EMAIL_USER || process.env.BREVO_USER;
const EMAIL_PASS = process.env.EMAIL_PASS || process.env.BREVO_PASS;
const EMAIL_FROM = process.env.EMAIL_FROM || EMAIL_USER;

if (!EMAIL_USER || !EMAIL_PASS) {
    console.error('[CRITICAL] Email credentials are missing. Set EMAIL_USER and EMAIL_PASS (or BREVO_USER/BREVO_PASS).');
}

if (!EMAIL_FROM) {
    console.error(`[CRITICAL] EMAIL_FROM is missing from environment variables.`);
} else {
    console.log(`EMAIL_FROM: ${EMAIL_FROM}`);
}
console.log("==========================================");

const transporter = nodemailer.createTransport({
    // Default to Brevo SMTP if environment variables are missing
    host: process.env.EMAIL_HOST || 'smtp-relay.brevo.com',
    port: process.env.EMAIL_PORT || 587,
    // Use secure connection for port 465, otherwise plain TLS
    secure: String(process.env.EMAIL_PORT) === '465',
    pool: false,
    family: 4,
    auth: {
        user: process.env.EMAIL_USER, // Brevo SMTP username (usually your email)
        pass: process.env.EMAIL_PASS, // Brevo SMTP password or API key
    },
    tls: {
        rejectUnauthorized: false
    }
});

// --- Startup Diagnostics & Instrumentation ---
transporter.verify((error, success) => {
    console.log("========== SMTP VERIFICATION ==========");
    if (error) {
        console.error("transporter.verify() FAILED:");
        console.error(error);
    } else {
        console.log("transporter.verify() SUCCESS:", success);
    }
    console.log("=======================================");
});

// --- 2. Email Flow Logging & SMTP Transport ---
export const sendEmail = async (to, subject, html, customBranding = null) => {
    try {
        console.log(`========== INITIATING EMAIL SEND ==========`);
        console.log(`SMTP Host: ${process.env.EMAIL_HOST || 'smtp-relay.brevo.com'}`);
        console.log(`SMTP Port: ${process.env.EMAIL_PORT || 587}`);
        console.log(`Sender Email: ${EMAIL_FROM}`);
        console.log(`Recipient Email: ${to}`);
        console.log(`Subject: ${subject}`);

        const branding = customBranding || await getBrandingForEmail(to);
        const senderName = branding?.siteName || "9JASUB";

        const info = await transporter.sendMail({
            from: `"${senderName}" <${EMAIL_FROM}>`,
            to: to,
            subject: subject,
            html: html
        });

        console.log(`Success! Message sent: ${info.messageId}`);
        console.log(`==========================================\n`);
        return true;

    } catch (error) {
        console.error(`\n========== NODEMAILER ERROR ==========`);
        console.error(`[Email to ${to}] FAILED at SMTP Transport.`);
        console.error(`Error Code:`, error.code);
        console.error(`Error Command:`, error.command);
        console.error(`Error Response:`, error.response);
        console.error(`Error ResponseCode:`, error.responseCode);
        console.error(`Full Error Object:`, JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
        console.error(`Stack Trace:\n`, error.stack);
        console.error(`==========================================\n`);
        
        return false;
    }
};

// --- 3. Transport Usage (Unchanged Business Logic) ---

export const sendOTPEmail = async (email, otp, customBranding = null) => {
    console.log(`[DIAGNOSTICS] sendOTPEmail() entered for ${email} (OTP: ${otp})`);
    const branding = customBranding || await getBrandingForEmail(email);
    const siteName = branding.siteName || "9JASUB";
    const primaryColor = branding.primaryColor || "#4CAF50";
    
    const subject = `${siteName} - Your Verification Code`;
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
            <h2 style="color: ${primaryColor}; text-align: center;">${siteName}</h2>
            <p>Your ${siteName} verification code is ${otp}.</p>
            <div style="text-align: center; margin: 20px 0;">
                <span style="font-size: 24px; font-weight: bold; padding: 10px 20px; background-color: #f4f4f4; border-radius: 5px; letter-spacing: 5px;">${otp}</span>
            </div>
            <p>This code will expire in 5 minutes.</p>
            <p>If you did not request this code, you can safely ignore this email.</p>
        </div>
    `;
    try {
        console.log(`[DIAGNOSTICS] Calling transporter.sendMail via sendEmail for ${email}...`);
        const result = await sendEmail(email, subject, html, customBranding);
        if (result) {
            console.log(`[DIAGNOSTICS] Successfully sent OTP email to ${email}. Brevo accepted.`);
            return true;
        } else {
            console.error(`[DIAGNOSTICS] Failed to send OTP email to ${email}. Brevo rejected or transport failed.`);
            return false;
        }
    } catch (error) {
        console.error(`[DIAGNOSTICS] Exception while sending OTP email to ${email}:`, error);
        return false;
    }
};

export const sendPinResetAlertEmail = async (email) => {
    const branding = await getBrandingForEmail(email);
    const siteName = branding.siteName || "9JASUB";
    const subject = `Security Alert: Transaction PIN Reset Attempt`;
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ffcccc; border-radius: 10px;">
            <h2 style="color: #D32F2F; text-align: center;">Security Alert</h2>
            <p>Someone attempted to reset your Transaction PIN on ${siteName}.</p>
            <p>If this was you, you can safely ignore this alert.</p>
            <p><strong>If you did not make this request, please contact support immediately and change your account password.</strong></p>
        </div>
    `;
    return sendEmail(email, subject, html);
};

export const sendTransactionReceiptEmail = async (email, transactionDetails) => {
    const branding = await getBrandingForEmail(email);
    const siteName = branding.siteName || "9JASUB";
    const { type, amount, description, reference, status, date } = transactionDetails;
    const subject = `Transaction Receipt - ${siteName}`;
    const color = status === 'success' ? '#4CAF50' : '#F44336';
    
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
            <h2 style="color: ${color}; text-align: center;">Transaction ${status.toUpperCase()}</h2>
            <p>Here is the receipt for your recent transaction on ${siteName}:</p>
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
            <p style="text-align: center; margin-top: 30px; font-size: 12px; color: #888;">Thank you for using ${siteName}.</p>
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
    const branding = await getBrandingForEmail(email);
    const siteName = branding.siteName || "9JASUB";
    const primaryColor = branding.primaryColor || "#3b82f6";

    const subject = title;
    const html = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #1e293b;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: ${primaryColor}; margin: 0; font-size: 24px;">${siteName}</h1>
                <p style="color: #64748b; font-size: 14px; margin-top: 5px;">Secure & Fast VTU Services</p>
            </div>
            <div style="border-top: 3px solid ${primaryColor}; padding-top: 20px;">
                <h2 style="color: #0f172a; font-size: 20px; margin-bottom: 15px;">${title}</h2>
                <div style="line-height: 1.6; font-size: 16px;">
                    ${message.replace(/\n/g, '<br>')}
                </div>
            </div>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 12px;">
                <p>You are receiving this email because you have an account on ${siteName}.</p>
                <p>&copy; ${new Date().getFullYear()} ${siteName}. All rights reserved.</p>
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

            const branding = user.resellerId?.branding || { siteName: "9JASUB" };
            const siteName = branding.siteName || "9JASUB";

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
                    <p>Thank you for choosing ${siteName}!</p>
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
    const branding = await getBrandingForEmail(email);
    const siteName = branding.siteName || "9JASUB";
    const primaryColor = branding.primaryColor || "#3b82f6";
    const { timestamp, device, ip, role } = details;
    const subject = "New Login Detected";
    const html = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #1e293b;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: ${primaryColor}; margin: 0; font-size: 24px;">${siteName}</h1>
                <p style="color: #64748b; font-size: 14px; margin-top: 5px;">Secure & Fast VTU Services</p>
            </div>
            <div style="border-top: 3px solid ${primaryColor}; padding-top: 20px;">
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
                <p>&copy; ${new Date().getFullYear()} ${siteName}. All rights reserved.</p>
            </div>
        </div>
    `;
    return sendEmail(email, subject, html);
};
// === Shared OTP dispatch helper ===
export const dispatchOTP = async (email, otp, customBranding = null) => {
  console.log(`OTP dispatch started for ${email}`);
  try {
    const sent = await sendOTPEmail(email, otp, customBranding);
    if (sent) {
      console.log(`OTP dispatch succeeded for ${email}`);
      return true;
    } else {
      console.error(`OTP dispatch reported failure for ${email}`);
      return false;
    }
  } catch (error) {
    console.error(`OTP dispatch failed for ${email}`);
    console.error('Error Code:', error.code);
    console.error('Error Command:', error.command);
    console.error('Error Response:', error.response);
    console.error('Error ResponseCode:', error.responseCode);
    console.error('Full Error Object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    console.error('Stack Trace:\n', error.stack);
    return false;
  }
};
