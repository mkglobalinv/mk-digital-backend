require('dotenv').config();
const mongoose = require('mongoose');

async function fixProfits() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const Transaction = require('./models/Transaction.js').default || mongoose.model('Transaction');
        const User = require('./models/User.js').default || mongoose.model('User');
        
        // Let's import the profit service we just wrote. But we are in CJS, so we dynamically import the ES module:
        const { applyResellerProfit } = await import('../services/resellerProfitService.js');
        
        const txs = await Transaction.find({ reference: { $in: ['6711511429', '6711511199'] } });
        console.log(`Found ${txs.length} transactions to fix.`);
        
        for (const tx of txs) {
            console.log(`Fixing tx ${tx.reference}... profit currently: ${tx.profit}`);
            if (!tx.profit || tx.profit === 0) {
                const user = await User.findById(tx.userId);
                await applyResellerProfit(tx, user);
                await tx.save();
                console.log(`Fixed tx ${tx.reference}. New profit: ${tx.profit}`);
            }
        }
        
        console.log("Done.");
    } catch(e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
fixProfits();
