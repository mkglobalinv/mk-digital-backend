import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import socketService from './socketService.js';
import { insertLedgerEntry, syncLedgerToMongo } from './supabaseLedger.js';

export const applyResellerProfit = async (tx, customerUser) => {
    try {
        const resellerId = tx.resellerId;
        if (!resellerId) return; // No reseller, no profit

        // Avoid double applying profit
        if (tx.profit && tx.profit > 0) return;

        const profit = (tx.selling_price || tx.amount) - (tx.cost_price || 0);
        if (profit <= 0) return;

        const reseller = await User.findById(resellerId);
        if (!reseller) return;

        tx.profit = profit;
        
        if (reseller.resellerTier === 'basic' || !reseller.resellerTier) {
            // For BASIC Reseller
            const ref = `COMM-${tx.reference || Date.now()}`;
            const customerEmail = customerUser ? customerUser.email : 'customer';
            const desc = `Commission: ${tx.description.replace(' (Pending)', '')} for customer ${customerEmail}`;
            
            const basicCommission = Number((profit).toFixed(2));
            
            await insertLedgerEntry(
                resellerId,
                basicCommission,
                'commission',
                'earnings',
                ref,
                desc
            );
            await syncLedgerToMongo(resellerId);
            
            // Create a credit transaction for the reseller
            await Transaction.create({
                userId: resellerId,
                type: 'credit',
                status: 'success',
                amount: basicCommission,
                description: desc,
                reference: ref,
                provider: 'System',
                isInternal: false,
                resellerId: resellerId
            });
        } else {
            // For Premium/VIP Reseller
            await User.findByIdAndUpdate(resellerId, { $inc: { earningsBalance: profit } });
        }

        // Fetch updated reseller and emit detailed realtime socket update
        const updatedReseller = await User.findById(resellerId);
        if (updatedReseller) {
            const actualProfit = (reseller.resellerTier === 'basic' || !reseller.resellerTier) 
                ? Number((profit).toFixed(2)) 
                : profit;
                
            socketService.emitWalletSync(resellerId, {
                balance: updatedReseller.balance1,
                earningsBalance: updatedReseller.earningsBalance,
                message: `Commission earned: ₦${actualProfit}!`
            });
        }

        console.log(`[Profit] Recorded ₦${profit} for Reseller ${resellerId} (${reseller.resellerTier || 'basic'}) on Tx ${tx.reference}`);
        
    } catch (err) {
        console.error(`[Profit Error] Failed to apply profit for Tx ${tx.reference}:`, err.message);
    }
};
