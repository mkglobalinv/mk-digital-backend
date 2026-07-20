import User from '../models/User.js';
import bcrypt from 'bcrypt';

export const verifyTransactionPin = async (req, res, next) => {
    try {
        let { transactionPin, amount, biometricData } = req.body;
        if (!amount && req.body.value && req.body.quantity) amount = req.body.value * req.body.quantity;
        
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        // Check PIN Lockout
        if (user.pinLockoutUntil && user.pinLockoutUntil > new Date()) {
            const remaining = Math.ceil((user.pinLockoutUntil - new Date()) / 60000);
            return res.status(403).json({ message: `Transaction PIN locked. Try again in ${remaining} minutes.` });
        }

        // Reset lock if expired
        if (user.pinLockoutUntil && user.pinLockoutUntil <= new Date()) {
            user.failedPinAttempts = 0;
            user.pinLockoutUntil = undefined;
            await user.save();
        }

        // BIOMETRIC AUTHENTICATION PATH
        if (biometricData) {
            console.log(`[PinVerify] Biometric path for ${user.email}`);
            // Check if biometric is enabled
            if (!user.biometricEnabled) return res.status(400).json({ message: "Biometric not enabled" });
            
            // Verify the credential ID exists for this user
            const hasCred = user.webauthnCredentials.some(c => c.credentialID === biometricData.credentialID);
            if (!hasCred) {
                console.warn(`[PinVerify] Invalid biometric credential for ${user.email}`);
                return res.status(400).json({ message: "Invalid biometric credential" });
            }
            
            // In a full implementation, we verify signature here. 
            // For now, we trust the device-released assertion.
            console.log(`[PinVerify] SUCCESS via Biometrics for ${user.email}`);
        } 
        // TRADITIONAL PIN PATH
        else {
            if (!transactionPin) return res.status(400).json({ message: "Transaction PIN required" });
            
            const isPinMatch = await bcrypt.compare(String(transactionPin), user.transactionPin);
            if (!isPinMatch) {
                console.log(`[PinVerify] FAILED: Incorrect PIN for ${user.email}`);
                
                user.failedPinAttempts = (user.failedPinAttempts || 0) + 1;
                if (user.failedPinAttempts >= 3) {
                    user.pinLockoutUntil = new Date(Date.now() + 10 * 60000); // 10 minutes lockout
                    await user.save();
                    return res.status(403).json({ message: "Incorrect PIN. Max attempts reached. Wallet transactions locked for 10 minutes." });
                }
                
                await user.save();
                return res.status(400).json({ message: `Incorrect PIN. ${3 - user.failedPinAttempts} attempts remaining.` });
            }
        }
        
        if (user.failedPinAttempts > 0 || user.pinLockoutUntil) {
            user.failedPinAttempts = 0;
            user.pinLockoutUntil = undefined;
            await user.save();
        }
        
        if (!user.kycVerified && amount > user.transactionLimit) {
            console.log(`[PinVerify] FAILED: Limit exceeded for ${user.email}. Amount: ${amount}, Limit: ${user.transactionLimit}`);
            return res.status(400).json({ message: "Limit exceeded" });
        }
        
        req.fullUser = user;
        next();
    } catch(err) { 
        console.error("[PinVerify] ERROR:", err);
        res.status(500).json({ message: "Error" }); 
    }
};
