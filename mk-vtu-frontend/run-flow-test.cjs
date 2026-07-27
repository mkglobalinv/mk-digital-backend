const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
    const baseUrl = process.env.BASE_URL || 'http://localhost:5173';
    console.log(`Starting Playwright for Signup -> Login -> Logout flow against ${baseUrl} ...`);
    
    const artifactsDir = 'C:\\Users\\userpc\\.gemini\\antigravity-ide\\brain\\6057fa15-edb1-4f87-b561-5199d92d8603\\scratch';
    if (!fs.existsSync(artifactsDir)){
        fs.mkdirSync(artifactsDir, { recursive: true });
    }

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    // Generate random credentials
    const randomNum = Math.floor(Math.random() * 100000);
    const email = `testuser_${randomNum}@example.com`;
    const password = `Test@Password123`;
    const name = `Test User ${randomNum}`;
    const pin = `1234`;

    console.log(`[INFO] Using Email: ${email}`);
    console.log(`[INFO] Using Password: ${password}`);

    // 1. SIGNUP
    console.log(`Navigating to ${baseUrl}/signup ...`);
    await page.goto(`${baseUrl}/signup`, { waitUntil: 'networkidle' });
    
    console.log('Filling out signup form...');
    await page.fill('input[placeholder*="e.g. John Doe"]', name);
    await page.fill('input[type="email"]', email);
    
    const pwInputs = await page.$$('input[type="password"]');
    if (pwInputs.length >= 3) {
        await pwInputs[0].fill(password);
        await pwInputs[1].fill(password);
        await pwInputs[2].fill(pin);
    } else {
        await page.fill('input[placeholder*="Create a strong password"]', password);
        await page.fill('input[placeholder*="Confirm your password"]', password);
        await page.fill('input[placeholder*="4-digit PIN"]', pin);
    }
    
    console.log('Submitting signup...');
    await page.click('button[type="submit"]');

    console.log('Waiting for response...');
    try {
        await Promise.race([
            page.waitForURL(/.*(\/home|\/login|\/verify-email).*/, { timeout: 15000 }),
            page.waitForSelector('.auth-message', { timeout: 15000, state: 'visible' })
        ]);
    } catch (e) {
        console.log('Timeout waiting for redirect or error message.');
    }
    
    await page.waitForTimeout(2000); // let animations finish
    await page.screenshot({ path: path.join(artifactsDir, 'local_signup_success.png') });
    console.log('[SUCCESS] Saved signup screenshot');

    const errorMsg = await page.$('.auth-message');
    if (errorMsg) {
        const text = await errorMsg.innerText();
        console.error(`Signup failed with error: ${text}`);
        await browser.close();
        process.exit(1);
    }

    const currentUrl = page.url();
    if (currentUrl.includes('/home') || currentUrl.includes('/verify-email')) {
        console.log('Logging out from dashboard/verification...');
        await page.evaluate(() => {
            localStorage.clear();
            sessionStorage.clear();
        });
    }

    // 2. LOGIN
    console.log(`Navigating to ${baseUrl}/login ...`);
    await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle' });

    console.log('Filling out login form...');
    const personalAccountBtn = await page.$('text=Personal Account');
    if (personalAccountBtn) {
        console.log('Clicking Personal Account...');
        await personalAccountBtn.click();
        await page.waitForTimeout(1000);
    }

    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    
    console.log('Submitting login...');
    await page.click('button[type="submit"]');

    try {
        await Promise.race([
            page.waitForURL(/.*(\/home|\/verify-email).*/, { timeout: 15000 }),
            page.waitForSelector('.auth-message', { timeout: 15000, state: 'visible' })
        ]);
    } catch (e) {}
    await page.waitForTimeout(2000); 
    
    await page.screenshot({ path: path.join(artifactsDir, 'local_login_success.png') });
    console.log('[SUCCESS] Saved login screenshot');

    const loginError = await page.$('.auth-message');
    if (loginError) {
        const text = await loginError.innerText();
        console.error(`Login failed with error: ${text}`);
        await browser.close();
        process.exit(1);
    }

    // 3. LOG OUT
    console.log('Logging out...');
    await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
    });
    
    await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: path.join(artifactsDir, 'local_logout_success.png') });
    console.log('[SUCCESS] Saved logout screenshot');

    await browser.close();
    console.log('Playwright script completed successfully.');
})();
