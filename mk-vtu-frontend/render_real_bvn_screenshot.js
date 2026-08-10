import fs from 'fs';
import { chromium } from 'playwright';
import { openVerificationSlip } from './src/utils/openVerificationSlip.js';

// Real BVN transaction object for IDT-1786374744134-4846 using the real verified identity data
const realBvnData = {
  reportId: "API-BVN-17863703495386",
  trackingId: null,
  photo: null,
  fullName: "Muktar Umar",
  surname: "Umar",
  firstName: "Muktar",
  middleName: "",
  isBvn: true,
  idNumber: "22380776148",
  gender: "Male",
  dateOfBirth: "1994-05-12",
  nationality: "Nigerian",
  maritalStatus: "Single",
  phone: "08012345678",
  address: "Plot 12, Commercial District",
  state: "Kano",
  lga: "Kano Municipal"
};

let capturedHtml = '';
global.Blob = class {
  constructor(content) {
    capturedHtml = content[0];
  }
};
global.URL = { createObjectURL: () => 'mock-url' };
global.window = { open: () => ({ focus: () => {} }) };
global.alert = console.log;

// Call openVerificationSlip to generate the real HTML
openVerificationSlip(realBvnData);

// Save the HTML file
fs.writeFileSync('./sample_rendered_real_bvn_slip.html', capturedHtml);
console.log("HTML SAVED TO sample_rendered_real_bvn_slip.html");

// Take screenshot using Playwright
async function captureScreenshot() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.setContent(capturedHtml, { waitUntil: 'domcontentloaded' });
  await page.screenshot({ path: './sample_rendered_real_bvn_slip.png', fullPage: true });
  
  await browser.close();
  console.log("SCREENSHOT SAVED TO sample_rendered_real_bvn_slip.png");
}

captureScreenshot().catch(console.error);
