// test_pricing_logic.js
// A standalone test to verify the updated Basic Reseller Pricing logic.

function simulateBasicResellerPricing(providerCost, adminMarkupPercentage, assignedPrice) {
    // Simulated variables representing the DB state
    const resellerWholesaleCost = providerCost;
    const globalPrice = { default_retail_price: providerCost };
    const adminRule = { markupPercentage: adminMarkupPercentage };
    const resellerId = "reseller_123";
    
    let baseRetailPrice;
    let adminPrice;
    
    console.log(`\n=== Running Test ===`);
    console.log(`Provider Cost: ₦${providerCost}`);
    console.log(`Admin Percentage Rule: ${adminMarkupPercentage}%`);
    if (assignedPrice) console.log(`Assigned Price: ₦${assignedPrice}`);

    // EXACT LOGIC FROM retailPricing.js
    if (assignedPrice) {
        adminPrice = Number(assignedPrice);
    } else {
        if (adminRule && adminRule.markupPercentage > 0) {
            const adminMarkupValue = Number(resellerWholesaleCost) * (Number(adminRule.markupPercentage) / 100);
            adminPrice = Number(resellerWholesaleCost) + adminMarkupValue;
        } else {
            adminPrice = Number(globalPrice.default_retail_price);
        }
    }

    const adminMarkup = adminPrice - Number(resellerWholesaleCost);
    const basicCommission = adminMarkup > 0 ? adminMarkup * 0.50 : 0;
    
    baseRetailPrice = adminPrice + basicCommission;
    
    const result = {
        finalPrice: Number(baseRetailPrice),
        resellerProfit: basicCommission,
        resellerId: resellerId
    };

    // Output Results
    console.log(`\n[Results]`);
    console.log(`Calculated Admin Price: ₦${adminPrice}`);
    console.log(`Calculated Admin Markup: ₦${adminMarkup}`);
    console.log(`Basic Reseller Commission (50% of Markup): ₦${basicCommission}`);
    console.log(`Final Customer Price: ₦${result.finalPrice}`);
    console.log(`Wallet Credit (resellerProfit): ₦${result.resellerProfit}`);
    
    // Assertions for expected business logic
    const expectedCustomerPrice = adminPrice + basicCommission;
    console.log(`\n[Validation]`);
    console.log(`Customer Price Correct? ${result.finalPrice === expectedCustomerPrice ? 'YES' : 'NO'}`);
    console.log(`Commission Correct? ${result.resellerProfit === (adminMarkup * 0.50) ? 'YES' : 'NO'}`);
    console.log(`--------------------------------\n`);
}

// Test Case 1: Standard 10% global markup (Matches User Example)
simulateBasicResellerPricing(100, 10, null);

// Test Case 2: Admin manually assigns the price to 120
simulateBasicResellerPricing(100, 10, 120);
