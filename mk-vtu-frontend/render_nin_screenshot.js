import fs from 'fs';
import { chromium } from 'playwright';
import { openVerificationSlip } from './src/utils/openVerificationSlip.js';

// Real NIN transaction data from IDT-1786379304637-3926
const realNinData = {
  reportId: "API-NIN-99999",
  trackingId: "TRK-NIN-888",
  photo: null,
  fullName: "Muktar Umar",
  surname: "Umar",
  firstName: "Muktar",
  middleName: "",
  isBvn: false,
  idNumber: "12345673858", // Real NIN inputted by the user
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

// Call openVerificationSlip to generate the real NIN HTML
openVerificationSlip(realNinData);

// Save the HTML file
fs.writeFileSync('./sample_rendered_real_nin_slip.html', capturedHtml);
console.log("NIN HTML SAVED");

// Take screenshot using Playwright
async function captureScreenshot() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.setContent(capturedHtml, { waitUntil: 'domcontentloaded' });
  await page.screenshot({ path: './sample_rendered_real_nin_slip.png', fullPage: true });
  
  await browser.close();
  console.log("NIN SCREENSHOT SAVED");
}

captureScreenshot().catch(console.error);
