const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Navigate to VTU Home Page (we need to be logged in to see the home page, but wait! What if it's protected by auth?)
  // Let's check if the root '/' is accessible.
  await page.goto('http://localhost:5173/');
  
  // Wait for the app to load
  await page.waitForTimeout(3000);
  
  await page.screenshot({ path: 'C:/Users/userpc/mk-digital-backend/mk-subdata-website/public/vtu_home_screenshot.png' });
  
  await browser.close();
  console.log('Screenshot saved!');
})();
