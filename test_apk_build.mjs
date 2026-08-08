import { generateAppAssets } from './services/appAssetService.js';

async function runTest() {
  console.log("Building Customer A...");
  try {
    const resA = await generateAppAssets({
        subdomain: 'customer_a_app',
        appName: 'Customer A App',
        logoUrl: 'https://placehold.co/512x512/png?text=A',
        isNativeApk: true,
        resellerId: 'test_a',
        themeColor: '#FF0000',
        businessName: 'Customer A Business',
        supportEmail: 'a@example.com',
        supportPhone: '111111111',
        apiUrl: 'https://api.example.com',
        brandName: 'customeraapp'
    });
    console.log("Customer A Build Finished. Result:", resA);
  } catch (err) {
    console.error("Customer A Build Failed:", err);
  }

  console.log("Building Customer B...");
  try {
    const resB = await generateAppAssets({
        subdomain: 'customer_b_app',
        appName: 'Customer B App',
        logoUrl: 'https://placehold.co/512x512/png?text=B',
        isNativeApk: true,
        resellerId: 'test_b',
        themeColor: '#0000FF',
        businessName: 'Customer B Business',
        supportEmail: 'b@example.com',
        supportPhone: '222222222',
        apiUrl: 'https://api.example.com',
        brandName: 'customerbapp'
    });
    console.log("Customer B Build Finished. Result:", resB);
  } catch (err) {
    console.error("Customer B Build Failed:", err);
  }
}

runTest();
