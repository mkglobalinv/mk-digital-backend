import { chromium } from 'playwright';

(async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        extraHTTPHeaders: {
            'x-forwarded-host': '9jasub.com'
        }
    });
    const page = await context.newPage();
    await page.goto('http://localhost:8801/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: '../homepage.png' });
    await browser.close();
})();
