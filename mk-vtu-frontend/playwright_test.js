import { chromium } from 'playwright';

const base64Image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

const MOCK_NIN_RESPONSE = {
  status: 'success',
  message: 'Verification successful',
  data: {
    status: true,
    data: {
      reportID: 'API-NIN-99999',
      nin: '12345673858',
      firstName: 'John',
      surname: 'Doe',
      middleName: 'Smith',
      gender: 'Male',
      address: '123 NIN St',
      lga: 'Abuja Mun.',
      state: 'FCT',
      photo: base64Image
    }
  }
};

const MOCK_BVN_RESPONSE = {
  status: 'success',
  message: 'Verification successful',
  data: {
    status: true,
    data: {
      reportID: 'API-BVN-88888',
      bvn: '22380776148',
      firstName: 'Jane',
      surname: 'Doe',
      gender: 'Female',
      address: '456 BVN Ave'
    }
  }
};

async function runTests() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Mock global API requests
  await page.route('**/api/retail/user/info', route => {
    route.fulfill({ json: { status: 'success', user: { name: 'Test', balance: 1000 } } });
  });
  await page.route('**/api/retail/domain/info', route => {
    route.fulfill({ json: { status: 'success', site: {} } });
  });

  // Intercept any unhandled requests
  await page.route('**/*', route => {
    if (route.request().url().includes('/api/')) {
      route.fulfill({ json: { status: 'success', data: [] } });
    } else {
      route.continue();
    }
  });

  let results = {
    ninPass: false,
    bvnPass: false,
    newTab: false,
    originalTabPreserved: false,
    ninMasking: false,
    photoRendering: false,
    fieldMapping: false,
    printTest: false,
    noCrossContamination: false
  };

  try {
    // ==========================================
    // NIN TEST
    // ==========================================
    console.log("Starting NIN Test...");
    // Override route for service info
    await page.route('**/api/retail/identity/service/nin-verify', route => {
      route.fulfill({ json: { status: 'success', data: { api_plan_id: 'nin-verify', name: 'NIN Verification' } } });
    }, { times: 1 });
    
    await page.route('**/api/retail/identity/purchase', route => {
      route.fulfill({ json: MOCK_NIN_RESPONSE });
    }, { times: 1 });

    // Set localStorage before navigating
    await page.addInitScript(() => {
      window.localStorage.setItem('token', 'mock-token');
      window.localStorage.setItem('user', JSON.stringify({ name: 'Test User' }));
    });

    await page.goto('http://localhost:4173/identity/nin-verify', { waitUntil: 'networkidle' });
    
    // Fill form and submit
    await page.waitForSelector('input[name="nin"]', { timeout: 10000 });
    await page.fill('input[name="nin"]', '12345673858');
    await page.click('button[type="submit"]');

    // Wait for Result to render
    await page.waitForSelector('text=View NIN Slip', { timeout: 10000 });
    
    // Assert DOM masking
    const pageHtml = await page.content();
    if (pageHtml.includes('12345673858')) {
      throw new Error("FULL NIN FOUND IN ORIGINAL TAB DOM!");
    }
    if (!pageHtml.includes('***3858')) {
      throw new Error("MASKED NIN NOT FOUND IN ORIGINAL TAB DOM!");
    }
    results.ninMasking = true; 

    // Intercept window.open
    const [newPage] = await Promise.all([
      context.waitForEvent('page'),
      page.click('button:has-text("View NIN Slip")')
    ]);

    results.newTab = true;
    
    const pages = context.pages();
    if (pages.length === 2 && !pages[0].isClosed()) {
      results.originalTabPreserved = true;
    }

    await newPage.waitForLoadState('domcontentloaded');
    const slipHtml = await newPage.content();
    
    if (slipHtml.includes('12345673858')) {
      throw new Error("FULL NIN LEAKED INTO HTML SLIP!");
    }
    if (!slipHtml.includes('***3858')) {
      throw new Error("MASKED NIN MISSING IN HTML SLIP!");
    }
    if (!slipHtml.includes('NIN VERIFICATION')) {
      throw new Error("NIN TITLE MISSING!");
    }
    if (!slipHtml.includes('John') || !slipHtml.includes('Doe') || !slipHtml.includes('API-NIN-99999')) {
      throw new Error("FIELD MAPPING FAILED FOR NIN!");
    }
    
    if (slipHtml.includes(base64Image)) {
      results.photoRendering = true;
    }

    if (slipHtml.includes('window.print()')) {
      results.printTest = true;
    }

    results.ninPass = true;
    await newPage.close();

    // ==========================================
    // BVN TEST
    // ==========================================
    console.log("Starting BVN Test...");
    await page.route('**/api/retail/identity/service/bvn-verify', route => {
      route.fulfill({ json: { status: 'success', data: { api_plan_id: 'bvn-verify', name: 'BVN Verification' } } });
    }, { times: 1 });
    
    await page.route('**/api/retail/identity/purchase', route => {
      route.fulfill({ json: MOCK_BVN_RESPONSE });
    }, { times: 1 });

    await page.goto('http://localhost:4173/identity/bvn-verify', { waitUntil: 'networkidle' });
    
    // Fill form and submit
    await page.waitForSelector('input[name="bvn"]', { timeout: 10000 });
    await page.fill('input[name="bvn"]', '22380776148');
    await page.click('button[type="submit"]');

    // Wait for Result to render
    await page.waitForSelector('text=View BVN Slip', { timeout: 10000 });
    
    const [bvnPage] = await Promise.all([
      context.waitForEvent('page'),
      page.click('button:has-text("View BVN Slip")')
    ]);

    await bvnPage.waitForLoadState('domcontentloaded');
    const bvnHtml = await bvnPage.content();

    if (!bvnHtml.includes('BVN VERIFICATION')) {
      throw new Error("BVN TITLE MISSING!");
    }
    
    if (bvnHtml.includes('National Identification Number') || bvnHtml.includes('NIMC') || bvnHtml.includes('***3858')) {
      throw new Error("NIN CROSS-CONTAMINATION DETECTED IN BVN SLIP!");
    }

    if (!bvnHtml.includes('22380776148')) {
      throw new Error("ACTUAL BVN MISSING IN SLIP!");
    }

    results.noCrossContamination = true;
    results.fieldMapping = true;
    results.bvnPass = true;
    
    console.log("All Playwright checks complete.");

  } catch (err) {
    console.error("Test failed:", err);
  } finally {
    await browser.close();
  }

  console.log(`
==================================================
FINAL REPORT
==================================================
1. NIN browser test — \${results.ninPass ? 'PASS' : 'FAIL'}
2. BVN browser test — \${results.bvnPass ? 'PASS' : 'FAIL'}
3. New-tab test — \${results.newTab ? 'PASS' : 'FAIL'}
4. Original-tab-preserved test — \${results.originalTabPreserved ? 'PASS' : 'FAIL'}
5. NIN masking test — \${results.ninMasking ? 'PASS' : 'FAIL'}
6. Photo rendering test — \${results.photoRendering ? 'PASS' : 'FAIL'}
7. Field mapping test — \${results.fieldMapping ? 'PASS' : 'FAIL'}
8. Print test — \${results.printTest ? 'PASS' : 'FAIL'}
9. No cross-contamination test — \${results.noCrossContamination ? 'PASS' : 'FAIL'}
`);

  process.exit(Object.values(results).every(v => v) ? 0 : 1);
}

runTests();
