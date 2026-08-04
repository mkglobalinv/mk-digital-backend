import User from "../models/User.js";
import OTP from "../models/OTP.js";
import Session from "../models/Session.js";
import OTPAuditLog from "../models/OTPAuditLog.js";
import Notification from "../models/Notification.js";
import { logFraudEvent } from "../middlewares/fraudMiddleware.js";
import { sendPinResetAlertEmail, sendOTPEmail, sendLoginAlertEmail, dispatchOTP as sendEmailOTP } from "../services/emailService.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
// import { handleVACreation } from "../services/accountService.js";
import auditLogService from "../services/auditLogService.js";
import { performance } from "perf_hooks";

// === Shared OTP dispatch helper ===
export const dispatchOTP = async (email, otp) => {
  console.log(`[DISPATCH OTP] Target recipient: ${email}, OTP: ${otp}`);
  try {
    const sent = await sendEmailOTP(email, otp);
    if (sent) {
      console.log(`[DISPATCH OTP] Success for ${email}`);
      return true;
    } else {
      console.error(`[DISPATCH OTP] Reported failure for ${email}`);
      return false;
    }
  } catch (error) {
    console.error(`[DISPATCH OTP] Exception for ${email}`);
    console.error('Error Code:', error.code);
    console.error('Error Command:', error.command);
    console.error('Error Response:', error.response);
    console.error('Error ResponseCode:', error.responseCode);
    console.error('Full Error Object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    console.error('Stack Trace:\n', error.stack);
    return false;
  }
};

export const register = async (req, res) => {
  const reqStart = performance.now();
  try {
    const { name, email, phone, password, referralCode } = req.body;
    
    if (!name || !email || !phone || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const resellerId = req.reseller ? req.reseller._id : null;
    const existingUser = await User.findByTenant(email, resellerId);
    
    if (existingUser) {
      return res.status(400).json({ message: "User already exists with this email" });
    }

    let referredBy = null;
    let referralCodeUsed = null;
    if (referralCode) {
      const referrer = await User.findOne({ referralCode: referralCode });
      if (referrer) {
         referredBy = referrer._id;
         referralCodeUsed = referralCode;
      }
    }

    // Tenant ownership: determined by which portal the user registered on.
    // If registered on a reseller portal (req.reseller set by whiteLabelMiddleware), they belong to that tenant.
    // If registered on the main platform, tenantOwnerId is null.
    // This is ENTIRELY INDEPENDENT from referredBy/referralCode.
    const tenantOwnerId = resellerId;

    const hashStart = performance.now();
    const hashedPassword = await bcrypt.hash(password, 10);
    const hashTime = performance.now() - hashStart;
    
    const dbStart = performance.now();
    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      phone,
      password: hashedPassword,
      referredBy,
      referralCodeUsed,
      tenantOwnerId,
      role: 'user',
      isEmailVerified: false,
      isSignupComplete: false
    });
    const dbTime = performance.now() - dbStart;

    console.log(`[Register] New user ${newUser.email} | tenantOwnerId: ${tenantOwnerId || 'Main Platform'} | referredBy: ${referredBy || 'None'}`);

    // Generate OTP for email verification
    const otpStart = performance.now();
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    await OTP.create({
      userId: newUser._id,
      hashedOtp,
      expiresAt
    });
    const otpTime = performance.now() - otpStart;

    const emailQueueStart = performance.now();
    console.log('[REGISTRATION] Recipient email:', newUser.email, 'OTP generated:', otp);
    console.log(`[AUTH] Dispatching registration OTP to ${newUser.email}`);
    const emailSent = await dispatchOTP(newUser.email, otp);
    const emailQueueTime = performance.now() - emailQueueStart;

    const reqTime = performance.now() - reqStart;
    console.log(`[Perf] Registration: Hash=${hashTime.toFixed(2)}ms, DBUser=${dbTime.toFixed(2)}ms, OTP=${otpTime.toFixed(2)}ms, QueueEmail=${emailQueueTime.toFixed(2)}ms, Total=${reqTime.toFixed(2)}ms`);

    res.status(201).json({ 
      success: true, 
      message: "Registration successful. Please verify your email.",
      userId: newUser._id
    });
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({ message: "Server error during registration" });
  }
};

export const requestOTP = async (req, res) => {
  const reqStart = performance.now();
  try {
    const { email, isResend } = req.body;
    const resellerId = req.reseller?._id || null;
    const user = await User.findByTenant(email, resellerId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // 1. Rate Limiting Check (60 seconds)
    const latestLog = await OTPAuditLog.findOne({ email, action: { $in: ["request", "resend"] } }).sort({ createdAt: -1 });
    if (latestLog && (Date.now() - new Date(latestLog.createdAt).getTime() < 60000)) {
      const waitSecs = Math.ceil((60000 - (Date.now() - new Date(latestLog.createdAt).getTime())) / 1000);
      return res.status(429).json({ 
        message: `Please wait ${waitSecs} seconds before requesting another OTP.`, 
        rateLimit: true, 
        waitSecs 
      });
    }

    // Generate 6-digit OTP
    const otpStart = performance.now();
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete existing OTPs for the user
    await OTP.deleteMany({ userId: user._id });

    // Store hashed OTP
    await OTP.create({
      userId: user._id,
      hashedOtp,
      expiresAt
    });
    const otpTime = performance.now() - otpStart;

    // Send actual email asynchronously
    const emailQueueStart = performance.now();
    console.log(`Generating OTP for password reset for: ${user.email}`);
    
    // Directly send OTP and record audit log
        console.log('[REQUEST OTP] Recipient email:', user.email, 'OTP generated:', otp);
        console.log(`[AUTH] Dispatching request OTP to ${user.email}`);
        const emailSent = await dispatchOTP(user.email, otp);
        const attemptsCount = await OTPAuditLog.countDocuments({ email, action: isResend ? "resend" : "request" });
        await OTPAuditLog.create({
          email,
          action: isResend ? "resend" : "request",
          deliveryStatus: emailSent ? "sent" : "failed",
          attempts: attemptsCount + 1,
          details: emailSent ? "OTP sent successfully" : "SMTP transport failure"
        });
    const emailQueueTime = performance.now() - emailQueueStart;

    const reqTime = performance.now() - reqStart;
    console.log(`[Perf] requestOTP: OTPGeneration=${otpTime.toFixed(2)}ms, QueueEmail=${emailQueueTime.toFixed(2)}ms, Total=${reqTime.toFixed(2)}ms`);

    res.json({ 
      success: true, 
      message: "OTP sent to your email.",
      expiresInMinutes: 10,
      otp: process.env.NODE_ENV === 'development' ? otp : undefined 
    });
  } catch (err) {
    console.error("REQUEST OTP ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const resellerId = req.reseller?._id || null;
    const user = await User.findByTenant(email, resellerId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const otpData = await OTP.findOne({ userId: user._id });
    if (!otpData) {
      await OTPAuditLog.create({
        email,
        action: "verify_failed",
        details: "No active OTP session found"
      });
      return res.status(400).json({ message: "No OTP requested or OTP expired" });
    }

    // Check Lockout
    if (otpData.isLocked && otpData.lockUntil > Date.now()) {
      const remainingTime = Math.ceil((otpData.lockUntil - Date.now()) / (60 * 1000));
      await OTPAuditLog.create({
        email,
        action: "verify_failed",
        details: "Verification locked out"
      });
      return res.status(403).json({ message: `Account locked. Try again in ${remainingTime} minutes` });
    }

    // Reset lock if expired
    if (otpData.isLocked && otpData.lockUntil <= Date.now()) {
      otpData.isLocked = false;
      otpData.attempts = 0;
    }

    // Verify OTP
    const isMatch = await bcrypt.compare(otp, otpData.hashedOtp);
    
    if (!isMatch) {
      otpData.attempts += 1;
      await logFraudEvent(user._id, "FAILED_OTP", req, { attempts: otpData.attempts });
      
      await OTPAuditLog.create({
        email,
        action: "verify_failed",
        attempts: otpData.attempts,
        details: `Incorrect code entered`
      });

      if (otpData.attempts >= 5) {
        otpData.isLocked = true;
        otpData.lockUntil = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes lockout
        await otpData.save();
        return res.status(403).json({ message: "Max attempts reached. Verification locked for 10 minutes" });
      }
      await otpData.save();
      return res.status(400).json({ message: `Invalid OTP. ${5 - otpData.attempts} attempts remaining` });
    }

    // OTP Correct - Check Expiry
    if (otpData.expiresAt < Date.now()) {
      await OTPAuditLog.create({
        email,
        action: "verify_failed",
        details: "OTP expired at " + otpData.expiresAt.toISOString()
      });
      return res.status(400).json({ message: "OTP has expired" });
    }

    // Success - Delete OTP
    await OTP.deleteOne({ _id: otpData._id });

    // Success Audit Log
    await OTPAuditLog.create({
      email,
      action: "verify_success",
      details: "Successfully verified OTP"
    });

    const resetToken = jwt.sign({ email }, process.env.JWT_SECRET || "mk_sub_data_secret_2024_premium", { expiresIn: '15m' });

    res.json({ success: true, message: "OTP verified successfully", resetToken });
  } catch (err) {
    console.error("VERIFY OTP ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, password, resetToken } = req.body;
    
    if (!resetToken) return res.status(401).json({ message: "Reset token is required." });
    
    try {
        const decoded = jwt.verify(resetToken, process.env.JWT_SECRET || "mk_sub_data_secret_2024_premium");
        if (decoded.email !== email) {
             return res.status(401).json({ message: "Invalid reset token for this email." });
        }
    } catch (err) {
        return res.status(401).json({ message: "Invalid or expired reset token." });
    }

    const resellerId = req.reseller?._id || null;
    const user = await User.findByTenant(email, resellerId);
    if (!user) return res.status(404).json({ message: "User not found" });
    
    // OTP verification explicitly proves email ownership, so bypass or auto-verify email.
    if (!user.isEmailVerified) {
        user.isEmailVerified = true;
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    user.password = hashedPassword;
    await user.save();
    res.json({ success: true, message: "Password reset successful" });
  } catch (err) {
    console.error("RESET PASSWORD ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const login = async (req, res) => {
  const reqStart = performance.now();
  try {
    const { password } = req.body;
    const email = req.body.email?.toLowerCase();
    const resellerId = req.reseller?._id || null;
    const sessionType = req.body.session_type || 'retail';
    const device = req.headers['user-agent'] || "Unknown";

    if (!email) return res.status(400).json({ message: "Email is required" });

    // Tenant-aware login
    let user = await User.findByTenant(email, resellerId);
    
    if (!user && resellerId) {
        const potentialOwner = await User.findById(resellerId);
        if (potentialOwner && potentialOwner.email.toLowerCase() === email) {
            user = potentialOwner;
        }
    }


    if (!user) {
        console.log(`[Login] Failure: User not found (${email}) in tenant ${resellerId || 'Main'}`);
        return res.status(400).json({ message: "User not found" });
    }

    // Enforce dual-account role validation
    const isBusinessAccount = (u) => {
        return u && (
            u.role === 'reseller_admin' ||
            u.resellerActivationStatus === 'active' ||
            u.whiteLabelStatus === 'active' ||
            u.apiLevel === 'reseller'
        );
    };

    const isOwner = resellerId && user._id.toString() === resellerId.toString();
    const isGlobalReseller = !resellerId && isBusinessAccount(user);
    // On a reseller storefront login, all users act as retail customers, except the owner.
    const isBiz = isOwner || isGlobalReseller;

    // STRICT PORTAL SEPARATION REQUIREMENT
    if (sessionType === 'retail') {
        if (user.role === 'admin' || user.role === 'superadmin') {
            return res.status(403).json({ message: "Admin accounts must use the Admin Portal for login.", isAdmin: true });
        }
        if (isBiz) {
            console.log(`[Login] Blocked: Reseller logging in via Retail flow (${email})`);
            // Phase 11: Independence Redirect / Retail Block
            return res.status(403).json({ 
                message: "Business Account Detected. Please login through the Reseller Portal.", 
                isBusiness: true,
                subdomain: user.subdomain || user.admin_subdomain,
                siteName: user.onboardingData?.siteName || "your Website"
            });
        }
    } else if (sessionType === 'business') {
        if (user.role === 'admin' || user.role === 'superadmin') {
            return res.status(403).json({ message: "Admin accounts must use the Admin Portal for login.", isAdmin: true });
        }
        if (!isBiz) {
            console.log(`[Login] Blocked: Retail user logging in via Business flow (${email})`);
            return res.status(403).json({ 
                message: "This portal is for Business Console accounts only. Personal accounts should use the main login page.", 
                isRetail: true 
            });
        }
        // Phase 11: Independence Redirect
        if (user.independence_redirect_enabled && (user.admin_subdomain || user.subdomain)) {
             const targetSub = user.subdomain || user.admin_subdomain;
             return res.status(403).json({ 
                 redirect: true, 
                 targetUrl: `https://${targetSub}.9jasub.com/business/login`, 
                 message: "You now manage your business through your Website Admin Portal. Opening your Admin Portal...",
                 isBusiness: true 
             });
        }
    }

    // Check Lockout
    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
        const remaining = Math.ceil((user.lockoutUntil - new Date()) / 60000);
        return res.status(403).json({ message: `Account locked due to too many failed attempts. Try again in ${remaining} minutes.` });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        console.log(`[Login] Failure: Wrong password (${email})`);
        
        user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
        if (user.failedLoginAttempts >= 5) {
            user.lockoutUntil = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
            await user.save();
            await logFraudEvent(user._id, "RATE_LIMIT_EXCEEDED", req, { reason: "Login Brute Force Lockout" });
            auditLogService.logAdminAction(req, 'LOGIN_LOCKED', 'failed_login', user._id, user.failedLoginAttempts - 1, user.failedLoginAttempts, { email, status: 'locked' });
            return res.status(403).json({ message: "Too many failed attempts. Account locked for 10 minutes." });
        }
        
        await user.save();
        auditLogService.logAdminAction(req, 'LOGIN_FAILED', 'failed_login', user._id, user.failedLoginAttempts - 1, user.failedLoginAttempts, { email, status: 'failed_attempt' });
        return res.status(400).json({ message: `Wrong password. ${5 - user.failedLoginAttempts} attempts remaining.` });
    }

    user.failedLoginAttempts = 0;
    user.lockoutUntil = undefined;
    auditLogService.logAdminAction(req, 'LOGIN_SUCCESS', 'login_attempt', user._id, null, null, { email, status: 'success' });

    if (user.isSuspended) {
        return res.status(403).json({ message: "Your account has been suspended. Contact support." });
    }

    // Security Tracking
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const isSuspicious = user.lastLoginIp && user.lastLoginIp !== ip;
    const loginAlertStatus = isSuspicious ? "suspicious" : "success";

    user.lastLoginIp = ip;
    user.loginActivity.unshift({ ip, device, timestamp: new Date() });
    if (user.loginActivity.length > 10) user.loginActivity.pop();
    await user.save();

    // Trigger Login Alerts
    const emailQueueStart = performance.now();
    setImmediate(async () => {
        try {
            await Notification.create({
                userId: user._id,
                title: isSuspicious ? "Suspicious Login Detected" : "New Login Detected",
                message: isSuspicious 
                    ? `A suspicious login was detected on your account. Time: ${new Date().toLocaleString()}, Device: ${device}, IP: ${ip}.`
                    : `A new login was detected successfully on your account. Time: ${new Date().toLocaleString()}, Device: ${device}, IP: ${ip}.`,
                type: isSuspicious ? "warning" : "success"
            });
            await sendLoginAlertEmail(user.email, { timestamp: new Date(), device, ip, role: user.role });
        } catch (alertErr) {
            console.error("Failed to send login alerts:", alertErr.message);
        }
    });
    const emailQueueTime = performance.now() - emailQueueStart;

    // Phase 12: Generate emergencyId if not exists
    if (!user.emergencyId) {
        const generateEmergencyId = async () => {
            let emergencyId;
            let exists = true;
            while(exists) {
                emergencyId = Math.random().toString(36).substring(2, 8).toUpperCase();
                exists = await User.findOne({ emergencyId });
            }
            return emergencyId;
        };
        user.emergencyId = await generateEmergencyId();
        await user.save();
    }

    console.log(`[Login] Success: ${email} from ${ip}`);
    const tokenRole = (resellerId && !isOwner) ? 'user' : user.role;
    const token = jwt.sign({ id: user._id, session_type: sessionType, tenantRole: tokenRole }, process.env.JWT_SECRET || "mk_sub_data_secret_2024_premium");
    
    // STRICT SESSION ISOLATION: Wipe old sessions for this device to prevent token crossover
    await Session.deleteMany({ userId: user._id, deviceInfo: device });
    
    await Session.create({ userId: user._id, token, deviceInfo: device });
    
    const reqTime = performance.now() - reqStart;
    console.log(`[Perf] Login: QueueAlert=${emailQueueTime.toFixed(2)}ms, Total=${reqTime.toFixed(2)}ms`);

    res.json({ token, balance: user.totalBalance, user: { name: user.name, email: user.email, role: tokenRole, emergencyId: user.emergencyId, isEmailVerified: user.isEmailVerified, isSignupComplete: user.isSignupComplete }, loginAlertStatus });
  } catch (err) { 
    console.error("Login Error:", err);
    res.status(500).json({ message: "Login failed due to a server error." }); 
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const resellerId = req.reseller?._id || null;
    const user = await User.findByTenant(email, resellerId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const otpData = await OTP.findOne({ userId: user._id });
    if (!otpData) return res.status(400).json({ message: "No OTP requested or OTP expired" });

    if (otpData.isLocked && otpData.lockUntil > Date.now()) {
      const remainingTime = Math.ceil((otpData.lockUntil - Date.now()) / (60 * 1000));
      return res.status(403).json({ message: `Account locked. Try again in ${remainingTime} minutes` });
    }

    if (otpData.isLocked && otpData.lockUntil <= Date.now()) {
      otpData.isLocked = false;
      otpData.attempts = 0;
    }

    const isMatch = await bcrypt.compare(otp, otpData.hashedOtp);
    
    if (!isMatch) {
      otpData.attempts += 1;
      if (otpData.attempts >= 5) {
        otpData.isLocked = true;
        otpData.lockUntil = new Date(Date.now() + 10 * 60 * 1000);
        await otpData.save();
        return res.status(403).json({ message: "Max attempts reached. Verification locked for 10 minutes" });
      }
      await otpData.save();
      return res.status(400).json({ message: `Invalid OTP. ${5 - otpData.attempts} attempts remaining` });
    }

    if (otpData.expiresAt < Date.now()) {
      return res.status(400).json({ message: "OTP has expired" });
    }

    await OTP.deleteOne({ _id: otpData._id });
    
    user.isEmailVerified = true;
    user.isSignupComplete = true; // Mark signup as complete automatically
    await user.save();

    // Virtual Account creation is now handled manually from the Wallet page.
    // console.log(`[VA] Auto-triggering VA creation for ${user.email} after verification...`);
    // handleVACreation(user);

    // Generate Login Token so they can go directly to dashboard
    const isOwner = resellerId && user._id.toString() === resellerId.toString();
    const tokenRole = (resellerId && !isOwner) ? 'user' : user.role;
    const sessionType = req.body.session_type || 'retail';
    const token = jwt.sign({ id: user._id, session_type: sessionType, tenantRole: tokenRole }, process.env.JWT_SECRET || "mk_sub_data_secret_2024_premium");
    
    // STRICT SESSION ISOLATION
    const device = req.headers['user-agent'] || "Unknown";
    await Session.deleteMany({ userId: user._id, deviceInfo: device });
    await Session.create({ userId: user._id, token, deviceInfo: device });
    
    // Security Tracking & Alert
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const isSuspicious = user.lastLoginIp && user.lastLoginIp !== ip;
    const loginAlertStatus = isSuspicious ? "suspicious" : "success";

    user.lastLoginIp = ip;
    await user.save();

    setImmediate(async () => {
        try {
            await Notification.create({
                userId: user._id,
                title: isSuspicious ? "Suspicious Login Detected" : "New Login Detected",
                message: isSuspicious 
                    ? `A suspicious login was detected on your account during email verification. Time: ${new Date().toLocaleString()}, Device: ${device}, IP: ${ip}.`
                    : `A new login was detected successfully during email verification. Time: ${new Date().toLocaleString()}, Device: ${device}, IP: ${ip}.`,
                type: isSuspicious ? "warning" : "success"
            });
            await sendLoginAlertEmail(user.email, { timestamp: new Date(), device, ip, role: user.role });
        } catch (alertErr) {
            console.error("Failed to send login alerts on verification:", alertErr.message);
        }
    });

    res.json({ 
        success: true, 
        message: "Email verified successfully. Welcome to 9JASUB!", 
        token, 
        user: { name: user.name, email: user.email, totalBalance: user.totalBalance, role: tokenRole },
        loginAlertStatus
    });
  } catch (err) {
    console.error("VERIFY EMAIL ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const resendEmailOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const resellerId = req.reseller?._id || null;
    const user = await User.findByTenant(email, resellerId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.isEmailVerified) return res.status(400).json({ message: "Email is already verified." });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await OTP.deleteMany({ userId: user._id });
    await OTP.create({ userId: user._id, hashedOtp, expiresAt });

    console.log(`Resending OTP for email verification: ${user.email}`);
    
    setImmediate(async () => {
        try {
            console.log(`[AUTH] Dispatching resend OTP to ${user.email}`);
            await dispatchOTP(user.email, otp);
        } catch (err) {
            console.error("[ResendOTP] Background email error:", err.message);
        }
    });

    res.json({ success: true, message: "A new OTP has been sent to your email" });
  } catch (err) {
    console.error("RESEND EMAIL OTP ERROR:", err);
    res.status(500).json({ message: "Failed to send OTP. Please try again" });
  }
};

export const verifySecurityQuestions = async (req, res) => {
    try {
        const { email, answers } = req.body; // answers: [{question, answer}]
        const resellerId = req.reseller?._id || null;
        const user = await User.findByTenant(email, resellerId);
        if (!user) return res.status(404).json({ message: "User not found" });

        if (!user.securityQuestions || user.securityQuestions.length < 2) {
            return res.status(400).json({ message: "Security questions not set up for this account." });
        }

        let correctCount = 0;
        for (const provided of answers) {
            const sq = user.securityQuestions.find(q => q.question === provided.question);
            if (sq) {
                const isMatch = await bcrypt.compare(provided.answer.toLowerCase().trim(), sq.answer);
                if (isMatch) correctCount++;
            }
        }

        if (correctCount < 2) {
            return res.status(400).json({ message: "Security answers are incorrect." });
        }

        // Generate OTP for PIN reset
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const hashedOtp = await bcrypt.hash(otp, 10);
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
        
        await OTP.deleteMany({ userId: user._id });
        await OTP.create({ userId: user._id, hashedOtp, expiresAt });
        
        console.log(`Generating OTP for security question verification: ${user.email}`);
        
        setImmediate(async () => {
            try {
                await sendPinResetAlertEmail(user.email);
                console.log(`[AUTH] Dispatching security question OTP to ${user.email}`);
                await dispatchOTP(user.email, otp);
            } catch (err) {
                console.error("[VerifySecurityQuestions] Background email error:", err.message);
            }
        });

        res.json({ success: true, message: "Security answers correct. OTP sent to email." });
    } catch(err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

export const resetTransactionPin = async (req, res) => {
    try {
        const { email, newPin, resetToken } = req.body;
        const resellerId = req.reseller?._id || null;
        
        try {
            const decoded = jwt.verify(resetToken, process.env.JWT_SECRET || "mk_sub_data_secret_2024_premium");
            if (decoded.email.toLowerCase() !== email.toLowerCase()) return res.status(400).json({ message: "Invalid reset token" });
        } catch(err) {
            return res.status(400).json({ message: "Reset token expired or invalid" });
        }

        if (!newPin || newPin.length !== 4) {
            return res.status(400).json({ message: "New PIN must be 4 digits" });
        }

        const hashedPin = await bcrypt.hash(newPin, 10);
        
        let userCheck = await User.findByTenant(email, resellerId);
        if (!userCheck) return res.status(404).json({ message: "User not found" });
        if (!userCheck.isEmailVerified) return res.status(403).json({ message: "Email verification required before performing this action." });

        userCheck.transactionPin = hashedPin;
        userCheck.failedPinAttempts = 0;
        userCheck.pinLockoutUntil = null;
        const user = await userCheck.save();
        
        if (user) {
            auditLogService.logAdminAction(req, 'PIN_RESET', 'pin_reset', user._id, 'Previous PIN existed', 'New PIN reset via token', { email });
        }
        res.json({ success: true, message: "Transaction PIN reset successfully." });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};
export const changeTransactionPin = async (req, res) => {
    try {
        const { oldPin, newPin, confirmPin } = req.body;
        if (!oldPin || !newPin || !confirmPin) return res.status(400).json({ message: "All fields are required" });
        if (newPin !== confirmPin) return res.status(400).json({ message: "New PINs do not match" });
        if (newPin.length !== 4) return res.status(400).json({ message: "PIN must be 4 digits" });

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: "User not found" });
        if (!user.isEmailVerified) return res.status(403).json({ message: "Email verification required before performing this action." });
        const isMatch = await bcrypt.compare(oldPin, user.transactionPin);
        if (!isMatch) return res.status(400).json({ message: "Incorrect PIN" });

        const hashedPin = await bcrypt.hash(newPin, 10);
        user.transactionPin = hashedPin;
        user.failedPinAttempts = 0;
        user.pinLockoutUntil = null;
        await user.save();

        auditLogService.logAdminAction(req, 'PIN_CHANGED', 'pin_reset', user._id, 'Previous PIN existed', 'New PIN changed', { email: user.email });
        res.json({ success: true, message: "Transaction PIN updated successfully" });
    } catch (err) {
        console.error("CHANGE PIN ERROR:", err);
        res.status(500).json({ message: "Server error" });
    }
};

export const requestPinOTP = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: "User not found" });
        if (!user.isEmailVerified) return res.status(403).json({ message: "Email verification required before performing this action." });
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const hashedOtp = await bcrypt.hash(otp, 10);
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

        await OTP.deleteMany({ userId: user._id });
    // Security Tracking & Alert
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const isSuspicious = user.lastLoginIp && user.lastLoginIp !== ip;
    const loginAlertStatus = isSuspicious ? "suspicious" : "success";

    user.lastLoginIp = ip;
    await user.save();

    setImmediate(async () => {
        try {
            await Notification.create({
                userId: user._id,
                title: isSuspicious ? "Suspicious Login Detected" : "New Login Detected",
                message: isSuspicious 
                    ? `A suspicious login was detected on your account during email verification. Time: ${new Date().toLocaleString()}, Device: ${device}, IP: ${ip}.`
                    : `A new login was detected successfully during email verification. Time: ${new Date().toLocaleString()}, Device: ${device}, IP: ${ip}.`,
                type: isSuspicious ? "warning" : "success"
            });
            await sendLoginAlertEmail(user.email, { timestamp: new Date(), device, ip, role: user.role });
        } catch (alertErr) {
            console.error("Failed to send login alerts on verification:", alertErr.message);
        }
    });

    res.json({ 
        success: true, 
        message: "Email verified successfully. Welcome to 9JASUB!", 
        token, 
        user: { name: user.name, email: user.email, totalBalance: user.totalBalance, role: tokenRole },
        loginAlertStatus
    });
  } catch (err) {
    console.error("VERIFY EMAIL ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const verifySecurityQuestions = async (req, res) => {
    try {
        const { email, answers } = req.body; // answers: [{question, answer}]
        const resellerId = req.reseller?._id || null;
        const user = await User.findByTenant(email, resellerId);
        if (!user) return res.status(404).json({ message: "User not found" });

        if (!user.securityQuestions || user.securityQuestions.length < 2) {
            return res.status(400).json({ message: "Security questions not set up for this account." });
        }

        let correctCount = 0;
        for (const provided of answers) {
            const sq = user.securityQuestions.find(q => q.question === provided.question);
            if (sq) {
                const isMatch = await bcrypt.compare(provided.answer.toLowerCase().trim(), sq.answer);
                if (isMatch) correctCount++;
            }
        }

        if (correctCount < 2) {
            return res.status(400).json({ message: "Security answers are incorrect." });
        }

        // Generate OTP for PIN reset
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const hashedOtp = await bcrypt.hash(otp, 10);
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
        
        await OTP.deleteMany({ userId: user._id });
        await OTP.create({ userId: user._id, hashedOtp, expiresAt });
        
        console.log(`Generating OTP for security question verification: ${user.email}`);
        
        setImmediate(async () => {
            try {
                await sendPinResetAlertEmail(user.email);
                console.log(`[AUTH] Dispatching security question OTP to ${user.email}`);
                await dispatchOTP(user.email, otp);
            } catch (err) {
                console.error("[VerifySecurityQuestions] Background email error:", err.message);
            }
        });

        res.json({ success: true, message: "Security answers correct. OTP sent to email." });
    } catch(err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

export const resetTransactionPin = async (req, res) => {
    try {
        const { email, newPin, resetToken } = req.body;
        const resellerId = req.reseller?._id || null;
        
        try {
            const decoded = jwt.verify(resetToken, process.env.JWT_SECRET || "mk_sub_data_secret_2024_premium");
            if (decoded.email.toLowerCase() !== email.toLowerCase()) return res.status(400).json({ message: "Invalid reset token" });
        } catch(err) {
            return res.status(400).json({ message: "Reset token expired or invalid" });
        }

        if (!newPin || newPin.length !== 4) {
            return res.status(400).json({ message: "New PIN must be 4 digits" });
        }

        const hashedPin = await bcrypt.hash(newPin, 10);
        
        let userCheck = await User.findByTenant(email, resellerId);
        if (!userCheck) return res.status(404).json({ message: "User not found" });
        if (!userCheck.isEmailVerified) return res.status(403).json({ message: "Email verification required before performing this action." });

        userCheck.transactionPin = hashedPin;
        userCheck.failedPinAttempts = 0;
        userCheck.pinLockoutUntil = null;
        const user = await userCheck.save();
        
        if (user) {
            auditLogService.logAdminAction(req, 'PIN_RESET', 'pin_reset', user._id, 'Previous PIN existed', 'New PIN reset via token', { email });
        }
        res.json({ success: true, message: "Transaction PIN reset successfully." });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};
export const changeTransactionPin = async (req, res) => {
    try {
        const { oldPin, newPin, confirmPin } = req.body;
        if (!oldPin || !newPin || !confirmPin) return res.status(400).json({ message: "All fields are required" });
        if (newPin !== confirmPin) return res.status(400).json({ message: "New PINs do not match" });
        if (newPin.length !== 4) return res.status(400).json({ message: "PIN must be 4 digits" });

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: "User not found" });
        if (!user.isEmailVerified) return res.status(403).json({ message: "Email verification required before performing this action." });
        const isMatch = await bcrypt.compare(oldPin, user.transactionPin);
        if (!isMatch) return res.status(400).json({ message: "Incorrect PIN" });

        const hashedPin = await bcrypt.hash(newPin, 10);
        user.transactionPin = hashedPin;
        user.failedPinAttempts = 0;
        user.pinLockoutUntil = null;
        await user.save();

        auditLogService.logAdminAction(req, 'PIN_CHANGED', 'pin_reset', user._id, 'Previous PIN existed', 'New PIN changed', { email: user.email });
        res.json({ success: true, message: "Transaction PIN updated successfully" });
    } catch (err) {
        console.error("CHANGE PIN ERROR:", err);
        res.status(500).json({ message: "Server error" });
    }
};

export const requestPinOTP = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: "User not found" });
        if (!user.isEmailVerified) return res.status(403).json({ message: "Email verification required before performing this action." });
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const hashedOtp = await bcrypt.hash(otp, 10);
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

        await OTP.deleteMany({ userId: user._id });
        await OTP.create({ userId: user._id, hashedOtp, expiresAt });

        console.log(`Generating PIN reset OTP for: ${user.email}`);
    
        setImmediate(async () => {
            try {
                const startTime = Date.now();
                console.log('[ADMIN LOGIN] Recipient email:', user.email, 'OTP generated:', otp);
                console.log(`[AUTH] Dispatching pin reset OTP to ${user.email}`);
                const sent = await dispatchOTP(user.email, otp);
                if (!sent) {
                    console.error("[Security] Admin OTP dispatch reported failure");
                }
                console.log(`[Telemetry] PIN reset OTP email processed in ${Date.now() - startTime}ms`);
            } catch (error) {
                console.error("[SECURITY] Unhandled SMTP exception caught during dispatch:", error);
            }
        });

        res.json({ success: true, message: "OTP sent to your email" });
    } catch (err) {
        console.error("REQUEST PIN OTP ERROR:", err);
        res.status(500).json({ message: "Server error" });
    }
};
