import User from '../models/User.js';
import EmergencyRequest from '../models/EmergencyRequest.js';
import Transaction from '../models/Transaction.js';
import { getRetailPrice } from '../services/pricing/retailPricing.js';
import Notification from '../models/Notification.js';

// Search User by Emergency ID
export const searchUserByEmergencyId = async (req, res) => {
    try {
        const { emergencyId } = req.query;
        if (!emergencyId) return res.status(400).json({ message: "emergencyId is required" });

        const user = await User.findOne({ emergencyId: emergencyId.toUpperCase() })
            .select("name email phone balance1 referredBy emergencyId");
            
        if (!user) return res.status(404).json({ message: "User not found for the given emergency code" });

        const tenant = user.referredBy ? await User.findById(user.referredBy).select("name branding subdomain") : null;

        res.json({
            status: "success",
            user,
            tenant
        });
    } catch (err) {
        console.error("[EmergencySearch Error]", err);
        res.status(500).json({ message: "Server error during search" });
    }
};

// Get Live Pricing for Emergency Request
export const getEmergencyPricing = async (req, res) => {
    try {
        const { userId, planId, network } = req.query;
        if (!userId || !planId) return res.status(400).json({ message: "userId and planId are required" });

        const { finalPrice, resellerProfit, resellerId, costPrice } = await getRetailPrice(userId, planId, 'data');
        
        res.json({
            status: "success",
            pricing: {
                finalPrice,
                resellerProfit,
                resellerId,
                costPrice
            }
        });
    } catch (err) {
        console.error("[EmergencyPricing Error]", err);
        res.status(500).json({ message: "Failed to load live pricing" });
    }
};

// Approve Emergency Request
export const approveEmergencyRequest = async (req, res) => {
    try {
        const { userId, planId, network, phone, rawSms } = req.body;
        const adminId = req.user.id;

        if (!userId || !planId || !network || !phone) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        // Calculate live pricing exactly at the moment of approval
        const { finalPrice, resellerProfit, resellerId } = await getRetailPrice(userId, planId, 'data');

        if (user.balance1 < finalPrice) {
            return res.status(400).json({ message: "Insufficient balance for this purchase. Balance: ₦" + user.balance1 });
        }

        // Deduct from User
        await User.findByIdAndUpdate(userId, { $inc: { balance1: -finalPrice } });

        // Credit exactly ₦10 SMS Cashback to user
        const cashbackAmount = 10;
        await User.findByIdAndUpdate(userId, { $inc: { balance1: cashbackAmount } });

        // Allocate profit to Reseller
        if (resellerProfit > 0 && resellerId) {
            await User.findByIdAndUpdate(resellerId, { $inc: { earningsBalance: resellerProfit } });
            
            try {
                const { getSupabaseClient } = await import('../services/supabaseClient.js');
                const supabase = getSupabaseClient();
                if (supabase) {
                    await supabase.from('reseller_profit_ledger').insert({
                        reseller_id: resellerId.toString(),
                        transaction_id: `EMER-PRF-${Date.now()}`,
                        amount: resellerProfit,
                        description: `Profit from Emergency Data purchase by ${user.email}`
                    });
                }
            } catch(e) { console.error(e) }
        }

        // Create the Emergency Request Record
        const requestRecord = await EmergencyRequest.create({
            userId,
            tenantId: resellerId || null,
            phone,
            network,
            planId,
            rawSms,
            status: "APPROVED",
            adminId,
            cashbackAmount,
            amountCharged: finalPrice
        });

        // Transactions Logging
        await Transaction.create({
            userId,
            amount: finalPrice,
            type: "debit",
            status: "success",
            description: `Emergency Data Purchase (${network})`,
            provider: "System",
            reference: `EMER-DATA-${Date.now()}`
        });

        await Transaction.create({
            userId,
            amount: cashbackAmount,
            type: "EMERGENCY_SMS_CASHBACK", // Enum update equivalent
            status: "success",
            description: "Cashback for Emergency SMS Request",
            provider: "System",
            reference: `EMER-CB-${Date.now()}`
        });

        res.json({
            status: "success",
            message: "Emergency request approved and fulfilled successfully",
            request: requestRecord
        });

    } catch (err) {
        console.error("[ApproveEmergency Error]", err);
        res.status(500).json({ message: "Failed to approve request" });
    }
};

// Reject Emergency Request
export const rejectEmergencyRequest = async (req, res) => {
    try {
        const { userId, planId, network, phone, rawSms, reason } = req.body;
        const adminId = req.user.id;

        const requestRecord = await EmergencyRequest.create({
            userId,
            phone,
            network,
            planId,
            rawSms,
            status: "REJECTED",
            adminId,
            rejectionReason: reason || "Admin Rejected"
        });

        res.json({
            status: "success",
            message: "Emergency request rejected successfully",
            request: requestRecord
        });
    } catch (err) {
        console.error("[RejectEmergency Error]", err);
        res.status(500).json({ message: "Failed to reject request" });
    }
};

// Get History
export const getEmergencyHistory = async (req, res) => {
    try {
        const history = await EmergencyRequest.find().sort({ createdAt: -1 }).populate('userId', 'name email phone').limit(50);
        res.json({
            status: "success",
            history
        });
    } catch (err) {
        console.error("[HistoryEmergency Error]", err);
        res.status(500).json({ message: "Failed to fetch history" });
    }
};
