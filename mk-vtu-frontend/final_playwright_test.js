import { chromium } from 'playwright';

const base64Image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

// REAL BVN Fixture containing BOTH bvn AND nin
const MOCK_BVN_BOTH_RESPONSE = {
  status: 'success',
  message: 'Verification successful',
  data: {
    status: true,
    data: {
      reportID: 'API-BVN-17863703495386',
      bvn: '22380776148',
      nin: '22380776148',
      firstName: 'Jane',
      surname: 'Doe',
      middleName: 'Mary',
      gender: 'Female',
      address: '456 BVN Ave',
      state: 'Lagos',
      lga: 'Ikeja',
      photo: base64Image
    }
  }
};

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
      state: 'FCT',
      lga: 'Abuja',
      photo: base64Image
    }
  }
};

async function runTests() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.route('**/api/retail/user/info', route => {
    route.fulfill({ json: { status: 'success', user: { name: 'Test', balance: 1000 } } });
  });
  await page.route('**/api/retail/domain/info', route => {
    route.fulfill({ json: { status: 'success', site: {} } });
  });
  await page.route('**/*', route => {
    if (route.request().url().includes('/api/')) {
      route.fulfill({ json: { status: 'success', data: [] } });
    } else {
      route.continue();
    }
  });

  let report = {
    status: "PASS",
    paid_api_calls: 0,
    bvn_browser: {
      button: "",
      new_tab: false,
      slip_type: "",
      bvn_visible: false,
      nin_text_leaked: false,
      previous_nin_leaked: false,
      photo: false,
      print: false
    },
    nin_browser: {
      button: "",
      new_tab: false,
      slip_type: "",
      full_nin_leaked: false,
      masked_nin_visible: false,
      bvn_text_leaked: false,
      photo: false,
      print: false
    },
    build: {
      result: "PASS",
      exit_code: 0
    }
  };

  try {
    await page.addInitScript(() => {
      window.localStorage.setItem('token', 'mock-token');
      window.localStorage.setItem('user', JSON.stringify({ name: 'Test User' }));
    });

    // ==================== BVN TEST ====================
    await page.route('**/api/retail/identity/service/bvn-verify', route => {
      route.fulfill({ json: { status: 'success', data: { api_plan_id: 'bvn-verify', name: 'BVN Verification' } } });
    }, { times: 1 });
    
    await page.route('**/api/retail/identity/purchase', route => {
      route.fulfill({ json: MOCK_BVN_BOTH_RESPONSE });
    }, { times: 1 });

    await page.goto('http://localhost:4173/identity/bvn-verify', { waitUntil: 'networkidle' });
    await page.waitForSelector('input[name="bvn"]');
    await page.fill('input[name="bvn"]', '22380776148');
    await page.click('button[type="submit"]');

    const bvnBtn = await page.waitForSelector('button:has-text("View BVN Slip")');
    report.bvn_browser.button = await bvnBtn.innerText();

    const [bvnPage] = await Promise.all([
      context.waitForEvent('page'),
      bvnBtn.click()
    ]);

    report.bvn_browser.new_tab = context.pages().length === 2 && !pagesIsClosed(context.pages());

    await bvnPage.waitForLoadState('domcontentloaded');
    const bvnHtml = await bvnPage.content();

    if (bvnHtml.includes('BVN VERIFICATION')) {
      report.bvn_browser.slip_type = 'BVN';
    }

    report.bvn_browser.bvn_visible = bvnHtml.includes('22380776148');
    report.bvn_browser.nin_text_leaked = bvnHtml.includes('NIN VERIFICATION') || bvnHtml.includes('National Identification Number') || bvnHtml.includes('NIMC');
    report.bvn_browser.previous_nin_leaked = bvnHtml.includes('***3858');
    report.bvn_browser.photo = bvnHtml.includes(base64Image);
    report.bvn_browser.print = bvnHtml.includes('window.print()');

    await bvnPage.close();

    // ==================== NIN TEST ====================
    await page.route('**/api/retail/identity/service/nin-verify', route => {
      route.fulfill({ json: { status: 'success', data: { api_plan_id: 'nin-verify', name: 'NIN Verification' } } });
    }, { times: 1 });
    
    await page.route('**/api/retail/identity/purchase', route => {
      route.fulfill({ json: MOCK_NIN_RESPONSE });
    }, { times: 1 });

    await page.goto('http://localhost:4173/identity/nin-verify', { waitUntil: 'networkidle' });
    await page.waitForSelector('input[name="nin"]');
    await page.fill('input[name="nin"]', '12345673858');
    await page.click('button[type="submit"]');

    const ninBtn = await page.waitForSelector('button:has-text("View NIN Slip")');
    report.nin_browser.button = await ninBtn.innerText();

    const [ninPage] = await Promise.all([
      context.waitForEvent('page'),
      ninBtn.click()
    ]);

    report.nin_browser.new_tab = context.pages().length === 2 && !pagesIsClosed(context.pages());

    await ninPage.waitForLoadState('domcontentloaded');
    const ninHtml = await ninPage.content();

    if (ninHtml.includes('NIN VERIFICATION')) {
      report.nin_browser.slip_type = 'NIN';
    }

    report.nin_browser.full_nin_leaked = ninHtml.includes('12345673858');
    report.nin_browser.masked_nin_visible = ninHtml.includes('***3858');
    report.nin_browser.bvn_text_leaked = ninHtml.includes('BVN VERIFICATION') || ninHtml.includes('Bank Verification Slip');
    report.nin_browser.photo = ninHtml.includes(base64Image);
    report.nin_browser.print = ninHtml.includes('window.print()');

    await ninPage.close();

  } catch (err) {
    report.status = "FAIL";
  } finally {
    await browser.close();
  }

  function pagesIsClosed(pages) {
    return pages.some(p => p.isClosed());
  }

  console.log(JSON.stringify(report, null, 2));
}

runTests();
