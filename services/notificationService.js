import backgroundQueue from './backgroundQueue.js';

class NotificationService {
    /**
     * General email sender (asynchronous)
     */
    sendEmail(to, subject, html) {
        backgroundQueue.push('EMAIL', { to, subject, html });
    }

    /**
     * General dashboard alert creator (asynchronous)
     */
    sendDashboardAlert(userId, title, message, type = 'info') {
        backgroundQueue.push('NOTIFICATION', { userId, title, message, type });
    }

    /**
     * General admin system notification creator (asynchronous)
     */
    sendSystemNotification(title, message, type = 'info') {
        backgroundQueue.push('SYSTEM_NOTIFICATION', { title, message, type });
    }

    /**
     * OTP verification email
     */
    sendOTP(email, otp) {
        const subject = "OTP Verification - Safety Protocol";
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
                <h2 style="color: #3b82f6; text-align: center; margin-top: 0;">OTP Verification Code</h2>
                <p>Hello,</p>
                <p>Use the verification OTP below to complete your action. This code is valid for 5 minutes.</p>
                <div style="text-align: center; margin: 30px 0;">
                    <span style="font-size: 32px; font-weight: bold; padding: 12px 30px; background-color: #f1f5f9; border-radius: 8px; letter-spacing: 5px; color: #1e293b; border: 1px solid #cbd5e1;">${otp}</span>
                </div>
                <p style="color: #64748b; font-size: 14px;">If you did not request this verification, please ignore this email or secure your account.</p>
                <p style="font-size: 12px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 15px; margin-top: 30px;">
                    MKSubData Secure Portal • Systems Security Telemetry
                </p>
            </div>
        `;
        this.sendEmail(email, subject, html);
    }

    /**
     * Login alert email
     */
    sendLoginAlert(email, details) {
        const { timestamp, device, ip, role } = details;
        const isSuspicious = details.isSuspicious || false;
        const subject = isSuspicious ? "⚠️ Suspicious Login Detected" : "Security Alert: Successful Login";
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 25px; border: 1px solid ${isSuspicious ? '#ef4444' : '#e2e8f0'}; border-radius: 12px; background-color: #ffffff;">
                <h2 style="color: ${isSuspicious ? '#ef4444' : '#3b82f6'}; text-align: center; margin-top: 0;">${isSuspicious ? '⚠️ Suspicious Login Alert' : 'New Login Detected'}</h2>
                <p>Hello,</p>
                <p>A new login was recorded for your account (${email}).</p>
                <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 20px 0;">
                    <p style="margin: 5px 0;"><strong>Time:</strong> ${new Date(timestamp).toLocaleString()}</p>
                    <p style="margin: 5px 0;"><strong>Device:</strong> ${device}</p>
                    <p style="margin: 5px 0;"><strong>IP Address:</strong> ${ip}</p>
                    <p style="margin: 5px 0;"><strong>Role:</strong> ${role}</p>
                </div>
                ${isSuspicious ? '<p style="color: #ef4444; font-weight: bold;">If this action was not initiated by you, please block your wallet and contact support immediately!</p>' : ''}
                <p style="font-size: 12px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 15px; margin-top: 30px;">
                    MKSubData Security Telemetry
                </p>
            </div>
        `;
        this.sendEmail(email, subject, html);
    }

    /**
     * Transaction receipt alerts
     */
    sendTransactionAlert(userId, email, txDetails) {
        const { description, amount, type, reference, status } = txDetails;
        
        // 1. Dashboard alert
        const title = type === 'credit' ? 'Wallet Funded' : 'Transaction Success';
        const msg = `${description}. Amount: ₦${amount.toLocaleString()}. Ref: ${reference}`;
        this.sendDashboardAlert(userId, title, msg, status === 'success' ? 'success' : 'failed');

        // 2. Email Receipt
        const subject = `Transaction Receipt: ${title}`;
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
                <h2 style="color: #10b981; text-align: center; margin-top: 0;">Transaction Receipt</h2>
                <p>Below is your transaction confirmation details:</p>
                <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 20px 0;">
                    <p style="margin: 5px 0;"><strong>Description:</strong> ${description}</p>
                    <p style="margin: 5px 0;"><strong>Type:</strong> ${type.toUpperCase()}</p>
                    <p style="margin: 5px 0;"><strong>Amount:</strong> ₦${amount.toLocaleString()}</p>
                    <p style="margin: 5px 0;"><strong>Reference:</strong> ${reference}</p>
                    <p style="margin: 5px 0;"><strong>Status:</strong> ${status.toUpperCase()}</p>
                    <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date().toLocaleString()}</p>
                </div>
                <p style="font-size: 12px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 15px; margin-top: 30px;">
                    MKSubData Financial Systems
                </p>
            </div>
        `;
        this.sendEmail(email, subject, html);
    }

    /**
     * PIN Reset security warning email
     */
    sendPinResetAlert(email) {
        const subject = "⚠️ Security Alert: PIN Reset Attempt";
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 25px; border: 1px solid #ef4444; border-radius: 12px; background-color: #ffffff;">
                <h2 style="color: #ef4444; text-align: center; margin-top: 0;">⚠️ Transaction PIN Reset Request</h2>
                <p>Hello,</p>
                <p>A request was received to reset your transaction PIN on MKSubData.</p>
                <p style="font-weight: bold; color: #1e293b;">If you did not make this request, please contact administrator immediately to secure your account credentials.</p>
                <p style="font-size: 12px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 15px; margin-top: 30px;">
                    MKSubData Security Telemetry
                </p>
            </div>
        `;
        this.sendEmail(email, subject, html);
    }

    /**
     * Low provider balance alert email to admin
     */
    sendProviderBalanceAlert(adminEmail, providerName, balance, threshold, isCritical = false) {
        const subject = isCritical ? `🚨 CRITICAL: Low Provider Balance (${providerName.toUpperCase()})` : `⚠️ WARNING: Low Provider Balance (${providerName.toUpperCase()})`;
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 25px; border: 2px solid ${isCritical ? '#ef4444' : '#f59e0b'}; border-radius: 12px; background-color: #fffbeb;">
                <h2 style="color: ${isCritical ? '#b91c1c' : '#d97706'}; text-align: center; margin-top: 0;">${isCritical ? '🚨 CRITICAL Wallet Depletion' : '⚠️ Low Balance Warning'}</h2>
                <p>The system has detected that the provider <strong>${providerName.toUpperCase()}</strong> wallet has dropped below its threshold limit.</p>
                <div style="background-color: #ffffff; padding: 15px; border-radius: 8px; border: 1px solid #fef3c7; margin: 20px 0;">
                    <p style="margin: 5px 0;"><strong>Provider:</strong> ${providerName.toUpperCase()}</p>
                    <p style="margin: 5px 0;"><strong>Current Balance:</strong> ₦${balance.toLocaleString()}</p>
                    <p style="margin: 5px 0;"><strong>Threshold Limit:</strong> ₦${threshold.toLocaleString()}</p>
                </div>
                <p style="font-weight: bold; color: #b91c1c;">Please fund the provider wallet immediately to avoid transaction disruptions.</p>
            </div>
        `;
        this.sendEmail(adminEmail, subject, html);
    }
}

export default new NotificationService();
