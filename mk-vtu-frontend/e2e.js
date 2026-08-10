import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Inject token
  await page.goto('http://localhost:5173/');
  await page.evaluate(() => {
    localStorage.setItem('token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhNzg1MjkyODFhNWFmYjRhZDg4NDg5OCIsImlhdCI6MTc4NjI3MDM1NCwiZXhwIjoxNzg2MzU2NzU0fQ.y6Ahd0J3riklGyiJzoo8xAElPRTZlW5RZrHmYru_NYk');
  });

  console.log("Navigating to NIN Modification...");
  // Use the ID we retrieved earlier
  await page.goto('http://localhost:5173/identity/6a7530f31e15988b3c412e12');
  
  // Wait for the UI to load
  await page.waitForSelector('span:has-text("Service Charge")');
  
  // Get generic price text
  const initialPrice = await page.locator('span:has-text("₦")').first().innerText();
  if (initialPrice.includes('17,000')) {
    console.error("UI Price Test: FAIL (17,000 still shown genericly)");
  }
  
  const testPrices = [
    { type: 'nin-name-modification', name: 'Name', expected: '6,000' },
    { type: 'nin-dob-modification', name: 'Date of Birth', expected: '36,500' },
    { type: 'nin-phone-modification', name: 'Phone Number', expected: '6,000' },
    { type: 'nin-address-modification', name: 'Address', expected: '6,000' },
    { type: 'nin-state-lga-modification', name: 'State', expected: '8,500' },
  ];
  
  let allPricesPassed = true;
  for (const t of testPrices) {
    await page.selectOption('select[name="service_type"]', t.type);
    await page.waitForTimeout(500); // UI update delay
    const priceText = await page.locator('span', { hasText: '₦' }).first().innerText();
    const payBtnText = await page.locator('button[type="submit"]').innerText();
    
    if (!priceText.includes(t.expected) || !payBtnText.includes(t.expected)) {
      console.error(`UI Price Test: FAIL for ${t.name}. Got ${priceText}, ${payBtnText}`);
      allPricesPassed = false;
    }
  }
  
  if (allPricesPassed) {
    console.log("Five modification prices: PASS");
    console.log("UI price test: PASS");
  }

  // Submit missing required fields
  await page.selectOption('select[name="service_type"]', 'nin-name-modification');
  await page.click('button[type="submit"]');
  // There should be validation error or browser validation.
  await page.waitForTimeout(1000);
  
  // Fill form
  await page.fill('input[name="whatsappNumber"]', '08123456789');
  await page.fill('input[name="nin"]', '12345678901');
  await page.fill('input[name="currentInformation"]', 'Old Name');
  await page.fill('textarea[name="details"]', 'New Name');
  
  // Document upload (using a dummy file)
  const fileInput = await page.locator('input[type="file"]');
  await fileInput.setInputFiles('C:/Users/userpc/mk-digital-backend/homepage.png');

  console.log("Submitting form...");
  
  await Promise.all([
    page.waitForResponse(resp => resp.url().includes('/api/retail/identity') && resp.status() === 200, { timeout: 15000 }),
    page.click('button[type="submit"]')
  ]).then(() => console.log("Form submission success!"))
    .catch(e => console.error("Form submission failed: ", e.message));

  await browser.close();
})();
