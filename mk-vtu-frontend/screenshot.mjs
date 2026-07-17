import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.goto('http://localhost:5173/');
  
  await page.waitForTimeout(3000);
  
  await page.screenshot({ path: 'C:/Users/userpc/mk-digital-backend/mk-subdata-website/public/vtu_home_screenshot.png' });
  
  await browser.close();
  console.log('Screenshot saved!');
})();
