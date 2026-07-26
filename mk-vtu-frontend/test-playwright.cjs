const { chromium } = require('playwright');

(async () => {
    console.log('Starting Playwright...');
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    const errors = [];
    const networkFailures = [];

    page.on('console', msg => {
        if (msg.type() === 'error') {
            errors.push(`[CONSOLE ERROR] ${msg.text()}`);
        }
    });

    page.on('pageerror', error => {
        errors.push(`[PAGE ERROR] ${error.message}`);
    });

    page.on('response', response => {
        if (!response.ok()) {
            networkFailures.push(`[NETWORK FAILURE] ${response.status()} ${response.url()}`);
        }
    });

    console.log('Navigating to http://localhost:8800/login ...');
    try {
        await page.goto('http://localhost:8800/login', { waitUntil: 'load' });
        console.log('Page loaded.');
    } catch (e) {
        console.error('Failed to load page:', e.message);
    }
    
    console.log('\n--- CONSOLE ERRORS ---');
    errors.forEach(e => console.log(e));
    if (errors.length === 0) console.log('None');

    console.log('\n--- NETWORK FAILURES ---');
    networkFailures.forEach(f => console.log(f));
    if (networkFailures.length === 0) console.log('None');

    const text = await page.evaluate(() => document.body.innerText);
    console.log('\n--- PAGE TEXT ---');
    console.log(text.substring(0, 500));

    await browser.close();
})();
