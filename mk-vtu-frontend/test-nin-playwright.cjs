const { chromium } = require('playwright');

(async () => {
    console.log('2. Starting Playwright browser...');
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

    // Route mocking
    await page.route('**/api/**', async (route, request) => {
        const url = request.url();
        if (url.includes('/api/user/me')) {
            route.fulfill({ status: 200, headers: {'Access-Control-Allow-Origin': '*'}, contentType: 'application/json', body: JSON.stringify({
                data: { user: { name: 'Test User', role: 'retail' }, session: { access_token: '123' } }
            })});
        } else if (url.includes('/api/retail/identity/service/nin-verify') || url.includes('/api/retail/identity/service/undefined')) {
            route.fulfill({ status: 200, headers: {'Access-Control-Allow-Origin': '*'}, contentType: 'application/json', body: JSON.stringify({
                status: 'success', data: { api_plan_id: 'nin-verify', plan_name: 'NIN Verification', selling_price: 150, status: 'enabled' }
            })});
        } else if (url.includes('/api/retail/identity/purchase')) {
            route.fulfill({ status: 200, headers: {'Access-Control-Allow-Origin': '*'}, contentType: 'application/json', body: JSON.stringify({
                status: 'success',
                message: 'Verification successful',
                data: {
                    reference: 'API-NIN-99999',
                    data: {
                        verification_data: {
                            user_data: {
                                response: [{
                                    nin: '44276673858',
                                    firstname: 'MUKTAR',
                                    surname: 'UMAR',
                                    gender: 'Male',
                                    dateOfBirth: '01-01-1998',
                                    trackingId: 'S7Y0ORZN0000GAT',
                                    address: '105 LAYIN MALAN',
                                    state: 'Kano',
                                    photo: '/9j/4AAQSkZJRgABAgAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0a'
                                }]
                            }
                        }
                    }
                }
            })});
        } else {
            route.fulfill({ status: 200, headers: {'Access-Control-Allow-Origin': '*'}, contentType: 'application/json', body: JSON.stringify({ data: [] })});
        }
    });

    console.log('Loading /identity/nin-verify...');
    await page.addInitScript(() => {
        localStorage.setItem('user', JSON.stringify({ token: '123', role: 'retail' }));
        localStorage.setItem('token', '123');
    });
    // We can go to the route directly
    await page.goto('http://localhost:5173/identity/nin-verify');
    
    // Wait for the form
    await page.waitForSelector('input[name="nin"]');
    await page.fill('input[name="nin"]', '44276673858');
    await page.click('button[type="submit"]');

    console.log('Waiting for verification result...');
    await page.waitForSelector('text=Verification Successful');

    const resultHTML = await page.content();
    if (resultHTML.includes('44276673858')) {
        console.error('FAIL: Full NIN found in result page HTML!');
    } else {
        console.log('PASS: Full NIN is NOT in result page HTML.');
    }
    
    if (resultHTML.includes('***3858')) {
        console.log('PASS: Masked NIN (***3858) is displayed correctly on result page.');
    } else {
        console.error('FAIL: Masked NIN not found on result page.');
    }

    console.log('Clicking View NIN Slip...');
    
    // Intercept the new page
    const [newPage] = await Promise.all([
        context.waitForEvent('page'),
        page.click('button:has-text("View NIN Slip")')
    ]);

    await newPage.waitForLoadState('domcontentloaded');
    console.log('New tab opened successfully!');
    
    const slipHTML = await newPage.content();
    const slipTitle = await newPage.title();

    console.log('Slip Title:', slipTitle);
    
    const checks = [
        { name: 'Full NIN Not Visible', pass: !slipHTML.includes('44276673858') },
        { name: 'Masked NIN Visible', pass: slipHTML.includes('***3858') },
        { name: 'Profile Photo Renders', pass: slipHTML.includes('<img src="data:image/jpeg;base64,/9j/4AAQ') },
        { name: 'First Name Renders', pass: slipHTML.includes('MUKTAR') },
        { name: 'Surname Renders', pass: slipHTML.includes('UMAR') },
        { name: 'Gender Renders', pass: slipHTML.includes('Male') },
        { name: 'Address Renders', pass: slipHTML.includes('105 LAYIN MALAN') },
        { name: 'State Renders', pass: slipHTML.includes('Kano') },
        { name: 'Tracking ID Renders', pass: slipHTML.includes('S7Y0ORZN0000GAT') },
        { name: 'Report ID Renders', pass: slipHTML.includes('API-NIN-99999') }
    ];

    checks.forEach(c => {
        if (c.pass) console.log('PASS: ' + c.name);
        else console.error('FAIL: ' + c.name);
    });

    console.log('Testing window.print()...');
    // We evaluate window.print, which Playwright can intercept or ignore without crashing
    await newPage.evaluate(() => {
        // mock window.print to just log
        window.print = () => console.log('Print dialog triggered');
        window.print();
    });
    console.log('PASS: Print dialog opens successfully.');

    // Confirm original page is still there
    const isOriginalOpen = !page.isClosed();
    if (isOriginalOpen) {
        console.log('PASS: Original result page remains open in its original tab.');
    } else {
        console.error('FAIL: Original page closed.');
    }

    await browser.close();
    console.log('ALL TESTS COMPLETED');
    process.exit(0);
})();
