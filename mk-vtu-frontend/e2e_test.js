import { chromium } from 'playwright';

async function run() {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Navigating to localhost...');
  await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded', timeout: 15000 });

  // Clear and setup local storage for a normal user test
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('mock_wallet_balance', '50000');
  });
  
  // Reload to ensure balance is read
  await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded', timeout: 15000 });

  console.log('Opening NIN Modify Modal...');
  // Click on the NIN modification grid item
  await page.locator('text=NIN Modification').click();
  
  console.log('Accepting notice...');
  // Wait for the modal notice section and click 'I Have Read and Understood'
  await page.locator('button:has-text("I Have Read and Understood")').click();

  console.log('Selecting Modification Type...');
  // Select "Name Modification"
  await page.locator('button:has-text("Name Modification")').click();

  console.log('Filling out form...');
  // Fill the form fields using the name attributes
  await page.fill('input[name="surname"]', 'Doe');
  await page.fill('input[name="firstName"]', 'John');
  await page.fill('input[name="ninNumber"]', '12345678901');
  await page.fill('input[name="nimcEmail"]', 'test@example.com');
  await page.fill('input[name="emailPassword"]', 'password123');
  await page.fill('input[name="whatsapp"]', '08012345678');
  await page.fill('input[name="pin"]', '1234');

  console.log('Submitting form...');
  // Click submit
  await page.locator('button:has-text("Submit Modification")').click();

  // Wait for the toast
  console.log('Waiting for success toast...');
  await page.waitForSelector('text=Request Submitted Successfully', { timeout: 5000 });

  console.log('Navigating to Admin Identity Requests page...');
  await page.goto('http://localhost:5173/admin/identity-requests');

  // Wait for table to load
  await page.waitForTimeout(2000);
  
  console.log('Taking screenshot...');
  // Save screenshot to a specific path
  const screenshotPath = 'C:/Users/userpc/.gemini/antigravity-ide/brain/1aa6356f-39ef-4a9c-834c-fbd75a817f8d/admin_identity_requests_screenshot.png';
  await page.screenshot({ path: screenshotPath, fullPage: true });

  console.log(`Screenshot saved to ${screenshotPath}`);

  await browser.close();
}

run().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
