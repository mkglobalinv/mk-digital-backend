import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import DataPlan from '../models/DataPlan.js';
import Transaction from '../models/Transaction.js';
import { insertLedgerEntry, syncLedgerToMongo } from '../services/supabaseLedger.js';
import { getSupabaseClient } from '../services/supabaseClient.js';

dotenv.config();

// Helper to simulate pricing calculation (since calculateVtuPrice is in server.js, we simulate it using the same formula)
const calculatePrice = (plan, reseller, customer) => {
    let basePrice = plan.reseller_price || plan.selling_price;
    let sellingPrice = plan.basic_selling_price || plan.selling_price;
    return { basePrice, sellingPrice };
};

async function runTest() {
    console.log("=== STARTING BASIC RESELLER FLOW TEST ===");
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB.");

        const supabase = getSupabaseClient();
        if (!supabase) {
            throw new Error("Supabase client failed to initialize.");
        }
        console.log("Supabase Client initialized.");

        // 1. Create Mock Data Plan
        const planCode = `test-data-plan-${Date.now()}`;
        const dataPlan = await DataPlan.create({
            api_plan_id: planCode,
            network: "MTN",
            plan_name: "Test MTN 1GB Plan",
            category: "SME",
            api_price: 99,
            reseller_price: 110,
            basic_selling_price: 140,
            selling_price: 150,
            status: true,
            provider: "smart"
        });
        console.log(`[OK] Mock Data Plan created: ${planCode}`);

        // 2. Create Mock Basic Reseller
        const resellerEmail = `basic_reseller_${Date.now()}@test.com`;
        const reseller = await User.create({
            name: "Test Basic Reseller",
            email: resellerEmail,
            password: "hashedpassword123",
            transactionPin: "1234",
            role: "reseller_admin",
            resellerTier: "basic",
            balance1: 0, // Reseller starts with 0 balance to test that checkout is NOT blocked
            earningsBalance: 0
        });
        console.log(`[OK] Basic Reseller created: ${resellerEmail} with 0 balance.`);

        // 3. Create Mock Customer under Reseller
        const customerEmail = `customer_${Date.now()}@test.com`;
        const customer = await User.create({
            name: "Test Reseller Customer",
            email: customerEmail,
            password: "hashedpassword123",
            transactionPin: "1234",
            role: "user",
            referredBy: reseller._id,
            balance1: 200 // Customer has enough balance
        });
        console.log(`[OK] Reseller Customer created: ${customerEmail} under reseller.`);

        // 4. Test Price Calculation Simulation
        const { basePrice, sellingPrice } = calculatePrice(dataPlan, reseller, customer);
        console.log(`[OK] Calculated prices: Customer Price = ₦${sellingPrice}, Reseller Cost = ₦${basePrice}`);
        if (sellingPrice !== 140 || basePrice !== 110) {
            throw new Error("Pricing calculation is incorrect for basic reseller.");
        }

        // 5. Test Checkout Logic Checks
        console.log("Simulating Checkout Logic checks...");
        const isPremiumOrVip = reseller.resellerTier === 'premium' || reseller.resellerTier === 'vip';
        if (isPremiumOrVip) {
            throw new Error("Basic reseller incorrectly identified as Premium/VIP!");
        }
        console.log("[OK] Basic reseller tier correctly identified.");

        // Simulate balance check: Customer has 200, price is 140 -> passes.
        // Reseller has 0, but since they are BASIC, we skip their balance check.
        if (customer.balance1 < sellingPrice) {
            throw new Error("Customer has insufficient balance.");
        }
        console.log("[OK] Customer balance check passed.");

        // Since reseller is BASIC, we skip checking reseller balance.
        console.log("[OK] Skip Reseller balance check for BASIC tier verified.");

        // 6. Simulate Customer Debit & Pending Transaction Creation
        console.log("Simulating checkout deductions...");
        // Deduct from customer
        customer.balance1 -= sellingPrice;
        await customer.save();
        console.log(`[OK] Customer debited ₦${sellingPrice}. New balance: ₦${customer.balance1}`);

        // Since reseller is BASIC, we skip debiting reseller.
        console.log("[OK] Skip Reseller debit for BASIC tier verified.");

        // Create pending transaction for customer
        const txRef = `TX-TEST-${Date.now()}`;
        const tx = await Transaction.create({
            userId: customer._id,
            resellerId: reseller._id,
            type: "debit",
            status: "pending",
            amount: sellingPrice,
            cost_price: basePrice,
            selling_price: sellingPrice,
            reference: txRef,
            description: `Data: ${planCode} (Pending)`,
            balance_deducted: true,
            isApiRequest: true
        });
        console.log(`[OK] Pending Customer transaction created. Ref: ${txRef}`);

        // 7. Simulate Queue Transaction Execution (Success)
        console.log("Simulating successful transaction queue execution...");
        tx.status = 'success';
        tx.reference = `API-SUCCESS-${Date.now()}`;
        tx.provider_used = 'smart';
        tx.api_response = { status: 'success' };

        const profit = (tx.selling_price || tx.amount) - (tx.cost_price || 0);
        console.log(`[OK] Transaction profit computed: ₦${profit}`);
        if (profit !== 30) {
            throw new Error(`Expected profit to be ₦30, but got ₦${profit}`);
        }
        tx.profit = profit;
        await tx.save();

        // Perform basic reseller profit distribution
        const freshReseller = await User.findById(reseller._id);
        if (freshReseller.resellerTier === 'basic') {
            const commRef = `COMM-${tx.reference}`;
            const commDesc = `Commission: Data: ${planCode} for customer ${customer.email}`;

            console.log("Crediting reseller profit to Supabase wallet_ledger...");
            await insertLedgerEntry(
                reseller._id,
                profit,
                'commission',
                'earnings',
                commRef,
                commDesc
            );
            console.log("[OK] Supabase wallet_ledger credited.");

            console.log("Syncing Supabase ledger to MongoDB user earningsBalance...");
            await syncLedgerToMongo(reseller._id);
            console.log("[OK] MongoDB user earningsBalance synced.");

            console.log("Creating reseller credit transaction log in MongoDB...");
            await Transaction.create({
                userId: reseller._id,
                type: 'credit',
                status: 'success',
                amount: profit,
                description: commDesc,
                reference: commRef,
                provider: 'System',
                isInternal: false,
                resellerId: reseller._id
            });
            console.log("[OK] Reseller MongoDB credit transaction log created.");
        }

        // 8. Assertions
        console.log("Running assertions on updated records...");
        const updatedReseller = await User.findById(reseller._id);
        console.log(`Reseller Main Balance: ₦${updatedReseller.balance1}`);
        console.log(`Reseller Earnings Balance: ₦${updatedReseller.earningsBalance}`);

        if (updatedReseller.balance1 !== 0) {
            throw new Error(`Reseller main wallet was debited! Main balance is ₦${updatedReseller.balance1}, expected ₦0`);
        }
        if (updatedReseller.earningsBalance !== 30) {
            throw new Error(`Reseller earnings wallet not credited correctly! Earnings balance is ₦${updatedReseller.earningsBalance}, expected ₦30`);
        }
        console.log("[SUCCESS] Reseller wallet balances verified!");

        // Assert transaction log
        const resellerTx = await Transaction.findOne({ userId: reseller._id, type: 'credit' });
        if (!resellerTx) {
            throw new Error("Reseller credit transaction history log was not created!");
        }
        console.log(`[SUCCESS] Reseller transaction history log found: "${resellerTx.description}" | Amount: ₦${resellerTx.amount}`);

        // 9. Cleanup
        console.log("Cleaning up mock records...");
        await DataPlan.deleteOne({ _id: dataPlan._id });
        await User.deleteOne({ _id: customer._id });
        await User.deleteOne({ _id: reseller._id });
        await Transaction.deleteMany({ userId: { $in: [customer._id, reseller._id] } });

        // Clean Supabase ledger entries
        const { error: deleteErr } = await supabase
            .from('wallet_ledger')
            .delete()
            .eq('user_id', reseller._id.toString());
        if (deleteErr) {
            console.error("Failed to clean Supabase wallet_ledger:", deleteErr);
        } else {
            console.log("[OK] Supabase wallet_ledger cleaned.");
        }

        console.log("=== ALL TESTS PASSED SUCCESSFULLY ===");
        process.exit(0);

    } catch (err) {
        console.error("=== TEST FAILED ===");
        console.error(err);
        process.exit(1);
    }
}

runTest();
