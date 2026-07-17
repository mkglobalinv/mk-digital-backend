import FraudLog from "../models/FraudLog.js";
import Transaction from "../models/Transaction.js";
import User from "../models/User.js";

/**
 * Middleware to check if a user is currently blocked from making payments
 */
export const checkPaymentBlock = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const ip = req.ip;

    // Check if there are 3 failed payment attempts in the last 10 minutes
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const failedAttempts = await Transaction.countDocuments({
      userId,
      status: "failed",
      createdAt: { $gte: tenMinutesAgo }
    });

    if (failedAttempts >= 3) {
      // Find the last failed attempt to see if 15 mins have passed since then
      const lastFailed = await Transaction.findOne({ userId, status: "failed" }).sort({ createdAt: -1 });
      const blockExpiry = new Date(lastFailed.createdAt.getTime() + 15 * 60 * 1000);

      if (blockExpiry > Date.now()) {
        const remainingTime = Math.ceil((blockExpiry - Date.now()) / (60 * 1000));
        
        // Log the block if not already logged recently
        await FraudLog.create({
          userId,
          eventType: "RATE_LIMIT_EXCEEDED",
          ipAddress: ip,
          metadata: { reason: "Too many failed payment attempts", remainingTime }
        });

        return res.status(403).json({ 
          message: `Too many failed attempts. Payment blocked. Try again in ${remainingTime} minutes.` 
        });
      }
    }

    // Check for multiple IPs in a short time (Suspicious activity)
    const recentTx = await Transaction.find({
      userId,
      createdAt: { $gte: tenMinutesAgo }
    }).select('ipAddress'); // need to add ipAddress to transactions

    // (Logic for multiple IPs can be more complex, but let's start simple)

    next();
  } catch (error) {
    console.error("FRAUD MIDDLEWARE ERROR:", error);
    next(); // Don't block if middleware crashes, but log it
  }
};

/**
 * Helper to log fraud events (can be used inside controllers)
 */
export const logFraudEvent = async (userId, eventType, req, metadata = {}) => {
  try {
    await FraudLog.create({
      userId,
      eventType,
      ipAddress: req.ip,
      metadata
    });
  } catch (error) {
    console.error("FAILED TO LOG FRAUD:", error);
  }
};
