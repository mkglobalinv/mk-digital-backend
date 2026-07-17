const plan = {
    api_plan_id: 'TEST_PLAN_123',
    network: 'MTN',
    selling_price: 500, // Retail Price
    reseller_price: 450, // Reseller Wholesale Cost
    basic_selling_price: 480 // Basic Reseller Customer Price
};

const validatePricing = async () => {
    try {
        console.log("Validating Phase 3 Pricing Math...");

        console.log("\n--- MOCK PLAN SETUP ---");
        console.log(`Retail Price: ${plan.selling_price}`);
        console.log(`Reseller Cost: ${plan.reseller_price}`);
        console.log(`Basic Customer Price: ${plan.basic_selling_price}`);

        // 1. Retail Validation
        let retailPrice = plan.selling_price;
        console.log(`\n1. RETAIL PURCHASE`);
        console.log(`   Deducted Amount: ${retailPrice} (Expected: 500)`);

        // 2. Basic Reseller Validation
        console.log(`\n2. BASIC RESELLER CUSTOMER PURCHASE`);
        let basicResellerCost = plan.reseller_price || plan.selling_price;
        let basicPrice = plan.basic_selling_price || plan.selling_price;
        let basicProfit = basicPrice - basicResellerCost;
        if (basicProfit < 0) basicProfit = 0;
        console.log(`   Deducted Amount: ${basicPrice} (Expected: 480)`);
        console.log(`   Reseller Profit: ${basicProfit} (Expected: 30)`);

        // 3. Premium Reseller Validation (No Override)
        console.log(`\n3. PREMIUM RESELLER CUSTOMER PURCHASE (NO OVERRIDE)`);
        let premiumCostNoOverride = plan.reseller_price || plan.selling_price;
        let premiumPriceNoOverride = plan.reseller_price || plan.selling_price; // Fallback
        let premiumProfitNoOverride = premiumPriceNoOverride - premiumCostNoOverride;
        if (premiumProfitNoOverride < 0) premiumProfitNoOverride = 0;
        console.log(`   Deducted Amount: ${premiumPriceNoOverride} (Expected: 450)`);
        console.log(`   Reseller Profit: ${premiumProfitNoOverride} (Expected: 0)`);

        // 4. Premium Reseller Validation (With Override)
        console.log(`\n4. PREMIUM RESELLER CUSTOMER PURCHASE (WITH OVERRIDE)`);
        let premiumCostOverride = plan.reseller_price || plan.selling_price;
        let override = { sellingPrice: 490 }; // Mock override
        let premiumPriceOverride = override.sellingPrice;
        let premiumProfitOverride = premiumPriceOverride - premiumCostOverride;
        if (premiumProfitOverride < 0) premiumProfitOverride = 0;
        console.log(`   Deducted Amount: ${premiumPriceOverride} (Expected: 490)`);
        console.log(`   Reseller Profit: ${premiumProfitOverride} (Expected: 40)`);

        console.log("\nValidation Complete.");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

validatePricing();
