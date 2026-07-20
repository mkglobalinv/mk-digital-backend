const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
    console.log('Starting Playwright test...');
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    let logs = [];
    page.on('console', msg => {
        const txt = `[PAGE LOG] [${msg.type()}] ${msg.text()}`;
        console.log(txt);
        logs.push(txt);
    });

    page.on('pageerror', err => {
        const txt = `[PAGE UNCAUGHT EXCEPTION] ${err.name}: ${err.message}\n${err.stack}`;
        console.log(txt);
        logs.push(txt);
    });

    try {
        console.log('Navigating to http://localhost:5173/login');
        await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle', timeout: 30000 });
        
        console.log('Waiting for network/navigation...');
        await page.waitForTimeout(3000);
        
        // Try to click the first selector button if it exists
        try {
            const selectorCards = await page.$$('.type-card');
            if (selectorCards.length > 0) {
                console.log('Selector detected, clicking first type-card...');
                await selectorCards[0].click();
                await page.waitForTimeout(1000);
            }
        } catch (e) {
            console.log('No selector cards found.');
        }

        const pinScreen = await page.$('.pin-auth-screen');
        if (pinScreen) {
            console.log('PIN screen detected! Entering PIN...');
            // ...
        } else {
            console.log('No PIN screen. Trying email login...');
            await page.waitForSelector('input[type="email"]', { timeout: 10000 });
            await page.fill('input[type="email"]', 'test@test.com');
            await page.fill('input[type="password"]', 'test1234');
            await page.click('button[type="submit"]');
            
            console.log('Waiting for login to complete...');
            await page.waitForTimeout(5000);
            
            console.log('Refreshing to trigger PIN unlock...');
            await page.reload({ waitUntil: 'networkidle' });
            await page.waitForTimeout(3000);
            
            const pinScreen2 = await page.$('.pin-auth-screen');
            if (pinScreen2) {
                console.log('PIN screen detected! Entering PIN...');
                const buttons = await page.$$('.pin-keypad button');
                for (let i = 1; i <= 4; i++) {
                    for (const btn of buttons) {
                        if ((await btn.innerText()) === i.toString()) {
                            await btn.click();
                            await page.waitForTimeout(200);
                            break;
                        }
                    }
                }
                console.log('PIN entered, waiting 5 seconds for crash or success...');
                await page.waitForTimeout(5000);
            } else {
                console.log('STILL NO PIN SCREEN AFTER REFRESH');
            }
        }
        
    } catch (e) {
        console.log('Test script error: ' + e);
    } finally {
        fs.writeFileSync('playwright_logs.txt', logs.join('\n'));
        await browser.close();
        console.log('Test complete. Logs saved to playwright_logs.txt');
    }
})();
