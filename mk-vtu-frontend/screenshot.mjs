import { chromium } from 'playwright';
import { spawn } from 'child_process';
import path from 'path';

(async () => {
  console.log("Starting local Vite dev server...");
  const serverProcess = spawn('npm', ['run', 'dev'], {
    cwd: process.cwd(),
    shell: true
  });

  // Wait a few seconds for server to start
  await new Promise(resolve => setTimeout(resolve, 6000));

  console.log("Launching browser...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();

  console.log("Mocking APIs...");
  await page.route('**/api/content/future-platforms', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([])
    });
  });

  console.log("Navigating to Business Signup...");
  await page.goto('http://localhost:5173/business/signup');

  console.log("Waiting for success screen...");
  await page.waitForSelector('text=Congratulations!', { timeout: 15000 });

  console.log("Taking screenshot...");
  const screenshotPath = path.resolve('../../success_screen.png');
  await page.screenshot({ path: screenshotPath });
  console.log(`Screenshot saved to: ${screenshotPath}`);

  await browser.close();
  serverProcess.kill();
  console.log("Done.");
  process.exit(0);
})();
