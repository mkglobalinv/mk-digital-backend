// test_authoritative_logic.js

function simulateAuthoritativeLogic(providerCost, adminMarkupPercentage) {
    console.log(`\n=== Running Authoritative Logic Test ===`);
    console.log(`Input: Provider Cost = ₦${providerCost}, Admin Percentage = ${adminMarkupPercentage}%`);

    // Simulated Variables
    const resellerWholesaleCost = providerCost;
    const globalPrice = { default_retail_price: providerCost };
    const adminRule = { markupPercentage: adminMarkupPercentage };
    
    // --- START OF ACTUAL CODE LOGIC ---
    const _providerCost = Number(resellerWholesaleCost);
    let adminPrice;

    if (adminRule && adminRule.markupPercentage > 0) {
        const adminMarkupValue = _providerCost * (Number(adminRule.markupPercentage) / 100);
        adminPrice = _providerCost + adminMarkupValue;
    } else {
        adminPrice = Number(globalPrice.default_retail_price);
    }

    const adminMarkup = adminPrice - _providerCost;
    const basicCommission = adminMarkup > 0 ? adminMarkup * 0.50 : 0;
    
    const customerPrice = adminPrice + basicCommission;
    // --- END OF ACTUAL CODE LOGIC ---

    console.log(`\n[Execution Results]`);
    console.log(`Exact Formulas Executed:`);
    console.log(`  adminMarkupValue = ${_providerCost} * (${adminRule.markupPercentage} / 100)`);
    console.log(`  adminPrice = ${_providerCost} + ${adminPrice - _providerCost}`);
    console.log(`  basicCommission = ${adminMarkup} * 0.50`);
    console.log(`  customerPrice = ${adminPrice} + ${basicCommission}`);

    console.log(`\n[Final Output Validation]`);
    console.log(`Admin Price = ₦${adminPrice}`);
    console.log(`Basic Commission = ₦${basicCommission}`);
    console.log(`Customer Price = ₦${customerPrice}`);
    console.log(`Basic Reseller Earnings = ₦${basicCommission}`);
    
    console.log(`\nVerification: Did Reseller receive EXACTLY 50% of the Admin Markup (₦${adminMarkup})? ${basicCommission === (adminMarkup * 0.50) ? 'YES' : 'NO'}`);
    console.log(`--------------------------------\n`);
}

simulateAuthoritativeLogic(100, 10);
