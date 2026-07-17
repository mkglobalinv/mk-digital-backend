const puppeteer = require('puppeteer');

(async () => {
  const adminToken = process.argv[2];
  const retailId = process.argv[3];
  const basicResellerId = process.argv[4];
  const vipResellerId = process.argv[5];

  if (!adminToken || !retailId || !basicResellerId || !vipResellerId) {
      console.log("Missing arguments!");
      process.exit(1);
  }

  const browser = await puppeteer.launch({ 
    headless: true, 
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    args: ['--no-sandbox'] 
  });
  const page = await browser.newPage();

  // Test Retail User
  await page.goto('http://localhost:5173/login');
  await page.evaluate((token) => {
      localStorage.setItem('adminToken', token);
  }, adminToken);

  console.log("Testing Retail User: " + retailId);
  await page.goto(`http://localhost:5173/admin/audit/user/${retailId}`, { waitUntil: 'networkidle2' });
  let content = await page.content();
  if (content.includes("Total Deposits") && !content.includes("Cannot read properties of undefined")) {
      console.log("Retail User Audit page loaded successfully.");
  } else {
      console.log("Retail User Audit page failed to load.");
      console.log(content.slice(0, 1000));
  }

  // Test Basic Reseller
  console.log("Testing Basic Reseller: " + basicResellerId);
  await page.goto(`http://localhost:5173/admin/audit/user/${basicResellerId}`, { waitUntil: 'networkidle2' });
  content = await page.content();
  if (content.includes("Total Deposits") && !content.includes("Cannot read properties of undefined")) {
      console.log("Basic Reseller Audit page loaded successfully.");
  } else {
      console.log("Basic Reseller Audit page failed to load.");
  }

  // Test VIP Reseller
  console.log("Testing VIP Reseller: " + vipResellerId);
  await page.goto(`http://localhost:5173/admin/audit/user/${vipResellerId}`, { waitUntil: 'networkidle2' });
  content = await page.content();
  if (content.includes("Total Deposits") && !content.includes("Cannot read properties of undefined")) {
      console.log("VIP Reseller Audit page loaded successfully.");
  } else {
      console.log("VIP Reseller Audit page failed to load.");
  }

  await browser.close();
})();
