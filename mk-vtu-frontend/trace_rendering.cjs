const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  let siteInfoResponse = null;
  page.on('response', async response => {
    if (response.url().includes('/api/site-info')) {
      try {
        const text = await response.text();
        siteInfoResponse = JSON.parse(text);
      } catch (e) {}
    }
  });

  await page.goto('http://127.0.0.1:5173', { waitUntil: 'networkidle' });

  // Wait a bit for React to render
  await page.waitForTimeout(2000);
  
  const content = await page.content();
  
  // Extract all text that matches the services
  const matches = [];
  const lines = content.split('\n');
  lines.forEach((line, i) => {
    if (line.toLowerCase().includes('nin') || line.toLowerCase().includes('bvn') || line.toLowerCase().includes('cac')) {
        matches.push(line.trim());
    }
  });

  const result = {
      siteInfo: siteInfoResponse,
      matches: matches
  };

  fs.writeFileSync('trace_output.json', JSON.stringify(result, null, 2));

  await browser.close();
})();
