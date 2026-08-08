import 'dotenv/config';
import { 
    buyAirtimeWithBillsplash, 
    fetchDataPlansFromBillsplash,
    buyDataWithBillsplash,
    fetchBillsplashBalance
} from './services/providers/billsplash.js';

async function runVtuAudit() {
    console.log('\n--- BILLSPLASH VTU ENDPOINT VERIFICATION AUDIT ---\n');
    
    // Balance check
    try {
        console.log('\n0. Testing Wallet Balance...');
        const bal = await fetchBillsplashBalance();
        console.log('Balance:', bal);
    } catch (e) {
        console.error('Balance Error:', e.message);
    }

    console.log('\n1. Testing Fetch Data Plans...');
    const plansRes = await fetchDataPlansFromBillsplash('mtn');
    console.log('Fetch Data Plans Result:', JSON.stringify(plansRes, null, 2));
    
    console.log('\n2. Testing Buy Airtime (50 NGN)...');
    const airtimeRes = await buyAirtimeWithBillsplash('mtn', 50, '08123456789');
    console.log('Buy Airtime Result:', JSON.stringify(airtimeRes, null, 2));

    console.log('\n3. Testing Buy Data...');
    // We will use a dummy plan id for safety unless we see a real plan id from the fetch.
    const dataRes = await buyDataWithBillsplash('mtn', 'dummy-plan-id', '08123456789');
    console.log('Buy Data Result:', JSON.stringify(dataRes, null, 2));
    
    console.log('\n--- AUDIT COMPLETE ---');
}

runVtuAudit().catch(console.error);
