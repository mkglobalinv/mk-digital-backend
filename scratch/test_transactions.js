import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

import { deductBalance } from '../services/walletService.js';
import User from '../models/User.js';

// We mock the external provider call to prevent real money loss
const mockExternalProviderCall = async (amount, type) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            console.log(`[Mock Provider] Processed ${type} for ₦${amount}`);
            resolve({ status: 'success', reference: `MOCK-${Date.now()}` });
        }, 500);
    });
};

const runAudit = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("=== DB Connected ===");

        const testUser = await User.findOne({ email: 'audit_test@mkdigital.com' });
        if (!testUser) {
            console.error("Run verify_business_ops.js first to create the test user.");
            process.exit(1);
        }

        console.log(`\n=== TRANSACTION ENGINE AUDIT (Simulated) ===`);
        console.log(`Initial Balance: ₦${testUser.balance1 || 0}`);

        const transactions = [
            { type: 'Airtime', amount: 100 },
            { type: 'Data', amount: 250 },
            { type: 'Electricity', amount: 1000 },
            { type: 'Cable TV', amount: 2000 }
        ];

        for (const txn of transactions) {
            console.log(`\n--- Initiating ${txn.type} Transaction ---`);
            const deduct = await deductBalance(testUser._id, txn.amount);
            
            if (!deduct) {
                console.log(`[Engine] Transaction FAILED: Insufficient Balance or Frozen Wallet`);
                continue;
            }

            console.log(`[Engine] Wallet Deducted ₦${txn.amount}. New Balance: ₦${deduct.balance1}`);
            
            // Simulating passing to `clubkonnect` or `smartBuy`
            const providerRes = await mockExternalProviderCall(txn.amount, txn.type);
            
            if (providerRes.status === 'success') {
                console.log(`[Engine] Transaction SUCCESS. Ref: ${providerRes.reference}`);
            } else {
                console.log(`[Engine] Provider Failed. Triggering Refund...`);
                // refund logic would go here
            }
        }

        console.log("\n=== AUDIT COMPLETE ===");
        process.exit(0);
    } catch (err) {
        console.error("Audit Failed:", err);
        process.exit(1);
    }
};

runAudit();
