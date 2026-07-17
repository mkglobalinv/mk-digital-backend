const fs = require('fs');
const path = require('path');
const controllerPath = path.join('c:/Users/userpc/mk-digital-backend/controllers/resellerController.js');
let code = fs.readFileSync(controllerPath, 'utf8');

code += `
export const adjustCustomerWallet = async (req, res) => {
    try {
        const { id } = req.params;
        const { action, amount, reason, pin } = req.body;
        const numAmount = Number(amount);

        if (!numAmount || numAmount <= 0) return res.status(400).json({ message: 'Invalid amount' });
        if (!pin) return res.status(400).json({ message: 'Withdrawal PIN required' });

        const User = (await import('../models/User.js')).default;
        const bcrypt = (await import('bcrypt')).default;
        const Transaction = (await import('../models/Transaction.js')).default;
        const { insertLedgerEntry } = await import('../services/supabaseLedger.js');

        const reseller = await User.findById(req.user.id);
        const isMatch = await bcrypt.compare(pin, reseller.withdrawalPin || '');
        if (!isMatch) return res.status(401).json({ message: 'Invalid withdrawal PIN' });

        const customer = await User.findOne({ _id: id, referredBy: req.user.id });
        if (!customer) return res.status(404).json({ message: 'Customer not found or access denied' });

        if (action === 'credit') {
            if (reseller.balance1 < numAmount) return res.status(400).json({ message: 'Insufficient balance to credit customer' });
            
            reseller.balance1 -= numAmount;
            customer.balance1 += numAmount;

            await reseller.save();
            await customer.save();

            await Transaction.create({
                userId: customer._id, amount: numAmount, type: 'credit', status: 'success',
                description: \`Wallet funded by Reseller: \${reason || 'N/A'}\`, provider: 'System', reference: \`WCR-\${Date.now()}\`
            });
            await Transaction.create({
                userId: reseller._id, amount: numAmount, type: 'debit', status: 'success',
                description: \`Funded Customer Wallet (\${customer.email})\`, provider: 'System', reference: \`WDB-\${Date.now()}\`
            });

            await insertLedgerEntry(reseller._id, -numAmount, 'withdrawal', 'wallet', \`WDB-\${Date.now()}\`, \`Funded Customer (\${customer.email})\`);
            await insertLedgerEntry(customer._id, numAmount, 'deposit', 'wallet', \`WCR-\${Date.now()}\`, 'Reseller Funding');
        } else if (action === 'debit') {
            if (customer.balance1 < numAmount) return res.status(400).json({ message: 'Customer has insufficient balance' });

            customer.balance1 -= numAmount;
            reseller.balance1 += numAmount;

            await customer.save();
            await reseller.save();

            await Transaction.create({
                userId: customer._id, amount: numAmount, type: 'debit', status: 'success',
                description: \`Wallet debited by Reseller: \${reason || 'N/A'}\`, provider: 'System', reference: \`WDB-\${Date.now()}\`
            });
            await Transaction.create({
                userId: reseller._id, amount: numAmount, type: 'credit', status: 'success',
                description: \`Debited Customer Wallet (\${customer.email})\`, provider: 'System', reference: \`WCR-\${Date.now()}\`
            });

            await insertLedgerEntry(customer._id, -numAmount, 'withdrawal', 'wallet', \`WDB-\${Date.now()}\`, 'Reseller Debit');
            await insertLedgerEntry(reseller._id, numAmount, 'deposit', 'wallet', \`WCR-\${Date.now()}\`, \`Debited Customer (\${customer.email})\`);
        } else {
            return res.status(400).json({ message: 'Invalid action' });
        }

        res.json({ message: \`Successfully \${action}ed ₦\${numAmount} to customer.\` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};

export const notifyCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const { subject, message } = req.body;

        const User = (await import('../models/User.js')).default;
        const Notification = (await import('../models/Notification.js')).default;

        const customer = await User.findOne({ _id: id, referredBy: req.user.id });
        if (!customer) return res.status(404).json({ message: 'Customer not found or access denied' });

        await Notification.create({
            userId: customer._id,
            title: subject,
            message: message,
            type: 'system',
            read: false
        });

        res.json({ message: 'Notification sent successfully.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};
`;
fs.writeFileSync(controllerPath, code);

// Now update resellerRoutes.js
const routesPath = path.join('c:/Users/userpc/mk-digital-backend/routes/resellerRoutes.js');
let rCode = fs.readFileSync(routesPath, 'utf8');

// Insert imports
rCode = rCode.replace('toggleResellerUserSuspension', 'toggleResellerUserSuspension,\n    adjustCustomerWallet,\n    notifyCustomer');

// Insert routes
rCode += `
router.post('/users/:id/adjust-wallet', restrictToBasicOrPremium, adjustCustomerWallet);
router.post('/users/:id/notify', restrictToBasicOrPremium, notifyCustomer);
`;
fs.writeFileSync(routesPath, rCode);
console.log("Done");
